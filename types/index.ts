// ─────────────────────────────────────────────
// Generic API Response Wrapper
// ─────────────────────────────────────────────
export type ApiResponse<T> = {
  data: T | null
  error: string | null
}

// ─────────────────────────────────────────────
// Auth Form Types
// ─────────────────────────────────────────────
export type SignupFormValues = {
  clinicName: string
  doctorName: string
  email: string
  password: string
}

export type LoginFormValues = {
  email: string
  password: string
}

// ─────────────────────────────────────────────
// Dashboard Types
// ─────────────────────────────────────────────
export type StatCardData = {
  title: string
  value: string | number
  change: number        // percentage change vs previous period (+/-)
  changeLabel: string   // e.g. "vs last month"
  icon: string          // lucide icon name, used to render dynamically
  trend: "up" | "down" | "neutral"
}

// ─────────────────────────────────────────────
// Widget Chat Types
// ─────────────────────────────────────────────
export type ChatRole = "user" | "assistant" | "system"

export type ChatMessage = {
  role: ChatRole
  content: string
  timestamp?: string    // ISO string
}

// ─────────────────────────────────────────────
// Booking Flow Types
// ─────────────────────────────────────────────
export type BookingStep =
  | "language"
  | "service"
  | "date"
  | "slot"
  | "details"
  | "confirm"
  | "success"

export type BookingFlowState = {
  currentStep: BookingStep
  clinicId: string
  language: "en" | "hi"
  selectedServiceId: string | null
  selectedDate: string | null        // YYYY-MM-DD
  selectedSlot: string | null        // HH:mm
  patientName: string
  patientEmail: string
  patientPhone: string
}

// ─────────────────────────────────────────────
// Clinic Public Profile (safe for widget use — no PII)
// ─────────────────────────────────────────────
export type ClinicPublicProfile = {
  id: string
  clinicName: string
  doctorName: string
  slug: string
  city: string | null
  state: string | null
  logoUrl: string | null
  currency: string
  language: string
  timezone: string
  services: PublicService[]
}

export type PublicService = {
  id: string
  name: string
  description: string | null
  duration: number   // minutes
  price: number
}

// ─────────────────────────────────────────────
// Appointment Status
// ─────────────────────────────────────────────
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"

// ─────────────────────────────────────────────
// Notification Channel
// ─────────────────────────────────────────────
export type NotificationChannel = "email" | "whatsapp"

// ─────────────────────────────────────────────
// Gender
// ─────────────────────────────────────────────
export type Gender = "male" | "female" | "other" | "prefer_not_to_say"