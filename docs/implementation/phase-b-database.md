# Phase B — Database Schema, RLS, pgvector & Functions

> **Estimated time:** 1–2 hours
> **Prerequisite:** Milestone A complete (auth working), Supabase CLI running (`supabase start`)
> **Reference:** [schema-draft.md](../schema-draft.md)

---

## Overview

Create the full Supabase migration: enable pgvector, create all 6 tables, add RLS policies, indexes, triggers, and the `match_diary_entries` function.

---

## Tasks

### B.1 — Create the migration file

```bash
supabase migration new initial_schema
```

This creates `supabase/migrations/<timestamp>_initial_schema.sql`.

---

### B.2 — Enable pgvector extension

Add at the top of the migration:

```sql
-- Enable pgvector for embedding storage and similarity search
create extension if not exists vector with schema extensions;
```

---

### B.3 — Create `profiles` table + trigger

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  ranch_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### B.4 — Create `pastures` table

```sql
create table public.pastures (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  acres numeric,
  notes text,
  created_at timestamptz default now(),
  unique (profile_id, name)
);

alter table public.pastures enable row level security;

create policy "Users can CRUD own pastures"
  on public.pastures for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
```

---

### B.5 — Create `herd_groups` table

```sql
create table public.herd_groups (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  species text,
  head_count integer,
  notes text,
  created_at timestamptz default now(),
  unique (profile_id, name)
);

alter table public.herd_groups enable row level security;

create policy "Users can CRUD own herd groups"
  on public.herd_groups for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
```

---

### B.6 — Create `diary_entries` table + trigger

```sql
create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  pasture_id uuid references public.pastures(id) on delete set null,
  herd_group_id uuid references public.herd_groups(id) on delete set null,
  entry_date date not null default current_date,
  raw_transcript text,
  content text not null,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.diary_entries enable row level security;

create policy "Users can CRUD own diary entries"
  on public.diary_entries for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_diary_entry_updated_at
  before update on public.diary_entries
  for each row execute procedure public.set_updated_at();
```

---

### B.7 — Create `weekly_reviews` table

```sql
create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  summary_md text not null,
  created_at timestamptz default now()
);

alter table public.weekly_reviews enable row level security;

create policy "Users can CRUD own weekly reviews"
  on public.weekly_reviews for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
```

---

### B.8 — Create `entry_embeddings` table

```sql
create table public.entry_embeddings (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.diary_entries(id) on delete cascade unique,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  content_for_rag text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

alter table public.entry_embeddings enable row level security;

create policy "Users can CRUD own embeddings"
  on public.entry_embeddings for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
```

---

### B.9 — Create indexes

```sql
-- Timeline queries
create index idx_diary_entries_profile_date
  on public.diary_entries (profile_id, entry_date desc);

-- Pasture-filtered diary
create index idx_diary_entries_profile_pasture
  on public.diary_entries (profile_id, pasture_id);

-- Recent reviews
create index idx_weekly_reviews_profile_week
  on public.weekly_reviews (profile_id, week_start desc);

-- HNSW index for approximate nearest-neighbour vector search
create index idx_entry_embeddings_hnsw
  on public.entry_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);
```

---

### B.10 — Create `match_diary_entries` function

> **Threshold note:** `openai/text-embedding-3-small` produces cosine similarities of
> **0.30–0.48** for typical short-question → diary-narrative matches. Use `0.3` as the
> default — a higher value like `0.5` or `0.72` will silently return no results for most
> real-world questions.
>
> **`set search_path` is required:** Because pgvector is installed in the `extensions`
> schema, you must set `search_path` so the function can resolve `extensions.vector`.

```sql
create or replace function public.match_diary_entries (
  query_embedding extensions.vector(1536),
  match_threshold float default 0.3,
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
set search_path = 'public', 'extensions'
as $$
  select
    ee.id,
    ee.entry_id,
    ee.content_for_rag,
    (1 - (ee.embedding <=> query_embedding))::float as similarity
  from public.entry_embeddings ee
  where ee.profile_id = p_profile_id
    and ee.embedding is not null
    and 1 - (ee.embedding <=> query_embedding) > match_threshold
  order by ee.embedding <=> query_embedding
  limit match_count;
$$;
```

---

### B.11 — Apply the migration

```bash
supabase db push
```

Verify tables exist:

```bash
supabase db reset  # if needed for a clean slate
```

Or query directly:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

Expected: `diary_entries`, `entry_embeddings`, `herd_groups`, `pastures`, `profiles`, `weekly_reviews`

---

### B.12 — Verify pgvector

```sql
SELECT extname FROM pg_extension WHERE extname = 'vector';
```

Expected: one row with `vector`.

---

## Checklist

- [ ] Migration file created
- [ ] pgvector extension enabled
- [ ] `profiles` table + `handle_new_user` trigger
- [ ] `pastures` table with `acres` column
- [ ] `herd_groups` table with `head_count` column
- [ ] `diary_entries` table + `set_updated_at` trigger
- [ ] `weekly_reviews` table with `week_start` + `week_end`
- [ ] `entry_embeddings` table with `content_for_rag` + `vector(1536)`
- [ ] All tables have RLS enabled + policies
- [ ] Indexes created (timeline, pasture-filter, reviews, HNSW)
- [ ] `match_diary_entries` function created
- [ ] Migration applied and verified
