# PrimeHealth — Product Requirements Document
Version: 2.0 | Status: Active Development

---

## Vision
The operating system for independent clinics in India.
Every doctor who uses PrimeHealth runs a smarter, more profitable clinic
with zero administrative overhead and an AI that works 24/7 on their behalf.

---

## Problem
Independent doctors and small clinics in India (600,000+ registered) operate with:
- No-show rates of 20–40% with zero recovery system
- Manual appointment booking via phone calls and WhatsApp texts
- Zero visibility into revenue, patient retention, or slot utilization
- No structured patient health records — everything in paper or personal WhatsApp
- No post-visit care continuity — patients disappear after one visit
- Tools that exist are either too expensive (hospital-grade) or too simple (just booking)

---

## Solution
PrimeHealth is a multi-tenant SaaS where each doctor gets:
1. A full clinic management dashboard
2. An embeddable AI widget on their website that books appointments 24/7
3. Clinical tools (visit notes, prescriptions, patient timelines)
4. Autonomous AI agents that run follow-ups, reminders, and reporting
5. Intelligence layer that makes the doctor understand their business

---

## Target Users

### Primary: Independent Doctor / Small Clinic Owner
- Solo practitioner or 2–3 doctor practice
- Has a website or wants one
- Sees 10–40 patients per day
- Pain: phone calls, no-shows, no records, no analytics
- Willingness to pay: ₹3,000–8,000/month

### Secondary: Multi-doctor Clinic / Specialty Center
- 3–10 doctors, possibly multiple locations
- Has existing staff but wants automation
- Pain: coordination overhead, revenue leakage, no unified analytics
- Willingness to pay: ₹15,000–40,000/month

---

## Core Principles
1. **Zero-friction for doctor** — setup in under 10 minutes, widget live in under 30
2. **Mobile-first for patients** — widget works perfectly on any device
3. **AI reduces work, not adds it** — every AI feature saves time, not creates tasks
4. **Data lock-in through value** — patient history, timelines, and analytics make switching painful
5. **Cost-efficient at scale** — RAG + Groq keeps AI costs near-zero per clinic

---

## Feature Modules

### Module 1: Core Booking System ✅ (Built)
**What**: Doctor configures availability, services, blocked dates. Widget allows patients to book.
**Success metric**: Booking completion rate > 70% via widget

### Module 2: AI Chat Widget ✅ (Built)
**What**: Conversational AI on clinic website. Answers FAQs, checks slots, books appointments.
**Stack**: Groq llama-3.3-70b + custom system prompt + clinic context injection
**Success metric**: < 3 message exchanges to complete booking

### Module 3: RAG Knowledge Base 🔨 (In Progress)
**What**: Doctor uploads clinic documents, protocols, FAQs. Widget AI answers using this context.
**Stack**: pgvector + Gemini text-embedding-004 + match_rag_chunks()
**Why**: Reduces hallucination, reduces token usage 70%, makes AI clinic-specific
**Success metric**: Widget answers clinic-specific questions correctly > 90% of time

### Module 4: Voice-Enabled Widget 🔨 (In Progress)
**What**: Patient clicks mic in widget → speaks → AI responds in voice
**Stack**: Browser Web Speech API (STT) + Groq (LLM) + Web Speech Synthesis (TTS)
**Cost**: Zero — fully browser-native
**Success metric**: Voice booking completion rate > 50%

### Module 5: AI Doctor Assistant 📋 (Planned)
**What**: When doctor opens an appointment, AI auto-generates patient briefing:
- Last visit summary
- Current medications (from prescriptions)
- Risk flags
- Recommended questions to ask
**Stack**: Groq + patient_health_timeline + visit_notes RAG retrieval
**Success metric**: Doctor saves > 5 minutes per consultation

### Module 6: Visit Notes + Prescriptions 📋 (Planned)
**What**: Doctor writes SOAP notes during/after appointment. AI structures them.
AI generates prescription from rough notes. PDF emailed to patient via Resend.
**Tables**: visit_notes, prescriptions, prescription_settings
**Success metric**: Prescription created in < 2 minutes

### Module 7: Patient Health Timeline 📋 (Planned)
**What**: AI builds longitudinal health record per patient from all visits, notes, prescriptions.
Doctor sees entire patient history in one scrollable timeline view.
**Tables**: patient_health_timeline
**Success metric**: Complete timeline visible within 2 seconds

### Module 8: Autonomous Follow-up Engine 📋 (Planned)
**What**: After every completed appointment, automated email sequence fires:
- Day 1: "How are you feeling?"
- Day 3: Medication reminder
- Day 7: Follow-up check-in
- Day 30: Recall / re-booking nudge
All templates editable from dashboard. Each step toggleable.
**Stack**: followup_tasks queue + cron job + Resend
**Success metric**: 25%+ patient re-booking rate from follow-up emails

### Module 9: No-Show Prediction Engine 📋 (Planned)
**What**: For every confirmed appointment, AI scores no-show risk (low/medium/high).
High-risk appointments flagged on dashboard. Doctor can choose to send manual reminder.
**Stack**: calculate_no_show_risk() DB function + dashboard badge
**Success metric**: 20% reduction in no-show rate for flagged appointments

### Module 10: Revenue Intelligence Dashboard 📋 (Planned)
**What**: Real business analytics — not just appointment counts:
- Gross/net revenue by period
- Revenue lost to cancellations and no-shows
- Top performing services
- Slot utilization rate
- New vs returning patient revenue
**Tables**: revenue_snapshots
**Success metric**: Doctor can answer "how much did I make this month?" in < 5 seconds

### Module 11: Clinic Performance Copilot 📋 (Planned)
**What**: Monthly AI-generated email report to doctor:
- Revenue trend vs last month
- Patient retention rate
- Underperforming slots
- Actionable recommendations
**Stack**: Groq + revenue_snapshots + analytics_snapshots + Resend
**Success metric**: > 60% email open rate (because it's actually useful)

### Module 12: Dynamic Pricing 📋 (Planned)
**What**: Doctor sets rules — peak hours cost more, off-peak slots auto-discounted.
Applied at slot selection in widget.
**Tables**: dynamic_pricing_rules
**Success metric**: 15% improvement in off-peak slot utilization

### Module 13: Multi-Doctor / Multi-Location 🗓️ (Future)
**What**: One clinic account, multiple doctors, multiple locations.
Each doctor has own availability. Appointments routed to correct doctor.
**When**: After ₹5L MRR — this is the ARPU multiplier

### Module 14: Patient-Facing Portal 🗓️ (Future)
**What**: Patient sees their own booking history, prescriptions, health timeline.
No app required — email magic link access.
**When**: After 1,000 active clinics — network effect begins here

---

## Subscription Plans

### Free Trial (14 days)
- All features unlocked
- Limit: 30 appointments total

### Starter — ₹2,999/month
- Core booking + AI widget
- Email notifications
- Basic analytics
- Up to 100 appointments/month

### Pro — ₹5,999/month
- Everything in Starter
- RAG knowledge base
- Visit notes + prescriptions
- Patient health timeline
- Follow-up sequences
- Revenue intelligence
- No-show predictions
- Voice widget

### Elite — ₹12,999/month
- Everything in Pro
- Multi-doctor support
- Performance copilot
- Dynamic pricing
- Priority support
- Custom widget branding

---

## Technical Constraints
- Zero WhatsApp/Twilio/Exotel cost until revenue — email only for now
- Voice is browser-native WebRTC only — no telephony
- AI cost kept near-zero via RAG (70% token reduction target)
- All features configurable from dashboard — nothing hardcoded
- RLS enforced on every table — multi-tenant security non-negotiable

---

## Success Metrics (6 months)
- 100 paying clinics
- < 5% monthly churn
- NPS > 50
- AI widget booking completion > 70%
- Average revenue per clinic > ₹5,000/month

---

## What We Are Not Building (Yet)
- ABHA / ABDM integration
- Telemedicine / video consults
- Insurance / billing
- Lab report integration
- Android / iOS native app
- WhatsApp Business API