alter table public.knowledge_sources
  add column if not exists processing_attempt_count integer not null default 0,
  add column if not exists last_processing_started_at timestamptz,
  add column if not exists last_processed_at timestamptz,
  add column if not exists last_error_code text;

create table if not exists public.knowledge_source_processing_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.knowledge_sources (id) on delete cascade,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  stage text not null,
  status text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint knowledge_source_processing_runs_stage_check
    check (stage in ('queued', 'parsing', 'downloading', 'extracting', 'indexing', 'completed', 'failed')),
  constraint knowledge_source_processing_runs_status_check
    check (status in ('started', 'completed', 'failed', 'info'))
);

create index if not exists knowledge_source_processing_runs_source_id_idx
  on public.knowledge_source_processing_runs (source_id, created_at desc);

create index if not exists knowledge_source_processing_runs_owner_user_id_idx
  on public.knowledge_source_processing_runs (owner_user_id, created_at desc);

alter table public.knowledge_source_processing_runs enable row level security;

drop policy if exists "Users can read their own knowledge processing runs" on public.knowledge_source_processing_runs;
create policy "Users can read their own knowledge processing runs"
on public.knowledge_source_processing_runs
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "Users can create their own knowledge processing runs" on public.knowledge_source_processing_runs;
create policy "Users can create their own knowledge processing runs"
on public.knowledge_source_processing_runs
for insert
to authenticated
with check (auth.uid() = owner_user_id);
