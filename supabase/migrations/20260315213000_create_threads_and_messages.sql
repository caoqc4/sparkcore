create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  title text not null default 'New chat',
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null,
  content text not null,
  status text not null default 'completed',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint messages_role_check check (role in ('user', 'assistant'))
);

create index if not exists threads_workspace_id_idx
  on public.threads (workspace_id);

create index if not exists threads_owner_user_id_idx
  on public.threads (owner_user_id);

create index if not exists threads_created_at_idx
  on public.threads (created_at desc);

create index if not exists messages_thread_id_idx
  on public.messages (thread_id);

create index if not exists messages_workspace_id_idx
  on public.messages (workspace_id);

create index if not exists messages_user_id_idx
  on public.messages (user_id);

create index if not exists messages_created_at_idx
  on public.messages (created_at asc);

drop trigger if exists threads_set_updated_at on public.threads;
create trigger threads_set_updated_at
before update on public.threads
for each row
execute function public.set_updated_at();

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at
before update on public.messages
for each row
execute function public.set_updated_at();

alter table public.threads enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Users can read their own threads" on public.threads;
create policy "Users can read their own threads"
on public.threads
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "Users can create their own threads" on public.threads;
create policy "Users can create their own threads"
on public.threads
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
);

drop policy if exists "Users can update their own threads" on public.threads;
create policy "Users can update their own threads"
on public.threads
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own threads" on public.threads;
create policy "Users can delete their own threads"
on public.threads
for delete
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "Users can read messages in their own threads" on public.messages;
create policy "Users can read messages in their own threads"
on public.messages
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = messages.workspace_id
  )
);

drop policy if exists "Users can create messages in their own threads" on public.messages;
create policy "Users can create messages in their own threads"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = messages.workspace_id
  )
);

drop policy if exists "Users can update messages in their own threads" on public.messages;
create policy "Users can update messages in their own threads"
on public.messages
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = messages.workspace_id
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = messages.workspace_id
  )
);

drop policy if exists "Users can delete messages in their own threads" on public.messages;
create policy "Users can delete messages in their own threads"
on public.messages
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.threads
    where threads.id = thread_id
      and threads.owner_user_id = auth.uid()
      and threads.workspace_id = messages.workspace_id
  )
);
