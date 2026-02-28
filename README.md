# Grit & Grain

> **"The AI-powered ranch assistant that transforms 'dirty-hand' voice notes into a digital legacy, turning seasonal observations into data-driven playbooks for rainfall, rotation, and hay."**

> *"Stop relying on memory, start relying on history. The AI field journal that listens to your day and synthesizes what actually worked this season."*

---

## The Problem

Ranchers and small-scale farmers carry decades of hard-won knowledge entirely in their heads. When did the back pasture last rest? What was the hay yield before that drought year? Which rotation sequence held up best through a wet spring? That institutional memory disappears when an operator retires, gets hurt, or simply forgets.

Existing farm-management apps demand structured data entry—spreadsheets, forms, GPS tracks—while a rancher is still muddy from the morning's work. Voice is the natural interface for the field, but today there is no tool that captures raw, unstructured voice notes and turns them into queryable history.

**Grit & Grain** bridges that gap: speak naturally, build a permanent, searchable record, and let AI surface the patterns that inform next season's decisions.

---

## MVP Scope

> All features require authentication (sign-up / sign-in required).

| Feature | Description |
|---|---|
| **Voice capture** | Record a voice note from any browser; transcribed automatically via voice-to-text |
| **Diary entries** | Timestamped entries stored per pasture or herd group |
| **Farm Memory chat** | RAG-powered chat that retrieves relevant historical context from the longitudinal vector database and answers questions grounded in *your* data |
| **Weekly Review** | AI-generated summary of the week's entries with cited sources and trend analysis |
| **Pasture & herd management** | Add/edit pastures and herd groups; link diary entries to them |

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
3. Watch the note transcribe, tag itself to a pasture, and appear in the Diary
4. Open **Farm Memory** → ask *"When did we last rest the North Pasture, and what was the rainfall that month?"*
5. Review the cited answer (sources shown inline)
6. Open **Weekly Review** → see the AI-generated summary with trend bullets

---

## Technical Implementation

Grit & Grain is built on a modern, serverless stack optimised for rapid iteration and Supabase's managed infrastructure.

### Core AI Pipeline

| Component | Technology |
|---|---|
| **Voice-to-text** | Browser Web Speech API (client) → Whisper (server fallback) |
| **Natural Language Processing (NLP)** | Text chunking, entity extraction (pasture names, dates, species) |
| **Embedding** | OpenAI `text-embedding-3-small` (1536-dim) or equivalent |
| **Longitudinal vector database** | pgvector extension on Supabase Postgres – stores every entry embedding for long-horizon retrieval |
| **RAG (Retrieval-Augmented Generation)** | Cosine-similarity nearest-neighbour search returns historical context; injected into GPT-4o prompt with strict citation rules |
| **Weekly Review** | Scheduled Edge Function summarises the week's unstructured notes into structured trend bullets (rainfall, rotation, hay) |

### Why Longitudinal Matters

A single-season tool is a novelty. Grit & Grain is designed so that every entry you make today enriches the historical context available next year and the year after. The vector store accumulates a multi-year record of seasonal decisions, letting the AI answer questions like *"Has the south pasture ever produced a second cut in a dry year?"* with real citations from your own history.

### Data Model Summary

See [`supabase/migrations/`](supabase/migrations/) for the full SQL migration.

Key tables: `profiles`, `pastures`, `herd_groups`, `diary_entries`, `weekly_reviews`, `entry_embeddings`.

---

## Feasibility & Pilot Plan

### Technical Feasibility

- Supabase provides auth, Postgres + pgvector, Edge Functions, and Storage in a single managed platform—no infra to manage during the hackathon.
- Voice-to-text, NLP chunking, and embedding are all available as API calls with well-documented latencies.
- The RAG pattern (embed → store → retrieve → generate) is proven and can be implemented in under 200 lines of Edge Function code.

### Pilot Plan (90 days post-hackathon)

| Phase | Milestone |
|---|---|
| **Week 1–2** | Onboard 3–5 pilot ranchers; assist with initial data entry and voice-note training |
| **Week 3–4** | Collect feedback on transcription accuracy, pasture-tagging, and chat relevance |
| **Month 2** | Refine chunking strategy and embedding model based on domain vocabulary (brand names, local place names, livestock terminology) |
| **Month 3** | First "end-of-season" Weekly Review cycle; gather qualitative feedback on decision support value |

---

## Data Privacy & Security

- **Row-Level Security (RLS)** is enabled on every table; users can only read and write their own rows (`profile_id = auth.uid()`).
- All data is encrypted at rest (Supabase default AES-256) and in transit (TLS 1.2+).
- Voice recordings are transcribed and then **discarded**; only the text transcript is stored.
- Embeddings are stored in the same Postgres instance as the source text—no third-party vector service receives your data.
- OpenAI API calls send only the relevant text chunks (never the full diary), and are governed by OpenAI's API data-usage policy (no training on API data by default).
- Users can delete all their data at any time; cascading deletes remove embeddings and derived summaries.

---

## Post-MVP Roadmap

| Feature | Notes |
|---|---|
| **Maps / GIS** | Visualise pastures on a satellite base map; draw boundary polygons |
| **Offline sync** | PWA with local-first storage (PGlite or SQLite) that syncs when connectivity is restored—critical for remote ranch use |
| **True pasture biomass measurement** | Integrate with rising-plate meter or drone NDVI imagery for objective forage estimation |
| **Import from sensors** | Ingest weather-station CSV / API feeds (rainfall, temperature, humidity) automatically into diary timeline |
| **Multi-operator permissions** | Role-based access (owner, manager, worker) so a ranch crew can share one account with appropriate write controls |
| **Export & data portability** | Download full diary as PDF or CSV; interoperability with other farm-management platforms |

---

## Getting Started (Development)

```bash
# 1. Clone the repo
git clone https://github.com/ThingEngineer/grit-and-grain.git
cd grit-and-grain

# 2. Install dependencies (once app scaffolding is added)
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Apply the database migration
supabase db push

# 5. Start the dev server
npm run dev
```

---

## Docs

- [`docs/prompts.md`](docs/prompts.md) – AI prompt templates (Farm Memory RAG, Weekly Review)
- [`docs/demo-script.md`](docs/demo-script.md) – 2–3 minute demo narrative
- [`docs/schema-draft.md`](docs/schema-draft.md) – Human-readable schema summary
- [`supabase/migrations/`](supabase/migrations/) – Timestamped SQL migration

---

*Built for the Grit & Grain Hackathon MVP · 2026*
