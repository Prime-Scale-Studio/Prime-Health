/**
 * lib/notifications.ts — Server-side only
 * Sends confirmation emails (via Resend) and WhatsApp messages (via Twilio)
 * for new appointment bookings.
 *
 * Both functions:
 *   - Accept typed DB row objects (Tables<"appointments"> + Tables<"clinics"> etc.)
 *   - Never throw — return { success, error }
 *   - Log notification results to the notification_logs table
 */

import twilio from "twilio"
import nodemailer from "nodemailer"
import { format, parse } from "date-fns"

// Provider-agnostic email sender
// Swap provider here without touching any other file
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
    if (process.env.EMAIL_PROVIDER === 'gmail') {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })

      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
      })

      return { success: true }
    }

    // Future: add resend provider here
    // if (process.env.EMAIL_PROVIDER === 'resend') { ... }

    return { success: false, error: 'No email provider configured' }
  } catch (error) {
    console.error('[notifications] email send failed:', error)
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
import { createAdminClient } from "@/lib/supabase/admin"
import { getBaseUrl } from "@/lib/utils"
import type { Tables } from "@/types/supabase"

// ─────────────────────────────────────────────
// Clients (lazy init — only validate keys at call-time, not module load)
// ─────────────────────────────────────────────

function getTwilioClient(): ReturnType<typeof twilio> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) throw new Error("Missing Twilio credentials")
  return twilio(sid, token)
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type NotificationResult = {
  success: boolean
  error: string | null
}

type AppointmentRow  = Tables<"appointments">
type ClinicRow       = Tables<"clinics">
type PatientRow      = Tables<"patients">
type ServiceRow      = Tables<"services">

export type AppointmentNotificationPayload = {
  appointment: AppointmentRow
  clinic: ClinicRow
  patient: PatientRow
  service: ServiceRow
}

// ─────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────

function readableDate(dateStr: string): string {
  // dateStr: "YYYY-MM-DD"
  const parsed = parse(dateStr, "yyyy-MM-dd", new Date())
  return format(parsed, "EEEE, d MMMM yyyy")
}

function readableTime(timeStr: string): string {
  // timeStr: "HH:mm"
  const parsed = parse(timeStr, "HH:mm", new Date())
  return format(parsed, "h:mm a")
}

// ─────────────────────────────────────────────
// Email: Patient confirmation
// ─────────────────────────────────────────────

function buildPatientEmailHtml(
  payload: AppointmentNotificationPayload,
  formattedDate: string,
  formattedTime: string
): string {
  const { clinic, patient, service, appointment } = payload
  const accentColor = '#10B981' // Emerald Green
  const secondaryColor = '#059669' // Darker Emerald
  const bgColor = '#F0FDF4' // Very light green tint
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.03); border: 1px solid #E2E8F0;">
          
          <!-- Success Header -->
          <tr>
            <td style="padding: 48px 40px 40px 40px; background-color: ${bgColor}; text-align: center; border-bottom: 1px solid #DCFCE7;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background-color: #FFFFFF; border-radius: 50%; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); margin-bottom: 24px;">
                <span style="color: ${accentColor}; font-size: 32px; line-height: 64px;">✓</span>
              </div>
              <h1 style="margin: 0; color: #064E3B; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">Appointment Confirmed</h1>
              <p style="margin: 8px 0 0 0; color: ${secondaryColor}; font-size: 16px; font-weight: 500;">We've reserved your slot at ${clinic.name}</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 32px 0; color: #1E293B; font-size: 16px; line-height: 1.6;">Hello <strong>${patient.name}</strong>, your appointment has been successfully scheduled with <strong>Dr. ${clinic.doctor_name}</strong>. Here are the details:</p>
              
              <!-- Details Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 20px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <tr>
                  <td>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 24px; border-bottom: 1px dashed #E2E8F0;">
                          <div style="color: #64748B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Service Requested</div>
                          <div style="color: #0F172A; font-size: 18px; font-weight: 700;">${service.name}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 24px 0; border-bottom: 1px dashed #E2E8F0;">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="50%" style="vertical-align: top;">
                                <div style="color: #64748B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Date</div>
                                <div style="color: #0F172A; font-size: 15px; font-weight: 600;">${formattedDate}</div>
                              </td>
                              <td width="50%" style="vertical-align: top; padding-left: 20px;">
                                <div style="color: #64748B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Time</div>
                                <div style="color: #0F172A; font-size: 15px; font-weight: 600;">${formattedTime}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 24px;">
                          <div style="color: #64748B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;">Location</div>
                          <div style="color: #0F172A; font-size: 15px; font-weight: 500; line-height: 1.5;">
                            <strong>${clinic.name}</strong><br>
                            ${clinic.address || 'Address not specified'}${clinic.city ? `, ${clinic.city}` : ""}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action / Notice -->
              <div style="margin-top: 32px; padding: 20px; background-color: #F8FAFC; border-radius: 12px; border-left: 4px solid ${accentColor};">
                <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                  <strong>Note:</strong> Please arrive 10 minutes early. If you need to cancel or reschedule, please contact the clinic at <strong>${clinic.email}</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0 40px 48px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #F1F5F9; padding-top: 32px; text-align: center;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #94A3B8; font-size: 13px;">Managed by Prime Health Smart Infrastructure</p>
                    <div style="margin-top: 16px;">
                      <span style="color: ${accentColor}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">✓ HIPAA COMPLIANT</span>
                    </div>
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
</html>
`.trim()
}

// ─────────────────────────────────────────────
// Email: Doctor/clinic notification
// ─────────────────────────────────────────────

function buildDoctorEmailHtml(
  payload: AppointmentNotificationPayload,
  formattedDate: string,
  formattedTime: string
): string {
  const { appointment, patient, service, clinic } = payload
  const dashboardUrl = `${getBaseUrl()}/app/appointments`
  const accentColor = '#10B981' // Emerald Green
  const bgColor = '#0F172A' // Dark slate

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #E2E8F0;">
          
          <!-- Alert Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: ${bgColor};">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.2); color: ${accentColor}; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">New Booking</div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 600;">Action Required: New Patient</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Patient Summary -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F0FDF4; border-bottom: 1px solid #DCFCE7;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="color: #065F46; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Patient Details</div>
                    <div style="color: #047857; font-size: 18px; font-weight: 700;">${patient.name}</div>
                  </td>
                  <td align="right">
                    <div style="color: #065F46; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Scheduled For</div>
                    <div style="color: #047857; font-size: 16px; font-weight: 600;">${formattedTime}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Grid Details -->
          <tr>
            <td style="padding: 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F1F5F9;">
                    <span style="color: #64748B; font-size: 14px;">Date</span>
                  </td>
                  <td align="right" style="padding: 12px 0; border-bottom: 1px solid #F1F5F9;">
                    <span style="color: #0F172A; font-size: 14px; font-weight: 600;">${formattedDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F1F5F9;">
                    <span style="color: #64748B; font-size: 14px;">Service</span>
                  </td>
                  <td align="right" style="padding: 12px 0; border-bottom: 1px solid #F1F5F9;">
                    <span style="color: #0F172A; font-size: 14px; font-weight: 600;">${service.name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #F1F5F9;">
                    <span style="color: #64748B; font-size: 14px;">Contact</span>
                  </td>
                  <td align="right" style="padding: 12px 0; border-bottom: 1px solid #F1F5F9;">
                    <span style="color: #0F172A; font-size: 14px; font-weight: 600;">${patient.phone}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #64748B; font-size: 14px;">Source</span>
                  </td>
                  <td align="right" style="padding: 12px 0;">
                    <span style="color: ${accentColor}; font-size: 13px; font-weight: 700; text-transform: uppercase;">${appointment.booked_via} widget</span>
                  </td>
                </tr>
              </table>

              <!-- Button -->
              <div style="margin-top: 40px;">
                <a href="${dashboardUrl}" style="display: block; background-color: ${accentColor}; color: #FFFFFF; text-align: center; padding: 18px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2);">
                  Review Appointment
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()
}

// ─────────────────────────────────────────────
// Log notification result
// ─────────────────────────────────────────────

async function logNotification(
  clinicId: string,
  appointmentId: string,
  channel: "email" | "whatsapp",
  recipient: string,
  status: "sent" | "failed",
  errorMsg: string | null
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from("notification_logs").insert({
      clinic_id: clinicId,
      appointment_id: appointmentId,
      channel,
      recipient,
      type: "appointment_confirmation",
      status,
      error_message: errorMsg,
    })
  } catch {
    // Logging failure should never crash the booking flow
  }
}

// ─────────────────────────────────────────────
// sendConfirmationEmail
// ─────────────────────────────────────────────

/**
 * Sends:
 * 1. Patient confirmation email with appointment details
 * 2. Doctor/clinic summary email with new booking info
 *
 * Uses Resend. In dev: respects RESEND_DEV_EMAIL override.
 */
export async function sendConfirmationEmail(
  payload: AppointmentNotificationPayload
): Promise<NotificationResult> {
  const { appointment, clinic, patient } = payload

  const isDev = process.env.NEXT_PUBLIC_EMAIL_FROM === 'onboarding@resend.dev'
  const patientEmail = isDev ? process.env.RESEND_DEV_EMAIL! : patient.email
  const doctorEmail = isDev ? process.env.RESEND_DEV_EMAIL! : clinic.email

  console.error('📧 Sending appointment confirmation emails')
  console.error('Mode:', isDev ? 'DEV (test mode)' : 'PRODUCTION')
  console.error('Patient email → ', patientEmail)
  console.error('Doctor email → ', doctorEmail)

  try {
    const from = process.env.NEXT_PUBLIC_EMAIL_FROM || 'onboarding@resend.dev'

    // Formatters
    const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const formatTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':')
      const h = parseInt(hours)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const displayHours = h % 12 || 12
      return `${displayHours}:${minutes} ${ampm}`
    }
    const formattedTime = formatTime(appointment.start_time)

    let patientSucceeded = false
    let doctorSucceeded = false
    let errorMessage = ''

    // 1. Patient Email
    try {
      if (patientEmail) {
        console.error('Sending patient email...')
        const { success, error } = await sendEmail({
          to: patientEmail,
          subject: `${isDev ? '[TEST] ' : ''}Appointment Confirmed - ${clinic.name}`,
          html: buildPatientEmailHtml(payload, formattedDate, formattedTime)
        })
        if (error || !success) {
          console.error('❌ Patient email failed:', error)
          errorMessage += `Patient: ${error}. `
          await logNotification(clinic.id, appointment.id, 'email', patientEmail, 'failed', error || 'Unknown error')
        } else {
          console.error('✅ Patient email sent')
          patientSucceeded = true
          await logNotification(clinic.id, appointment.id, 'email', patientEmail, 'sent', null)
        }
      } else {
        console.error('⚠️ No patient email found, skipping...')
        patientSucceeded = true
      }
    } catch (err: any) {
      console.error('❌ Patient email exception:', err.message)
      errorMessage += `Patient exception: ${err.message}. `
    }

    // 2. Doctor Email
    try {
      if (doctorEmail) {
        console.error('Sending doctor email...')
        const { success, error } = await sendEmail({
          to: doctorEmail,
          subject: `${isDev ? '[TEST] ' : ''}New Booking - ${appointment.patient_name}`,
          html: buildDoctorEmailHtml(payload, formattedDate, formattedTime)
        })
        if (error || !success) {
          console.error('❌ Doctor email failed:', error)
          errorMessage += `Doctor: ${error}. `
          await logNotification(clinic.id, appointment.id, 'email', doctorEmail, 'failed', error || 'Unknown error')
        } else {
          console.error('✅ Doctor email sent')
          doctorSucceeded = true
          await logNotification(clinic.id, appointment.id, 'email', doctorEmail, 'sent', null)
        }
      } else {
        console.error('⚠️ No doctor email found, skipping...')
        doctorSucceeded = true
      }
    } catch (err: any) {
      console.error('❌ Doctor email exception:', err.message)
      errorMessage += `Doctor exception: ${err.message}. `
    }

    return {
      success: patientSucceeded && doctorSucceeded,
      error: errorMessage.trim() || null
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Email send failed"
    console.error('❌ Global email error:', error)
    return { success: false, error }
  }
}

// ─────────────────────────────────────────────
// sendWhatsAppNotification
// ─────────────────────────────────────────────

/**
 * Sends a WhatsApp message to the patient via Twilio.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.
 *
 * Patient phone must be a valid 10-digit Indian number (stored without +91).
 * Twilio requires E.164: "whatsapp:+91XXXXXXXXXX"
 */
export async function sendWhatsAppNotification(
  payload: AppointmentNotificationPayload
): Promise<NotificationResult> {
  const { appointment, clinic, patient, service } = payload

  try {
    const twilioClient = getTwilioClient()

    const from = process.env.TWILIO_WHATSAPP_FROM
    if (!from) throw new Error("Missing TWILIO_WHATSAPP_FROM")

    if (!patient.phone) throw new Error("Patient has no phone number")

    // Normalise to E.164: assume stored phone is 10-digit Indian number
    const rawPhone = patient.phone.replace(/\D/g, "")
    const e164 = rawPhone.startsWith("91") ? `+${rawPhone}` : `+91${rawPhone}`
    const to = `whatsapp:${e164}`

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

    const msg = await twilioClient.messages.create({
      from: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      to,
      body: messageBody,
    })

    await logNotification(
      clinic.id, appointment.id, "whatsapp", e164,
      "sent", null
    )

    return { success: true, error: null }
  } catch (err) {
    const error =
      err instanceof Error ? err.message : "WhatsApp notification failed"
    await logNotification(
      clinic.id, appointment.id, "whatsapp", patient.phone || "unknown",
      "failed", error
    )
    return { success: false, error }
  }
}
