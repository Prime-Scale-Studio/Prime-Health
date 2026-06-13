import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function OPTIONS() {
  return new Response(null, { status: 200 })
}

/**
 * POST /api/widget/recognize-customer
 * Public — no auth required.
 *
 * Body: { clinicId: string, phone: string }
 * Returns customer recognition data if found in the patients table.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { clinicId?: string; phone?: string }

    if (!body.clinicId || typeof body.clinicId !== "string") {
      return NextResponse.json({ error: "Missing clinicId" }, { status: 400 })
    }
    if (!body.phone || typeof body.phone !== "string") {
      return NextResponse.json({ error: "Missing phone" }, { status: 400 })
    }

    // Sanitize: digits only, strip leading 91 if 12-digit Indian number
    let phone = body.phone.replace(/\D/g, "")
    if (phone.length === 12 && phone.startsWith("91")) phone = phone.slice(2)
    if (phone.length !== 10) {
      return NextResponse.json({ found: false }, { status: 200 })
    }

    const supabase = createAdminClient()

    const { data: patient, error } = await supabase
      .from("patients")
      .select("id, name, email, phone, total_appointments, last_appointment_at")
      .eq("clinic_id", body.clinicId)
      .eq("phone", phone)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!patient) {
      return NextResponse.json({ found: false }, { status: 200 })
    }

    return NextResponse.json({
      found: true,
      customer: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        totalAppointments: patient.total_appointments,
        lastVisit: patient.last_appointment_at,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
