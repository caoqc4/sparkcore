alter table public.memory_items
  add column if not exists category text,
  add column if not exists key text,
  add column if not exists value jsonb,
  add column if not exists scope text default 'user_global',
  add column if not exists subject_user_id uuid references public.users (id) on delete cascade,
  add column if not exists target_agent_id uuid references public.agents (id) on delete set null,
  add column if not exists target_thread_id uuid references public.threads (id) on delete cascade,
  add column if not exists stability text,
  add column if not exists status text default 'active',
  add column if not exists source_refs jsonb not null default '[]'::jsonb,
  add column if not exists last_used_at timestamptz,
  add column if not exists last_confirmed_at timestamptz;

alter table public.memory_items
  drop constraint if exists memory_items_category_check;

alter table public.memory_items
  add constraint memory_items_category_check
  check (category in ('profile', 'preference', 'relationship', 'goal') or category is null);

alter table public.memory_items
  drop constraint if exists memory_items_scope_check;

alter table public.memory_items
  add constraint memory_items_scope_check
  check (scope in ('user_global', 'user_agent', 'thread_local') or scope is null);

alter table public.memory_items
  drop constraint if exists memory_items_stability_check;

alter table public.memory_items
  add constraint memory_items_stability_check
  check (stability in ('low', 'medium', 'high') or stability is null);

alter table public.memory_items
  drop constraint if exists memory_items_status_check;

alter table public.memory_items
  add constraint memory_items_status_check
  check (status in ('active', 'hidden', 'incorrect', 'superseded') or status is null);

create index if not exists memory_items_category_idx
  on public.memory_items (category);

create index if not exists memory_items_scope_idx
  on public.memory_items (scope);

create index if not exists memory_items_status_idx
  on public.memory_items (status);

create index if not exists memory_items_target_agent_id_idx
  on public.memory_items (target_agent_id);

create index if not exists memory_items_subject_user_id_idx
  on public.memory_items (subject_user_id);
