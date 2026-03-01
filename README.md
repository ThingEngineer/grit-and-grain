# Grit & Grain

> **"The AI-powered ranch assistant that transforms 'dirty-hand' voice notes into a digital legacy, turning seasonal observations into data-driven playbooks for rainfall, rotation, and hay."**

> _"Stop relying on memory, start relying on history. The AI field journal that listens to your day and synthesizes what actually worked this season."_

---

## The Problem

Ranchers and small-scale farmers carry decades of hard-won knowledge entirely in their heads. When did the back pasture last rest? What was the hay yield before that drought year? Which rotation sequence held up best through a wet spring? That institutional memory disappears when an operator retires, gets hurt, or simply forgets.

The scale of this problem is significant: according to the USDA's 2022 Census of Agriculture, the average U.S. farm operator is **58.1 years old**, and more than **370 million acres** are projected to change hands over the next decade. Yet fewer than one-third of farm operations have a documented succession or knowledge-transfer plan. Every retirement is a potential erasure of irreplaceable operational history.

Existing farm-management apps demand structured data entry—spreadsheets, forms, GPS tracks—while a rancher is still muddy from the morning's work. Voice is the natural interface for the field, but today there is no tool that captures raw, unstructured voice notes and turns them into queryable history.

**Grit & Grain** bridges that gap: speak naturally, build a permanent, searchable record, and let AI surface the patterns that inform next season's decisions.

### What Makes This Different

General-purpose voice assistants and note apps don't understand ranch operations—they can't cross-reference a pasture rotation from three years ago against today's rainfall reading. Existing ag-tech platforms require disciplined structured data entry, which fails at the point of use: in the field, with muddy hands, during a busy work day. Grit & Grain is the only tool that combines **voice-first field capture**, **NLP entity extraction**, and a **longitudinal vector database** designed specifically for the multi-year decision cadence of pasture-based agriculture. The result is an AI that can answer questions like _"Has the south pasture ever produced a second hay cut in a dry year?"_ with citations from your own history—not generic advice.

---

## MVP Scope

> All features require authentication (sign-up / sign-in required).

| Feature                       | Description                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Voice capture**             | Record a voice note from any browser; transcribed automatically via voice-to-text                                                                                                                            |
| **Diary entries**             | Timestamped entries stored per pasture or herd group                                                                                                                                                         |
| **Farm Memory chat**          | RAG-powered chat that retrieves relevant historical context from the longitudinal vector database and answers questions grounded in _your_ data. Responses can be read aloud for hands-free use in the field |
| **Weekly Review**             | AI-generated summary of the week's entries with cited sources and trend analysis. Read responses aloud for field-friendly access                                                                             |
| **Pasture & herd management** | Add/edit pastures and herd groups; link diary entries to them                                                                                                                                                |
| **Offline-first PWA**         | Installable as a Progressive Web App. All pages cached by a service worker for offline browsing. Write operations (diary entries, pasture/herd changes) queued in IndexedDB and auto-synced on reconnect     |

> **Hands-free in the field:** Voice capture + read-aloud responses create a fully natural, no-hands workflow. Speak your observations, ask questions, and listen to answers while managing livestock or moving through pastures.

---

## Try the Live Demo

**Live URL:** https://gritandgrain.farm

**Demo Account Credentials:**

- **Email:** `demo@gritandgrain.farm`
- **Password:** `DemoPassword123!`

After logging in, you can populate your account with sample data by clicking the **"Seed Demo Data"** button on the Dashboard page. This will add twelve months of synthetic diary entries for a fictional ranch ("Dry Creek Ranch") covering rainfall observations, pasture rotation, hay cutting notes, and herd health logs.

---

## Demo Flow (Seed Data)

The demo environment is pre-loaded with twelve months of synthetic diary entries for a fictional ranch ("Dry Creek Ranch") covering:

- Rainfall observations across three pastures
- Rotation timing and grazing-day counts
- Hay cutting dates, yield estimates, and quality notes
- Herd health observations and vet visit logs

**Suggested walkthrough (≈ 2 minutes):**

1. Sign in → land on the Dashboard
2. Tap **Record** → speak a 15-second voice note about today's pasture condition
3. Watch the note transcribe, auto-tag itself to a pasture and herd group (NLP entity extraction), and appear in the Diary
4. Open **Farm Memory** → ask _"When did we last rest the North Pasture, and what was the rainfall that month?"_ — this is the question that previously required digging through years of paper notebooks or relying on aging memory
5. Review the cited answer (sources shown inline, grounded only in your actual diary history)
6. Open **Weekly Review** → see the AI-generated summary with trend bullets and cited entry dates

---

## Technical Implementation

Grit & Grain leverages Natural Language Processing (NLP) to ingest unstructured voice-to-text notes, utilising RAG (Retrieval-Augmented Generation) over a longitudinal vector database to provide producers with historical context on seasonal decisions.

Built on a modern, serverless stack optimised for rapid iteration: **Next.js on Vercel** + **Supabase** (auth, Postgres + pgvector, Edge Functions).

### Core AI Pipeline

| Component                                | Technology                                                                                                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Voice-to-text**                        | Browser Web Speech API (client) → Whisper (server fallback)                                                                                                                                                                                                               |
| **NLP Entity Extraction**                | Anthropic Claude (via Vercel AI Gateway, `POST /api/ai/extract`) — auto-tags each entry with pasture name, herd group, observation categories (rainfall, rotation, hay, herd health, etc.), and resolved dates before the entry is saved                                  |
| **Embedding**                            | OpenAI `text-embedding-3-small` (1536-dim, via Vercel AI Gateway, `POST /api/ai/embed`) — encodes the canonical `content_for_rag` text string for every saved entry                                                                                                       |
| **AI Gateway**                           | [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) — unified routing layer for all model calls with provider failover, usage observability, and rate-limit management                                                                                                |
| **Text generation**                      | Anthropic Claude (via Vercel AI Gateway, e.g. `anthropic/claude-sonnet-4.6`) — powers Farm Memory chat and Weekly Review with strict citation discipline                                                                                                                  |
| **Longitudinal vector database**         | pgvector extension on Supabase Postgres — stores every entry embedding for long-horizon retrieval                                                                                                                                                                         |
| **RAG (Retrieval-Augmented Generation)** | Cosine-similarity nearest-neighbour search (`match_diary_entries` Postgres function) returns historical context; injected into Anthropic Claude prompt with strict citation rules. Model is instructed to only use retrieved entries — sources are shown inline in the UI |
| **Weekly Review**                        | On-demand generation via Next.js Route Handler (`POST /api/ai/weekly-review`). Rolling last 7 days by default; supports custom date range. In production, scheduled via Vercel Cron / Supabase pg_cron on a user-chosen cadence                                           |

### Vercel AI SDK Integration

All AI features are implemented using the [Vercel AI SDK](https://sdk.vercel.ai/) (`ai` package) routed through **Vercel AI Gateway**:

- **Unified authentication** — Single `VERCEL_AI_GATEWAY_API_KEY` grants access to all models (Anthropic + OpenAI)
- **Model routing** — Reference models by their gateway IDs (e.g., `anthropic/claude-opus-4.5`, `openai/text-embedding-3-small`)
- **Features** — Automatic retries, usage observability, rate-limit management, and a single billing surface

### Offline Architecture

The app is fully functional without a network connection:

| Layer                | Technology                                                              | Role                                                                                                |
| -------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Service worker**   | Vanilla JS (`public/sw.js`)                                             | Network-first page caching with RSC-aware proactive HTML caching; cache-first for static assets     |
| **Write queue**      | [`idb-keyval`](https://github.com/jakearchibald/idb-keyval) (IndexedDB) | Serialises all CRUD operations while offline; auto-flushes to `POST /api/offline/sync` on reconnect |
| **Online detection** | `useSyncExternalStore` + `navigator.onLine` + `/api/health` ping        | SSR-safe; supplements the browser flag with a real connectivity check                               |
| **Offline UI**       | `OfflineProvider` context + animated `OfflineBanner`                    | Amber banner with pending-op count and stale-content notice; blue → green transition on sync        |
| **AI guards**        | Inline disabled state                                                   | Farm Memory chat input and Weekly Review button replaced with "Reconnect for insights" when offline |

Supported offline operation types: `create_entry`, `create_pasture`, `delete_pasture`, `create_herd`, `delete_herd`, `update_profile`. Newly queued diary entries trigger embedding generation automatically after sync.

### Why Longitudinal Matters

A single-season tool is a novelty. Grit & Grain is designed so that every entry you make today enriches the historical context available next year and the year after. The vector store accumulates a multi-year record of seasonal decisions, letting the AI answer questions like _"Has the south pasture ever produced a second cut in a dry year?"_ with real citations from your own history.

### Data Model Summary

See [`supabase/migrations/`](supabase/migrations/) for the full SQL migration and [`docs/schema-draft.md`](docs/schema-draft.md) for a human-readable summary.

Key tables: `profiles`, `pastures`, `herd_groups`, `diary_entries`, `weekly_reviews`, `entry_embeddings`.

---

## Feasibility & Pilot Plan

### Technical Feasibility

- Supabase provides auth, Postgres + pgvector, Edge Functions, and Storage in a single managed platform — no infra to manage during the hackathon.
- Vercel AI Gateway unifies model access (Anthropic + OpenAI) with a single integration point, automatic retries, and built-in usage tracking.
- Voice-to-text, NLP entity extraction, and embedding are all available as API calls with well-documented latencies.
- The RAG pattern (embed → store → retrieve → generate) is proven and can be implemented in under 200 lines of route handler code.
- MVP: manual "Generate Weekly Review" for transparency and demo reliability. Production: scheduled reviews on a user-chosen cadence (weekly/biweekly) + optional SMS/email delivery via Vercel Cron.

### Pilot Plan (90 days post-hackathon)

| Phase        | Milestone                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Week 1–2** | Onboard 3–5 pilot ranchers; assist with initial data entry and voice-note training                                              |
| **Week 3–4** | Collect feedback on transcription accuracy, pasture-tagging, and chat relevance                                                 |
| **Month 2**  | Refine chunking strategy and embedding model based on domain vocabulary (brand names, local place names, livestock terminology) |
| **Month 3**  | First "end-of-season" Weekly Review cycle; gather qualitative feedback on decision support value                                |

---

## Data Privacy & Security

- **Row-Level Security (RLS)** is enabled on every table; users can only read and write their own rows (`profile_id = auth.uid()`).
- All data is encrypted at rest (Supabase default AES-256) and in transit (TLS 1.2+).
- Voice recordings are transcribed and then **discarded**; only the text transcript is stored.
- Embeddings are stored in the same Postgres instance as the source text — no third-party vector service receives your data.
- All AI model calls (Anthropic generation + OpenAI embeddings) are routed through **Vercel AI Gateway**. Only the relevant text chunks are sent (never the full diary). Vercel does not use API data for model training. OpenAI embedding calls are governed by OpenAI's API data-usage policy (no training on API data by default).
- Users can delete all their data at any time; cascading deletes remove embeddings and derived summaries.

---

## Post-MVP Roadmap

| Feature                              | Notes                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Maps / GIS**                       | Visualise pastures on a satellite base map; draw boundary polygons                                               |
| **Offline sync** ✅                  | Shipped — installable PWA, service worker page caching, IndexedDB write queue with auto-sync on reconnect        |
| **True pasture biomass measurement** | Integrate with rising-plate meter or drone NDVI imagery for objective forage estimation                          |
| **Import from sensors**              | Ingest weather-station CSV / API feeds (rainfall, temperature, humidity) automatically into diary timeline       |
| **Multi-operator permissions**       | Role-based access (owner, manager, worker) so a ranch crew can share one account with appropriate write controls |
| **Export & data portability**        | Download full diary as PDF or CSV; interoperability with other farm-management platforms                         |

---

## Getting Started (Development)

```bash
# 1. Clone the repo
git clone https://github.com/ThingEngineer/grit-and-grain.git
cd grit-and-grain

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Required variables:
#   NEXT_PUBLIC_SUPABASE_URL                  – Supabase project URL
#   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY – Supabase anon/public key
#   SUPABASE_SECRET_KEY                       – Supabase service-role key (server-side only)
#   VERCEL_AI_GATEWAY_API_KEY                 – Vercel AI Gateway API key (unified access)
#   VERCEL_AI_GATEWAY_BASE_URL                – https://ai-gateway.vercel.sh
#   NEXT_PUBLIC_AI_CHAT_MODEL                 – Chat model (e.g. anthropic/claude-sonnet-4.6)
#   NEXT_PUBLIC_AI_EMBEDDING_MODEL            – Embedding model (e.g. openai/text-embedding-3-small)

# 4. Start Supabase locally (requires Supabase CLI + Docker)
supabase start

# 5. Apply the database migration
supabase db push

# 6. Start the dev server
pnpm dev
```

---

## Docs

- [`docs/prompts.md`](docs/prompts.md) – AI prompt templates (Farm Memory RAG, Weekly Review)
- [`docs/demo-script.md`](docs/demo-script.md) – 2–3 minute demo narrative
- [`docs/schema-draft.md`](docs/schema-draft.md) – Human-readable schema summary
- [`supabase/migrations/`](supabase/migrations/) – Timestamped SQL migration

---

_Built for Vibeathon · 2026_
