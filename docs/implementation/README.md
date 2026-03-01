# Implementation Guide — Grit & Grain

> Master tracking document. Each phase has its own file to keep context small during implementation.

---

## Current State

**Milestone A — COMPLETE** ✅

- Next.js 16 app scaffolded with pnpm
- Supabase Auth SSR (sign-up, login, sign-out, callback, proxy/middleware, protected routes)
- Supabase client utilities (`lib/supabase/` — browser, server, admin)
- Tailwind CSS 4 configured
- All docs drafted (README, prompts, schema-draft, demo-script)

---

## Phase Tracker

Start from Phase B and work down. Each phase is designed so you can **stop after any phase and still demo something**.

**Recommendation:** Implement Phase G (Design System) early, before or alongside Phase C, to ensure consistent styling across all pages.

| Phase | File                                                 | Description                                                                                 | Status   | Est. Time |
| ----- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------- | --------- |
| **G** | [phase-g-design-system.md](phase-g-design-system.md) | Light mode default, dark mode toggle, design tokens (colors, typography), theme persistence | Complete | 1–2 hrs   |
| **B** | [phase-b-database.md](phase-b-database.md)           | Supabase migration: tables, RLS, indexes, triggers, pgvector, functions                     | Complete | 1–2 hrs   |
| **C** | [phase-c-crud-ux.md](phase-c-crud-ux.md)             | Dashboard, diary entry form/list, pasture/herd management, app layout (use Phase G tokens)  | Complete | 2–3 hrs   |
| **D** | [phase-d-seed-data.md](phase-d-seed-data.md)         | Seed API route: "Dry Creek Ranch" demo data (pastures, herds, 12 months of diary entries)   | Complete | 1–2 hrs   |
| **E** | [phase-e-ai-features.md](phase-e-ai-features.md)     | Vercel AI SDK + Gateway: embeddings, Farm Memory chat (RAG), Weekly Review, NLP tagging     | Complete | 3–4 hrs   |
| **F** | [phase-f-polish.md](phase-f-polish.md)               | Layout metadata, .env.example, voice capture UI, final README check                         | Complete | 1–2 hrs   |

---

## Key Decisions (locked in)

| Decision          | Choice                                                             | Why                                                                                                                             |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Auth              | Required (email/password)                                          | Links demo user to seed data; clean RLS story                                                                                   |
| AI routing        | Vercel AI Gateway via AI SDK                                       | Unified model access, observability, single billing                                                                             |
| Text generation   | Anthropic Claude via OpenAI-compatible endpoint (`@ai-sdk/openai`) | Vercel AI Gateway's `/v1` endpoint supports all providers; `@ai-sdk/anthropic` sends `x-api-key` auth which the gateway rejects |
| Embeddings        | OpenAI `text-embedding-3-small` 1536-dim (via `@ai-sdk/openai`)    | Industry standard, strong retrieval quality                                                                                     |
| Weekly Review     | On-demand (button click)                                           | Hackathon speed; mention cron as production plan                                                                                |
| Review date range | Rolling 7 days + optional custom range                             | Flexible, easy to implement                                                                                                     |
| Package manager   | pnpm                                                               | Already configured                                                                                                              |

---

## Reference Docs

| Doc                                                  | Purpose                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| [README.md](../../README.md)                         | Public-facing project description (AI judges read this)  |
| [phase-g-design-system.md](phase-g-design-system.md) | Design tokens, typography, theme architecture, dark mode |
| [docs/prompts.md](../prompts.md)                     | All AI prompt templates + retrieval params               |
| [docs/schema-draft.md](../schema-draft.md)           | Human-readable schema + `match_diary_entries` function   |
| [docs/demo-script.md](../demo-script.md)             | 2:45 demo narrative for video recording                  |

---

## Repo Structure Target

```
app/
  layout.tsx              ← update metadata + add nav shell
  globals.css
  dashboard/
    page.tsx              ← main hub: diary list + quick-add + seed button
  diary/
    page.tsx              ← full diary list with filters
    new/page.tsx          ← diary entry form (manual + voice)
  chat/
    page.tsx              ← Farm Memory RAG chat
  review/
    page.tsx              ← Weekly Review generator + history
  login/page.tsx          ← ✅ exists
  signup/page.tsx         ← ✅ exists
  auth/                   ← ✅ exists
  api/
    auth/                 ← ✅ exists
    ai/
      chat/route.ts       ← RAG chat endpoint
      weekly-review/route.ts
      embed/route.ts      ← embedding generation
    seed/route.ts         ← demo data seeder

lib/
  supabase/               ← ✅ exists (client, server, admin, errors)
  ai/
    gateway.ts            ← Vercel AI SDK client wrappers
    prompts.ts            ← system prompt constants
  rag/
    format.ts             ← formatEntryForRag (canonical text builder)
    search.ts             ← vector search wrapper (calls match_diary_entries)

components/
  nav.tsx                 ← app navigation bar
  diary-entry-form.tsx
  diary-entry-card.tsx
  chat-message.tsx
  review-card.tsx
  voice-recorder.tsx      ← Web Speech API wrapper

supabase/
  config.toml             ← ✅ exists
  migrations/
    00001_initial_schema.sql  ← Phase B creates this
  seed.sql                ← optional (API seeding preferred)
```

---

## How to Use These Files

1. Open the phase file you're working on
2. Attach it (and relevant reference docs) to your Copilot session
3. Work through the tasks in order — each has concrete instructions
4. Mark tasks complete as you go
5. When a phase is done, update the tracker above and move to the next phase
