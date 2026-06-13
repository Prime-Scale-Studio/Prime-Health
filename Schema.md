# PrimeHealth — Database Schema Reference
> Supabase (PostgreSQL) · Multi-tenant · RLS enforced on every table
> Every table traces back to clinic_id. Two actors: authenticated doctor, anon widget.

---

## RLS Model

| Actor | Access |
|---|---|
| Authenticated Doctor | Full CRUD on own clinic data via `get_my_clinic_id()` |
| Anon Widget | SELECT on public config, INSERT on appointments/chat_sessions/voice_call_logs |

---

## Core Tables

### `clinics`
Root table. One user owns exactly one clinic.
- Identity: `name`, `doctor_name`, `specialty`, `description`, `address`, `city`, `phone`, `email`, `website`
- Branding: `logo_url`, `widget_theme_color`, `widget_tone` (professional|friendly|formal)
- Scheduling: `slot_duration_minutes`, `buffer_time_minutes`, `max_advance_days`, `min_notice_hours`
- Localization: `timezone` (default: Asia/Kolkata), `language` (en|hi)
- Notifications: `notification_channel` (email|whatsapp|both), `whatsapp_number`, `email_notifications`
- Subscription: `plan` (free|pro), `plan_status` (active|inactive|trial|cancelled), `trial_ends_at`, `stripe_customer_id`, `stripe_subscription_id`
- Routing: `slug` (unique, used for public widget URL `/book/{slug}`)

### `patients`
Clinic's patient directory. Scoped to clinic_id.
- `name`, `email`, `phone`, `date_of_birth`, `gender`, `address`, `notes`
- `preferred_language` (en|hi)
- Denormalized stats: `total_appointments`, `last_appointment_at` — auto-updated by trigger on every appointment change
- Unique constraints: `(clinic_id, email)`, `(clinic_id, phone)`

### `appointments`
Core transactional table.
- References: `clinic_id`, `patient_id` (nullable), `service_id` (nullable)
- Denormalized at insert: `patient_name`, `patient_email`, `patient_phone`, `service_name`, `duration_minutes`
- Scheduling: `appointment_date`, `start_time`, `end_time`
- `status`: pending | confirmed | completed | cancelled | no_show
- `booked_via`: widget | dashboard | manual
- `booking_language`: en | hi
- `patient_notes` (visible to doctor), `doctor_notes` (internal only)
- `confirmation_sent`, `reminder_sent` (boolean tracking)
- **Double-booking prevented** by `validate_appointment_slot()` DB trigger

### `services`
Medical services offered by clinic.
- `name`, `description`, `duration_minutes`, `price`, `currency` (default INR)
- `is_active`, `sort_order`
- Hindi translations: `name_hi`, `description_hi`

---

## Scheduling Tables

### `availability`
One row per day of week (0=Sun to 6=Sat) per clinic.
- `day_of_week`, `is_available`, `start_time`, `end_time`
- `break_start`, `break_end`
- Auto-seeded on clinic creation: Mon–Fri 9–18, Sat 9–14, Sun closed

### `blocked_dates`
Specific dates where clinic is unavailable (non-recurring).
- `blocked_date`, `reason`
- Unique: `(clinic_id, blocked_date)`

---

## AI Tables

### `ai_knowledge`
Custom FAQ knowledge base for widget AI.
- `question`, `answer`
- Hindi: `question_hi`, `answer_hi`
- `is_active`, `sort_order`

### `ai_companion_settings`
Widget AI behavior config. One row per clinic.
- `is_enabled`, `triage_enabled`
- `triage_sensitivity`: low | moderate | high
- `symptom_checker_enabled`
- `restricted_topics` (text array)
- `max_messages_per_session`, `session_timeout_minutes`

### `rag_documents`
Source documents for RAG knowledge base.
- `title`, `content`
- `source_type`: manual | upload | auto_generated
- `file_url`, `is_active`

### `rag_chunks`
Chunked + embedded text for vector similarity search.
- `content`, `embedding` (vector 768), `token_count`, `chunk_index`
- References: `document_id`
- Index: IVFFlat cosine similarity

---

## Clinical Tables

### `visit_notes`
SOAP-format doctor notes per appointment. One per appointment.
- `subjective`, `objective`, `assessment`, `plan`
- `ai_summary` (AI-generated brief)
- `ai_risk_flags` (text array)
- `follow_up_recommended`, `follow_up_days`

### `prescriptions`
Structured prescription per appointment.
- `medicines` (jsonb array): `[{name, dosage, frequency, duration, instructions}]`
- `diagnosis`, `advice`, `follow_up_date`
- `pdf_url`, `is_sent`, `sent_at`
- References: `visit_note_id` (optional)

### `patient_health_timeline`
AI-built longitudinal health record per patient.
- `event_type`: visit | prescription | follow_up | note | ai_insight
- `title`, `summary`
- `data` (jsonb — flexible per event type)
- `ai_generated` (boolean)
- Index: `(patient_id, created_at DESC)`

---

## Automation Tables

### `followup_sequence_settings`
Email follow-up automation config. One per clinic.
- 4 steps, each with: `enabled`, `delay_days`, `subject`, `template`
- Default delays: Day 1, Day 3, Day 7, Day 30

### `followup_tasks`
Queue of pending follow-up emails.
- `step` (1–4), `scheduled_at`, `status` (pending|sent|failed|cancelled)
- `sent_at`, `error_message`
- Index: `(scheduled_at, status)` WHERE status = 'pending' — for cron job efficiency

---

## Intelligence Tables

### `no_show_predictions`
ML risk score per appointment. One per appointment.
- `risk_score` (0.0–1.0), `risk_level` (low|medium|high)
- `factors` (jsonb): historical_no_show_rate, lead_time_hours, day_of_week, hour_of_day
- `model_version`

### `analytics_snapshots`
Daily pre-aggregated clinic stats (for fast dashboard loads).
- `total_appointments`, `confirmed_count`, `completed_count`, `cancelled_count`, `no_show_count`
- `new_patients`, `widget_sessions`, `bookings_via_widget`
- Unique: `(clinic_id, snapshot_date)`

### `revenue_snapshots`
Financial intelligence per clinic per period.
- `period_type`: daily | weekly | monthly
- `gross_revenue`, `net_revenue`
- `cancelled_revenue_loss`, `no_show_revenue_loss`
- `avg_revenue_per_patient`, `slot_utilization_rate`
- `top_service_id`, `top_service_name`, `top_service_revenue`
- `new_patient_revenue`, `returning_patient_revenue`

---

## Settings Tables

### `voice_settings`
Voice widget config. One per clinic.
- `is_enabled`, `default_language` (en|hi), `auto_detect_language`
- `voice_gender` (male|female), `speech_rate`, `noise_cancellation`

### `prescription_settings`
Prescription PDF config. One per clinic.
- `is_enabled`, `auto_send_email`
- `template_style`: standard | minimal | detailed
- `header_text`, `footer_text`, `show_logo`, `show_doctor_signature`, `signature_url`

### `doctor_assistant_settings`
AI doctor briefing config. One per clinic.
- `is_enabled`, `auto_generate_on_open`
- `summary_depth`: brief | standard | detailed
- `show_risk_flags`, `show_medication_history`, `show_visit_patterns`, `show_recommendations`

### `copilot_settings`
Performance report config. One per clinic.
- `is_enabled`, `report_frequency` (weekly|monthly), `send_email`
- `show_revenue_trends`, `show_patient_retention`, `show_service_performance`
- `show_slot_utilization`, `show_recommendations`
- `last_report_sent_at`

### `dynamic_pricing_rules`
Slot pricing rules per clinic/service.
- `rule_type`: peak | off_peak | early_bird | last_minute
- `day_of_week` (int array), `start_time`, `end_time`
- `adjustment_type`: percentage | fixed
- `adjustment_value`, `is_active`

### `language_settings`
Widget language config. One per clinic.
- `default_language` (en|hi), `auto_detect`
- `supported_languages` (text array)
- `widget_greeting_en`, `widget_greeting_hi`

---

## Logging Tables

### `chat_sessions`
Widget conversation tracking.
- `session_token` (anonymous identifier)
- `completed_booking`, `messages_count`, `language_used`
- `started_at`, `ended_at`, `duration_seconds`

### `notification_logs`
Audit trail of every notification sent.
- `channel` (email|whatsapp), `recipient`, `type`, `status` (sent|failed|pending)
- `error_message`

### `voice_call_logs`
Browser voice session records.
- `session_id`, `duration_seconds`, `transcript`
- `intent_detected`, `booking_completed`, `language_used`

---

## Key Database Functions

| Function | Purpose |
|---|---|
| `get_my_clinic_id()` | SECURITY DEFINER — returns clinic_id for authenticated user. Used in every RLS policy |
| `get_available_slots(clinic_id, date, service_id)` | Computes open time slots respecting availability, breaks, blocked dates, existing bookings |
| `validate_appointment_slot()` | BEFORE INSERT/UPDATE trigger — hard prevents double booking |
| `update_patient_stats()` | AFTER INSERT/UPDATE on appointments — recomputes total_appointments, last_appointment_at |
| `match_rag_chunks(clinic_id, embedding, count, threshold)` | Vector similarity search — returns top-k relevant chunks for RAG |
| `calculate_no_show_risk(clinic_id, patient_id, date, time, created_at)` | Scores no-show probability using 4 factors |
| `generate_daily_snapshot(date)` | Aggregates daily stats into analytics_snapshots — designed for cron |
| `seed_default_availability(clinic_id)` | Seeds 7 availability rows on clinic creation |
| `seed_clinic_elite_settings()` | Trigger — auto-creates all settings rows on clinic creation |

---

## Auto-Seeded On Signup
Every new clinic automatically gets rows created in:
`availability` · `ai_companion_settings` · `voice_settings` · `doctor_assistant_settings`
`prescription_settings` · `followup_sequence_settings` · `copilot_settings` · `language_settings`

## RLS Fixes Applied (TASK-001 ✅)
1. Created `clinic_public` view — widget now reads this, not clinics table directly
2. chat_sessions UPDATE scoped to session_token
3. notification_logs insert removed — admin client only