"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendConfirmationEmail, sendWhatsAppNotification } from "@/lib/notifications"
import type { ApiResponse } from "@/types/index"
import type { Database, Tables, TablesInsert } from "@/types/supabase"
import { format } from "date-fns"

type AppointmentRow = Tables<"appointments">

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function getClinicId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ─────────────────────────────────────────────
// Enriched appointment type for list views
// ─────────────────────────────────────────────

export type AppointmentWithRelations = AppointmentRow & {
  patients: Pick<Tables<"patients">, "id" | "name" | "phone" | "email">
  services: Pick<Tables<"services">, "id" | "name" | "duration_minutes" | "price">
}

// ─────────────────────────────────────────────
// getAppointments
// ─────────────────────────────────────────────

export type AppointmentFilters = {
  status?: string
  dateFrom?: string   // "YYYY-MM-DD"
  dateTo?: string     // "YYYY-MM-DD"
}

export async function getAppointments(
  filters?: AppointmentFilters
): Promise<ApiResponse<AppointmentWithRelations[]>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    let query = supabase
      .from("appointments")
      .select("*, patients(id, name, phone, email), services(id, name, duration_minutes, price)")
      .eq("clinic_id", clinicId)
      .order("appointment_date", { ascending: false })
      .order("start_time", { ascending: true })

    if (filters?.status) query = query.eq("status", filters.status as any)
    if (filters?.dateFrom) query = query.gte("appointment_date", filters.dateFrom)
    if (filters?.dateTo) query = query.lte("appointment_date", filters.dateTo)

    const { data, error } = await query

    if (error) return { data: null, error: error.message }
    return { data: data as AppointmentWithRelations[], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// getAppointmentById
// ─────────────────────────────────────────────

export async function getAppointmentById(
  id: string
): Promise<ApiResponse<AppointmentWithRelations>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data, error } = await supabase
      .from("appointments")
      .select("*, patients(id, name, phone, email), services(id, name, duration_minutes, price)")
      .eq("id", id)
      .eq("clinic_id", clinicId)
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as AppointmentWithRelations, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// createAppointment  (manual dashboard booking)
// ─────────────────────────────────────────────

type CreateAppointmentInput = Pick<
  TablesInsert<"appointments">,
  | "patient_id"
  | "service_id"
  | "patient_name"
  | "patient_email"
  | "patient_phone"
  | "service_name"
  | "duration_minutes"
  | "appointment_date"
  | "start_time"
  | "end_time"
  | "status"
  | "patient_notes"
  | "doctor_notes"
>

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<ApiResponse<AppointmentRow>> {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data: appointment, error } = await adminSupabase
      .from("appointments")
      .insert({
        ...input,
        clinic_id: clinicId,
        booked_via: "dashboard",
        booking_language: "en",
        status: input.status ?? "confirmed",
      })
      .select()
      .single()

    if (error || !appointment) return { data: null, error: error?.message ?? "Failed to create appointment" }

    // ── Notifications ─────────────────────────────────────────
    // Fetch all related data for the notification payload
    if (!input.patient_id || !input.service_id) {
       return { data: appointment, error: null }
    }

    const [{ data: clinic }, { data: patient }, { data: service }] = await Promise.all([
      adminSupabase.from("clinics").select("*").eq("id", clinicId).single(),
      adminSupabase.from("patients").select("*").eq("id", input.patient_id as string).single(),
      adminSupabase.from("services").select("*").eq("id", input.service_id as string).single(),
    ])

    if (clinic && patient && service) {
      const payload = { appointment, clinic, patient, service }
      // We don't await to avoid slowing down the response
      void sendConfirmationEmail(payload)
      void sendWhatsAppNotification(payload)
    }

    return { data: appointment, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// updateAppointmentStatus
// ─────────────────────────────────────────────

export async function updateAppointmentStatus(
  id: string,
  status: Database["public"]["Enums"]["appointment_status"]
): Promise<ApiResponse<AppointmentRow>> {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data: appointment, error } = await adminSupabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .eq("clinic_id", clinicId)
      .select()
      .single()

    if (error || !appointment) return { data: null, error: error?.message ?? "Failed to update" }

    // ── Notifications ─────────────────────────────────────────
    // If status changed to confirmed, send confirmation email
    if (status === "confirmed" && appointment.patient_id && appointment.service_id) {
      const [{ data: clinic }, { data: patient }, { data: service }] = await Promise.all([
        adminSupabase.from("clinics").select("*").eq("id", clinicId).single(),
        adminSupabase.from("patients").select("*").eq("id", appointment.patient_id).single(),
        adminSupabase.from("services").select("*").eq("id", appointment.service_id).single(),
      ])

      if (clinic && patient && service) {
        const payload = { appointment, clinic, patient, service }
        void sendConfirmationEmail(payload)
        void sendWhatsAppNotification(payload)
      }
    }

    return { data: appointment, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// addDoctorNotes
// ─────────────────────────────────────────────

export async function addDoctorNotes(
  id: string,
  notes: string
): Promise<ApiResponse<AppointmentRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({ doctor_notes: notes })
      .eq("id", id)
      .eq("clinic_id", clinicId)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// deleteAppointment
// ─────────────────────────────────────────────

export async function deleteAppointment(
  id: string
): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { error } = await supabaseAdmin
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinicId)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// getTodaysAppointments
// ─────────────────────────────────────────────

export async function getTodaysAppointments(): Promise<
  ApiResponse<AppointmentWithRelations[]>
> {
  const today = format(new Date(), "yyyy-MM-dd")
  return getAppointments({ dateFrom: today, dateTo: today })
}

// ─────────────────────────────────────────────
// getUpcomingAppointments
// ─────────────────────────────────────────────

export async function getUpcomingAppointments(
  limit = 10
): Promise<ApiResponse<AppointmentWithRelations[]>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const today = format(new Date(), "yyyy-MM-dd")

    const { data, error } = await supabase
      .from("appointments")
      .select("*, patients(id, name, phone, email), services(id, name, duration_minutes, price)")
      .eq("clinic_id", clinicId)
      .gte("appointment_date", today)
      .in("status", ["pending", "confirmed"])
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(limit)

    if (error) return { data: null, error: error.message }
    return { data: data as AppointmentWithRelations[], error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}