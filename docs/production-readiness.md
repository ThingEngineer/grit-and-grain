# Grit & Grain — Production Readiness

> Last updated: March 1, 2026

This document summarises every production-readiness measure in place across security, data integrity, AI safety, code quality, and deployment.

---

## Security

### HTTP Security Headers (`next.config.ts`)

Applied globally to all routes via Next.js `headers()`:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevent clickjacking / iframe embedding |
| `X-Content-Type-Options` | `nosniff` | Block MIME-type sniffing attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage to third parties |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=()` | Restrict browser features; microphone scoped to own origin only |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS for 2 years, including subdomains |
| `Content-Security-Policy` | Dynamically built from env vars | Restricts script, style, image, frame, and network origins |

### Content Security Policy

CSP origins are built at startup from `NEXT_PUBLIC_SUPABASE_URL` and `VERCEL_AI_GATEWAY_BASE_URL` — no URLs are hardcoded, so the same build works for local dev and production without modification.

```
default-src 'self'
script-src 'self' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob:
font-src 'self'
connect-src 'self' <supabase-origin> <supabase-ws-origin> <ai-gateway-origin>
frame-src 'none'
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

---

## Authentication & Session Management

### Middleware (`proxy.ts`)

- Every request passes through the auth middleware before reaching any route handler or page.
- Supabase session tokens are **silently refreshed** on each request — users are never unexpectedly logged out mid-session.
- **Unauthenticated users** are redirected to `/login` before any protected route is served.
- **Authenticated users** hitting `/`, `/login`, or `/signup` are redirected to `/dashboard`.
- **Incomplete profiles** (missing `full_name`) are redirected to `/profile` for onboarding before accessing the rest of the app.

### Supabase Client Isolation

Three separate client factories prevent privilege escalation:

| File | Factory | Privilege |
|------|---------|-----------|
| `lib/supabase/client.ts` | `createClient()` | Anon key — client components only |
| `lib/supabase/server.ts` | `createClient()` | Anon key — server components & route handlers |
| `lib/supabase/admin.ts` | `createAdminClient()` | Service-role key — server-side only, bypasses RLS for trusted operations |

The service-role key (`SUPABASE_SECRET_KEY`) is never exposed to the browser.

---

## Database Security

### Row Level Security (RLS)

RLS is **enabled on every table**. All policies use `profile_id = auth.uid()` (or `id = auth.uid()` for `profiles`) to ensure complete data isolation between users.

| Table | Policy |
|-------|--------|
| `profiles` | `id = auth.uid()` — view and update own profile only |
| `pastures` | `profile_id = auth.uid()` — full CRUD on own pastures |
| `herd_groups` | `profile_id = auth.uid()` — full CRUD on own herd groups |
| `diary_entries` | `profile_id = auth.uid()` — full CRUD on own entries |
| `weekly_reviews` | `profile_id = auth.uid()` — full CRUD on own reviews |
| `entry_embeddings` | `profile_id = auth.uid()` — full CRUD on own embeddings |

### Account Deletion

Account deletion is handled by a server-side Postgres function with RLS enforcement. Cascading deletes propagate to all user-owned rows across every table, ensuring no orphaned data remains after account removal.

### Version-Controlled Migrations

All schema changes live in `supabase/migrations/` and are applied in order, ensuring the database schema is reproducible and auditable.

---

## AI Safety

### Per-User Rate Limiting (`lib/ai/rate-limit.ts`)

A sliding-window rate limiter is applied to every AI endpoint (`chat`, `embed`, `extract`, `weekly-review`). Limits are enforced per authenticated user ID — unauthenticated callers cannot reach any AI route. Returns a `Retry-After` value when a limit is exceeded.

### Topic Guard (`lib/ai/topic-guard.ts`)

A keyword-based relevance filter runs before queries reach the RAG pipeline or LLM. Clearly off-topic messages are rejected with a polite error response, avoiding wasted LLM calls and potential prompt injection through unrelated inputs.

### AI Gateway Abstraction (`lib/ai/gateway.ts`)

All AI calls are routed through the **Vercel AI Gateway**. No Anthropic or OpenAI API keys are held in application code. The active model for both chat and embeddings is controlled by environment variables:

- `NEXT_PUBLIC_AI_CHAT_MODEL` (default: `anthropic/claude-sonnet-4.6`)
- `NEXT_PUBLIC_AI_EMBEDDING_MODEL` (default: `openai/text-embedding-3-small`)

This enables model swaps without code changes.

---

## Accessibility

The authenticated app targets **WCAG 2.1 Level AA** conformance. The following measures are in place across all `app/(authenticated)` pages and shared components:

### Keyboard Navigation & Focus Management

- **Skip-to-content link** — a visually-hidden `<a href="#main-content">` is the first focusable element on every authenticated page; it becomes visible on focus so keyboard users can bypass the nav bar.
- **`<main id="main-content">`** — the primary landmark receives focus when the skip link is activated (`tabIndex={-1}`, `outline-none`).
- **Profile menu** — focuses the first menu item (`Profile`) via `requestAnimationFrame` when the dropdown opens, so keyboard users land in the menu immediately.
- **Mobile nav** — the hamburger button exposes `aria-controls="mobile-menu"` pointing to the dropdown; `aria-expanded` reflects open/closed state.

### Landmarks & Semantic Structure

- `<nav aria-label="Main navigation">` identifies the nav as a distinct landmark (important when multiple `<nav>` elements exist on a page).
- `<main>` serves as the page's main content landmark on every authenticated page.
- Profile menu dropdown uses `role="menu"` / `role="menuitem"` per the ARIA Authoring Practices menu button pattern.
- Data tables (Pastures, Herds) include `scope="col"` on all `<th>` elements (WCAG 1.3.1).

### Active / State Communication

- Nav links carry `aria-current="page"` on the matching route (both desktop and mobile lists).
- Tag-filter buttons and diary-entry tag toggles use `aria-pressed` to communicate selected state to screen readers.
- The voice recorder button exposes `aria-label` ("Start voice recording" / "Stop recording") and `aria-pressed` reflecting live recording state; the decorative 🎙 emoji is wrapped in `aria-hidden="true"`.

### Live Regions & Dynamic Content

| Location | Pattern | Behaviour |
|----------|---------|-----------|
| Chat message list | `role="log"` + `aria-live="polite"` | New assistant messages are announced as they arrive |
| Chat "Thinking…" spinner | `role="status"` + `aria-live="polite"` | Loading state announced without interrupting reading |
| Chat error | `role="alert"` | Error announced immediately |
| Weekly Review loading | `role="status"` + `aria-live="polite"` | Generation progress announced |
| Weekly Review error | `role="alert"` | Error announced immediately |
| Generate Review button | `aria-busy={isLoading}` | Signals busy state to assistive technology |
| Profile / Account banners | `role="alert"` | Success and error messages announced on page load |

### Form Labelling

- All `<input>` and `<select>` elements have either an associated `<label>` or an `aria-label` attribute — no unlabelled controls.
- Diary filter controls (search, pasture, herd, date range) previously relied on `placeholder` text or a `title` attribute; these are replaced with proper labels.
- The chat input carries `aria-label="Ask about your ranch history"`.

---

## Code Quality

### TypeScript Strict Mode

`tsconfig.json` enables `"strict": true`, enforcing:

- No implicit `any`
- Strict null checks
- Strict function types
- No unchecked indexed access

### ESLint

ESLint is configured with `eslint-config-next` (which includes `next/core-web-vitals`) plus TypeScript-aware rules. Run via `pnpm lint`.

### Input Validation

[Zod](https://zod.dev/) is used for runtime schema validation on API route inputs and form data.

### Error Handling

Raw Supabase error codes are mapped to user-friendly messages in `lib/supabase/errors.ts` via `getErrorMessage()`. Internal error details are never surfaced to the client.

---

## Testing

Tests are written with [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/). Coverage is generated with `@vitest/coverage-v8`.

```bash
pnpm test            # Run all tests once
pnpm test:watch      # Watch mode
pnpm test:coverage   # Generate coverage report
```

Test coverage spans:

- **Middleware** — `tests/proxy.test.ts` (auth redirect logic)
- **Components** — diary entry cards, filters, nav
- **API route handlers** — diary, account, herds, pastures, profile
- **Libraries** — AI utilities, RAG search, Supabase helpers, string utilities

---

## Environment Variables

| Variable | Visibility | Purpose |
|----------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Client + Server | Supabase anon/publishable key |
| `SUPABASE_SECRET_KEY` | Server only | Supabase service-role key (admin operations) |
| `VERCEL_AI_GATEWAY_API_KEY` | Server only | Unified access to Anthropic + OpenAI |
| `VERCEL_AI_GATEWAY_BASE_URL` | Server only | Gateway base URL |
| `NEXT_PUBLIC_AI_CHAT_MODEL` | Client + Server | Override active chat model |
| `NEXT_PUBLIC_AI_EMBEDDING_MODEL` | Client + Server | Override active embedding model |

Server-only variables are never prefixed with `NEXT_PUBLIC_` and cannot leak to the browser bundle.

---

## Known Gaps / Pre-Launch Checklist

The following items are not yet implemented and should be addressed before a public production launch:

- [ ] **Global rate limiting** — the current in-memory rate limiter is per-serverless-instance. Replace with Redis (e.g. Upstash) for coordinated enforcement across all instances at scale.
- [ ] **Structured logging & error monitoring** — integrate Sentry or similar for runtime error tracking and alerting.
- [ ] **Automated CI pipeline** — add GitHub Actions workflow to run `pnpm lint` and `pnpm test` on every pull request.
- [ ] **HSTS preload submission** — HSTS header is set; submit the domain to the [HSTS preload list](https://hstspreload.org/) once DNS is confirmed stable.
- [ ] **PWA / offline support** — Web App Manifest and service worker for field use without connectivity (tracked in roadmap Phase 1.1).
- [ ] **Scheduled weekly reviews** — Vercel Cron job for automated Monday summaries (tracked in roadmap Phase 1.4).
- [ ] **Dependency audit** — run `pnpm audit` and resolve any high/critical advisories before launch.
