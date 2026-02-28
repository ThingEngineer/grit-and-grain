# Schema Draft — Grit & Grain

> This document is a human-readable summary. The authoritative schema is the SQL migration at [`supabase/migrations/`](../supabase/migrations/).

---

## Tables

### `profiles`
Extends `auth.users`. Created automatically via trigger on new user sign-up.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK; mirrors `auth.users.id` |
| `full_name` | `text` | |
| `ranch_name` | `text` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

### `pastures`
Physical pasture or paddock units on the ranch.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `profile_id` | `uuid` | FK → `profiles.id` |
| `name` | `text` | Unique per profile |
| `notes` | `text` | Optional free-text description |
| `created_at` | `timestamptz` | |

---

### `herd_groups`
Named groups of animals (e.g. "Angus Cow-Calf Pairs", "Yearling Steers").

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `profile_id` | `uuid` | FK → `profiles.id` |
| `name` | `text` | Unique per profile |
| `species` | `text` | e.g. "cattle", "sheep" |
| `notes` | `text` | |
| `created_at` | `timestamptz` | |

---

### `diary_entries`
Core table. One row per voice note / manual entry.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `profile_id` | `uuid` | FK → `profiles.id` |
| `pasture_id` | `uuid` | FK → `pastures.id` (nullable) |
| `herd_group_id` | `uuid` | FK → `herd_groups.id` (nullable) |
| `entry_date` | `date` | Date of observation |
| `raw_transcript` | `text` | Original voice-to-text output |
| `content` | `text` | Cleaned/edited text shown to user |
| `tags` | `text[]` | e.g. `{rainfall, rotation, hay}` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | Auto-updated via trigger |

---

### `weekly_reviews`
AI-generated weekly summaries.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `profile_id` | `uuid` | FK → `profiles.id` |
| `week_start` | `date` | Monday of the review week; unique per profile |
| `summary_md` | `text` | Full Markdown summary from the AI |
| `created_at` | `timestamptz` | |

---

### `entry_embeddings`
Vector representations of diary entry content for RAG retrieval.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `entry_id` | `uuid` | FK → `diary_entries.id` (unique) |
| `profile_id` | `uuid` | FK → `profiles.id` (for RLS) |
| `embedding` | `vector(1536)` | Dimension must match embedding model; update if using a different model and regenerate all existing embeddings. `NULL` = not yet generated (async pipeline). |
| `created_at` | `timestamptz` | |

---

## Row-Level Security Summary

All tables have RLS **enabled**. Policies follow the pattern:

- **SELECT / INSERT / UPDATE / DELETE**: `profile_id = auth.uid()` (or `id = auth.uid()` for `profiles`)

---

## Key Indexes

| Table | Index | Purpose |
|---|---|---|
| `diary_entries` | `(profile_id, entry_date DESC)` | Timeline queries |
| `diary_entries` | `(profile_id, pasture_id)` | Pasture-filtered diary |
| `weekly_reviews` | `(profile_id, week_start DESC)` | Recent reviews |
| `entry_embeddings` | HNSW on `embedding` | Approximate nearest-neighbour search |

---

## Triggers

| Trigger | Table | Purpose |
|---|---|---|
| `set_updated_at` | `diary_entries` | Stamps `updated_at` on every row update |
| `handle_new_user` | `auth.users` (via `AFTER INSERT`) | Auto-creates a `profiles` row on sign-up |
