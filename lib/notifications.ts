/**
 * lib/notifications.ts — Server-side only
 *
 * Handles all outbound notifications for PrimeHealth:
 *   • Confirmation email (patient + doctor) on new booking
 *   • Cancellation email (patient + doctor) on appointment cancel
 *   • WhatsApp via Twilio
 *
 * Email provider: Gmail SMTP via Nodemailer (temporary — swap provider in sendEmail() only)
 * All templates: production-grade, elite HTML
 * Dev mode: controlled via NODE_ENV — never overrides production recipients
 */

import twilio from "twilio"
import nodemailer from "nodemailer"
import { format, parse } from "date-fns"
import { createAdminClient } from "@/lib/supabase/admin"
import { getBaseUrl } from "@/lib/utils"
import type { Tables } from "@/types/supabase"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type NotificationResult = {
  success: boolean
  error: string | null
}

type AppointmentRow = Tables<"appointments">
type ClinicRow      = Tables<"clinics">
type PatientRow     = Tables<"patients">
type ServiceRow     = Tables<"services">

export type AppointmentNotificationPayload = {
  appointment: AppointmentRow
  clinic:      ClinicRow
  patient:     PatientRow
  service:     ServiceRow
}

// Public-facing shape expected by new function signatures
export type AppointmentWithDetails = AppointmentRow & {
  patient_name:  string
  patient_email: string | null
  patient_phone: string | null
  service_name:  string | null
  start_time:    string
  appointment_date: string
}

export type ClinicDetails = Pick<
  ClinicRow,
  | "id"
  | "name"
  | "doctor_name"
  | "email"
  | "phone"
  | "address"
  | "city"
  | "slug"
  | "widget_theme_color"
>

// ─────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────

function readableDate(dateStr: string): string {
  const parsed = parse(dateStr, "yyyy-MM-dd", new Date())
  return format(parsed, "EEEE, d MMMM yyyy")
}

function readableTime(timeStr: string): string {
  const parsed = parse(timeStr, "HH:mm", new Date())
  return format(parsed, "h:mm a")
}

function googleCalendarUrl(
  appointment: Pick<AppointmentRow, "appointment_date" | "start_time" | "end_time">,
  clinic: Pick<ClinicRow, "name" | "address" | "doctor_name">
): string {
  // Format: 20260512T103000Z
  const dateStr  = appointment.appointment_date.replace(/-/g, "")
  const startStr = appointment.start_time.replace(":", "") + "00"
  const endStr   = appointment.end_time.replace(":", "") + "00"
  const start    = `${dateStr}T${startStr}`
  const end      = `${dateStr}T${endStr}`
  const text     = encodeURIComponent(`Appointment at ${clinic.name}`)
  const details  = encodeURIComponent(`With Dr. ${clinic.doctor_name}`)
  const location = encodeURIComponent(clinic.address ?? clinic.name)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`
}

// ─────────────────────────────────────────────
// Provider-agnostic email sender
// Swap provider here — zero other files change
// ─────────────────────────────────────────────

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.EMAIL_PROVIDER === "gmail") {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })

      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME ?? "PrimeHealth"}" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
      })

      return { success: true }
    }

    // Future: add resend here
    // if (process.env.EMAIL_PROVIDER === "resend") { ... }

    return { success: false, error: "No email provider configured" }
  } catch (error) {
    console.error("[notifications] sendEmail failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ─────────────────────────────────────────────
// Notification logger
// ─────────────────────────────────────────────

async function logNotification(
  clinicId:      string,
  appointmentId: string,
  channel:       "email" | "whatsapp",
  recipient:     string,
  type:          string,
  status:        "sent" | "failed",
  errorMsg:      string | null
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from("notification_logs").insert({
      clinic_id:      clinicId,
      appointment_id: appointmentId,
      channel,
      recipient,
      type,
      status,
      error_message: errorMsg,
    })
  } catch {
    // Logging failure must never crash the main flow
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES — Elite Design System
//
// Design tokens:
//   Primary:    #0F172A  (Slate 900)  — dark headers
//   Accent:     #6366F1  (Indigo 500) — CTAs and highlights
//   Success:    #10B981  (Emerald 500)
//   Danger:     #EF4444  (Red 500)
//   Surface:    #FFFFFF
//   Muted bg:   #F8FAFC  (Slate 50)
//   Border:     #E2E8F0  (Slate 200)
//   Text:       #1E293B  (Slate 800)
//   Muted text: #64748B  (Slate 500)
//   Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
// ─────────────────────────────────────────────────────────────────────────────

const TOKENS = {
  fontStack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
  primary:   "#0F172A",
  accent:    "#6366F1",
  accentDk:  "#4F46E5",
  success:   "#10B981",
  danger:    "#EF4444",
  surface:   "#FFFFFF",
  mutedBg:   "#F8FAFC",
  border:    "#E2E8F0",
  text:      "#1E293B",
  muted:     "#64748B",
  label:     "#94A3B8",
} as const

function emailWrapper(content: string, accentBar?: string): string {
  const bar = accentBar ?? TOKENS.accent
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>PrimeHealth</title>
</head>
<body style="margin:0;padding:0;background-color:${TOKENS.mutedBg};font-family:${TOKENS.fontStack};-webkit-font-smoothing:antialiased;mso-line-height-rule:exactly;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:${TOKENS.mutedBg};">
    <tr>
      <td align="center" style="padding:48px 20px;">

        <!-- Top accent bar -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${bar} 0%,${TOKENS.accentDk} 100%);border-radius:4px 4px 0 0;"></td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
          style="max-width:600px;background-color:${TOKENS.surface};border-radius:0 0 20px 20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);border:1px solid ${TOKENS.border};border-top:none;">
          ${content}

          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 40px 40px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-top:1px solid ${TOKENS.border};padding-top:28px;text-align:center;">
                    <p style="margin:0 0 6px 0;font-size:12px;color:${TOKENS.label};letter-spacing:0.04em;text-transform:uppercase;font-weight:600;">Powered by PrimeHealth</p>
                    <p style="margin:0;font-size:11px;color:${TOKENS.label};">Smart clinic management for modern healthcare providers.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

// ─────────────────────────────────────────────
// 1. Patient Confirmation
// ─────────────────────────────────────────────

function buildPatientConfirmationHtml(
  appointment: AppointmentRow,
  clinic:      ClinicRow,
  patient:     PatientRow,
  service:     ServiceRow
): string {
  const formattedDate = readableDate(appointment.appointment_date)
  const formattedTime = readableTime(appointment.start_time)
  const calLink       = googleCalendarUrl(appointment, clinic)
  const location      = [clinic.address, clinic.city].filter(Boolean).join(", ") || "Contact clinic for address"

  const content = /* html */ `
  <!-- Hero -->
  <tr>
    <td style="padding:48px 40px 0 40px;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;background:linear-gradient(135deg,#ECFDF5 0%,#D1FAE5 100%);border-radius:50%;margin-bottom:24px;">
        <span style="font-size:36px;line-height:1;">✓</span>
      </div>
      <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:${TOKENS.primary};letter-spacing:-0.02em;">Your appointment is confirmed</h1>
      <p style="margin:0;font-size:16px;color:${TOKENS.muted};line-height:1.5;">Hi <strong style="color:${TOKENS.text};">${patient.name}</strong>, we've locked in your slot with <strong style="color:${TOKENS.text};">Dr. ${clinic.doctor_name}</strong>.</p>
    </td>
  </tr>

  <!-- Divider -->
  <tr>
    <td style="padding:32px 40px 0 40px;">
      <div style="height:1px;background:${TOKENS.border};"></div>
    </td>
  </tr>

  <!-- Details Card -->
  <tr>
    <td style="padding:32px 40px 0 40px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
        style="background:${TOKENS.mutedBg};border-radius:16px;border:1px solid ${TOKENS.border};overflow:hidden;">

        <!-- Row: Service -->
        <tr>
          <td style="padding:20px 24px;border-bottom:1px solid ${TOKENS.border};">
            <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${TOKENS.label};text-transform:uppercase;letter-spacing:0.08em;">Service</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:${TOKENS.primary};">${service.name}</p>
          </td>
        </tr>

        <!-- Row: Date + Time -->
        <tr>
          <td style="padding:0;border-bottom:1px solid ${TOKENS.border};">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td width="50%" style="padding:20px 24px;border-right:1px solid ${TOKENS.border};vertical-align:top;">
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${TOKENS.label};text-transform:uppercase;letter-spacing:0.08em;">Date</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:${TOKENS.text};">${formattedDate}</p>
                </td>
                <td width="50%" style="padding:20px 24px;vertical-align:top;">
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${TOKENS.label};text-transform:uppercase;letter-spacing:0.08em;">Time</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:${TOKENS.text};">${formattedTime}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Row: Clinic + Doctor -->
        <tr>
          <td style="padding:0;border-bottom:1px solid ${TOKENS.border};">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td width="50%" style="padding:20px 24px;border-right:1px solid ${TOKENS.border};vertical-align:top;">
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${TOKENS.label};text-transform:uppercase;letter-spacing:0.08em;">Doctor</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:${TOKENS.text};">Dr. ${clinic.doctor_name}</p>
                </td>
                <td width="50%" style="padding:20px 24px;vertical-align:top;">
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${TOKENS.label};text-transform:uppercase;letter-spacing:0.08em;">Clinic</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:${TOKENS.text};">${clinic.name}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Row: Location -->
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${TOKENS.label};text-transform:uppercase;letter-spacing:0.08em;">Location</p>
            <p style="margin:0;font-size:14px;color:${TOKENS.muted};line-height:1.5;">${location}</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:32px 40px 0 40px;text-align:center;">
      <a href="${calLink}" target="_blank"
        style="display:inline-block;background:linear-gradient(135deg,${TOKENS.accent} 0%,${TOKENS.accentDk} 100%);color:#FFFFFF;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.01em;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
        📅 Add to Google Calendar
      </a>
    </td>
  </tr>

  <!-- Note -->
  <tr>
    <td style="padding:24px 40px 40px 40px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
        style="background:#EEF2FF;border-radius:12px;border-left:4px solid ${TOKENS.accent};">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-size:13px;color:#4338CA;line-height:1.6;">
              <strong>Need to reschedule?</strong> Please contact us at least 2 hours before your appointment.
              ${clinic.email ? `Reply to this email or call <strong>${clinic.phone ?? ""}</strong>.` : ""}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  `

  return emailWrapper(content, TOKENS.success)
}

// ─────────────────────────────────────────────
// 2. Doctor Confirmation (new booking alert)
// ─────────────────────────────────────────────

function buildDoctorConfirmationHtml(
  appointment: AppointmentRow,
  clinic:      ClinicRow,
  patient:     PatientRow,
  service:     ServiceRow
): string {
  const formattedDate = readableDate(appointment.appointment_date)
  const formattedTime = readableTime(appointment.start_time)
  const dashboardUrl  = `${getBaseUrl()}/appointments`

  const content = /* html */ `
  <!-- Header -->
  <tr>
    <td style="padding:40px 40px 0 40px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td>
            <span style="display:inline-block;background:#EEF2FF;color:${TOKENS.accent};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:5px 12px;border-radius:6px;">New Booking</span>
          </td>
          <td align="right">
            <span style="font-size:12px;color:${TOKENS.label};">${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </td>
        </tr>
      </table>
      <h1 style="margin:16px 0 4px 0;font-size:24px;font-weight:800;color:${TOKENS.primary};letter-spacing:-0.02em;">New appointment booked</h1>
      <p style="margin:0;font-size:15px;color:${TOKENS.muted};">A patient has scheduled a visit at <strong style="color:${TOKENS.text};">${clinic.name}</strong>.</p>
    </td>
  </tr>

  <!-- Divider -->
  <tr>
    <td style="padding:24px 40px 0 40px;">
      <div style="height:1px;background:${TOKENS.border};"></div>
    </td>
  </tr>

  <!-- Patient summary banner -->
  <tr>
    <td style="padding:24px 40px 0 40px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
        style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Patient</p>
            <p style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#FFFFFF;">${patient.name}</p>
            <table role="presentation" border="0" cellspacing="0" cellpadding="0">
              <tr>
                ${patient.phone ? `<td style="padding-right:24px;"><span style="font-size:13px;color:rgba(255,255,255,0.6);">📞 </span><span style="font-size:13px;color:rgba(255,255,255,0.9);font-weight:500;">${patient.phone}</span></td>` : ""}
                ${patient.email ? `<td><span style="font-size:13px;color:rgba(255,255,255,0.6);">✉️ </span><span style="font-size:13px;color:rgba(255,255,255,0.9);font-weight:500;">${patient.email}</span></td>` : ""}
              </tr>
            </table>
          </td>
          <td style="padding:24px 28px;text-align:right;vertical-align:middle;">
            <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Time</p>
            <p style="margin:0;font-size:20px;font-weight:800;color:${TOKENS.accent};">${formattedTime}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Details rows -->
  <tr>
    <td style="padding:24px 40px 0 40px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
        style="border:1px solid ${TOKENS.border};border-radius:16px;overflow:hidden;">

        <tr style="background:${TOKENS.mutedBg};">
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};width:50%;">
            <p style="margin:0;font-size:12px;color:${TOKENS.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Service</p>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};">
            <p style="margin:0;font-size:14px;font-weight:600;color:${TOKENS.text};">${service.name}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};">
            <p style="margin:0;font-size:12px;color:${TOKENS.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Date</p>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};">
            <p style="margin:0;font-size:14px;font-weight:600;color:${TOKENS.text};">${formattedDate}</p>
          </td>
        </tr>

        <tr style="background:${TOKENS.mutedBg};">
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};">
            <p style="margin:0;font-size:12px;color:${TOKENS.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Duration</p>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};">
            <p style="margin:0;font-size:14px;font-weight:600;color:${TOKENS.text};">${service.duration_minutes} min</p>
          </td>
        </tr>

        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};">
            <p style="margin:0;font-size:12px;color:${TOKENS.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Booked via</p>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};">
            <span style="display:inline-block;background:#EEF2FF;color:${TOKENS.accent};font-size:12px;font-weight:700;padding:3px 10px;border-radius:6px;text-transform:capitalize;">${appointment.booked_via}</span>
          </td>
        </tr>

        ${appointment.patient_notes ? /* html */ `
        <tr style="background:${TOKENS.mutedBg};">
          <td style="padding:14px 20px;" valign="top">
            <p style="margin:0;font-size:12px;color:${TOKENS.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Patient Notes</p>
          </td>
          <td style="padding:14px 20px;">
            <p style="margin:0;font-size:14px;color:${TOKENS.text};line-height:1.6;font-style:italic;">"${appointment.patient_notes}"</p>
          </td>
        </tr>
        ` : ""}

      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:32px 40px 40px 40px;text-align:center;">
      <a href="${dashboardUrl}" target="_blank"
        style="display:inline-block;background:linear-gradient(135deg,${TOKENS.accent} 0%,${TOKENS.accentDk} 100%);color:#FFFFFF;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
        Open Dashboard →
      </a>
    </td>
  </tr>
  `

  return emailWrapper(content, TOKENS.accent)
}

// ─────────────────────────────────────────────
// 3. Patient Cancellation
// ─────────────────────────────────────────────

function buildPatientCancellationHtml(
  appointment: AppointmentRow,
  clinic:      ClinicRow,
  patient:     PatientRow,
  service:     ServiceRow,
  reason?:     string
): string {
  const formattedDate = readableDate(appointment.appointment_date)
  const formattedTime = readableTime(appointment.start_time)
  const bookingUrl    = clinic.slug
    ? `${getBaseUrl()}/book/${clinic.slug}`
    : `${getBaseUrl()}/book`

  const content = /* html */ `
  <!-- Hero -->
  <tr>
    <td style="padding:48px 40px 0 40px;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;background:#FEF2F2;border-radius:50%;margin-bottom:24px;">
        <span style="font-size:36px;line-height:1;">✕</span>
      </div>
      <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:${TOKENS.primary};letter-spacing:-0.02em;">Appointment Cancelled</h1>
      <p style="margin:0;font-size:16px;color:${TOKENS.muted};line-height:1.5;">Hi <strong style="color:${TOKENS.text};">${patient.name}</strong>, your appointment has been cancelled.</p>
    </td>
  </tr>

  <!-- Divider -->
  <tr>
    <td style="padding:32px 40px 0 40px;">
      <div style="height:1px;background:${TOKENS.border};"></div>
    </td>
  </tr>

  <!-- Cancelled booking summary -->
  <tr>
    <td style="padding:32px 40px 0 40px;">
      <p style="margin:0 0 16px 0;font-size:13px;font-weight:700;color:${TOKENS.label};text-transform:uppercase;letter-spacing:0.08em;">Cancelled Appointment Details</p>
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
        style="background:${TOKENS.mutedBg};border-radius:16px;border:1px solid ${TOKENS.border};overflow:hidden;">

        <tr>
          <td style="padding:0;">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td width="50%" style="padding:20px 24px;border-right:1px solid ${TOKENS.border};border-bottom:1px solid ${TOKENS.border};vertical-align:top;">
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${TOKENS.label};text-transform:uppercase;letter-spacing:0.08em;">Service</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:${TOKENS.text};">${service.name}</p>
                </td>
                <td width="50%" style="padding:20px 24px;border-bottom:1px solid ${TOKENS.border};vertical-align:top;">
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${TOKENS.label};text-transform:uppercase;letter-spacing:0.08em;">Doctor</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:${TOKENS.text};">Dr. ${clinic.doctor_name}</p>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:20px 24px;border-right:1px solid ${TOKENS.border};vertical-align:top;">
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${TOKENS.label};text-transform:uppercase;letter-spacing:0.08em;">Date</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:${TOKENS.text};">${formattedDate}</p>
                </td>
                <td width="50%" style="padding:20px 24px;vertical-align:top;">
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:${TOKENS.label};text-transform:uppercase;letter-spacing:0.08em;">Time</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:${TOKENS.text};">${formattedTime}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>

  ${reason ? /* html */ `
  <!-- Reason -->
  <tr>
    <td style="padding:20px 40px 0 40px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
        style="background:#FEF2F2;border-radius:12px;border-left:4px solid ${TOKENS.danger};">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:0.06em;">Reason</p>
            <p style="margin:0;font-size:14px;color:#7F1D1D;line-height:1.5;">${reason}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ` : ""}

  <!-- Rebook message -->
  <tr>
    <td style="padding:24px 40px 0 40px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
        style="background:#EEF2FF;border-radius:12px;border-left:4px solid ${TOKENS.accent};">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-size:14px;color:#3730A3;line-height:1.6;">
              We're sorry for the inconvenience. Please <strong>contact us to reschedule</strong> at your earliest convenience.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Clinic contact + Rebook CTA -->
  <tr>
    <td style="padding:32px 40px 40px 40px;text-align:center;">
      <a href="${bookingUrl}" target="_blank"
        style="display:inline-block;background:linear-gradient(135deg,${TOKENS.accent} 0%,${TOKENS.accentDk} 100%);color:#FFFFFF;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(99,102,241,0.35);margin-bottom:20px;">
        Book a New Appointment →
      </a>
      <br>
      ${clinic.email || clinic.phone ? /* html */ `
      <p style="margin:16px 0 0 0;font-size:13px;color:${TOKENS.muted};">
        Or contact us directly:
        ${clinic.phone ? `<strong style="color:${TOKENS.text};">${clinic.phone}</strong>` : ""}
        ${clinic.phone && clinic.email ? " · " : ""}
        ${clinic.email ? `<a href="mailto:${clinic.email}" style="color:${TOKENS.accent};text-decoration:none;font-weight:500;">${clinic.email}</a>` : ""}
      </p>
      ` : ""}
    </td>
  </tr>
  `

  return emailWrapper(content, TOKENS.danger)
}

// ─────────────────────────────────────────────
// 4. Doctor Cancellation
// ─────────────────────────────────────────────

function buildDoctorCancellationHtml(
  appointment: AppointmentRow,
  clinic:      ClinicRow,
  patient:     PatientRow,
  service:     ServiceRow,
  reason?:     string
): string {
  const formattedDate = readableDate(appointment.appointment_date)
  const formattedTime = readableTime(appointment.start_time)
  const dashboardUrl  = `${getBaseUrl()}/appointments`

  const content = /* html */ `
  <!-- Header -->
  <tr>
    <td style="padding:40px 40px 0 40px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td>
            <span style="display:inline-block;background:#FEF2F2;color:${TOKENS.danger};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:5px 12px;border-radius:6px;">Appointment Cancelled</span>
          </td>
          <td align="right">
            <span style="font-size:12px;color:${TOKENS.label};">${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </td>
        </tr>
      </table>
      <h1 style="margin:16px 0 4px 0;font-size:24px;font-weight:800;color:${TOKENS.primary};letter-spacing:-0.02em;">Appointment cancelled</h1>
      <p style="margin:0;font-size:15px;color:${TOKENS.muted};">The following appointment at <strong style="color:${TOKENS.text};">${clinic.name}</strong> has been cancelled.</p>
    </td>
  </tr>

  <!-- Divider -->
  <tr>
    <td style="padding:24px 40px 0 40px;">
      <div style="height:1px;background:${TOKENS.border};"></div>
    </td>
  </tr>

  <!-- Patient banner -->
  <tr>
    <td style="padding:24px 40px 0 40px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
        style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Patient</p>
            <p style="margin:0 0 16px 0;font-size:22px;font-weight:800;color:#FFFFFF;">${patient.name}</p>
            <table role="presentation" border="0" cellspacing="0" cellpadding="0">
              <tr>
                ${patient.phone ? `<td style="padding-right:24px;"><span style="font-size:13px;color:rgba(255,255,255,0.9);">📞 ${patient.phone}</span></td>` : ""}
                ${patient.email ? `<td><span style="font-size:13px;color:rgba(255,255,255,0.9);">✉️ ${patient.email}</span></td>` : ""}
              </tr>
            </table>
          </td>
          <td style="padding:24px 28px;text-align:right;vertical-align:middle;">
            <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Was scheduled</p>
            <p style="margin:0;font-size:18px;font-weight:800;color:#FCA5A5;">${formattedTime}</p>
            <p style="margin:4px 0 0 0;font-size:12px;color:rgba(255,255,255,0.5);">${formattedDate}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Details table -->
  <tr>
    <td style="padding:24px 40px 0 40px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
        style="border:1px solid ${TOKENS.border};border-radius:16px;overflow:hidden;">

        <tr style="background:${TOKENS.mutedBg};">
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};width:40%;">
            <p style="margin:0;font-size:12px;color:${TOKENS.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Service</p>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};">
            <p style="margin:0;font-size:14px;font-weight:600;color:${TOKENS.text};">${service.name}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};">
            <p style="margin:0;font-size:12px;color:${TOKENS.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Original Date</p>
          </td>
          <td style="padding:14px 20px;border-bottom:1px solid ${TOKENS.border};">
            <p style="margin:0;font-size:14px;font-weight:600;color:${TOKENS.text};">${formattedDate} at ${formattedTime}</p>
          </td>
        </tr>

        ${reason ? /* html */ `
        <tr style="background:${TOKENS.mutedBg};">
          <td style="padding:14px 20px;" valign="top">
            <p style="margin:0;font-size:12px;color:${TOKENS.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Reason</p>
          </td>
          <td style="padding:14px 20px;">
            <p style="margin:0;font-size:14px;color:${TOKENS.text};line-height:1.6;">${reason}</p>
          </td>
        </tr>
        ` : ""}

      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:32px 40px 40px 40px;text-align:center;">
      <a href="${dashboardUrl}" target="_blank"
        style="display:inline-block;background:linear-gradient(135deg,${TOKENS.accent} 0%,${TOKENS.accentDk} 100%);color:#FFFFFF;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
        View Appointments →
      </a>
    </td>
  </tr>
  `

  return emailWrapper(content, TOKENS.danger)
}

// ─────────────────────────────────────────────
// DEV MODE LOGIC — EXPLICIT (as required)
//
// In development: both emails go to DEV_EMAIL_OVERRIDE if set,
// otherwise fall through to the real address.
// In production: always use real recipient. Zero overrides.
// ─────────────────────────────────────────────

function resolveRecipients(patientEmail: string | null, clinicEmail: string | null) {
  const isDev = process.env.NODE_ENV !== "production"

  const patientRecipient = isDev
    ? (process.env.DEV_EMAIL_OVERRIDE ?? patientEmail)
    : patientEmail

  const doctorRecipient = isDev
    ? (process.env.DEV_EMAIL_OVERRIDE ?? clinicEmail)
    : clinicEmail

  return { patientRecipient, doctorRecipient, isDev }
}

// ─────────────────────────────────────────────
// sendConfirmationEmail — public API
// (keeps backward-compatible payload signature AND
//  supports new AppointmentWithDetails + ClinicDetails overload)
// ─────────────────────────────────────────────

export async function sendConfirmationEmail(
  payload: AppointmentNotificationPayload
): Promise<NotificationResult>

export async function sendConfirmationEmail(
  appointment: AppointmentWithDetails,
  clinic:       ClinicDetails
): Promise<{ success: boolean } | { error: string }>

export async function sendConfirmationEmail(
  payloadOrAppointment: AppointmentNotificationPayload | AppointmentWithDetails,
  clinicArg?:           ClinicDetails
): Promise<NotificationResult | { success: boolean } | { error: string }> {

  // Normalise both call signatures into one shape
  let appointment: AppointmentRow
  let clinic:      ClinicRow
  let patient:     PatientRow
  let service:     ServiceRow

  if ("patient" in payloadOrAppointment) {
    // Legacy payload object call
    ;({ appointment, clinic, patient, service } = payloadOrAppointment)
  } else {
    // New two-arg call — fetch full rows from DB via admin client
    const admin = createAdminClient()
    appointment  = payloadOrAppointment as AppointmentRow

    if (!clinicArg) return { success: false, error: "Missing clinic argument" }

    const [clinicRes, patientRes, serviceRes] = await Promise.all([
      admin.from("clinics").select("*").eq("id", clinicArg.id).single(),
      appointment.patient_id
        ? admin.from("patients").select("*").eq("id", appointment.patient_id).single()
        : Promise.resolve({ data: null, error: null }),
      appointment.service_id
        ? admin.from("services").select("*").eq("id", appointment.service_id).single()
        : Promise.resolve({ data: null, error: null }),
    ])

    if (!clinicRes.data) return { error: "Clinic not found" }
    clinic  = clinicRes.data
    patient = patientRes.data ?? ({ name: appointment.patient_name, email: appointment.patient_email, phone: appointment.patient_phone } as PatientRow)
    service = serviceRes.data ?? ({ name: appointment.service_name ?? "Consultation", duration_minutes: appointment.duration_minutes } as ServiceRow)
  }

  const { patientRecipient, doctorRecipient, isDev } = resolveRecipients(
    patient.email,
    clinic.email
  )

  console.error("[notifications] sendConfirmationEmail — mode:", isDev ? "DEV" : "PROD")
  console.error("[notifications] patient →", patientRecipient)
  console.error("[notifications] doctor  →", doctorRecipient)

  const subjectPrefix = isDev ? "[TEST] " : ""
  let errorMsg = ""

  // ── 1. Patient email ─────────────────────────────────────
  if (patientRecipient) {
    const { success, error } = await sendEmail({
      to:      patientRecipient,
      subject: `${subjectPrefix}Your appointment is confirmed — ${clinic.name}`,
      html:    buildPatientConfirmationHtml(appointment, clinic, patient, service),
    })
    await logNotification(clinic.id, appointment.id, "email", patientRecipient, "appointment_confirmation_patient", success ? "sent" : "failed", error ?? null)
    if (!success) errorMsg += `Patient: ${error ?? "unknown"}. `
  }

  // ── 2. Doctor email ───────────────────────────────────────
  if (doctorRecipient) {
    const { success, error } = await sendEmail({
      to:      doctorRecipient,
      subject: `${subjectPrefix}New booking — ${patient.name} · ${readableDate(appointment.appointment_date)}`,
      html:    buildDoctorConfirmationHtml(appointment, clinic, patient, service),
    })
    await logNotification(clinic.id, appointment.id, "email", doctorRecipient, "appointment_confirmation_doctor", success ? "sent" : "failed", error ?? null)
    if (!success) errorMsg += `Doctor: ${error ?? "unknown"}. `
  }

  const result: NotificationResult = {
    success: errorMsg.length === 0,
    error:   errorMsg.trim() || null,
  }
  return result
}

// ─────────────────────────────────────────────
// sendCancellationEmail — public API
// ─────────────────────────────────────────────

export async function sendCancellationEmail(
  payload: AppointmentNotificationPayload,
  clinicArg?: null,
  options?:   { reason?: string }
): Promise<NotificationResult>

export async function sendCancellationEmail(
  appointment: AppointmentWithDetails,
  clinic:      ClinicDetails,
  options?:    { reason?: string }
): Promise<{ success: boolean } | { error: string }>

export async function sendCancellationEmail(
  payloadOrAppointment: AppointmentNotificationPayload | AppointmentWithDetails,
  clinicArg?:           ClinicDetails | null,
  options?:             { reason?: string }
): Promise<NotificationResult | { success: boolean } | { error: string }> {

  let appointment: AppointmentRow
  let clinic:      ClinicRow
  let patient:     PatientRow
  let service:     ServiceRow
  const reason = options?.reason

  if ("patient" in payloadOrAppointment) {
    ;({ appointment, clinic, patient, service } = payloadOrAppointment)
  } else {
    const admin = createAdminClient()
    appointment  = payloadOrAppointment as AppointmentRow

    if (!clinicArg) return { error: "Missing clinic argument" }

    const [clinicRes, patientRes, serviceRes] = await Promise.all([
      admin.from("clinics").select("*").eq("id", clinicArg.id).single(),
      appointment.patient_id
        ? admin.from("patients").select("*").eq("id", appointment.patient_id).single()
        : Promise.resolve({ data: null, error: null }),
      appointment.service_id
        ? admin.from("services").select("*").eq("id", appointment.service_id).single()
        : Promise.resolve({ data: null, error: null }),
    ])

    if (!clinicRes.data) return { error: "Clinic not found" }
    clinic  = clinicRes.data
    patient = patientRes.data ?? ({ name: appointment.patient_name, email: appointment.patient_email, phone: appointment.patient_phone } as PatientRow)
    service = serviceRes.data ?? ({ name: appointment.service_name ?? "Consultation", duration_minutes: appointment.duration_minutes } as ServiceRow)
  }

  const { patientRecipient, doctorRecipient, isDev } = resolveRecipients(
    patient.email,
    clinic.email
  )

  console.error("[notifications] sendCancellationEmail — mode:", isDev ? "DEV" : "PROD")
  console.error("[notifications] patient →", patientRecipient)
  console.error("[notifications] doctor  →", doctorRecipient)

  const subjectPrefix = isDev ? "[TEST] " : ""
  let errorMsg = ""

  // ── 1. Patient cancellation email ────────────────────────
  if (patientRecipient) {
    const { success, error } = await sendEmail({
      to:      patientRecipient,
      subject: `${subjectPrefix}Your appointment has been cancelled — ${clinic.name}`,
      html:    buildPatientCancellationHtml(appointment, clinic, patient, service, reason),
    })
    await logNotification(clinic.id, appointment.id, "email", patientRecipient, "appointment_cancellation_patient", success ? "sent" : "failed", error ?? null)
    if (!success) errorMsg += `Patient: ${error ?? "unknown"}. `
  }

  // ── 2. Doctor cancellation email ──────────────────────────
  if (doctorRecipient) {
    const { success, error } = await sendEmail({
      to:      doctorRecipient,
      subject: `${subjectPrefix}Appointment cancelled — ${patient.name} · ${readableDate(appointment.appointment_date)}`,
      html:    buildDoctorCancellationHtml(appointment, clinic, patient, service, reason),
    })
    await logNotification(clinic.id, appointment.id, "email", doctorRecipient, "appointment_cancellation_doctor", success ? "sent" : "failed", error ?? null)
    if (!success) errorMsg += `Doctor: ${error ?? "unknown"}. `
  }

  const result: NotificationResult = {
    success: errorMsg.length === 0,
    error:   errorMsg.trim() || null,
  }
  return result
}

// ─────────────────────────────────────────────
// sendWhatsAppNotification — unchanged
// ─────────────────────────────────────────────

function getTwilioClient(): ReturnType<typeof twilio> {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) throw new Error("Missing Twilio credentials")
  return twilio(sid, token)
}

export async function sendWhatsAppNotification(
  payload: AppointmentNotificationPayload
): Promise<NotificationResult> {
  const { appointment, clinic, patient, service } = payload

  try {
    const twilioClient = getTwilioClient()

    const from = process.env.TWILIO_WHATSAPP_FROM
    if (!from) throw new Error("Missing TWILIO_WHATSAPP_FROM")

    if (!patient.phone) throw new Error("Patient has no phone number")

    const rawPhone = patient.phone.replace(/\D/g, "")
    const e164     = rawPhone.startsWith("91") ? `+${rawPhone}` : `+91${rawPhone}`
    const to       = `whatsapp:${e164}`

    const date = readableDate(appointment.appointment_date)
    const time = readableTime(appointment.start_time)

    const messageBody = [
      `✅ *Appointment Confirmed!*`,
      ``,
      `*${clinic.name}*`,
      `Dr. ${clinic.doctor_name}`,
      ``,
      `📋 *Service:* ${service.name}`,
      `📅 *Date:* ${date}`,
      `🕐 *Time:* ${time}`,
      ``,
      clinic.address
        ? `📍 *Address:* ${clinic.address}${clinic.city ? `, ${clinic.city}` : ""}`
        : null,
      ``,
      `Please arrive 10 minutes early. Reply to this message to contact the clinic.`,
    ]
      .filter((line) => line !== null)
      .join("\n")

    await twilioClient.messages.create({
      from: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      to,
      body: messageBody,
    })

    await logNotification(clinic.id, appointment.id, "whatsapp", e164, "whatsapp_confirmation", "sent", null)

    return { success: true, error: null }
  } catch (err) {
    const error = err instanceof Error ? err.message : "WhatsApp notification failed"
    await logNotification(clinic.id, appointment.id, "whatsapp", patient.phone ?? "unknown", "whatsapp_confirmation", "failed", error)
    return { success: false, error }
  }
}
