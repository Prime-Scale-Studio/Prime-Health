import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function OPTIONS() {
  return new Response(null, { status: 200 })
}

/**
 * GET /api/widget/voice-settings?clinicId=<uuid>
 * Public — no auth. Returns minimal voice config for the widget.
 * Returns is_enabled=false when no row exists (safe default).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinicId')

    if (!clinicId || typeof clinicId !== 'string') {
      return NextResponse.json({ error: 'Missing clinicId' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data } = await supabase
      .from('voice_settings')
      .select(
        'is_enabled, default_language, speech_rate, voice_gender, auto_detect_language'
      )
      .eq('clinic_id', clinicId)
      .single()

    // If no row, return safe defaults (voice off)
    return NextResponse.json(
      {
        is_enabled: data?.is_enabled ?? false,
        default_language: data?.default_language ?? 'en',
        speech_rate: data?.speech_rate ?? 1.0,
        voice_gender: data?.voice_gender ?? 'female',
        auto_detect_language: data?.auto_detect_language ?? true,
      },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
