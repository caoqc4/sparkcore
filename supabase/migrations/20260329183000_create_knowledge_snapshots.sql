create table if not exists public.knowledge_snapshots (
  id uuid primary key default gen_random_uuid(),
  knowledge_source_id uuid not null references public.knowledge_sources (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  target_role_id uuid references public.agents (id) on delete cascade,
  snapshot_index integer not null default 0,
  title text not null,
  summary text not null,
  body_text text not null,
  source_kind text not null,
  captured_at timestamptz not null default timezone('utc', now()),
  scope_user_id uuid references public.users (id) on delete set null,
  scope_agent_id uuid references public.agents (id) on delete set null,
  scope_thread_id uuid references public.threads (id) on delete set null,
  scope_project_id uuid,
  scope_world_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint knowledge_snapshots_source_kind_check
    check (source_kind in ('external_reference', 'project_document', 'workspace_note')),
  constraint knowledge_snapshots_snapshot_index_check
    check (snapshot_index >= 0),
  constraint knowledge_snapshots_source_snapshot_unique
    unique (knowledge_source_id, snapshot_index)
);

create index if not exists knowledge_snapshots_source_id_idx
  on public.knowledge_snapshots (knowledge_source_id);

create index if not exists knowledge_snapshots_workspace_id_idx
  on public.knowledge_snapshots (workspace_id);

create index if not exists knowledge_snapshots_owner_user_id_idx
  on public.knowledge_snapshots (owner_user_id);

create index if not exists knowledge_snapshots_target_role_id_idx
  on public.knowledge_snapshots (target_role_id);

create index if not exists knowledge_snapshots_source_kind_idx
  on public.knowledge_snapshots (source_kind);

drop trigger if exists knowledge_snapshots_set_updated_at on public.knowledge_snapshots;
create trigger knowledge_snapshots_set_updated_at
before update on public.knowledge_snapshots
for each row
execute function public.set_updated_at();

alter table public.knowledge_snapshots enable row level security;

drop policy if exists "Users can read their own knowledge snapshots" on public.knowledge_snapshots;
create policy "Users can read their own knowledge snapshots"
on public.knowledge_snapshots
for select
to authenticated
using (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can create their own knowledge snapshots" on public.knowledge_snapshots;
create policy "Users can create their own knowledge snapshots"
on public.knowledge_snapshots
for insert
to authenticated
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.knowledge_sources
    where knowledge_sources.id = knowledge_source_id
      and knowledge_sources.owner_user_id = auth.uid()
      and knowledge_sources.workspace_id = knowledge_snapshots.workspace_id
  )
);

drop policy if exists "Users can update their own knowledge snapshots" on public.knowledge_snapshots;
create policy "Users can update their own knowledge snapshots"
on public.knowledge_snapshots
for update
to authenticated
using (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
)
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.knowledge_sources
    where knowledge_sources.id = knowledge_source_id
      and knowledge_sources.owner_user_id = auth.uid()
      and knowledge_sources.workspace_id = knowledge_snapshots.workspace_id
  )
);

drop policy if exists "Users can delete their own knowledge snapshots" on public.knowledge_snapshots;
create policy "Users can delete their own knowledge snapshots"
on public.knowledge_snapshots
for delete
to authenticated
using (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);
