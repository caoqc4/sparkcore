create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  target_role_id uuid references public.agents (id) on delete cascade,
  title text not null,
  source_type text not null,
  status text not null default 'draft',
  processing_status text not null default 'queued',
  storage_path text,
  mime_type text,
  original_file_name text,
  content_excerpt text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint knowledge_sources_source_type_check
    check (source_type in ('document', 'url', 'note', 'pack')),
  constraint knowledge_sources_status_check
    check (status in ('draft', 'processing', 'active', 'failed', 'archived')),
  constraint knowledge_sources_processing_status_check
    check (processing_status in ('queued', 'parsing', 'indexed', 'failed'))
);

create index if not exists knowledge_sources_workspace_id_idx
  on public.knowledge_sources (workspace_id);

create index if not exists knowledge_sources_owner_user_id_idx
  on public.knowledge_sources (owner_user_id);

create index if not exists knowledge_sources_target_role_id_idx
  on public.knowledge_sources (target_role_id);

create index if not exists knowledge_sources_status_idx
  on public.knowledge_sources (status);

create index if not exists knowledge_sources_source_type_idx
  on public.knowledge_sources (source_type);

drop trigger if exists knowledge_sources_set_updated_at on public.knowledge_sources;
create trigger knowledge_sources_set_updated_at
before update on public.knowledge_sources
for each row
execute function public.set_updated_at();

alter table public.knowledge_sources enable row level security;

drop policy if exists "Users can read their own knowledge sources" on public.knowledge_sources;
create policy "Users can read their own knowledge sources"
on public.knowledge_sources
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

drop policy if exists "Users can create their own knowledge sources" on public.knowledge_sources;
create policy "Users can create their own knowledge sources"
on public.knowledge_sources
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
  and (
    target_role_id is null
    or exists (
      select 1
      from public.agents
      where agents.id = target_role_id
        and agents.owner_user_id = auth.uid()
        and agents.workspace_id = knowledge_sources.workspace_id
    )
  )
);

drop policy if exists "Users can update their own knowledge sources" on public.knowledge_sources;
create policy "Users can update their own knowledge sources"
on public.knowledge_sources
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
  and (
    target_role_id is null
    or exists (
      select 1
      from public.agents
      where agents.id = target_role_id
        and agents.owner_user_id = auth.uid()
        and agents.workspace_id = knowledge_sources.workspace_id
    )
  )
);

drop policy if exists "Users can delete their own knowledge sources" on public.knowledge_sources;
create policy "Users can delete their own knowledge sources"
on public.knowledge_sources
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
