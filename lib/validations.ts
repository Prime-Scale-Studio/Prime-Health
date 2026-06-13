import { z } from "zod"

// ─────────────────────────────────────────────
// Reusable field validators
// ─────────────────────────────────────────────
const emailField = z.string().email("Please enter a valid email address")
const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
const phoneField = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
const timeField = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:mm format")
const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
const positiveNumber = z.number().positive("Must be a positive number")

// ─────────────────────────────────────────────
// Clinic Signup
// ─────────────────────────────────────────────
export const clinicSignupSchema = z.object({
  clinicName: z
    .string()
    .min(2, "Clinic name must be at least 2 characters")
    .max(100, "Clinic name is too long"),
  doctorName: z
    .string()
    .min(2, "Doctor name must be at least 2 characters")
    .max(100, "Doctor name is too long"),
  email: emailField,
  password: passwordField,
})
export type ClinicSignupInput = z.infer<typeof clinicSignupSchema>

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
})
export type LoginInput = z.infer<typeof loginSchema>

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────
export const serviceSchema = z.object({
  name: z
    .string()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  duration_minutes: z
    .number()
    .int("Duration must be a whole number")
    .min(5, "Duration must be at least 5 minutes")
    .max(480, "Duration cannot exceed 8 hours"),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .max(1_000_000, "Price seems too high"),
})
export type ServiceInput = z.infer<typeof serviceSchema>

// ─────────────────────────────────────────────
// Availability Update
// ─────────────────────────────────────────────
export const availabilitySchema = z
  .object({
    dayOfWeek: z
      .number()
      .int()
      .min(0, "Day must be 0 (Sunday) to 6 (Saturday)")
      .max(6, "Day must be 0 (Sunday) to 6 (Saturday)"),
    isAvailable: z.boolean(),
    startTime: timeField,
    endTime: timeField,
    breakStart: timeField.optional().nullable(),
    breakEnd: timeField.optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.isAvailable) return true
      return data.startTime < data.endTime
    },
    { message: "Start time must be before end time", path: ["startTime"] }
  )
  .refine(
    (data) => {
      if (!data.breakStart || !data.breakEnd) return true
      return data.breakStart < data.breakEnd
    },
    { message: "Break start must be before break end", path: ["breakStart"] }
  )
export type AvailabilityInput = z.infer<typeof availabilitySchema>

// ─────────────────────────────────────────────
// Patient
// ─────────────────────────────────────────────
export const patientSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: emailField.optional().or(z.literal("")),
  phone: phoneField,
  dateOfBirth: dateField.optional().nullable(),
  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .optional()
    .nullable(),
  notes: z.string().max(1000, "Notes too long").optional().nullable(),
})
export type PatientInput = z.infer<typeof patientSchema>

// ─────────────────────────────────────────────
// AI Knowledge Entry
// ─────────────────────────────────────────────
export const aiKnowledgeSchema = z.object({
  question: z
    .string()
    .min(5, "Question must be at least 5 characters")
    .max(500, "Question is too long"),
  answer: z
    .string()
    .min(5, "Answer must be at least 5 characters")
    .max(2000, "Answer is too long"),
  questionHi: z.string().max(500, "Hindi question is too long").optional().nullable(),
  answerHi: z.string().max(2000, "Hindi answer is too long").optional().nullable(),
})
export type AiKnowledgeInput = z.infer<typeof aiKnowledgeSchema>

// ─────────────────────────────────────────────
// Blocked Date
// ─────────────────────────────────────────────
export const blockedDateSchema = z.object({
  blocked_date: dateField,
  reason: z.string().max(200, "Reason is too long").optional().nullable(),
})
export type BlockedDateInput = z.infer<typeof blockedDateSchema>

// ─────────────────────────────────────────────
// Widget Booking (public — used by AI widget patients)
// ─────────────────────────────────────────────
export const widgetBookingSchema = z.object({
  patientName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  patientEmail: emailField.optional().or(z.literal("")),
  patientPhone: phoneField,
  serviceId: z.string().uuid("Invalid service ID"),
  appointmentDate: dateField,
  startTime: timeField,
  clinicId: z.string().uuid("Invalid clinic ID"),
  booking_language: z.enum(["en", "hi"]).default("en"),
})
export type WidgetBookingInput = z.infer<typeof widgetBookingSchema>

// ─────────────────────────────────────────────
// Appointment Status Update (doctor dashboard)
// ─────────────────────────────────────────────
export const appointmentStatusSchema = z.object({
  status: z.enum(
    ["pending", "confirmed", "completed", "cancelled", "no_show"],
    { errorMap: () => ({ message: "Invalid appointment status" }) }
  ),
  doctorNotes: z.string().max(2000, "Notes too long").optional().nullable(),
})
export type AppointmentStatusInput = z.infer<typeof appointmentStatusSchema>

// Keep positiveNumber exported for use in other schemas
export { positiveNumber }