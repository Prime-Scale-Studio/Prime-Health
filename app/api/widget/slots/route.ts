import { NextRequest, NextResponse } from "next/server"

export async function OPTIONS() {
  return new Response(null, { status: 200 })
}
import { getAvailableSlots } from "@/lib/slots"

/**
 * GET /api/widget/slots
 * Public — no auth required.
 *
 * Query params:
 *   clinicId  (required) — UUID
 *   date      (required) — YYYY-MM-DD
 *   serviceId (optional) — UUID, used to derive slot duration
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)

    const clinicId  = searchParams.get("clinicId")
    const date      = searchParams.get("date")
    const serviceId = searchParams.get("serviceId") ?? undefined

    // ── Validate required params ──────────────────────────────
    if (!clinicId || typeof clinicId !== "string" || clinicId.trim() === "") {
      return NextResponse.json(
        { error: "Missing required parameter: clinicId" },
        { status: 400 }
      )
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Missing or invalid parameter: date (expected YYYY-MM-DD)" },
        { status: 400 }
      )
    }

    // ── Generate slots ────────────────────────────────────────
    const { data: slots, error } = await getAvailableSlots(clinicId, date, serviceId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ slots }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}