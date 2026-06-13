import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getChatResponse } from '@/lib/ai/groq'
import { retrieveContext } from '@/lib/ai/rag'
import type { ChatMessage } from '@/types/index'

// ─────────────────────────────────────────────
// CORS preflight
// ─────────────────────────────────────────────

export async function OPTIONS() {
  return new Response(null, { status: 200 })
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Remove markdown syntax so TTS doesn't say "asterisk asterisk bold asterisk asterisk" */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`(.*?)`/g, '$1')
    .trim()
}

/** Classify the patient's intent for analytics logging */
function detectIntent(text: string): string {
  if (/book|appointment|schedule/i.test(text)) return 'booking'
  if (/time|slot|available|when/i.test(text)) return 'availability'
  if (/price|cost|fee|charge/i.test(text)) return 'pricing'
  if (/address|location|where/i.test(text)) return 'location'
  return 'general'
}

// ─────────────────────────────────────────────
// Request schema
// ─────────────────────────────────────────────

const bodySchema = z.object({
  clinicId: z.string().uuid(),
  sessionToken: z.string().uuid(),
  transcript: z.string().min(1).max(2000),
  language: z.enum(['en', 'hi']).default('en'),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      })
    )
    .max(50)
    .default([]),
})

// ─────────────────────────────────────────────
// POST /api/widget/voice
// ─────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json()

    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { clinicId, sessionToken, transcript, language, messages } = parsed.data
    const admin = createAdminClient()

    // ── 1. Fetch clinic ──────────────────────────────────────
    const { data: rawClinic, error: clinicError } = await admin
      .from('clinic_public' as any)
      .select('*')
      .eq('id', clinicId)
      .single()
    const clinic = rawClinic as any

    if (clinicError || !clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    // ── 2. Check voice_settings.is_enabled ───────────────────
    const { data: voiceSettings } = await admin
      .from('voice_settings')
      .select('is_enabled')
      .eq('clinic_id', clinicId)
      .single()

    if (voiceSettings && !voiceSettings.is_enabled) {
      return NextResponse.json(
        { error: 'Voice assistant is disabled for this clinic' },
        { status: 403 }
      )
    }

    // ── 3. Build conversation with transcript appended ────────
    const conversationMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: transcript },
    ]

    // ── 4. Parallel data fetches (same pattern as chat route) ─
    const { format } = await import('date-fns')
    const { getAvailableSlots } = await import('@/lib/slots')

    const [servicesResult, knowledgeResult, availabilityResult, blockedResult, ragContext] =
      await Promise.all([
        admin
          .from('services')
          .select('id, name, description, duration_minutes, price, currency')
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .order('name', { ascending: true }),
        admin
          .from('ai_knowledge')
          .select('question, answer, question_hi, answer_hi')
          .eq('clinic_id', clinicId)
          .eq('is_active', true),
        admin
          .from('availability')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('day_of_week', { ascending: true }),
        admin
          .from('blocked_dates')
          .select('blocked_date, reason')
          .eq('clinic_id', clinicId)
          .gte('blocked_date', format(new Date(), 'yyyy-MM-dd'))
          .order('blocked_date', { ascending: true })
          .limit(10),
        // RAG — safe fallback
        retrieveContext(clinicId, transcript, 5).catch(() => ''),
      ])

    const services = servicesResult.data
    const knowledge = knowledgeResult.data
    const availability = availabilityResult.data
    const blocked = blockedResult.data

    // ── 5. Dynamic slot check ─────────────────────────────────
    // Look for date mentions in the transcript
    let availableSlotsForDate: string[] = []
    const isoMatch = transcript.match(/\b\d{4}-\d{2}-\d{2}\b/)
    const mentionedDate = isoMatch ? isoMatch[0] : null

    if (mentionedDate) {
      const { data: slots } = await getAvailableSlots(clinicId, mentionedDate)
      if (slots) {
        availableSlotsForDate = slots.filter((s) => s.available).map((s) => s.startTime)
      }
    }

    // ── 6. Build clinic context ───────────────────────────────
    const clinicContext = {
      clinicName: clinic.name,
      doctorName: clinic.doctor_name,
      city: clinic.city,
      timezone: clinic.timezone,
      currency: services?.[0]?.currency ?? 'INR',
      services: (services ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration_minutes: s.duration_minutes,
        price: s.price ?? 0,
      })),
      knowledgeBase: (knowledge ?? []).map((k) => ({
        question: k.question,
        answer: k.answer,
        question_hi: k.question_hi,
        answer_hi: k.answer_hi,
      })),
      workingHours: (availability ?? []).map((a) => ({
        day_of_week: a.day_of_week,
        is_available: a.is_available,
        start_time: a.start_time,
        end_time: a.end_time,
        break_start: a.break_start,
        break_end: a.break_end,
      })),
      blockedDates: (blocked ?? []).map((b) => ({
        blocked_date: b.blocked_date,
        reason: b.reason,
      })),
      mentionedDate: mentionedDate ?? undefined,
      availableSlots: availableSlotsForDate,
      widgetTone: clinic.widget_tone,
      ragContext,
    }

    // ── 7. Call Groq (exact same pipeline as chat route) ──────
    const resolvedLanguage = language === 'hi' ? 'hi' : 'en'
    const { content: rawReply, error: aiError } = await getChatResponse(
      clinicContext,
      conversationMessages,
      resolvedLanguage
    )

    if (aiError) {
      return NextResponse.json({ error: aiError }, { status: 502 })
    }

    // ── 8. Detect BOOKING_READY (preserve exact existing logic) ─
    const bookingMatch = rawReply.match(/BOOKING_READY:(.*)/)
    const isBookingReady = !!bookingMatch?.[1]
    let bookingData: Record<string, unknown> | undefined

    if (isBookingReady && bookingMatch?.[1]) {
      try {
        bookingData = JSON.parse(bookingMatch[1].trim()) as Record<string, unknown>
      } catch {
        // malformed JSON — still voice-respond but no booking data
      }
    }

    // Strip BOOKING_READY signal from spoken text
    const cleanReply = rawReply.replace(/BOOKING_READY:(.*)/, '').trim()
    // Strip markdown for clean TTS output
    const spokenText = stripMarkdown(cleanReply || 'Please review the details below.')

    // ── 9. Log to voice_call_logs ─────────────────────────────
    await admin.from('voice_call_logs').insert({
      clinic_id: clinicId,
      session_id: sessionToken,
      transcript,
      intent_detected: detectIntent(transcript),
      booking_completed: isBookingReady,
      language_used: resolvedLanguage,
    })

    // ── 10. Upsert chat session ────────────────────────────────
    await admin
      .from('chat_sessions')
      .upsert(
        {
          clinic_id: clinicId,
          session_token: sessionToken,
          language_used: resolvedLanguage,
        },
        { onConflict: 'session_token' }
      )

    return NextResponse.json(
      { text: spokenText, isBookingReady, bookingData },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
