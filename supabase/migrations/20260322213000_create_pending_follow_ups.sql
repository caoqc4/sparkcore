create table if not exists public.pending_follow_ups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  agent_id uuid not null references public.agents (id) on delete cascade,
  thread_id uuid not null references public.threads (id) on delete cascade,
  source_message_id uuid references public.messages (id) on delete set null,
  source_request_index integer not null,
  kind text not null,
  status text not null default 'pending',
  trigger_at timestamptz not null,
  request_reason text not null,
  request_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint pending_follow_ups_status_check
    check (status in ('pending', 'claimed', 'executed', 'failed', 'skipped'))
);

create index if not exists pending_follow_ups_workspace_id_idx
  on public.pending_follow_ups (workspace_id);

create index if not exists pending_follow_ups_user_id_idx
  on public.pending_follow_ups (user_id);

create index if not exists pending_follow_ups_agent_id_idx
  on public.pending_follow_ups (agent_id);

create index if not exists pending_follow_ups_thread_id_idx
  on public.pending_follow_ups (thread_id);

create index if not exists pending_follow_ups_status_trigger_at_idx
  on public.pending_follow_ups (status, trigger_at);

create index if not exists pending_follow_ups_kind_status_idx
  on public.pending_follow_ups (kind, status);

create unique index if not exists pending_follow_ups_source_request_unique_idx
  on public.pending_follow_ups (thread_id, source_message_id, source_request_index)
  where source_message_id is not null;

drop trigger if exists pending_follow_ups_set_updated_at on public.pending_follow_ups;
create trigger pending_follow_ups_set_updated_at
before update on public.pending_follow_ups
for each row
execute function public.set_updated_at();

alter table public.pending_follow_ups enable row level security;

drop policy if exists "Users can read their own pending follow-ups" on public.pending_follow_ups;
create policy "Users can read their own pending follow-ups"
on public.pending_follow_ups
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

drop policy if exists "Users can create their own pending follow-ups" on public.pending_follow_ups;
create policy "Users can create their own pending follow-ups"
on public.pending_follow_ups
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
      and agents.workspace_id = pending_follow_ups.workspace_id
  )
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = pending_follow_ups.workspace_id
  )
  and (
    source_message_id is null
    or exists (
      select 1
      from public.messages
      where messages.id = source_message_id
        and messages.user_id = auth.uid()
        and messages.thread_id = pending_follow_ups.thread_id
        and messages.workspace_id = pending_follow_ups.workspace_id
    )
  )
);

drop policy if exists "Users can update their own pending follow-ups" on public.pending_follow_ups;
create policy "Users can update their own pending follow-ups"
on public.pending_follow_ups
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
      and agents.workspace_id = pending_follow_ups.workspace_id
  )
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = pending_follow_ups.workspace_id
  )
  and (
    source_message_id is null
    or exists (
      select 1
      from public.messages
      where messages.id = source_message_id
        and messages.user_id = auth.uid()
        and messages.thread_id = pending_follow_ups.thread_id
        and messages.workspace_id = pending_follow_ups.workspace_id
    )
  )
);

drop policy if exists "Users can delete their own pending follow-ups" on public.pending_follow_ups;
create policy "Users can delete their own pending follow-ups"
on public.pending_follow_ups
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
