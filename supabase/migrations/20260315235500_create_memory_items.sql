create table if not exists public.memory_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  agent_id uuid references public.agents (id) on delete set null,
  source_message_id uuid not null references public.messages (id) on delete cascade,
  memory_type text not null,
  content text not null,
  confidence numeric(3,2) not null default 0.00,
  importance numeric(3,2) not null default 0.50,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint memory_items_memory_type_check check (memory_type in ('profile', 'preference'))
);

create index if not exists memory_items_workspace_id_idx
  on public.memory_items (workspace_id);

create index if not exists memory_items_user_id_idx
  on public.memory_items (user_id);

create index if not exists memory_items_agent_id_idx
  on public.memory_items (agent_id);

create index if not exists memory_items_source_message_id_idx
  on public.memory_items (source_message_id);

create index if not exists memory_items_memory_type_idx
  on public.memory_items (memory_type);

create index if not exists memory_items_created_at_idx
  on public.memory_items (created_at desc);

drop trigger if exists memory_items_set_updated_at on public.memory_items;
create trigger memory_items_set_updated_at
before update on public.memory_items
for each row
execute function public.set_updated_at();

alter table public.memory_items enable row level security;

drop policy if exists "Users can read their own memory items" on public.memory_items;
create policy "Users can read their own memory items"
on public.memory_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own memory items" on public.memory_items;
create policy "Users can create their own memory items"
on public.memory_items
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
);

drop policy if exists "Users can update their own memory items" on public.memory_items;
create policy "Users can update their own memory items"
on public.memory_items
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own memory items" on public.memory_items;
create policy "Users can delete their own memory items"
on public.memory_items
for delete
to authenticated
using (auth.uid() = user_id);
