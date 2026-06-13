import { NextRequest, NextResponse } from "next/server"

export async function OPTIONS() {
  return new Response(null, { status: 200 })
}
import { createAdminClient } from "@/lib/supabase/admin"
import { widgetBookingSchema } from "@/lib/validations"
import { isSlotAvailable } from "@/lib/slots"
import { calculateEndTime } from "@/lib/utils"
import { sendConfirmationEmail, sendWhatsAppNotification } from "@/lib/notifications"
import type { Tables } from "@/types/supabase"

/**
 * POST /api/widget/book
 * Public — used by the AI widget or web form to finalize a booking.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json()

    // 1. Validate input with Zod
    const validation = widgetBookingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: "Validation failed",
        details: validation.error.format()
      }, { status: 400 })
    }

    const data = validation.data
    const supabase = createAdminClient()

    // 2. Fetch service to get duration/price
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("*")
      .eq("id", data.serviceId)
      .eq("clinic_id", data.clinicId)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const endTime = calculateEndTime(data.startTime, service.duration_minutes)

    // 3. Final slot availability guard (race-condition check)
    const available = await isSlotAvailable(
      data.clinicId,
      data.appointmentDate,
      data.startTime,
      endTime
    )

    if (!available) {
      return NextResponse.json({
        error: "This slot was just taken. Please select another time."
      }, { status: 409 })
    }

    // 4. Find or create patient (safer than relying on a DB unique index)
    const { data: existingPatient, error: existingPatientError } = await supabase
      .from("patients")
      .select("*")
      .eq("clinic_id", data.clinicId)
      .eq("phone", data.patientPhone)
      .maybeSingle()

    if (existingPatientError) {
      return NextResponse.json({ error: existingPatientError.message }, { status: 500 })
    }

    let patient: Tables<"patients"> | null = existingPatient

    if (!patient) {
      const { data: createdPatient, error: patientCreateError } = await supabase
        .from("patients")
        .insert({
          clinic_id: data.clinicId,
          name: data.patientName,
          email: data.patientEmail || null,
          phone: data.patientPhone,
        })
        .select()
        .single()

      if (patientCreateError || !createdPatient) {
        return NextResponse.json(
          { error: patientCreateError?.message ?? "Failed to create patient record" },
          { status: 500 }
        )
      }
      patient = createdPatient
    } else if (patient.name !== data.patientName || patient.email !== (data.patientEmail || null)) {
      const { data: updatedPatient, error: patientUpdateError } = await supabase
        .from("patients")
        .update({
          name: data.patientName,
          email: data.patientEmail || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", patient.id)
        .select()
        .single()

      if (patientUpdateError || !updatedPatient) {
        return NextResponse.json(
          { error: patientUpdateError?.message ?? "Failed to update patient record" },
          { status: 500 }
        )
      }
      patient = updatedPatient
    }

    // 5. Create Appointment
    const { data: appointment, error: apptError } = await supabase
      .from("appointments")
      .insert({
        clinic_id: data.clinicId,
        patient_id: patient.id,
        service_id: data.serviceId,
        patient_name: data.patientName,
        patient_phone: data.patientPhone,
        patient_email: data.patientEmail || null,
        service_name: service.name,
        duration_minutes: service.duration_minutes,
        appointment_date: data.appointmentDate,
        start_time: data.startTime,
        end_time: endTime,
        status: "confirmed",
        booked_via: "widget",
        booking_language: data.booking_language,
      })
      .select()
      .single()

    if (apptError || !appointment) {
      return NextResponse.json(
        { error: apptError?.message ?? "Failed to create appointment" },
        { status: 500 }
      )
    }

    // 6. Fetch clinic info for notifications
    const { data: clinic } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", data.clinicId)
      .single()

    if (clinic) {
      const payload = { appointment, clinic, patient, service }

      // Await notifications so the serverless function does not terminate
      // before they are fully sent.
      try {
        await Promise.allSettled([
          sendConfirmationEmail(payload),
          sendWhatsAppNotification(payload)
        ])
      } catch (emailErr) {
        console.error("[WidgetBook] Notification dispatch failed:", emailErr)
      }
    }

    // 7. Return confirmation
    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        date: appointment.appointment_date,
        time: appointment.start_time,
        service: service.name,
        clinic: clinic?.name,
        doctor: clinic?.doctor_name
      }
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}