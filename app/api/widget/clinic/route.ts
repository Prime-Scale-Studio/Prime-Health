import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return new Response(null, { status: 200 })
}
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");

    if (!clinicId || typeof clinicId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid clinicId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: clinic, error } = await supabase
      .from("clinics")
      .select("id, name, doctor_name, widget_theme_color")
      .eq("id", clinicId)
      .single();

    if (error || !clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    return NextResponse.json(clinic, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
