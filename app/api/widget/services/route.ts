import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function OPTIONS() {
  return new Response(null, { status: 200 })
}

/**
 * GET /api/widget/services?clinicId=xxx
 * Public — no auth required.
 * Returns active services for the given clinic.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get("clinicId")

    if (!clinicId || typeof clinicId !== "string") {
      return NextResponse.json({ error: "Missing clinicId" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: services, error } = await supabase
      .from("services")
      .select("id, name, description, duration_minutes, price, currency")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ services: services ?? [] }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
