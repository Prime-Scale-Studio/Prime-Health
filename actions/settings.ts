"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ApiResponse } from "@/types/index"
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase"

type AvailabilityRow  = Tables<"availability">
type BlockedDateRow   = Tables<"blocked_dates">
type KnowledgeRow     = Tables<"ai_knowledge">

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

async function getClinicId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ══════════════════════════════════════════════
// AVAILABILITY
// ══════════════════════════════════════════════

// ─────────────────────────────────────────────
// getAvailability — all 7 days
// ─────────────────────────────────────────────

export async function getAvailability(): Promise<ApiResponse<AvailabilityRow[]>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data, error } = await supabase
      .from("availability")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("day_of_week", { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// updateAvailability — upsert a single day
// ─────────────────────────────────────────────

type AvailabilityInput = Pick<
  TablesInsert<"availability">,
  | "day_of_week"
  | "is_available"
  | "start_time"
  | "end_time"
  | "break_start"
  | "break_end"
>

export async function updateAvailability(
  dayOfWeek: number,
  input: Omit<AvailabilityInput, "day_of_week">
): Promise<ApiResponse<AvailabilityRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { data, error } = await supabaseAdmin
      .from("availability")
      .upsert(
        {
          clinic_id: clinicId,
          day_of_week: dayOfWeek,
          ...input,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "clinic_id,day_of_week" }
      )
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ══════════════════════════════════════════════
// BLOCKED DATES
// ══════════════════════════════════════════════

// ─────────────────────────────────────────────
// getBlockedDates
// ─────────────────────────────────────────────

export async function getBlockedDates(): Promise<ApiResponse<BlockedDateRow[]>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data, error } = await supabase
      .from("blocked_dates")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("blocked_date", { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// addBlockedDate
// ─────────────────────────────────────────────

type BlockedDateInput = Pick<TablesInsert<"blocked_dates">, "blocked_date" | "reason">

export async function addBlockedDate(
  input: BlockedDateInput
): Promise<ApiResponse<BlockedDateRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { data, error } = await supabaseAdmin
      .from("blocked_dates")
      .insert({ ...input, clinic_id: clinicId })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// removeBlockedDate
// ─────────────────────────────────────────────

export async function removeBlockedDate(id: string): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { error } = await supabaseAdmin
      .from("blocked_dates")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinicId)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ══════════════════════════════════════════════
// AI KNOWLEDGE BASE
// ══════════════════════════════════════════════

// ─────────────────────────────────────────────
// getKnowledgeBase — active entries only
// ─────────────────────────────────────────────

export async function getKnowledgeBase(): Promise<ApiResponse<KnowledgeRow[]>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data, error } = await supabase
      .from("ai_knowledge")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// createKnowledgeEntry
// ─────────────────────────────────────────────

type KnowledgeInput = Pick<
  TablesInsert<"ai_knowledge">,
  "question" | "answer" | "question_hi" | "answer_hi"
>

export async function createKnowledgeEntry(
  input: KnowledgeInput
): Promise<ApiResponse<KnowledgeRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { data, error } = await supabaseAdmin
      .from("ai_knowledge")
      .insert({ ...input, clinic_id: clinicId, is_active: true })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// updateKnowledgeEntry
// ─────────────────────────────────────────────

type KnowledgeUpdateInput = Pick<
  TablesUpdate<"ai_knowledge">,
  "question" | "answer" | "question_hi" | "answer_hi" | "is_active"
>

export async function updateKnowledgeEntry(
  id: string,
  input: KnowledgeUpdateInput
): Promise<ApiResponse<KnowledgeRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { data, error } = await supabaseAdmin
      .from("ai_knowledge")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("clinic_id", clinicId)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// deleteKnowledgeEntry
// ─────────────────────────────────────────────

export async function deleteKnowledgeEntry(id: string): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { error } = await supabaseAdmin
      .from("ai_knowledge")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinicId)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ══════════════════════════════════════════════
// CHAT SESSIONS
// ══════════════════════════════════════════════

export async function getActiveChatSessionsCount(): Promise<ApiResponse<number>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { count, error } = await supabase
      .from("chat_sessions")
      .select("id", { count: "exact" })
      .eq("clinic_id", clinicId)
      .is("ended_at", null)

    if (error) return { data: null, error: error.message }
    return { data: count ?? 0, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}