# Schema Draft — Grit & Grain

> This document is a human-readable summary. The authoritative schema is the SQL migration at [`supabase/migrations/`](../supabase/migrations/).

---

## Tables

### `profiles`

Extends `auth.users`. Created automatically via trigger on new user sign-up.

| Column       | Type          | Notes                       |
| ------------ | ------------- | --------------------------- |
| `id`         | `uuid`        | PK; mirrors `auth.users.id` |
| `full_name`  | `text`        |                             |
| `ranch_name` | `text`        |                             |
| `created_at` | `timestamptz` |                             |
| `updated_at` | `timestamptz` |                             |

---

### `pastures`

Physical pasture or paddock units on the ranch.

| Column       | Type          | Notes                                              |
| ------------ | ------------- | -------------------------------------------------- |
| `id`         | `uuid`        | PK                                                 |
| `profile_id` | `uuid`        | FK → `profiles.id`                                 |
| `name`       | `text`        | Unique per profile                                 |
| `acres`      | `numeric`     | Optional; used in `content_for_rag` canonical text |
| `notes`      | `text`        | Optional free-text description                     |
| `created_at` | `timestamptz` |                                                    |

---

### `herd_groups`

Named groups of animals (e.g. "Angus Cow-Calf Pairs", "Yearling Steers").

| Column       | Type          | Notes                                       |
| ------------ | ------------- | ------------------------------------------- |
| `id`         | `uuid`        | PK                                          |
| `profile_id` | `uuid`        | FK → `profiles.id`                          |
| `name`       | `text`        | Unique per profile                          |
| `species`    | `text`        | e.g. "cattle", "sheep"                      |
| `head_count` | `integer`     | Optional; current count of animals in group |
| `notes`      | `text`        |                                             |
| `created_at` | `timestamptz` |                                             |

---

### `diary_entries`

Core table. One row per voice note / manual entry.

| Column           | Type          | Notes                             |
| ---------------- | ------------- | --------------------------------- |
| `id`             | `uuid`        | PK                                |
| `profile_id`     | `uuid`        | FK → `profiles.id`                |
| `pasture_id`     | `uuid`        | FK → `pastures.id` (nullable)     |
| `herd_group_id`  | `uuid`        | FK → `herd_groups.id` (nullable)  |
| `entry_date`     | `date`        | Date of observation               |
| `raw_transcript` | `text`        | Original voice-to-text output     |
| `content`        | `text`        | Cleaned/edited text shown to user |
| `tags`           | `text[]`      | e.g. `{rainfall, rotation, hay}`  |
| `created_at`     | `timestamptz` |                                   |
| `updated_at`     | `timestamptz` | Auto-updated via trigger          |

---

### `weekly_reviews`

AI-generated summaries. Generated on-demand via `POST /api/ai/weekly-review`; in production, schedulable via Vercel Cron / Supabase pg_cron.

| Column       | Type          | Notes                                                                                 |
| ------------ | ------------- | ------------------------------------------------------------------------------------- |
| `id`         | `uuid`        | PK                                                                                    |
| `profile_id` | `uuid`        | FK → `profiles.id`                                                                    |
| `week_start` | `date`        | Start date of the review period (rolling 7-day default or custom range)               |
| `week_end`   | `date`        | End date of the review period                                                         |
| `summary_md` | `text`        | Full Markdown summary from the AI (see [prompts.md](prompts.md) for output structure) |
| `created_at` | `timestamptz` |                                                                                       |

---

### `entry_embeddings`

Vector representations of diary entry content for RAG retrieval. Embeddings are generated via Vercel AI Gateway → OpenAI `text-embedding-3-small` (1536 dimensions).

| Column            | Type           | Notes                                                                                                                                                              |
| ----------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`              | `uuid`         | PK                                                                                                                                                                 |
| `entry_id`        | `uuid`         | FK → `diary_entries.id` (unique)                                                                                                                                   |
| `profile_id`      | `uuid`         | FK → `profiles.id` (for RLS)                                                                                                                                       |
| `content_for_rag` | `text`         | Canonical text string that was embedded (see [prompts.md §3](prompts.md) for format). Stored for retrieval display and debugging.                                  |
| `embedding`       | `vector(1536)` | Dimension matches `text-embedding-3-small`; update if using a different model and regenerate all existing embeddings. `NULL` = not yet generated (async pipeline). |
| `created_at`      | `timestamptz`  |                                                                                                                                                                    |

---

## Row-Level Security Summary

All tables have RLS **enabled**. Policies follow the pattern:

- **SELECT / INSERT / UPDATE / DELETE**: `profile_id = auth.uid()` (or `id = auth.uid()` for `profiles`)

---

## Key Indexes

| Table              | Index                           | Purpose                              |
| ------------------ | ------------------------------- | ------------------------------------ |
| `diary_entries`    | `(profile_id, entry_date DESC)` | Timeline queries                     |
| `diary_entries`    | `(profile_id, pasture_id)`      | Pasture-filtered diary               |
| `weekly_reviews`   | `(profile_id, week_start DESC)` | Recent reviews                       |
| `entry_embeddings` | HNSW on `embedding`             | Approximate nearest-neighbour search |

---

## Triggers

| Trigger           | Table                             | Purpose                                  |
| ----------------- | --------------------------------- | ---------------------------------------- |
| `set_updated_at`  | `diary_entries`                   | Stamps `updated_at` on every row update  |
| `handle_new_user` | `auth.users` (via `AFTER INSERT`) | Auto-creates a `profiles` row on sign-up |

---

## Functions

### `match_diary_entries`

Postgres function for RAG vector similarity search. Called from the Farm Memory chat route handler.

```sql
create or replace function match_diary_entries (
  query_embedding vector(1536),
  match_threshold float default 0.72,
  match_count int default 8,
  p_profile_id uuid default auth.uid()
)
returns table (
  id uuid,
  entry_id uuid,
  content_for_rag text,
  similarity float
)
language sql stable
as $$
  select
    ee.id,
    ee.entry_id,
    ee.content_for_rag,
    1 - (ee.embedding <=> query_embedding) as similarity
  from entry_embeddings ee
  where ee.profile_id = p_profile_id
    and 1 - (ee.embedding <=> query_embedding) > match_threshold
  order by ee.embedding <=> query_embedding
  limit match_count;
$$;
```

**Parameters:**

| Parameter         | Default      | Notes                                                        |
| ----------------- | ------------ | ------------------------------------------------------------ |
| `query_embedding` | —            | 1536-dim vector from `text-embedding-3-small`                |
| `match_threshold` | `0.72`       | Minimum cosine similarity; discard low-relevance results     |
| `match_count`     | `8`          | Top-k results; increase to 12 for trend/historical questions |
| `p_profile_id`    | `auth.uid()` | RLS-safe: only searches the authenticated user's entries     |
