create table if not exists public.thread_states (
  thread_id uuid not null references public.threads (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  agent_id uuid not null references public.agents (id) on delete cascade,
  state_version integer not null default 1,
  lifecycle_status text not null default 'active',
  focus_mode text,
  current_language_hint text,
  recent_turn_window_size integer,
  continuity_status text,
  last_user_message_id uuid references public.messages (id) on delete set null,
  last_assistant_message_id uuid references public.messages (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint thread_states_pkey primary key (thread_id, agent_id),
  constraint thread_states_lifecycle_status_check
    check (lifecycle_status in ('active', 'paused', 'closed')),
  constraint thread_states_continuity_status_check
    check (continuity_status in ('cold', 'warm', 'engaged') or continuity_status is null),
  constraint thread_states_recent_turn_window_size_check
    check (recent_turn_window_size is null or recent_turn_window_size >= 0),
  constraint thread_states_state_version_check
    check (state_version >= 1)
);

create index if not exists thread_states_workspace_id_idx
  on public.thread_states (workspace_id);

create index if not exists thread_states_user_id_idx
  on public.thread_states (user_id);

create index if not exists thread_states_agent_id_idx
  on public.thread_states (agent_id);

create index if not exists thread_states_updated_at_idx
  on public.thread_states (updated_at desc);

drop trigger if exists thread_states_set_updated_at on public.thread_states;
create trigger thread_states_set_updated_at
before update on public.thread_states
for each row
execute function public.set_updated_at();

alter table public.thread_states enable row level security;

drop policy if exists "Users can read their own thread states" on public.thread_states;
create policy "Users can read their own thread states"
on public.thread_states
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
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = thread_states.workspace_id
  )
);

drop policy if exists "Users can create their own thread states" on public.thread_states;
create policy "Users can create their own thread states"
on public.thread_states
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
      and agents.workspace_id = thread_states.workspace_id
  )
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = thread_states.workspace_id
      and (threads.agent_id is null or threads.agent_id = thread_states.agent_id)
  )
  and (
    last_user_message_id is null
    or exists (
      select 1
      from public.messages
      where messages.id = last_user_message_id
        and messages.user_id = auth.uid()
        and messages.thread_id = thread_states.thread_id
        and messages.workspace_id = thread_states.workspace_id
    )
  )
  and (
    last_assistant_message_id is null
    or exists (
      select 1
      from public.messages
      where messages.id = last_assistant_message_id
        and messages.user_id = auth.uid()
        and messages.thread_id = thread_states.thread_id
        and messages.workspace_id = thread_states.workspace_id
    )
  )
);

drop policy if exists "Users can update their own thread states" on public.thread_states;
create policy "Users can update their own thread states"
on public.thread_states
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
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = thread_states.workspace_id
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
      and agents.workspace_id = thread_states.workspace_id
  )
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = thread_states.workspace_id
      and (threads.agent_id is null or threads.agent_id = thread_states.agent_id)
  )
  and (
    last_user_message_id is null
    or exists (
      select 1
      from public.messages
      where messages.id = last_user_message_id
        and messages.user_id = auth.uid()
        and messages.thread_id = thread_states.thread_id
        and messages.workspace_id = thread_states.workspace_id
    )
  )
  and (
    last_assistant_message_id is null
    or exists (
      select 1
      from public.messages
      where messages.id = last_assistant_message_id
        and messages.user_id = auth.uid()
        and messages.thread_id = thread_states.thread_id
        and messages.workspace_id = thread_states.workspace_id
    )
  )
);

drop policy if exists "Users can delete their own thread states" on public.thread_states;
create policy "Users can delete their own thread states"
on public.thread_states
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
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = thread_states.workspace_id
  )
);
