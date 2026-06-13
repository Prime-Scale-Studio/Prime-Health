# PrimeHealth — Agent Instructions
> Read this entire file before writing a single line of code.
> This is the source of truth for how code is written in this repo.

---

## What This Project Is
Multi-tenant clinic management SaaS. Next.js 14 App Router + Supabase + Groq AI.
Every piece of data belongs to a clinic. Every query must be scoped to clinic_id.
Two actors: authenticated doctor (dashboard), anonymous patient (widget).

---

## Stack
- **Framework**: Next.js 14 App Router (strict)
- **Language**: TypeScript 5 strict mode — no `any`, no type assertions without comment
- **Database**: Supabase (Postgres + Auth + Realtime + RLS + pgvector)
- **AI**: Groq SDK — primary: `llama-3.3-70b-versatile`, fallback: `llama-3.1-8b-instant`
- **RAG**: pgvector + Gemini `text-embedding-004` for embeddings
- **Email**: Resend
- **Styling**: Tailwind CSS + Framer Motion
- **Validation**: Zod

---

## Absolute Rules — Never Break These

1. **Zero DB logic in React components** — all DB calls go in Server Actions (`actions/`) or API routes (`app/api/`)
2. **Never use the Supabase client directly in components** — always through Server Actions
3. **Never expose `SUPABASE_SERVICE_ROLE_KEY` to client** — server-only
4. **Never skip RLS** — every new table must have RLS enabled + policies before use
5. **Never trust client-supplied `clinic_id`** — always derive from `get_my_clinic_id()` server-side
6. **Never use `any` type** — use `unknown` + type narrowing if needed
7. **Never write raw SQL in application code** — use Supabase query builder or RPC calls
8. **Always handle errors explicitly** — no silent catches, no empty catch blocks
9. **Never store sensitive data in localStorage** — auth is Supabase session only
10. **Always validate input with Zod** before any DB write

---

## Folder Structure & Where Things Go
actions/          → Server Actions only. One file per domain.

e.g. actions/appointments.ts, actions/patients.ts
app/(app)/        → Authenticated dashboard pages

app/(auth)/       → Login, signup, onboarding

app/api/widget/   → Public API routes for the patient widget (anon access)
components/

appointments/   → Appointment-related UI

dashboard/      → KPI cards, charts

layout/         → Sidebar, topbar, page headers

patients/       → Patient directory, profile, timeline

clinical/       → Visit notes, prescriptions

ai/             → AI settings, RAG management, companion config

analytics/      → Revenue, performance, copilot

settings/       → All settings tab components

ui/             → Primitive components (Button, Dialog, etc)

widget/         → Patient-facing chat bubble and widget UI
hooks/            → Custom React hooks only

lib/

ai/             → Groq config, system prompts, RAG retrieval

supabase/       → client.ts, server.ts, admin.ts singletons

notifications.ts → Resend email functions

slots.ts        → Slot calculation logic

validations.ts  → Zod schemas

pdf.ts          → Prescription PDF generation

embeddings.ts   → Gemini embedding calls
types/            → TypeScript interfaces, Supabase generated types

---

## Supabase Client Usage

```typescript
// In Server Actions / API routes — use server client
import { createServerClient } from '@/lib/supabase/server'

// In components that need realtime — use browser client
import { createBrowserClient } from '@/lib/supabase/client'

// For admin operations (bypasses RLS) — server-only, never in client
import { createAdminClient } from '@/lib/supabase/admin'
// Only use admin client for: cron jobs, webhook handlers, seeding
```

---

## Server Action Pattern

```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  // always validate inputs
})

export async function myAction(input: unknown) {
  // 1. Validate input
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input', details: parsed.error.flatten() }
  }

  // 2. Get authenticated client
  const supabase = await createServerClient()
  
  // 3. Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 4. clinic_id always from DB, never from client
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .single()
  if (!clinic) return { error: 'Clinic not found' }

  // 5. Perform operation
  const { data, error } = await supabase
    .from('table')
    .insert({ clinic_id: clinic.id, ...parsed.data })
    .select()
    .single()

  if (error) {
    console.error('[myAction]', error)
    return { error: 'Operation failed' }
  }

  return { data }
}
```

---

## Widget API Route Pattern (Public/Anon)

```typescript
// app/api/widget/[slug]/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // 1. Validate slug exists — get clinic
  const supabase = createAdminClient()
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, doctor_name')
    .eq('slug', params.slug)
    .single()
  
  if (!clinic) {
    return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
  }

  // 2. All subsequent queries scoped to clinic.id
  // Never trust any clinic_id from request body
}
```

---

## AI / Groq Pattern

```typescript
// lib/ai/groq.ts
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function callGroq(
  messages: Groq.Chat.Messages,
  options?: { model?: string }
) {
  const model = options?.model ?? 'llama-3.3-70b-versatile'
  
  try {
    const response = await groq.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    })
    return { data: response.choices[0].message.content }
  } catch (error: unknown) {
    // Fallback on rate limit
    if (error instanceof Groq.RateLimitError) {
      const fallback = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      })
      return { data: fallback.choices[0].message.content }
    }
    return { error: 'AI unavailable' }
  }
}
```

---

## RAG Pattern

```typescript
// lib/ai/rag.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from '@/lib/embeddings'

export async function retrieveContext(
  clinicId: string,
  query: string,
  topK: number = 5
): Promise<string> {
  const embedding = await generateEmbedding(query)
  const supabase = createAdminClient()
  
  const { data: chunks } = await supabase.rpc('match_rag_chunks', {
    p_clinic_id: clinicId,
    p_embedding: embedding,
    p_match_count: topK,
    p_similarity_threshold: 0.7,
  })

  if (!chunks?.length) return ''
  
  return chunks.map((c: { content: string }) => c.content).join('\n\n')
}
```

---

## Error Handling Rules

- Server Actions always return `{ data } | { error: string }`
- Never throw from Server Actions — always return error object
- Log errors with context: `console.error('[ActionName]', error)`
- API routes return proper HTTP status codes
- Client components handle both states explicitly — no optimistic-only UI

---

## TypeScript Rules

- All DB row types from `types/supabase.ts` — never redefine manually
- Use `Database['public']['Tables']['tablename']['Row']` pattern
- Insert types: use generated `Insert` types, never cast
- Prefer `const` assertions for static config
- No barrel exports from `components/` — import directly

---

## Styling Rules

- Tailwind only — no inline styles, no CSS modules
- Dark theme by default (dashboard), light optional (widget)
- Framer Motion for: page transitions, modal open/close, list item enter/exit
- No animation on data tables — performance
- Mobile-first responsive on all pages

---

## Settings Pages Pattern
Every feature has a settings component in `components/settings/`.
Each settings component:
1. Fetches own settings row on mount via Server Action
2. Uses controlled form state
3. Saves via Server Action on submit
4. Shows toast on success/error
5. Never saves partial state — full row update only

---

## What Never Goes In This Repo
- No hardcoded clinic_id anywhere
- No API keys in any file except `.env.local`
- No console.log in production paths — use console.error for errors only
- No TODO comments in committed code — use TASKS.md
- No `@ts-ignore` — fix the type properly
