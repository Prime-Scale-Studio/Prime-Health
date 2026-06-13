# PrimeHealth — Build Tasks
> Ordered by priority. Complete each task fully before moving to next.
> Each task references exact files to create or modify.

---

## ACTIVE SPRINT — Foundation Completion

---

### TASK-001: Fix RLS Vulnerabilities
**Priority**: CRITICAL — fix before any new feature
**Context**: Three known security holes in current RLS policies
**Files**: Supabase SQL editor

```sql
-- Fix 1: Restrict public clinic select to safe columns only
DROP POLICY IF EXISTS clinic_select_public_by_slug ON public.clinics;
CREATE POLICY clinic_select_public_by_slug ON public.clinics
  FOR SELECT
  USING (slug IS NOT NULL);
-- TODO: Create a clinic_public view with only safe columns
-- (id, name, doctor_name, specialty, city, widget_theme_color, widget_tone, slug)
-- and point widget API to that view instead

-- Fix 2: Scope chat session updates to own token
DROP POLICY IF EXISTS chat_sessions_update_by_token ON public.chat_sessions;
CREATE POLICY chat_sessions_update_by_token ON public.chat_sessions
  FOR UPDATE
  USING (session_token = current_setting('app.session_token', true));

-- Fix 3: Restrict notification log inserts to service role only
DROP POLICY IF EXISTS notif_logs_insert_own ON public.notification_logs;
-- notification_logs should only be written by server-side code via admin client
-- No anon or authenticated insert policy needed
```

**Acceptance criteria**: No sensitive clinic data exposed to anon key

---

### TASK-002: RAG Document Management UI
**Priority**: HIGH
**Context**: rag_documents + rag_chunks tables exist. Need UI + processing pipeline.
**Files to create**:
- `actions/rag.ts` — uploadDocument, deleteDocument, listDocuments, reindexDocument
- `lib/embeddings.ts` — generateEmbedding() via Gemini text-embedding-004
- `lib/ai/rag.ts` — retrieveContext(clinicId, query, topK)
- `components/ai/RAGDocumentManager.tsx` — upload, list, delete, toggle active
- `app/(app)/settings/ai-training/page.tsx` — update to include RAG section

**Acceptance criteria**:
- Doctor can upload text/PDF document
- Document auto-chunked (500 tokens, 50 token overlap)
- Each chunk embedded via Gemini and stored in rag_chunks
- Widget AI uses RAG context on every message

---

### TASK-003: Integrate RAG into Widget Chat
**Priority**: HIGH — depends on TASK-002
**Context**: Widget currently uses only ai_knowledge. Add RAG retrieval.
**Files to modify**:
- `app/api/widget/[slug]/chat/route.ts`
- `lib/ai/prompts/widget.ts`

**Logic**:
user message arrives →

retrieveContext(clinic_id, message, 5) →

inject chunks into system prompt →

callGroq(messages)

**Acceptance criteria**: Widget answers clinic-specific questions using uploaded documents

---

### TASK-004: Voice Widget (Browser Native)
**Priority**: HIGH
**Context**: Zero cost voice using Web Speech API
**Files to create**:
- `components/widget/VoiceButton.tsx`
- `hooks/useVoice.ts` — handles SpeechRecognition + SpeechSynthesis
- `app/api/widget/[slug]/voice/route.ts` — receives transcript, returns AI response text

**Logic**:
Patient clicks mic →

SpeechRecognition starts (browser native) →

transcript sent to /api/widget/[slug]/voice →

same AI pipeline as chat →

response text → SpeechSynthesis.speak()

**Acceptance criteria**:
- Works in Chrome and Safari
- Auto-detects Hindi vs English
- Falls back to text if speech not supported

---

### TASK-005: Visit Notes (SOAP)
**Priority**: HIGH
**Context**: visit_notes table exists. Need doctor UI.
**Files to create**:
- `actions/visit-notes.ts` — saveVisitNote, getVisitNote, generateAISummary
- `components/clinical/VisitNoteEditor.tsx` — 4 field SOAP form
- `components/clinical/AISummaryPanel.tsx` — shows AI generated summary
- `app/(app)/appointments/[id]/page.tsx` — add visit notes section

**AI behavior**:
Doctor fills SOAP fields →

On save: callGroq(summarize these SOAP notes in 2 sentences) →

UPDATE visit_notes.ai_summary

If risk keywords detected → UPDATE ai_risk_flags

INSERT patient_health_timeline (event_type: visit)

**Acceptance criteria**: Doctor can write and save SOAP notes. AI summary auto-generates.

---

### TASK-006: Prescription Engine
**Priority**: HIGH — depends on TASK-005
**Context**: prescriptions + prescription_settings tables exist
**Files to create**:
- `actions/prescriptions.ts` — savePrescription, sendPrescription, getPrescription
- `lib/pdf.ts` — generatePrescriptionPDF() using @react-pdf/renderer
- `components/clinical/PrescriptionBuilder.tsx` — medicine entry UI
- `components/clinical/PrescriptionPreview.tsx` — live PDF preview
- `components/settings/PrescriptionSettings.tsx`
- `app/(app)/settings/prescriptions/page.tsx`

**Acceptance criteria**:
- Doctor adds medicines with dosage/frequency/duration
- PDF generated with clinic branding
- Auto-emailed to patient on save if enabled

---

### TASK-007: Patient Health Timeline
**Priority**: MEDIUM — depends on TASK-005, TASK-006
**Context**: patient_health_timeline table exists
**Files to create**:
- `actions/patients.ts` — add getPatientTimeline()
- `components/patients/HealthTimeline.tsx` — scrollable timeline UI
- `app/(app)/patients/[id]/page.tsx` — add timeline tab

**Events auto-inserted by**:
- Visit note save → event_type: visit
- Prescription save → event_type: prescription
- Follow-up completed → event_type: follow_up
- AI insight generated → event_type: ai_insight

**Acceptance criteria**: Full patient history visible in timeline. Paginated 20/page.

---

### TASK-008: AI Doctor Assistant
**Priority**: MEDIUM — depends on TASK-007
**Context**: doctor_assistant_settings table exists
**Files to create**:
- `lib/ai/prompts/doctor-assistant.ts`
- `actions/doctor-assistant.ts` — generatePatientBriefing(appointment_id)
- `components/clinical/DoctorBriefingPanel.tsx`
- `components/settings/DoctorAssistantSettings.tsx`

**Briefing includes**:
- Last visit summary
- Current active medications
- Risk flags from previous notes
- Visit frequency pattern
- Recommended follow-up questions

**Acceptance criteria**: Briefing auto-loads when appointment opened if enabled

---

### TASK-009: Follow-up Email Sequences
**Priority**: MEDIUM
**Context**: followup_sequence_settings + followup_tasks tables exist
**Files to create**:
- `actions/followups.ts` — createFollowupTasks, cancelFollowupTasks
- `app/api/cron/followups/route.ts` — processes pending tasks
- `lib/ai/prompts/followup.ts` — personalizes email content per step
- `components/settings/FollowupSequenceSettings.tsx`
- `app/(app)/settings/follow-ups/page.tsx`

**Cron logic**:
SELECT followup_tasks WHERE status='pending' AND scheduled_at <= now() LIMIT 50

for each task → render template → send Resend email → mark sent

**Acceptance criteria**:
- 4 follow-up emails sent automatically after appointment completion
- Each step independently toggleable
- Templates editable from dashboard

---

### TASK-010: No-Show Prediction Dashboard
**Priority**: MEDIUM
**Context**: no_show_predictions table + calculate_no_show_risk() function exist
**Files to create**:
- `actions/appointments.ts` — add scoreNoShowRisk(appointment_id)
- `components/appointments/NoShowBadge.tsx` — low/medium/high indicator
- Update appointment list and calendar to show risk badges

**Trigger**: Call scoreNoShowRisk() when appointment status → confirmed

**Acceptance criteria**: Risk badge visible on every confirmed appointment

---

### TASK-011: Revenue Intelligence Dashboard
**Priority**: MEDIUM
**Context**: revenue_snapshots table exists. Need cron + UI.
**Files to create**:
- `app/api/cron/snapshots/route.ts` — daily revenue aggregation
- `actions/analytics.ts` — getRevenueSnapshots, getAnalyticsSnapshots
- `components/analytics/RevenueOverview.tsx`
- `components/analytics/SlotUtilizationChart.tsx`
- `components/analytics/ServicePerformanceChart.tsx`
- `app/(app)/analytics/page.tsx` — full analytics page

**Acceptance criteria**:
- Doctor sees gross revenue, net revenue, loss from no-shows/cancellations
- Service performance breakdown
- Slot utilization rate
- All data from snapshots — never live aggregation

---

### TASK-012: Clinic Performance Copilot
**Priority**: LOW — depends on TASK-011
**Context**: copilot_settings table exists
**Files to create**:
- `lib/ai/prompts/copilot.ts`
- `actions/copilot.ts` — generateCopilotReport(clinic_id)
- `app/api/cron/copilot/route.ts` — monthly trigger
- `components/settings/CopilotSettings.tsx`
- `app/(app)/settings/copilot/page.tsx`

**Report structure**:
AI analyzes last 30 days of revenue_snapshots + analytics_snapshots

→ generates narrative: what went well, what underperformed

→ 3 specific recommendations

→ sent as beautiful HTML email via Resend

**Acceptance criteria**: Doctor receives actionable monthly report email

---

### TASK-013: Dynamic Pricing Rules
**Priority**: LOW
**Context**: dynamic_pricing_rules table exists
**Files to create**:
- `actions/settings/dynamic-pricing.ts`
- `components/settings/DynamicPricingRules.tsx`
- `app/(app)/settings/pricing/page.tsx`
- Update `lib/slots.ts` to apply pricing rules to slot output

**Acceptance criteria**: Peak/off-peak/early-bird pricing applied in widget slot display

---

### TASK-014: Multi-language Settings UI
**Priority**: LOW
**Context**: language_settings table exists. Core en/hi logic in widget already.
**Files to create**:
- `actions/settings/language.ts`
- `components/settings/LanguageSettings.tsx`
- `app/(app)/settings/language/page.tsx`

**Acceptance criteria**: Doctor can set default language and custom greetings per language

---

## FUTURE SPRINT

- TASK-015: Stripe billing integration
- TASK-016: Multi-doctor support
- TASK-017: Patient-facing portal (email magic link)
- TASK-018: Fix clinic_public view for anon RLS
- TASK-019: WhatsApp BSP integration (post-revenue)
- TASK-020: Mobile app (React Native — post 1000 clinics)
