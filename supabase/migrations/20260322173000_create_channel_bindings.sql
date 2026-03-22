create table if not exists public.channel_bindings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  agent_id uuid not null references public.agents (id) on delete cascade,
  thread_id uuid references public.threads (id) on delete set null,
  platform text not null,
  channel_id text not null,
  peer_id text not null,
  platform_user_id text not null,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint channel_bindings_status_check check (status in ('active', 'inactive'))
);

create index if not exists channel_bindings_workspace_id_idx
  on public.channel_bindings (workspace_id);

create index if not exists channel_bindings_user_id_idx
  on public.channel_bindings (user_id);

create index if not exists channel_bindings_agent_id_idx
  on public.channel_bindings (agent_id);

create index if not exists channel_bindings_thread_id_idx
  on public.channel_bindings (thread_id);

create index if not exists channel_bindings_lookup_idx
  on public.channel_bindings (
    platform,
    channel_id,
    peer_id,
    platform_user_id,
    status
  );

create unique index if not exists channel_bindings_active_identity_unique_idx
  on public.channel_bindings (
    platform,
    channel_id,
    peer_id,
    platform_user_id
  )
  where status = 'active';

drop trigger if exists channel_bindings_set_updated_at on public.channel_bindings;
create trigger channel_bindings_set_updated_at
before update on public.channel_bindings
for each row
execute function public.set_updated_at();

alter table public.channel_bindings enable row level security;

drop policy if exists "Users can read their own channel bindings" on public.channel_bindings;
create policy "Users can read their own channel bindings"
on public.channel_bindings
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can create their own channel bindings" on public.channel_bindings;
create policy "Users can create their own channel bindings"
on public.channel_bindings
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.agents
    where agents.id = agent_id
      and agents.owner_user_id = auth.uid()
      and agents.workspace_id = channel_bindings.workspace_id
  )
  and (
    thread_id is null
    or exists (
      select 1
      from public.threads
      where threads.id = thread_id
        and threads.owner_user_id = auth.uid()
        and threads.workspace_id = channel_bindings.workspace_id
    )
  )
);

drop policy if exists "Users can update their own channel bindings" on public.channel_bindings;
create policy "Users can update their own channel bindings"
on public.channel_bindings
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.agents
    where agents.id = agent_id
      and agents.owner_user_id = auth.uid()
      and agents.workspace_id = channel_bindings.workspace_id
  )
  and (
    thread_id is null
    or exists (
      select 1
      from public.threads
      where threads.id = thread_id
        and threads.owner_user_id = auth.uid()
        and threads.workspace_id = channel_bindings.workspace_id
    )
  )
);

drop policy if exists "Users can delete their own channel bindings" on public.channel_bindings;
create policy "Users can delete their own channel bindings"
on public.channel_bindings
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);
