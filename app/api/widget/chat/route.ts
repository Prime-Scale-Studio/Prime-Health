import { NextRequest, NextResponse } from "next/server"

export async function OPTIONS() {
  return new Response(null, { status: 200 })
}
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { format } from "date-fns"
import { getChatResponse } from "@/lib/ai/groq"
import { retrieveContext } from "@/lib/ai/rag"
import { getAvailableSlots } from "@/lib/slots"
import type { ChatMessage } from "@/types/index"

function extractDate(messages: ChatMessage[]): string | null {
  // Check user messages from newest to oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role !== "user") continue

    // ISO: YYYY-MM-DD
    const iso = m.content.match(/\b\d{4}-\d{2}-\d{2}\b/)
    if (iso) return iso[0]

    // DD/MM/YYYY or D/M/YYYY
    const slash = m.content.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/)
    if (slash) {
      const d = slash[1].padStart(2, "0")
      const m = slash[2].padStart(2, "0")
      const y = slash[3]
      return `${y}-${m}-${d}`
    }
  }
  return null
}

/**
 * Request body schema — validated with Zod before any processing.
 */
const bodySchema = z.object({
  clinicId: z.string().uuid(),
  sessionToken: z.string().uuid(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(50),
  language: z.enum(["en", "hi"]).optional().default("en"),
})

/**
 * POST /api/widget/chat
 * Public — no auth required.
 *
 * Body:
 *   clinicId     string   — UUID of the clinic
 *   sessionToken string   — client-generated UUID for this conversation
 *   messages     array    — full conversation history [{ role, content }]
 *   language     string   — "en" | "hi"  (default: "en")
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody: unknown = await request.json()

    // ── Zod validation ────────────────────────────────────────
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { clinicId, sessionToken, messages, language } = parsed.data

    const supabase = createAdminClient()

    // ── 1. Fetch clinic ───────────────────────────────────────
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", clinicId)
      .single()

    if (clinicError || !clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
    }

    // ── 2. Extract last user message for RAG query ────────────
    // We use the most recent user message as the semantic query
    const lastUserMessage =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? ""

    // ── 3. Parallel data fetches ──────────────────────────────
    // retrieveContext is .catch(() => '') so RAG failure never breaks chat
    const [servicesResult, knowledgeResult, availabilityResult, blockedResult, ragContext] =
      await Promise.all([
        supabase
          .from("services")
          .select("id, name, description, duration_minutes, price, currency")
          .eq("clinic_id", clinicId)
          .eq("is_active", true)
          .order("name", { ascending: true }),
        supabase
          .from("ai_knowledge")
          .select("question, answer, question_hi, answer_hi")
          .eq("clinic_id", clinicId)
          .eq("is_active", true),
        supabase
          .from("availability")
          .select("*")
          .eq("clinic_id", clinicId)
          .order("day_of_week", { ascending: true }),
        supabase
          .from("blocked_dates")
          .select("blocked_date, reason")
          .eq("clinic_id", clinicId)
          .gte("blocked_date", format(new Date(), "yyyy-MM-dd"))
          .order("blocked_date", { ascending: true })
          .limit(10),
        // RAG retrieval — safe fallback: if it throws for any reason, return ''
        lastUserMessage
          ? retrieveContext(clinicId, lastUserMessage, 5).catch(() => "")
          : Promise.resolve(""),
      ])

    const services = servicesResult.data
    const knowledge = knowledgeResult.data
    const availability = availabilityResult.data
    const blocked = blockedResult.data

    // ── 4. Dynamic Slot Checking ──────────────────────────────
    let availableSlotsForMentionedDate: string[] = []
    const mentionedDate: string | null = extractDate(messages)

    if (mentionedDate) {
      const { data: slots } = await getAvailableSlots(clinicId, mentionedDate)
      if (slots) {
        availableSlotsForMentionedDate = slots
          .filter((s) => s.available)
          .map((s) => s.startTime)
      }
    }

    // ── 5. Build clinic context for AI ────────────────────────
    const clinicContext = {
      clinicName: clinic.name,
      doctorName: clinic.doctor_name,
      city: clinic.city,
      timezone: clinic.timezone,
      currency: services?.[0]?.currency ?? "INR",
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
      availableSlots: availableSlotsForMentionedDate,
      widgetTone: clinic.widget_tone,
      // RAG context — empty string when no documents found or retrieval failed
      ragContext,
    }

    // ── 6. Get AI response ────────────────────────────────────
    const resolvedLanguage = language === "hi" ? "hi" : "en"
    const { content: reply, error: aiError } = await getChatResponse(
      clinicContext,
      messages,
      resolvedLanguage
    )

    if (aiError) {
      return NextResponse.json({ error: aiError }, { status: 502 })
    }

    // ── 8. Upsert chat session ────────────────────────────────
    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: "assistant", content: reply, timestamp: new Date().toISOString() },
    ]

    await supabase
      .from("chat_sessions")
      .upsert(
        {
          clinic_id: clinicId,
          session_token: sessionToken,
          language_used: resolvedLanguage,
        },
        { onConflict: "session_token" }
      )

    return NextResponse.json({ reply }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}