/**
 * lib/ai/groq.ts — Server-side only
 * Groq client singleton + getChatResponse for the widget AI assistant.
 */

import Groq from "groq-sdk"
import type { ChatMessage } from "@/types/index"

// ─────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────

if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY environment variable.")
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export const GROQ_MODEL = "llama-3.3-70b-versatile" as const
export const GROQ_FALLBACK_MODEL = "llama-3.1-8b-instant" as const

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type KnowledgeEntry = {
  question: string
  answer: string
  question_hi: string | null
  answer_hi: string | null
}

export type ServiceSummary = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
}

export type WorkingDay = {
  day_of_week: number
  is_available: boolean
  start_time: string
  end_time: string
  break_start: string | null
  break_end: string | null
}

export type BlockedDate = {
  blocked_date: string
  reason: string | null
}

export type ClinicContext = {
  clinicName: string
  doctorName: string
  specialty?: string | null
  city?: string | null
  currency: string
  timezone: string
  services: ServiceSummary[]
  knowledgeBase: KnowledgeEntry[]
  workingHours: WorkingDay[]
  blockedDates: BlockedDate[]
  mentionedDate?: string
  availableSlots?: string[]
  /** RAG-retrieved context chunks for this message. Empty string if none found. */
  ragContext?: string
  widgetTone?: string
}

export type ChatResponseResult = {
  content: string
  error: string | null
}

// ─────────────────────────────────────────────
// System prompt builder
// ─────────────────────────────────────────────

function buildSystemPrompt(clinic: ClinicContext, language: string): string {
  const isHindi = language === "hi"

  // RAG context section — only injected when non-empty
  const ragSection =
    clinic.ragContext && clinic.ragContext.trim().length > 0
      ? `
CLINIC KNOWLEDGE BASE (from uploaded documents):
The following information is specific to this clinic. Use it to answer patient questions accurately. If the answer is not in this context, say "please contact the clinic directly" rather than guessing.
${clinic.ragContext}
`
      : ""

  const servicesText = clinic.services
    .map(
      (s) =>
        `  • ${s.name} [ID: ${s.id}]${s.description ? ` — ${s.description}` : ""} | Duration: ${s.duration_minutes} min | Price: ${clinic.currency} ${s.price}`
    )
    .join("\n")

  const kbText =
    clinic.knowledgeBase.length > 0
      ? clinic.knowledgeBase
          .map((k) => {
            const q = isHindi && k.question_hi ? k.question_hi : k.question
            const a = isHindi && k.answer_hi ? k.answer_hi : k.answer
            return `  Q: ${q}\n  A: ${a}`
          })
          .join("\n\n")
      : "  No additional FAQs configured."

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const workingHoursText = clinic.workingHours
    .map((w) => {
      if (!w.is_available) return `  • ${dayNames[w.day_of_week]}: Closed`
      let text = `  • ${dayNames[w.day_of_week]}: ${w.start_time.slice(0, 5)} - ${w.end_time.slice(0, 5)}`
      if (w.break_start && w.break_end) {
        text += ` (Break: ${w.break_start.slice(0, 5)} - ${w.break_end.slice(0, 5)})`
      }
      return text
    })
    .join("\n")

  const blockedDatesText = clinic.blockedDates.length > 0
    ? clinic.blockedDates.map(b => `  • ${b.blocked_date}${b.reason ? ` (${b.reason})` : ""}`).join("\n")
    : "  No specific dates blocked."

  const now = new Date()
  const currentDate = now.toISOString().split("T")[0]
  const currentTime = now.toTimeString().split(" ")[0].slice(0, 5)
  const currentDay = dayNames[now.getDay()]

  let availabilityContext = ""
  if (clinic.mentionedDate) {
    if (clinic.availableSlots && clinic.availableSlots.length > 0) {
      availabilityContext = `AVAILABLE SLOTS FOR ${clinic.mentionedDate}:\n  ${clinic.availableSlots.join(", ")}`
    } else {
      availabilityContext = `AVAILABILITY FOR ${clinic.mentionedDate}: No slots available or clinic is closed.`
    }
  }

  return `You are an AI appointment booking assistant for ${clinic.clinicName}, the clinic of ${clinic.doctorName}${clinic.specialty ? ` (${clinic.specialty})` : ""}${clinic.city ? `, located in ${clinic.city}` : ""}.

Today's Date: ${currentDate} (${currentDay})
Current Time: ${currentTime}

YOUR ONLY JOB is to help patients book appointments by:
1. Warmly greeting the patient.
2. Collecting the following details one or two at a time — do NOT ask for all at once:
   - Patient's full name
   - Mobile phone number (10-digit Indian number)
   - Email address (optional — mention it's optional)
   - Which service they need (from the list below)
   - Preferred date (YYYY-MM-DD format internally; confirm in readable format)
   - Preferred time slot
3. Confirming all details back to the patient before finalising.
4. Telling them their booking is confirmed once the system confirms it.

SERVICES OFFERED:
${servicesText}

CLINIC WORKING HOURS:
${workingHoursText}

BLOCKED / CLOSED DATES:
${blockedDatesText}

${availabilityContext}

CLINIC FAQ / KNOWLEDGE BASE:
${kbText}
${ragSection}
RULES YOU MUST FOLLOW:
- IMPORTANT: Before confirming a date, check if it's a working day and not a blocked date. If the clinic is closed on that day (e.g., Sunday), politely inform the patient and suggest other dates.
- If the patient asks for availability on a specific date, use the "AVAILABLE SLOTS" section above if provided. If not provided or empty, explain that the clinic is closed or fully booked for that day.
- Respond ONLY in the language the patient uses. If they write in Hindi, respond in Hindi. If English, respond in English.
- Do NOT discuss anything unrelated to this clinic, its services, or the booking process.
- Do NOT make up services, prices, or availability — only use the data above.
- Keep responses SHORT and conversational — 1 to 3 sentences max unless listing items.
- Be warm, professional, and helpful at all times.
- IMPORTANT: "phone" in JSON MUST be exactly a 10-digit Indian mobile number starting with 6-9, with NO spaces, NO dashes, NO +91 (e.g. "9876543210").
- IMPORTANT: "time" in JSON MUST be exactly "HH:mm" in 24-hour format (e.g. "14:30").
- When you have all the required info (name, phone, service, date, time), output exactly this JSON on its own line so the system can parse it:
  BOOKING_READY:{"name":"...","phone":"...","email":"...","serviceId":"...","date":"YYYY-MM-DD","time":"HH:mm"}

Timezone: ${clinic.timezone}
Currency: ${clinic.currency}`.trim()
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

/**
 * Sends the conversation to Groq and returns the assistant reply.
 * Never throws — always returns { content, error }.
 */
export async function getChatResponse(
  clinic: ClinicContext,
  messages: ChatMessage[],
  language: string = "en"
): Promise<ChatResponseResult> {
  try {
    const systemPrompt = buildSystemPrompt(clinic, language)
    // Estimated token count for observability (1 token ≈ 4 chars)
    console.error('[chat] estimated tokens:', Math.ceil(systemPrompt.length / 4))

    const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ]

    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: groqMessages,
        temperature: 0.3,        // low temp for consistent, predictable booking flow
        max_tokens: 500,
        stream: false,
      })
    } catch (apiErr: any) {
      // Fallback on rate limit (429) or service unavailable (503)
      if (apiErr?.status === 429 || apiErr?.status === 503 || apiErr?.error?.error?.code === "rate_limit_exceeded") {
        console.warn(`Primary model ${GROQ_MODEL} failed (quota/rate limit), falling back to ${GROQ_FALLBACK_MODEL}...`)
        completion = await groq.chat.completions.create({
          model: GROQ_FALLBACK_MODEL,
          messages: groqMessages,
          temperature: 0.3,
          max_tokens: 500,
          stream: false,
        })
      } else {
        throw apiErr;
      }
    }

    const content =
      completion.choices[0]?.message?.content?.trim() ??
      "I'm sorry, I couldn't process that. Please try again."

    return { content, error: null }
  } catch (err) {
    const error =
      err instanceof Error ? err.message : "AI service error. Please try again."
    return { content: "", error }
  }
}