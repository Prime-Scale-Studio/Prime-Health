# PrimeHealth — Architecture Document
Version: 2.0

---

## System OverviewPatient (Browser) → Widget (Anon) → Next.js API Routes → Supabase (Postgres + pgvector)

Doctor (Browser) → Dashboard (Auth) → Server Actions → Supabase

Cron Jobs → Server Actions → Supabase

AI Pipeline → Groq LLM + pgvector RAG → Response

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript 5 Strict |
| Database | Supabase (Postgres + RLS + Realtime + pgvector) |
| Auth | Supabase Auth |
| AI LLM | Groq (llama-3.3-70b primary, llama-3.1-8b fallback) |
| Embeddings | Gemini text-embedding-004 |
| Vector Search | pgvector (IVFFlat cosine) |
| Email | Resend |
| PDF | React-PDF or Puppeteer |
| Styling | Tailwind CSS + Framer Motion |
| Validation | Zod |
| Hosting | Vercel |

---

## Folder Structureactions/

appointments.ts

patients.ts

services.ts

availability.ts

visit-notes.ts

prescriptions.ts

analytics.ts

followups.ts

rag.ts

settings/

ai-companion.ts

voice.ts

prescription.ts

followup-sequence.ts

copilot.ts

language.ts

doctor-assistant.ts

dynamic-pricing.tsapp/

(auth)/

login/

signup/

onboarding/

(app)/

dashboard/

calendar/

appointments/

[id]/

patients/

[id]/

services/

settings/

clinic/

availability/

blocked-dates/

notifications/

ai-training/

ai-companion/

voice/

prescriptions/

follow-ups/

copilot/

pricing/

analytics/

ai-assistant/

api/

widget/

[slug]/

chat/route.ts

slots/route.ts

book/route.ts

voice/route.ts

cron/

followups/route.ts

snapshots/route.ts

no-show/route.ts

webhooks/

stripe/route.tscomponents/

appointments/

dashboard/

patients/

clinical/

ai/

analytics/

settings/

layout/

ui/

widget/lib/

ai/

groq.ts

rag.ts

prompts/

widget.ts

doctor-assistant.ts

prescription.ts

followup.ts

copilot.ts

supabase/

client.ts

server.ts

admin.ts

notifications.ts

slots.ts

validations.ts

pdf.ts

embeddings.tstypes/

supabase.ts

index.ts

---

## Data Flow

### Widget Booking Flow
Patient opens widget

→ GET /api/widget/[slug] → fetch clinic by slug

→ GET /api/widget/[slug]/slots?date=&service= → get_available_slots()

Patient sends message

→ POST /api/widget/[slug]/chat

→ retrieveContext(clinic_id, message) → match_rag_chunks()

→ buildSystemPrompt(clinic, services, slots, ragContext)

→ callGroq(messages)

→ parse response for BOOKING_READY JSON

BOOKING_READY detected

→ POST /api/widget/[slug]/book

→ validate slot still available

→ INSERT appointments (triggers validate_appointment_slot)

→ INSERT/UPDATE patients (upsert by phone)

→ INSERT chat_sessions

→ send confirmation email via Resend

→ INSERT notification_logs

→ trigger followup_tasks creation (4 rows)

→ return confirmation to widget


### Doctor Dashboard Flow
Doctor opens appointment

→ Server Action: getAppointment(id)

→ if doctor_assistant_settings.auto_generate_on_open:

→ retrievePatientContext(patient_id)

→ callGroq(doctor-assistant prompt)

→ display AI briefing

Doctor writes visit note

→ Server Action: saveVisitNote(appointment_id, soap)

→ INSERT visit_notes

→ callGroq(summarize soap notes)

→ UPDATE visit_notes.ai_summary

→ INSERT patient_health_timeline (event_type: visit)

Doctor creates prescription

→ Server Action: savePrescription(visit_note_id, medicines)

→ INSERT prescriptions

→ generatePrescriptionPDF()

→ upload PDF to Supabase Storage

→ UPDATE prescriptions.pdf_url

→ if auto_send_email: sendPrescriptionEmail() via Resend

→ INSERT patient_health_timeline (event_type: prescription)


### RAG PipelineDocument Upload:

Doctor uploads doc → POST actions/rag.ts

→ chunk text (500 tokens, 50 overlap)

→ generateEmbedding() via Gemini API (each chunk)

→ INSERT rag_documents

→ INSERT rag_chunks[] with embeddingsQuery Time (Widget):

User message → generateEmbedding(message)

→ match_rag_chunks(clinic_id, embedding, 5, 0.7)

→ top-k chunks injected into system prompt

→ Groq generates response with clinic-specific context

### Follow-up Automation FlowAppointment completed → Server Action

→ check followup_sequence_settings.is_enabled

→ CREATE 4 followup_tasks rows with scheduled_at:

step1: completed_at + 1 day

step2: completed_at + 3 days

step3: completed_at + 7 days

step4: completed_at + 30 daysCron: POST /api/cron/followups (runs every hour)

→ SELECT followup_tasks WHERE status='pending' AND scheduled_at <= now()

→ for each task:

→ fetch patient + appointment + clinic + template

→ render email template with patient data

→ send via Resend

→ UPDATE followup_tasks.status = 'sent'

→ INSERT notification_logs

### No-Show Prediction FlowAppointment confirmed →

→ calculate_no_show_risk(clinic_id, patient_id, date, time, created_at)

→ INSERT no_show_predictions

→ Dashboard shows risk badge on appointment card

→ High risk: doctor sees alert, can manually send reminder email

### Revenue Snapshot FlowCron: POST /api/cron/snapshots (runs daily at midnight IST)

→ generate_daily_snapshot(today)

→ aggregates appointments, revenue, patients into analytics_snapshots

→ aggregates financial data into revenue_snapshots (daily + weekly + monthly)

---

## AI Architecture

### System Prompt Injection Strategy
Every Groq call injects fresh context — never stale:[SYSTEM PROMPT LAYERS]

Role definition (who the AI is)
Clinic identity (name, doctor, specialty, tone)
Services catalog (name, duration, price)
Available slots for requested date
RAG context (top-5 relevant chunks)
Behavioral rules (what to never do)
Output format (BOOKING_READY JSON spec)


### Groq Model SelectionPrimary:  llama-3.3-70b-versatile  → complex reasoning, booking flow

Fallback: llama-3.1-8b-instant     → rate limit recovery

Doctor Assistant: llama-3.3-70b   → patient briefing generation

Copilot Reports: llama-3.3-70b    → monthly analysis generation

### Token Cost Control via RAGWithout RAG: Full knowledge base injected every message (~2000 tokens)

With RAG:    Top-5 relevant chunks only (~400 tokens)

Saving:      ~70% reduction in input tokens per message

---

## Security Architecture

### Two-Actor ModelActor 1: Authenticated Doctor

Supabase Auth session (JWT)
All queries filtered by get_my_clinic_id()
Cannot access other clinic's data even if they know the UUID
Server Actions verify auth before every operation
Actor 2: Anonymous Widget (Patient)

Uses Supabase anon key
Can only: SELECT clinic/services/slots, INSERT appointments/chat_sessions
clinic_id always verified against slug — never trusted from request body
No SELECT on appointments (can't read other bookings)


### Known RLS Issues To Fix
1. `clinic_select_public_by_slug` exposes stripe_customer_id — fix with column projection
2. `chat_sessions_update_by_token` uses USING(TRUE) — fix with session_token check
3. `notif_logs_insert_own` has no service-role enforcement

---

## Cron Jobs Required

| Job | Endpoint | Frequency | Purpose |
|---|---|---|---|
| Follow-up sender | /api/cron/followups | Every hour | Send pending follow-up emails |
| Daily snapshot | /api/cron/snapshots | Daily midnight IST | Generate analytics + revenue snapshots |
| No-show scorer | /api/cron/no-show | Every 6 hours | Score upcoming appointments |

Setup: Vercel Cron Jobs (vercel.json) or Supabase pg_cron

---

## Realtime Subscriptions

| Channel | Event | Dashboard Action |
|---|---|---|
| appointments | INSERT | Show new appointment toast + calendar update |
| appointments | UPDATE | Update status badge in list |
| chat_sessions | INSERT | Increment active widget sessions counter |

---

## Email Architecture (Resend)

| Email Type | Trigger | Template |
|---|---|---|
| Booking confirmation | Appointment INSERT | Patient name, date, time, service, clinic address |
| Follow-up Day 1 | followup_tasks cron | How are you feeling? |
| Follow-up Day 3 | followup_tasks cron | Medication reminder |
| Follow-up Day 7 | followup_tasks cron | Check-in |
| Follow-up Day 30 | followup_tasks cron | Re-booking nudge |
| Prescription | Prescription created | PDF attachment |
| Copilot Report | Monthly cron | Revenue + analytics summary |

---

## Environment Variables

```envSupabase
NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=        # server onlyAI
GROQ_API_KEY=

GEMINI_API_KEY=                   # for embeddings onlyEmail
RESEND_API_KEY=Stripe (future)
STRIPE_SECRET_KEY=

STRIPE_WEBHOOK_SECRET=Cron Security
CRON_SECRET=                      # validates cron requests

---

## Performance Rules
- Dashboard data from snapshots tables — never aggregate live
- Patient timeline paginated — 20 events per page
- RAG chunks limited to top-5 — never more
- Realtime only on appointments table — not on analytics
- PDF generation server-side only — never in browser