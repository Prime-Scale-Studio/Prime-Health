/**
 * scripts/test-email.ts
 *
 * Sends all 4 email templates to GMAIL_USER for visual inspection.
 * Run with: npx tsx scripts/test-email.ts
 */

import { config } from "dotenv"
import { resolve } from "path"
import nodemailer from "nodemailer"
import { format, parse, addHours } from "date-fns"
import { getBaseUrl } from "../lib/utils"

config({ path: resolve(process.cwd(), ".env.local") })

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

const MOCK_APPOINTMENT = {
  id:               "test-appt-001",
  clinic_id:        "test-clinic-001",
  patient_id:       "test-patient-001",
  service_id:       "test-service-001",
  patient_name:     "Ayush Raj",
  patient_email:    process.env.GMAIL_USER ?? "test@example.com",
  patient_phone:    "9876543210",
  service_name:     "General Consultation",
  duration_minutes: 30,
  appointment_date: "2026-06-20",
  start_time:       "10:30",
  end_time:         "11:00",
  status:           "confirmed" as const,
  patient_notes:    "Mild fever and headache for 3 days. Previous BP issue.",
  doctor_notes:     null,
  booked_via:       "widget",
  booking_language: "en" as const,
  confirmation_sent: false,
  reminder_sent:    false,
  created_at:       new Date().toISOString(),
  updated_at:       new Date().toISOString(),
}

const MOCK_CLINIC = {
  id:                    "test-clinic-001",
  user_id:               "test-user-001",
  name:                  "Prime Health Clinic",
  doctor_name:           "Ayush Raj",
  specialty:             "General Physician",
  description:           "Modern clinic for comprehensive healthcare.",
  address:               "123 MG Road, Sector 5",
  city:                  "New Delhi",
  country:               "IN",
  phone:                 "+91 98765 43210",
  email:                 process.env.GMAIL_USER ?? "doctor@example.com",
  website:               "https://primehealth.ai",
  logo_url:              null,
  widget_theme_color:    "#6366F1",
  widget_tone:           "professional",
  timezone:              "Asia/Kolkata",
  language:              "en" as const,
  slot_duration_minutes: 30,
  buffer_time_minutes:   10,
  max_advance_days:      30,
  min_notice_hours:      2,
  notification_channel:  "email" as const,
  whatsapp_number:       null,
  email_notifications:   true,
  plan:                  "pro" as const,
  plan_status:           "active" as const,
  trial_ends_at:         new Date(Date.now() + 30 * 86400000).toISOString(),
  stripe_customer_id:    null,
  stripe_subscription_id: null,
  slug:                  "prime-health-clinic",
  created_at:            new Date().toISOString(),
  updated_at:            new Date().toISOString(),
}

const MOCK_PATIENT = {
  id:                   "test-patient-001",
  clinic_id:            "test-clinic-001",
  name:                 "Ayush Raj",
  email:                process.env.GMAIL_USER ?? "patient@example.com",
  phone:                "9876543210",
  date_of_birth:        "1995-03-15",
  gender:               "male",
  address:              "456 Sector 12, Noida",
  notes:                "Allergic to penicillin",
  preferred_language:   "en" as const,
  total_appointments:   5,
  last_appointment_at:  new Date().toISOString(),
  created_at:           new Date().toISOString(),
  updated_at:           new Date().toISOString(),
}

const MOCK_SERVICE = {
  id:                "test-service-001",
  clinic_id:         "test-clinic-001",
  name:              "General Consultation",
  description:       "Comprehensive health checkup and consultation",
  duration_minutes:  30,
  price:             500,
  currency:          "INR",
  is_active:         true,
  sort_order:        1,
  name_hi:           null,
  description_hi:    null,
  created_at:        new Date().toISOString(),
  updated_at:        new Date().toISOString(),
}

// ─────────────────────────────────────────────
// Shared formatters (mirror lib/notifications.ts)
// ─────────────────────────────────────────────

function readableDate(dateStr: string): string {
  const parsed = parse(dateStr, "yyyy-MM-dd", new Date())
  return format(parsed, "EEEE, d MMMM yyyy")
}

function readableTime(timeStr: string): string {
  const parsed = parse(timeStr, "HH:mm", new Date())
  return format(parsed, "h:mm a")
}

function googleCalendarUrl(appt: typeof MOCK_APPOINTMENT, clinic: typeof MOCK_CLINIC): string {
  const dateStr  = appt.appointment_date.replace(/-/g, "")
  const startStr = appt.start_time.replace(":", "") + "00"
  const endStr   = appt.end_time.replace(":", "") + "00"
  const start    = `${dateStr}T${startStr}`
  const end      = `${dateStr}T${endStr}`
  const text     = encodeURIComponent(`Appointment at ${clinic.name}`)
  const details  = encodeURIComponent(`With Dr. ${clinic.doctor_name}`)
  const location = encodeURIComponent(clinic.address ?? clinic.name)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`
}

// ─────────────────────────────────────────────
// Design tokens (inline for script isolation)
// ─────────────────────────────────────────────

const T = {
  accent:   "#6366F1",
  accentDk: "#4F46E5",
  success:  "#10B981",
  danger:   "#EF4444",
  primary:  "#0F172A",
  surface:  "#FFFFFF",
  mutedBg:  "#F8FAFC",
  border:   "#E2E8F0",
  text:     "#1E293B",
  muted:    "#64748B",
  label:    "#94A3B8",
  font:     `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
}

function wrapper(content: string, barColor: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${T.mutedBg};font-family:${T.font};">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:${T.mutedBg};">
    <tr><td align="center" style="padding:48px 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
        <tr><td style="height:4px;background:linear-gradient(90deg,${barColor},${T.accentDk});border-radius:4px 4px 0 0;"></td></tr>
      </table>
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:${T.surface};border-radius:0 0 20px 20px;border:1px solid ${T.border};border-top:none;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        ${content}
        <tr><td style="padding:0 40px 40px;"><table width="100%" cellspacing="0" cellpadding="0">
          <tr><td style="border-top:1px solid ${T.border};padding-top:28px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:${T.label};font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Powered by PrimeHealth</p>
            <p style="margin:0;font-size:11px;color:${T.label};">Smart clinic management for modern healthcare.</p>
          </td></tr>
        </table></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// ─────────────────────────────────────────────
// Template builders
// ─────────────────────────────────────────────

function patientConfirmationHtml(): string {
  const a = MOCK_APPOINTMENT, c = MOCK_CLINIC, p = MOCK_PATIENT, s = MOCK_SERVICE
  const date = readableDate(a.appointment_date)
  const time = readableTime(a.start_time)
  const cal  = googleCalendarUrl(a, c)
  const loc  = [c.address, c.city].filter(Boolean).join(", ")

  return wrapper(`
    <tr><td style="padding:48px 40px 0;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-radius:50%;margin-bottom:24px;">
        <span style="font-size:36px;">✓</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:${T.primary};letter-spacing:-0.02em;">Your appointment is confirmed</h1>
      <p style="margin:0;font-size:16px;color:${T.muted};">Hi <strong style="color:${T.text};">${p.name}</strong>, we've locked in your slot with <strong style="color:${T.text};">Dr. ${c.doctor_name}</strong>.</p>
    </td></tr>

    <tr><td style="padding:32px 40px 0;"><div style="height:1px;background:${T.border};"></div></td></tr>

    <tr><td style="padding:32px 40px 0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="background:${T.mutedBg};border-radius:16px;border:1px solid ${T.border};">
        <tr><td style="padding:20px 24px;border-bottom:1px solid ${T.border};">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${T.label};text-transform:uppercase;letter-spacing:0.08em;">Service</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:${T.primary};">${s.name}</p>
        </td></tr>
        <tr><td style="padding:0;border-bottom:1px solid ${T.border};">
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td width="50%" style="padding:20px 24px;border-right:1px solid ${T.border};vertical-align:top;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${T.label};text-transform:uppercase;letter-spacing:0.08em;">Date</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:${T.text};">${date}</p>
              </td>
              <td width="50%" style="padding:20px 24px;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${T.label};text-transform:uppercase;letter-spacing:0.08em;">Time</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:${T.text};">${time}</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${T.label};text-transform:uppercase;letter-spacing:0.08em;">Location</p>
          <p style="margin:0;font-size:14px;color:${T.muted};">${loc}</p>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:32px 40px 0;text-align:center;">
      <a href="${cal}" style="display:inline-block;background:linear-gradient(135deg,${T.accent},${T.accentDk});color:#FFF;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
        📅 Add to Google Calendar
      </a>
    </td></tr>

    <tr><td style="padding:24px 40px 40px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="background:#EEF2FF;border-radius:12px;border-left:4px solid ${T.accent};">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;font-size:13px;color:#4338CA;line-height:1.6;">
            <strong>Need to reschedule?</strong> Please contact us at least 2 hours before. Call <strong>${c.phone}</strong> or email <a href="mailto:${c.email}" style="color:${T.accent};">${c.email}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  `, T.success)
}

function doctorConfirmationHtml(): string {
  const a = MOCK_APPOINTMENT, c = MOCK_CLINIC, p = MOCK_PATIENT, s = MOCK_SERVICE
  const date = readableDate(a.appointment_date)
  const time = readableTime(a.start_time)

  return wrapper(`
    <tr><td style="padding:40px 40px 0;">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td><span style="display:inline-block;background:#EEF2FF;color:${T.accent};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:5px 12px;border-radius:6px;">New Booking</span></td>
          <td align="right"><span style="font-size:12px;color:${T.label};">${new Date().toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</span></td>
        </tr>
      </table>
      <h1 style="margin:16px 0 4px;font-size:24px;font-weight:800;color:${T.primary};letter-spacing:-0.02em;">New appointment booked</h1>
      <p style="margin:0;font-size:15px;color:${T.muted};">A patient has scheduled a visit at <strong style="color:${T.text};">${c.name}</strong>.</p>
    </td></tr>

    <tr><td style="padding:24px 40px 0;"><div style="height:1px;background:${T.border};"></div></td></tr>

    <tr><td style="padding:24px 40px 0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#0F172A,#1E293B);border-radius:16px;">
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Patient</p>
            <p style="margin:0 0 16px;font-size:22px;font-weight:800;color:#FFF;">${p.name}</p>
            <table cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding-right:24px;"><span style="font-size:13px;color:rgba(255,255,255,0.9);">📞 ${p.phone}</span></td>
                <td><span style="font-size:13px;color:rgba(255,255,255,0.9);">✉️ ${p.email}</span></td>
              </tr>
            </table>
          </td>
          <td style="padding:24px 28px;text-align:right;vertical-align:middle;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Time</p>
            <p style="margin:0;font-size:20px;font-weight:800;color:${T.accent};">${time}</p>
          </td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:24px 40px 0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${T.border};border-radius:16px;overflow:hidden;">
        <tr style="background:${T.mutedBg};">
          <td style="padding:14px 20px;border-bottom:1px solid ${T.border};width:40%;"><p style="margin:0;font-size:12px;color:${T.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Service</p></td>
          <td style="padding:14px 20px;border-bottom:1px solid ${T.border};"><p style="margin:0;font-size:14px;font-weight:600;color:${T.text};">${s.name}</p></td>
        </tr>
        <tr>
          <td style="padding:14px 20px;border-bottom:1px solid ${T.border};"><p style="margin:0;font-size:12px;color:${T.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Date</p></td>
          <td style="padding:14px 20px;border-bottom:1px solid ${T.border};"><p style="margin:0;font-size:14px;font-weight:600;color:${T.text};">${date}</p></td>
        </tr>
        <tr style="background:${T.mutedBg};">
          <td style="padding:14px 20px;border-bottom:1px solid ${T.border};"><p style="margin:0;font-size:12px;color:${T.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Duration</p></td>
          <td style="padding:14px 20px;border-bottom:1px solid ${T.border};"><p style="margin:0;font-size:14px;font-weight:600;color:${T.text};">${s.duration_minutes} min</p></td>
        </tr>
        <tr>
          <td style="padding:14px 20px;" valign="top"><p style="margin:0;font-size:12px;color:${T.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Patient Notes</p></td>
          <td style="padding:14px 20px;"><p style="margin:0;font-size:14px;color:${T.text};line-height:1.6;font-style:italic;">"${a.patient_notes}"</p></td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:32px 40px 40px;text-align:center;">
      <a href="#" style="display:inline-block;background:linear-gradient(135deg,${T.accent},${T.accentDk});color:#FFF;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
        Open Dashboard →
      </a>
    </td></tr>
  `, T.accent)
}

function patientCancellationHtml(): string {
  const a = MOCK_APPOINTMENT, c = MOCK_CLINIC, p = MOCK_PATIENT, s = MOCK_SERVICE
  const date = readableDate(a.appointment_date)
  const time = readableTime(a.start_time)
  const bookingUrl = `https://primehealth.ai/book/${c.slug}`

  return wrapper(`
    <tr><td style="padding:48px 40px 0;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;background:#FEF2F2;border-radius:50%;margin-bottom:24px;">
        <span style="font-size:36px;">✕</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:${T.primary};letter-spacing:-0.02em;">Appointment Cancelled</h1>
      <p style="margin:0;font-size:16px;color:${T.muted};">Hi <strong style="color:${T.text};">${p.name}</strong>, your appointment has been cancelled.</p>
    </td></tr>

    <tr><td style="padding:32px 40px 0;"><div style="height:1px;background:${T.border};"></div></td></tr>

    <tr><td style="padding:32px 40px 0;">
      <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:${T.label};text-transform:uppercase;letter-spacing:0.08em;">Cancelled Appointment</p>
      <table width="100%" cellspacing="0" cellpadding="0" style="background:${T.mutedBg};border-radius:16px;border:1px solid ${T.border};">
        <tr><td style="padding:0;">
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td width="50%" style="padding:20px 24px;border-right:1px solid ${T.border};border-bottom:1px solid ${T.border};vertical-align:top;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${T.label};text-transform:uppercase;letter-spacing:0.08em;">Service</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:${T.text};">${s.name}</p>
              </td>
              <td width="50%" style="padding:20px 24px;border-bottom:1px solid ${T.border};vertical-align:top;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${T.label};text-transform:uppercase;letter-spacing:0.08em;">Doctor</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:${T.text};">Dr. ${c.doctor_name}</p>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding:20px 24px;border-right:1px solid ${T.border};vertical-align:top;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${T.label};text-transform:uppercase;letter-spacing:0.08em;">Date</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:${T.text};">${date}</p>
              </td>
              <td width="50%" style="padding:20px 24px;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${T.label};text-transform:uppercase;letter-spacing:0.08em;">Time</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:${T.text};">${time}</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:20px 40px 0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="background:#EEF2FF;border-radius:12px;border-left:4px solid ${T.accent};">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;font-size:14px;color:#3730A3;line-height:1.6;">
            We're sorry for the inconvenience. Please <strong>contact us to reschedule</strong> at your earliest convenience.
          </p>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:32px 40px 40px;text-align:center;">
      <a href="${bookingUrl}" style="display:inline-block;background:linear-gradient(135deg,${T.accent},${T.accentDk});color:#FFF;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(99,102,241,0.35);margin-bottom:16px;">
        Book a New Appointment →
      </a>
      <br>
      <p style="margin:16px 0 0;font-size:13px;color:${T.muted};">Or contact us: <strong style="color:${T.text};">${c.phone}</strong> · <a href="mailto:${c.email}" style="color:${T.accent};text-decoration:none;">${c.email}</a></p>
    </td></tr>
  `, T.danger)
}

function doctorCancellationHtml(): string {
  const a = MOCK_APPOINTMENT, c = MOCK_CLINIC, p = MOCK_PATIENT, s = MOCK_SERVICE
  const date = readableDate(a.appointment_date)
  const time = readableTime(a.start_time)

  return wrapper(`
    <tr><td style="padding:40px 40px 0;">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td><span style="display:inline-block;background:#FEF2F2;color:${T.danger};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;padding:5px 12px;border-radius:6px;">Appointment Cancelled</span></td>
          <td align="right"><span style="font-size:12px;color:${T.label};">${new Date().toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</span></td>
        </tr>
      </table>
      <h1 style="margin:16px 0 4px;font-size:24px;font-weight:800;color:${T.primary};letter-spacing:-0.02em;">Appointment cancelled</h1>
      <p style="margin:0;font-size:15px;color:${T.muted};">The following appointment at <strong style="color:${T.text};">${c.name}</strong> has been cancelled.</p>
    </td></tr>

    <tr><td style="padding:24px 40px 0;"><div style="height:1px;background:${T.border};"></div></td></tr>

    <tr><td style="padding:24px 40px 0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#0F172A,#1E293B);border-radius:16px;">
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Patient</p>
            <p style="margin:0 0 16px;font-size:22px;font-weight:800;color:#FFF;">${p.name}</p>
            <table cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding-right:24px;"><span style="font-size:13px;color:rgba(255,255,255,0.9);">📞 ${p.phone}</span></td>
                <td><span style="font-size:13px;color:rgba(255,255,255,0.9);">✉️ ${p.email}</span></td>
              </tr>
            </table>
          </td>
          <td style="padding:24px 28px;text-align:right;vertical-align:middle;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Was scheduled</p>
            <p style="margin:0;font-size:18px;font-weight:800;color:#FCA5A5;">${time}</p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);">${date}</p>
          </td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:24px 40px 0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${T.border};border-radius:16px;overflow:hidden;">
        <tr style="background:${T.mutedBg};">
          <td style="padding:14px 20px;border-bottom:1px solid ${T.border};width:40%;"><p style="margin:0;font-size:12px;color:${T.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Service</p></td>
          <td style="padding:14px 20px;border-bottom:1px solid ${T.border};"><p style="margin:0;font-size:14px;font-weight:600;color:${T.text};">${s.name}</p></td>
        </tr>
        <tr>
          <td style="padding:14px 20px;"><p style="margin:0;font-size:12px;color:${T.label};text-transform:uppercase;font-weight:700;letter-spacing:0.06em;">Original Date</p></td>
          <td style="padding:14px 20px;"><p style="margin:0;font-size:14px;font-weight:600;color:${T.text};">${date} at ${time}</p></td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="padding:32px 40px 40px;text-align:center;">
      <a href="#" style="display:inline-block;background:linear-gradient(135deg,${T.accent},${T.accentDk});color:#FFF;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(99,102,241,0.35);">
        View Appointments →
      </a>
    </td></tr>
  `, T.danger)
}

// ─────────────────────────────────────────────
// Send helper
// ─────────────────────────────────────────────

async function send(label: string, to: string, subject: string, html: string) {
  console.info(`\n📧 Sending: ${label}`)
  console.info(`   To: ${to}`)
  console.info(`   Subject: ${subject}`)

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME ?? "PrimeHealth"}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    })

    console.info(`   ✅ Sent — Message ID: ${info.messageId}`)
    return true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`   ❌ Failed: ${msg}`)
    return false
  }
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.info("═══════════════════════════════════════════════")
  console.info("  PrimeHealth — Email Template Test Runner")
  console.info("═══════════════════════════════════════════════")
  console.info(`Provider   : ${process.env.EMAIL_PROVIDER}`)
  console.info(`Gmail User : ${process.env.GMAIL_USER}`)
  console.info(`Test To    : ${process.env.GMAIL_USER}`)
  console.info("───────────────────────────────────────────────")

  if (process.env.EMAIL_PROVIDER !== "gmail") {
    console.error("❌ EMAIL_PROVIDER is not 'gmail'. Set it in .env.local")
    process.exit(1)
  }

  const to = process.env.GMAIL_USER!
  const results: { label: string; ok: boolean }[] = []

  results.push({
    label: "1. Patient Confirmation",
    ok: await send(
      "1. Patient Confirmation",
      to,
      "[TEST] Your appointment is confirmed — Prime Health Clinic",
      patientConfirmationHtml()
    ),
  })

  results.push({
    label: "2. Doctor Confirmation",
    ok: await send(
      "2. Doctor Confirmation",
      to,
      "[TEST] New booking — Ayush Raj · Friday, 20 June 2026",
      doctorConfirmationHtml()
    ),
  })

  results.push({
    label: "3. Patient Cancellation",
    ok: await send(
      "3. Patient Cancellation",
      to,
      "[TEST] Your appointment has been cancelled — Prime Health Clinic",
      patientCancellationHtml()
    ),
  })

  results.push({
    label: "4. Doctor Cancellation",
    ok: await send(
      "4. Doctor Cancellation",
      to,
      "[TEST] Appointment cancelled — Ayush Raj · Friday, 20 June 2026",
      doctorCancellationHtml()
    ),
  })

  console.info("\n═══════════════════════════════════════════════")
  console.info("  Results")
  console.info("═══════════════════════════════════════════════")
  for (const r of results) {
    console.info(`  ${r.ok ? "✅" : "❌"} ${r.label}`)
  }

  const passed = results.filter((r) => r.ok).length
  console.info(`\n  ${passed}/${results.length} templates sent successfully`)
  console.info("═══════════════════════════════════════════════\n")

  process.exit(passed === results.length ? 0 : 1)
}

main()
