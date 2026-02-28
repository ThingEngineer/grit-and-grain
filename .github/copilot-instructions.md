# Copilot Instructions — Grit & Grain

## Project Overview

AI-powered ranch assistant (hackathon MVP). Ranchers record voice notes → transcribed → stored as diary entries → queried via RAG chat ("Farm Memory") and AI-generated weekly summaries. Built on **Next.js 16 (App Router) + Supabase + Vercel AI SDK**.

## Architecture

- **Frontend/API:** Next.js 16 App Router, React 19, Tailwind CSS 4, pnpm
- **Auth & DB:** Supabase (email/password auth, Postgres + pgvector, RLS on all tables)
- **AI pipeline:** Vercel AI SDK (`ai` + `@ai-sdk/anthropic` for generation + `@ai-sdk/openai` for embeddings) routed through Vercel AI Gateway
- **Path alias:** `@/*` maps to project root (e.g. `@/lib/supabase/server`)

## Supabase Client Pattern (Critical)

Three client factories in `lib/supabase/` — always use the correct one:

| File        | Function              | When to use                                                    |
| ----------- | --------------------- | -------------------------------------------------------------- |
| `client.ts` | `createClient()`      | Client components (`"use client"`)                             |
| `server.ts` | `createClient()`      | Server components, route handlers (uses anon key)              |
| `admin.ts`  | `createAdminClient()` | Server-side operations needing service-role key (bypasses RLS) |

**Never** call `createBrowserClient` or `createServerClient` directly — always import from `@/lib/supabase/*`.

## Auth & Middleware

- `proxy.ts` acts as Next.js middleware — refreshes Supabase sessions and enforces auth redirects. **Do not add code between `createServerClient()` and `getUser()`** in this file.
- Unauthenticated users → redirected to `/login`. Authenticated users on `/login` or `/signup` → redirected to `/dashboard`.
- Auth errors are mapped to user-friendly messages via `lib/supabase/errors.ts` (`getErrorMessage()`).

## Database Conventions

- All tables use `profile_id = auth.uid()` for RLS (except `profiles` which uses `id = auth.uid()`)
- Key tables: `profiles`, `pastures`, `herd_groups`, `diary_entries`, `weekly_reviews`, `entry_embeddings`
- Migrations live in `supabase/migrations/`. Create new ones with `supabase migration new <name>`.
- Schema reference: `docs/schema-draft.md`. RAG search function: `match_diary_entries` (pgvector cosine similarity).
- Embeddings: OpenAI `text-embedding-3-small`, 1536 dimensions, stored in `entry_embeddings.embedding` column.

## Implementation Plan

The project follows a phased plan in `docs/implementation/`. Each phase file is self-contained:

- **Phase A** (complete): Auth, project scaffold
- **Phase B**: Database migration (tables, RLS, pgvector, triggers)
- **Phase C**: CRUD UX (dashboard, diary entries, pasture/herd management)
- **Phase D**: Seed data ("Dry Creek Ranch" demo)
- **Phase E**: AI features (embeddings, RAG chat, weekly review, NLP tagging)
- **Phase F**: Polish (metadata, voice capture UI, .env.example)

**Always check the relevant phase doc before implementing a feature** — it contains exact SQL, component specs, and API contracts.

## AI Prompt & RAG Patterns

- All AI prompts are defined in `docs/prompts.md` — use these templates exactly.
- `content_for_rag` is a canonical text format (Date/Pasture/Herd/Rain/Notes) stored alongside embeddings. Omit null fields.
- RAG retrieval: top-k=8 (12 for trend questions), similarity threshold 0.72, cosine metric.
- NLP entity extraction runs after voice transcription to auto-tag entries (temperature=0, max 200 tokens).

## Dev Workflow

```bash
supabase start          # Local Supabase (DB port 54322, Studio port 54323)
pnpm dev                # Next.js dev server
supabase db push        # Apply migrations
supabase migration new <name>  # Create new migration
pnpm lint               # ESLint (next/core-web-vitals + typescript)
```

## Env Variables

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY  # Client-safe
SUPABASE_SECRET_KEY         # Server-only (admin/service-role)
OPENAI_API_KEY              # Embeddings
ANTHROPIC_API_KEY           # Text generation
```

## Code Style

- TypeScript strict mode. Use `Readonly<>` for component props.
- Tailwind utility classes directly in JSX — no CSS modules. Dark mode via `dark:` variant with zinc palette.
- Server components by default; add `"use client"` only when needed (state, effects, browser APIs).
- Route handlers return `NextResponse`. Auth route handlers use `createClient()` from server, admin operations use `createAdminClient()`.
- Error display pattern: conditional render of error/message state in colored alert boxes (see `app/login/page.tsx`).
