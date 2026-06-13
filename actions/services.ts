"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ApiResponse } from "@/types/index"
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase"

type ServiceRow = Tables<"services">

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

// ─────────────────────────────────────────────
// getServices — all, including inactive
// ─────────────────────────────────────────────

export async function getServices(): Promise<ApiResponse<ServiceRow[]>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data, error } = await supabase
      .from("services")
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
// getActiveServices — active only (for widget / booking)
// ─────────────────────────────────────────────

export async function getActiveServices(): Promise<ApiResponse<ServiceRow[]>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// createService
// ─────────────────────────────────────────────

type CreateServiceInput = Pick<
  TablesInsert<"services">,
  "name" | "description" | "duration_minutes" | "price"
>

export async function createService(
  input: CreateServiceInput
): Promise<ApiResponse<ServiceRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { data, error } = await supabaseAdmin
      .from("services")
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
// updateService
// ─────────────────────────────────────────────

type UpdateServiceInput = Pick<
  TablesUpdate<"services">,
  "name" | "description" | "duration_minutes" | "price"
>

export async function updateService(
  id: string,
  input: UpdateServiceInput
): Promise<ApiResponse<ServiceRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { data, error } = await supabaseAdmin
      .from("services")
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
// toggleServiceActive — flip is_active boolean
// ─────────────────────────────────────────────

export async function toggleServiceActive(
  id: string
): Promise<ApiResponse<ServiceRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    // Fetch current value first
    const { data: current, error: fetchError } = await supabase
      .from("services")
      .select("is_active")
      .eq("id", id)
      .eq("clinic_id", clinicId)
      .single()

    if (fetchError || !current) {
      return { data: null, error: fetchError?.message ?? "Service not found" }
    }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { data, error } = await supabaseAdmin
      .from("services")
      .update({
        is_active: !current.is_active,
        updated_at: new Date().toISOString(),
      })
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
// deleteService
// ─────────────────────────────────────────────

export async function deleteService(id: string): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { error } = await supabaseAdmin
      .from("services")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinicId)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}