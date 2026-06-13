"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ApiResponse } from "@/types/index"
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase"

type PatientRow = Tables<"patients">

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
// Patient with appointment history
// ─────────────────────────────────────────────

export type PatientWithHistory = PatientRow & {
  appointments: Array<
    Tables<"appointments"> & {
      services: Pick<Tables<"services">, "id" | "name" | "duration_minutes" | "price">
    }
  >
}

// ─────────────────────────────────────────────
// getPatients — with optional search
// ─────────────────────────────────────────────

export async function getPatients(
  search?: string
): Promise<ApiResponse<PatientRow[]>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    let query = supabase
      .from("patients")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })

    if (search && search.trim().length > 0) {
      const term = search.trim()
      // Supabase full-text OR: use ilike on each column
      query = query.or(
        `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
      )
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// getPatientById — with full appointment history
// ─────────────────────────────────────────────

export async function getPatientById(
  id: string
): Promise<ApiResponse<PatientWithHistory>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data, error } = await supabase
      .from("patients")
      .select(
        `*,
         appointments(
           *,
           services(id, name, duration_minutes, price)
         )`
      )
      .eq("id", id)
      .eq("clinic_id", clinicId)
      .single()

    if (error) return { data: null, error: error.message }
    return { data: data as PatientWithHistory, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// createPatient
// ─────────────────────────────────────────────

type CreatePatientInput = Pick<
  TablesInsert<"patients">,
  "name" | "email" | "phone" | "date_of_birth" | "gender" | "notes"
>

export async function createPatient(
  input: CreatePatientInput
): Promise<ApiResponse<PatientRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { data, error } = await supabaseAdmin
      .from("patients")
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
// updatePatient
// ─────────────────────────────────────────────

type UpdatePatientInput = Pick<
  TablesUpdate<"patients">,
  "name" | "email" | "phone" | "date_of_birth" | "gender" | "notes"
>

export async function updatePatient(
  id: string,
  input: UpdatePatientInput
): Promise<ApiResponse<PatientRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { data, error } = await supabaseAdmin
      .from("patients")
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
// deletePatient
// ─────────────────────────────────────────────

export async function deletePatient(id: string): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient()
    const clinicId = await getClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const supabaseAdmin = createAdminClient() // Use Admin for write
    const { error } = await supabaseAdmin
      .from("patients")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinicId)

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}