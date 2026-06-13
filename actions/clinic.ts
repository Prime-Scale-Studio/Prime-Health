"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ApiResponse } from "@/types/index"
import type { Tables, TablesUpdate } from "@/types/supabase"
import { Resend } from "resend"

type ClinicRow = Tables<"clinics">

// ─────────────────────────────────────────────
// Helper: require authenticated clinic or short-circuit
// ─────────────────────────────────────────────

async function getAuthenticatedClinicId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ─────────────────────────────────────────────
// getMyClinic
// ─────────────────────────────────────────────

export async function getMyClinic(): Promise<ApiResponse<ClinicRow>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: "Unauthorized" }
    }

    const { data, error } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // Row doesn't exist, self-heal and create it using Admin client to bypass RLS
        const supabaseAdmin = createAdminClient();
        const { data: newClinic, error: insertError } = await supabaseAdmin
          .from("clinics")
          .insert({
            id: user.id,
            user_id: user.id, // Mandatory column
            name: user.user_metadata?.name || "Prime Health Clinic",
            doctor_name: user.user_metadata?.doctor_name || "Doctor",
            email: user.email,
            language: "en",
            widget_theme_color: "#2563EB",
            widget_tone: "professional"
          })
          .select()
          .single();
          
        if (insertError) return { data: null, error: insertError.message };
        return { data: newClinic, error: null };
      }
      return { data: null, error: error.message };
    }
    
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// updateClinicProfile
// ─────────────────────────────────────────────

type ProfileUpdateFields = Pick<
  TablesUpdate<"clinics">,
  | "name"
  | "doctor_name"
  | "specialty"
  | "description"
  | "phone"
  | "email"
  | "address"
  | "city"
  | "country"
  | "website"
  | "timezone"
  | "logo_url"
>

export async function updateClinicProfile(
  fields: ProfileUpdateFields
): Promise<ApiResponse<ClinicRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getAuthenticatedClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data, error } = await supabase
      .from("clinics")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", clinicId)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// updateWidgetSettings
// ─────────────────────────────────────────────

type WidgetSettingsFields = Pick<
  TablesUpdate<"clinics">,
  | "language"
  | "widget_theme_color"
  | "widget_tone"
>

export async function updateWidgetSettings(
  fields: WidgetSettingsFields
): Promise<ApiResponse<ClinicRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getAuthenticatedClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data, error } = await supabase
      .from("clinics")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", clinicId)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// updateNotificationPreferences
// Phone number stored in clinics.phone; email in clinics.email
// ─────────────────────────────────────────────

type NotificationPrefsFields = {
  phone?: string | null
  email?: string
  email_notifications?: boolean
  whatsapp_number?: string | null
  notification_channel?: "email" | "whatsapp"
}

export async function updateNotificationPreferences(
  fields: NotificationPrefsFields
): Promise<ApiResponse<ClinicRow>> {
  try {
    const supabase = await createClient()
    const clinicId = await getAuthenticatedClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const updatePayload: TablesUpdate<"clinics"> = {
      updated_at: new Date().toISOString(),
    }
    if (fields.phone !== undefined) updatePayload.phone = fields.phone
    if (fields.email !== undefined) updatePayload.email = fields.email
    if (fields.email_notifications !== undefined) {
      updatePayload.email_notifications = fields.email_notifications
    }
    if (fields.whatsapp_number !== undefined) {
      updatePayload.whatsapp_number = fields.whatsapp_number
    }
    if (fields.notification_channel !== undefined) {
      updatePayload.notification_channel = fields.notification_channel
    }

    const { data, error } = await supabase
      .from("clinics")
      .update(updatePayload)
      .eq("id", clinicId)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}

// ─────────────────────────────────────────────
// sendTestNotificationEmail
// ─────────────────────────────────────────────

export async function sendTestNotificationEmail(): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient()
    const clinicId = await getAuthenticatedClinicId()
    if (!clinicId) return { data: null, error: "Unauthorized" }

    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("name, email")
      .eq("id", clinicId)
      .single()

    if (clinicError || !clinic) {
      return { data: null, error: clinicError?.message ?? "Clinic not found" }
    }

    if (!clinic.email) {
      return { data: null, error: "Clinic email is required to send a test notification" }
    }

    if (!process.env.RESEND_API_KEY) {
      return { data: null, error: "RESEND_API_KEY is not configured" }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromAddress = process.env.NEXT_PUBLIC_EMAIL_FROM ?? "onboarding@resend.dev"

    const { error } = await resend.emails.send({
      from: `Prime Health <${fromAddress}>`,
      to: clinic.email,
      subject: "Prime Health test notification",
      html: `<p>Hello from Prime Health.</p><p>This is a test notification for <strong>${clinic.name}</strong>.</p>`,
    })

    if (error) return { data: null, error: error.message }
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unexpected error" }
  }
}