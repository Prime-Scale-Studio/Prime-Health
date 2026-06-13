/**
 * lib/slots.ts — Server-side only
 * Generates time slots for a clinic on a specific date.
 * Accounts for: day-of-week availability, break windows,
 * blocked dates, and existing confirmed/pending appointments.
 */

import { format, parse, addMinutes, isAfter, isBefore } from "date-fns"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Tables } from "@/types/supabase"
import type { ApiResponse } from "@/types/index"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type TimeSlot = {
  startTime: string   // "HH:mm"
  endTime: string     // "HH:mm"
  available: boolean  // false = greyed-out in widget
}

export type GetAvailableSlotsResult = ApiResponse<TimeSlot[]>

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** Buffer between appointments in minutes */
const BUFFER_MINUTES = 0

/** Default slot duration fallback if service not found */
const DEFAULT_DURATION_MINUTES = 30

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

/**
 * Returns all time slots for a clinic on a given date.
 * If serviceId is passed the slot duration is pulled from that service.
 * If omitted, DEFAULT_DURATION_MINUTES is used.
 *
 * Slots are marked available=false (not removed) so the widget can
 * render them greyed-out, giving patients full visibility.
 */
export async function getAvailableSlots(
  clinicId: string,
  date: string,            // "YYYY-MM-DD"
  serviceId?: string
): Promise<GetAvailableSlotsResult> {
  try {
    const supabase = createAdminClient()

    // ── 1. Check blocked date first (cheapest query) ─────────
    const { data: blockedEntry, error: blockedError } = await supabase
      .from("blocked_dates")
      .select("blocked_date")
      .eq("clinic_id", clinicId)
      .eq("blocked_date", date)
      .maybeSingle()

    if (blockedError) return { data: null, error: blockedError.message }
    if (blockedEntry) return { data: [], error: null }

    // ── 2. Day-of-week availability ───────────────────────────
    const [year, month, day] = date.split("-").map(Number)
    const dayOfWeek = new Date(year, month - 1, day).getDay()

    const { data: avail, error: availError } = await supabase
      .from("availability")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_available", true)
      .maybeSingle()

    if (availError) return { data: null, error: availError.message }
    if (!avail) return { data: [], error: null }

    // ── 3. Service duration ───────────────────────────────────
    let slotDuration = DEFAULT_DURATION_MINUTES

    if (serviceId) {
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("duration_minutes")
        .eq("id", serviceId)
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .maybeSingle()

      if (serviceError) return { data: null, error: serviceError.message }
      if (service) slotDuration = service.duration_minutes
    } else {
      // Fetch clinic default duration if no service specified
      const { data: clinic } = await supabase
        .from("clinics")
        .select("slot_duration_minutes")
        .eq("id", clinicId)
        .maybeSingle()
      
      if (clinic) slotDuration = clinic.slot_duration_minutes
    }

    // ── 4. Existing confirmed / pending appointments ──────────
    const { data: existingAppts, error: apptError } = await supabase
      .from("appointments")
      .select("start_time, end_time, status")
      .eq("clinic_id", clinicId)
      .eq("appointment_date", date)
      .neq("status", "cancelled")

    if (apptError) return { data: null, error: apptError.message }

    // ── 5. Generate slots ─────────────────────────────────────
    const slots = generateSlots({
      availability: avail,
      slotDuration,
      existingAppointments: existingAppts ?? [],
      date,
    })

    return { data: slots, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected error generating slots"
    return { data: null, error: message }
  }
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

type AppointmentSlice = Pick<
  Tables<"appointments">,
  "start_time" | "end_time" | "status"
>

type AvailabilityRow = Tables<"availability">

function generateSlots({
  availability,
  slotDuration,
  existingAppointments,
  date,
}: {
  availability: AvailabilityRow
  slotDuration: number
  existingAppointments: AppointmentSlice[]
  date: string
}): TimeSlot[] {
  // Parse all times relative to a fixed base date to avoid DST drift
  const base = new Date(`${date}T00:00:00`)
  // time strings from DB might be HH:mm or HH:mm:ss
  const toDate = (t: string) => parse(t.slice(0, 5), "HH:mm", base)
  const toStr = (d: Date) => format(d, "HH:mm")

  const dayStart = toDate(availability.start_time)
  const dayEnd = toDate(availability.end_time)
  const breakStart = availability.break_start ? toDate(availability.break_start) : null
  const breakEnd = availability.break_end ? toDate(availability.break_end) : null

  const slots: TimeSlot[] = []
  let cursor = dayStart

  while (isBefore(cursor, dayEnd)) {
    const slotEnd = addMinutes(cursor, slotDuration)

    // Slot must finish before or exactly at clinic close
    if (isAfter(slotEnd, dayEnd)) break

    const startStr = toStr(cursor)
    const endStr = toStr(slotEnd)

    // ── Break window check ────────────────────────────────────
    // A slot overlaps the break if it starts before break ends
    // AND finish after break starts (half-open interval logic)
    const inBreak =
      breakStart !== null &&
      breakEnd !== null &&
      isBefore(cursor, breakEnd) &&
      isAfter(slotEnd, breakStart)

    // ── Existing appointment conflict ─────────────────────────
    const hasConflict = existingAppointments.some((appt) => {
      const aStart = toDate(appt.start_time)
      const aEnd = toDate(appt.end_time)
      // Overlap: slot starts before appt ends AND slot ends after appt starts
      return isBefore(cursor, aEnd) && isAfter(slotEnd, aStart)
    })

    slots.push({
      startTime: startStr,
      endTime: endStr,
      available: !inBreak && !hasConflict,
    })

    // Advance by duration + buffer
    cursor = addMinutes(slotEnd, BUFFER_MINUTES)
  }

  return slots
}

// ─────────────────────────────────────────────
// Guard: called just before writing a booking
// ─────────────────────────────────────────────

/**
 * Final race-condition guard — verifies a specific time window
 * is still free and the clinic is open right before an appointment is created.
 */
export async function isSlotAvailable(
  clinicId: string,
  date: string,
  startTime: string,  // "HH:mm"
  endTime: string     // "HH:mm"
): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // 1. Check blocked date
    const { data: blocked } = await supabase
      .from("blocked_dates")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("blocked_date", date)
      .maybeSingle()
    
    if (blocked) return false

    // 2. Check day-of-week availability
    const [year, month, day] = date.split("-").map(Number)
    const dayOfWeek = new Date(year, month - 1, day).getDay()

    const { data: avail } = await supabase
      .from("availability")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_available", true)
      .maybeSingle()

    if (!avail) return false

    // 3. Check if within working hours and not in break
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number)
      return h * 60 + m
    }

    const start = toMinutes(startTime)
    const end = toMinutes(endTime)
    const dayOpen = toMinutes(avail.start_time)
    const dayClose = toMinutes(avail.end_time)

    if (start < dayOpen || end > dayClose) return false

    if (avail.break_start && avail.break_end) {
      const bStart = toMinutes(avail.break_start)
      const bEnd = toMinutes(avail.break_end)
      // Overlap with break: slot starts before break ends AND slot ends after break starts
      if (start < bEnd && end > bStart) return false
    }

    // 4. Check for conflicting appointments
    const { data: conflict } = await supabase
      .from("appointments")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("appointment_date", date)
      .in("status", ["pending", "confirmed", "completed", "no_show"])
      .lt("start_time", endTime)
      .gt("end_time", startTime)
      .maybeSingle()

    return !conflict
  } catch {
    return false
  }
}