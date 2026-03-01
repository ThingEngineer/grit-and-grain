# Grit & Grain — Product Roadmap

> Living document. Ordered roughly by value / feasibility. Items within a phase are loosely prioritised but can be reordered based on pilot feedback.

---

## Current State (MVP — Complete)

- Voice capture → auto-transcription → diary entry
- NLP entity extraction (pasture, herd, date auto-tagging)
- Pasture & herd group management (CRUD)
- Farm Memory RAG chat (pgvector cosine retrieval, cited answers)
- Weekly Review (on-demand AI summary with trend bullets)
- Read-aloud responses for hands-free field use
- Vercel AI Gateway (unified Anthropic + OpenAI routing)
- Supabase Auth + RLS (email/password, cascading deletes)
- **Offline-first PWA** — installable, service worker page caching, IndexedDB write queue with auto-sync on reconnect (Phase 1.1 ✅)

---

## Phase 1 — Field-Ready Foundation

_Goal: make the app genuinely usable in a no-signal, muddy-hands environment._

### 1.1 Offline-First Form Entry & Background Sync ✅ Complete

- [x] Install-as-PWA (Web App Manifest + vanilla service worker; Serwist excluded — incompatible with Next.js Turbopack)
- [x] IndexedDB write queue (`idb-keyval`) for all form submissions made offline (diary entries, pasture CRUD, herd CRUD, profile updates)
- [x] Auto-flush on reconnect via `POST /api/offline/sync` — queue drains the moment connectivity is restored; new diary entries trigger embedding automatically
- [x] Offline banner with pending-operation count; stale-content notice
- [x] Offline read access — service worker caches all 8 authenticated pages (network-first with RSC proactive caching; falls back to cached HTML)
- [x] AI features (Farm Memory, Weekly Review) gracefully disabled offline with "Reconnect for insights" inline message
- [ ] Conflict resolution UI — current strategy is last-write-wins; surface conflicts to user if simultaneous edits are detected _(future polish)_
- [ ] Per-entry "pending sync" badge on unsynced diary cards _(future polish)_

### 1.2 Photo Attachments on Diary Entries

- Attach one or more photos per entry (Supabase Storage, `diary_photos` bucket)
- Thumbnail grid in the diary entry card; lightbox viewer
- Optional: on-device compression before upload to reduce data usage on cellular
- AI alt-text generation (vision model) to make photo content searchable via RAG

### 1.3 GPS Location Tagging

- One-tap "tag my current GPS location" on the diary entry form
- Store lat/lng on `diary_entries`; show a simple pin-drop map thumbnail on the card
- Lay groundwork for Phase 2 GIS pasture polygons

### 1.4 Scheduled Weekly Reviews

- Vercel Cron (`/api/cron/weekly-review`) fires every Monday morning
- Per-user opt-in with configurable day/time in account settings
- Email delivery of the generated summary (see 1.5)

### 1.5 Transactional Email

- Integrate [Resend](https://resend.com) via the official `resend` Node.js SDK for all outbound email
- **Auth emails:** password-reset, email-verification, and invite-to-ranch sent through Supabase Auth custom SMTP → Resend
- **Weekly Review digest:** HTML email edition of the AI summary delivered on each scheduled run; unsubscribe link per-user
- **Alert emails:** opt-in digest of proactive AI alerts (see Phase 4.1) — batched daily or immediately depending on severity
- **Billing events:** trial expiry reminders, payment failure notices, and plan-change confirmations (hooks into Phase 6)
- React Email templates stored in `emails/` for consistent branding; preview server via `email dev` script
- Per-user notification preferences table (`notification_preferences`) with channel toggles (email / push) and quiet-hours setting
- Unsubscribe handled via signed one-click URL; preference centre at `/account/notifications`

### 1.6 Web Push Notifications

- VAPID key pair generated at deploy time; public key stored in `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Service worker registers `pushManager.subscribe()` on first authenticated visit; subscription stored in `push_subscriptions` table (user, endpoint, keys)
- `POST /api/push/subscribe` and `DELETE /api/push/subscribe` route handlers manage subscription lifecycle
- Server-side delivery via the `web-push` npm package called from route handlers or Vercel Cron jobs
- **Notification types:** weekly review ready, proactive AI alert (Phase 4.1), sync conflict detected, low hay inventory warning
- Permission prompt deferred until user takes a meaningful action (not on page load) to protect opt-in rate
- Notification click opens the relevant app page from the service worker `notificationclick` handler
- Per-user push preferences respected from the same `notification_preferences` table as email (1.5)

---

## Phase 2 — Livestock & Land Intelligence

_Goal: capture the structured data ranchers actually track, turning Grit & Grain from a journal into an operations hub._

### 2.1 AUM & Grazing Pressure Tracker

- Animal Unit Months (AUM) calculation per pasture per period using `head_count` + species weighting
- Grazing-day log automatically updated from diary entries mentioning "moved to" / "rotated off"
- Per-pasture rest-day counter with configurable minimum rest threshold
- Alert when a pasture approaches its minimum rest period

### 2.2 Hay & Forage Inventory

- `hay_inventory` table: cutting date, pasture source, bale count, estimated weight, quality notes
- Running inventory updated when entries mention "fed X bales" (NLP extraction)
- Low-inventory alert at a configurable threshold
- Per-cutting cost tracking → cost-per-head-per-day metric

### 2.3 Water Source Management

- `water_sources` table linked to pastures: tanks, ponds, wells
- Log water levels, pump checks, and repairs via diary entries or dedicated quick-log form
- Flag entries mentioning water issues for automatic water-source tag

### 2.4 Rotation Planner

- Visual rotation schedule: calendar view showing which herd is in which pasture
- Drag-and-drop scheduling (future moves); past moves populated from diary history
- AI-suggested rotation sequence based on rest-day history and AUM load
- "When should I move the cows?" quick-answer card on the dashboard

### 2.5 Pasture Map / GIS

- Satellite base map (Mapbox or MapLibre + PMTiles)
- Draw and save pasture boundary polygons; stored as GeoJSON in `pastures.boundary`
- Colour-coded map overlay: green (resting) → yellow (light graze) → red (heavy use)
- Tap a pasture on the map to see its recent diary entries inline

### 2.6 Soil & Rainfall Records

- `soil_samples` table: date, pasture, pH, P, K, OM%, lab notes
- Rainfall log auto-extracted from diary entries; manual override form
- Cumulative rainfall chart per pasture per season
- Year-over-year rainfall comparison chart

---

## Phase 3 — Animal Health & Compliance

_Goal: replace the paper binder in the truck with a fully digital health record — critical for food-safety compliance and resale documentation._

### 3.1 Individual Animal Registry

- `animals` table: tag number, breed, sex, DOB, purchase date/source, sire/dam (optional)
- Bulk import from CSV (ear-tag list export from most chute systems)
- Link diary entries to individual animals or herd groups

### 3.2 Health & Treatment Log

- `treatments` table: animal(s), drug name, dose, route, withdrawal days, expiry date
- Automatic withdrawal-period countdown with alert on expiry
- Vet visit log with invoice attachment (Supabase Storage)
- Mass-treatment recording (e.g., "vaccinated entire Angus group on 15 Mar")

### 3.3 Breeding & Pregnancy Records

- `breeding_events` table: breed date, sire, dam, expected calving date
- Calving calendar view; alert 2 weeks before expected calving
- Weaning date tracker; weaning weight entry

### 3.4 Weight & Performance Tracking

- `weight_records` table: animal/group, date, weight, scale type
- Average Daily Gain (ADG) calculated automatically between successive weights
- Group performance chart: weight over time per herd group

### 3.5 NLIS / Compliance Export

- Generate NLIS-compatible movement CSV for Australian users (or USDA/EID format for US)
- Chemical usage report (treatments within a date range) for auditors
- PDF health certificate template pre-populated from animal records

---

## Phase 4 — Smart Alerts & Automation

_Goal: let the app surface proactive intelligence rather than requiring the rancher to ask._

### 4.1 Proactive AI Alerts

- "North Pasture hasn't rested in 45 days — last entry suggested feed pressure was building"
- "Hay inventory is projected to run out in ~3 weeks at current feeding rate"
- "Bull turnout is due in 2 weeks based on last year's breeding log"
- Delivered as dashboard notification cards; push notification and email delivery powered by the infrastructure from phases 1.5 and 1.6
- Alert severity levels: `info`, `warning`, `critical` — only `warning`/`critical` trigger push; all levels visible in-app
- Alert history stored in `alert_events` table; dismissed alerts not re-surfaced for 7 days

### 4.2 Weather Integration

- Pull NOAA / Open-Meteo daily forecast + historical rainfall for the ranch's GPS coordinates
- Auto-correlate weather events with diary entries ("that entry on 12 Feb coincided with 24mm of rain")
- Drought index overlay on pasture map (NDVI or SPEI)

### 4.3 Seasonal Comparison AI Feature

- New Farm Memory query mode: "How does this year compare to last year at the same time?"
- Retrieves entries from the same calendar window across all available years
- AI synthesises side-by-side narrative with trend deltas

### 4.4 Automated NLP Improvements

- Domain vocabulary fine-tuning for local place names, breed names, and product names
- Confidence score on auto-extracted tags; low-confidence tags flagged for user review
- "Did you mean…?" disambiguation when a new pasture name is close to an existing one

---

## Phase 5 — Multi-User & Enterprise

_Goal: support ranch crews, family operations, and consulting agronomists._

### 5.1 Role-Based Access Control

- Roles: `owner`, `manager`, `worker`, `agronomist` (read-only)
- `owner` invites by email; invite link expires in 48 hours
- `worker` can create diary entries and view; cannot edit pastures, herds, or billing
- `agronomist` read-only access scoped to a selectable date range

### 5.2 Activity Feed & Collaboration

- Ranch-wide activity feed: who recorded what, when
- @mention a team member in a diary entry to flag it for their attention
- Comment thread on individual diary entries

### 5.3 Multi-Ranch / Enterprise Account

- One billing account can manage multiple ranch profiles
- Consolidated reporting across properties
- White-label option for agricultural consultants managing multiple clients

---

## Phase 6 — Monetization & Billing

_Goal: introduce sustainable revenue through tiered subscription plans without gate-keeping core functionality for small operators._

### 6.1 Stripe Subscription Plans

- Integrate [Stripe Billing](https://stripe.com/billing) via the official `stripe` Node.js SDK
- Three tiers: **Free** (solo rancher, limited AI calls/month), **Pro** (unlimited AI, all features), **Enterprise** (multi-ranch, RBAC, white-label)
- Subscription state stored in `profiles.subscription_tier` and `profiles.stripe_customer_id`
- Webhooks (`/api/webhooks/stripe`) handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`
- RLS policies gate premium features on `subscription_tier`; graceful degradation in the UI for free-tier users

### 6.2 Checkout & Customer Portal

- Stripe Checkout (hosted page) for new subscriptions — no PCI scope on our servers
- Stripe Customer Portal link in Account Settings for self-serve plan changes, payment method updates, and cancellations
- Trial period (14 days Pro) on first signup; trial expiry reminder email via Resend

### 6.3 Usage-Based AI Metering

- Track AI token consumption per user per billing cycle in `ai_usage_log` table
- Free tier: 50 Farm Memory queries + 4 Weekly Reviews per month; overage upsell prompt
- Pro tier: unlimited; Enterprise tier: pooled across all ranch profiles under one account
- Usage dashboard in Account Settings showing current-cycle consumption vs. limits

### 6.4 Billing UI & Upgrade Flows

- Pricing page (`/pricing`) with feature comparison table
- Inline upgrade prompts when a free-tier user hits a gated feature ("Unlock unlimited AI with Pro →")
- Current plan badge and next billing date displayed in the profile menu
- Cancellation flow with retention offer (1-month discount)

### 6.5 Revenue & Churn Analytics

- Stripe-native dashboards for MRR, churn rate, and trial conversion
- Webhook events forwarded to an analytics sink (Segment / PostHog) for funnel analysis
- Monthly revenue snapshot stored in a `billing_snapshots` table for internal reporting

---

## Phase 7 — Data Portability & Integrations

_Goal: Grit & Grain should be a hub, not a silo._

### 7.1 Export

- Full diary export as PDF (formatted) or CSV
- Annual report PDF: rainfall, rotation summary, health events, weight performance
- Export embeddings as JSON for data portability / model migration

### 7.2 Sensor & Device Integrations

- Weather-station CSV / API import (Davis Instruments, Onset HOBO, etc.)
- Electronic ID (EID) stick-reader Bluetooth import for rapid animal lookup
- Rising-plate meter integration for objective pasture biomass measurement
- Drone NDVI imagery upload → auto-mapped to pasture polygons

### 7.3 Third-Party Platform Interoperability

- Import from AgriWebb, MLA Feedback, or HerdDogg CSV exports
- Zapier / Make webhook trigger on new diary entry (for custom automations)
- Open API (REST + OpenAPI spec) for custom integrations

---

## Ongoing / Cross-Cutting Concerns

| Area                     | Work Items                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| **Performance**          | Paginate diary list at 50 entries; lazy-load embeddings; edge caching for Weekly Review  |
| **Accessibility**        | WCAG 2.1 AA audit; keyboard-navigable voice recorder; sufficient colour contrast         |
| **i18n**                 | Spanish (US/MX market), Portuguese (Brazil), French (Canada)                             |
| **Privacy & Compliance** | GDPR data-export endpoint; CCPA opt-out; SOC 2 Type I (if enterprise tier pursued)       |
| **Testing**              | E2E Playwright suite for critical paths (login → record → chat); load test RAG retrieval |
| **Observability**        | Vercel AI Gateway usage dashboards; Sentry error tracking; Datadog RUM for field UX      |

---

## Backlog / Speculative

> Not prioritised — capturing for future discussion.

- **Livestock market price feed** — daily feeder/fat cattle prices from CME or local sale yards, correlated with herd weight records to surface optimal selling windows
- **Carbon credit tracking** — sequestration estimates from rotation and soil data for voluntary carbon markets
- **Drone flight log** — record drone inspection flights with video attachments; auto-extract pasture condition observations using vision AI
- **Voice-to-text model fine-tuning** — custom Whisper fine-tune on ag vocabulary ("orchard grass", "Angus", "brix", "Hereford", pasture names) to reduce WER in the field
- **SMS/WhatsApp diary entry** — text a note to a Twilio number → auto-transcribed and stored as a diary entry (zero-app friction for non-smartphone users)
- **Shared knowledge base** — opt-in anonymised benchmarking: "How does my rainfall recovery compare to ranches with similar soil type in this region?"
- **AI-generated management plans** — end-of-season synthesis of all entries → 12-month forward management plan document

---

_Last updated: March 2026_
