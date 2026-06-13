'use server'

/**
 * actions/voice.ts
 * Server Actions for voice_settings management.
 * Authenticated doctor only — clinic_id always from server auth.
 */

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Tables } from '@/types/supabase'

type VoiceSettingsRow = Tables<'voice_settings'>

// ─────────────────────────────────────────────
// Input schema
// ─────────────────────────────────────────────

const voiceSettingsSchema = z.object({
  is_enabled: z.boolean(),
  default_language: z.enum(['en', 'hi']),
  auto_detect_language: z.boolean(),
  voice_gender: z.enum(['male', 'female']),
  speech_rate: z.number().min(0.5).max(2.0),
  noise_cancellation: z.boolean(),
})

type VoiceSettingsInput = z.infer<typeof voiceSettingsSchema>

// ─────────────────────────────────────────────
// Internal: authenticated clinic ID
// ─────────────────────────────────────────────

async function getAuthenticatedClinicId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ─────────────────────────────────────────────
// getVoiceSettings
// ─────────────────────────────────────────────

export async function getVoiceSettings(): Promise<{
  data: VoiceSettingsRow | null
  error: string | null
}> {
  try {
    const clinicId = await getAuthenticatedClinicId()
    if (!clinicId) return { data: null, error: 'Unauthorized' }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('voice_settings')
      .select('*')
      .eq('clinic_id', clinicId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = "no rows returned" — expected when not yet configured
      console.error('[getVoiceSettings]', error)
      return { data: null, error: error.message }
    }

    return { data: data ?? null, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}

// ─────────────────────────────────────────────
// updateVoiceSettings
// Upserts (insert on first save, update thereafter)
// ─────────────────────────────────────────────

export async function updateVoiceSettings(input: VoiceSettingsInput): Promise<{
  data: VoiceSettingsRow | null
  error: string | null
}> {
  try {
    const clinicId = await getAuthenticatedClinicId()
    if (!clinicId) return { data: null, error: 'Unauthorized' }

    const parsed = voiceSettingsSchema.safeParse(input)
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0].message }
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('voice_settings')
      .upsert(
        {
          clinic_id: clinicId,
          ...parsed.data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'clinic_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('[updateVoiceSettings]', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    console.error('[updateVoiceSettings]', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}
