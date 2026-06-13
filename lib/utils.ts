import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parse, addMinutes } from "date-fns"

// ─────────────────────────────────────────────
// Classname merger (clsx + tailwind-merge)
// ─────────────────────────────────────────────
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────────
// Format 24-hour time string to 12-hour AM/PM
// e.g. "14:30" → "2:30 PM"
// ─────────────────────────────────────────────
export function formatTime(time24: string): string {
  const parsed = parse(time24, "HH:mm", new Date())
  return format(parsed, "h:mm a")
}

// ─────────────────────────────────────────────
// Format ISO date / YYYY-MM-DD to readable Indian format
// e.g. "2024-01-15" → "15 Jan 2024"
// ─────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  const parsed = parse(dateStr, "yyyy-MM-dd", new Date())
  return format(parsed, "d MMM yyyy")
}

// ─────────────────────────────────────────────
// Get initials from a full name (up to 2 chars)
// e.g. "Dr. Rajan Mehta" → "RM"
// ─────────────────────────────────────────────
export function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter((part) => /^[a-zA-Z]/.test(part))  // skip "Dr." etc.
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
}

// ─────────────────────────────────────────────
// Generate a cryptographically random session token
// Uses Web Crypto API (available in Node 20+ and all browsers)
// ─────────────────────────────────────────────
export function generateSessionToken(): string {
  return crypto.randomUUID()
}

// ─────────────────────────────────────────────
// Generate a URL-safe slug from any string
// e.g. "Dr. Rajan's Clinic!" → "dr-rajans-clinic"
// ─────────────────────────────────────────────
export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")   // remove special chars
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .replace(/^-|-$/g, "")           // trim leading/trailing hyphens
}

// ─────────────────────────────────────────────
// Calculate end time given a start time and duration
// startTime: "HH:mm"  duration: minutes (number)
// returns: "HH:mm"
// ─────────────────────────────────────────────
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const parsed = parse(startTime, "HH:mm", new Date())
  const endDate = addMinutes(parsed, durationMinutes)
  return format(endDate, "HH:mm")
}

// ─────────────────────────────────────────────
// Get the absolute base URL for the application
// Falls back gracefully across Vercel environments to localhost
// ─────────────────────────────────────────────
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin
  
  let url = process.env.NEXT_PUBLIC_APP_URL || 
            (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") || 
            "http://localhost:3000"

  url = url.trim()
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`
  }
  
  return url
}