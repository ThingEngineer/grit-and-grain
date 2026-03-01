-- ============================================================
-- Phase B — Database Schema, RLS, pgvector & Functions
-- ============================================================

-- B.2 — Enable pgvector extension
create extension if not exists vector with schema extensions;

-- ============================================================
-- B.3 — Profiles table + auto-create trigger
-- ============================================================
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

-- ============================================================
-- B.4 — Pastures table
-- ============================================================
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

-- ============================================================
-- B.5 — Herd Groups table
-- ============================================================
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

-- ============================================================
-- B.6 — Diary Entries table + updated_at trigger
-- ============================================================
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

-- ============================================================
-- B.7 — Weekly Reviews table
-- ============================================================
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

-- ============================================================
-- B.8 — Entry Embeddings table
-- ============================================================
create table public.entry_embeddings (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.diary_entries(id) on delete cascade unique,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  content_for_rag text not null,
  embedding extensions.vector(1536),
  created_at timestamptz default now()
);

alter table public.entry_embeddings enable row level security;

create policy "Users can CRUD own embeddings"
  on public.entry_embeddings for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ============================================================
-- B.9 — Indexes
-- ============================================================

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
  using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ============================================================
-- B.10 — match_diary_entries function (vector similarity search)
-- ============================================================
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
