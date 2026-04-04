create table if not exists public.product_feedback_incidents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  agent_id uuid not null references public.agents (id) on delete cascade,
  thread_id uuid not null references public.threads (id) on delete cascade,
  source_message_id uuid not null references public.messages (id) on delete cascade,
  assistant_message_id uuid references public.messages (id) on delete set null,
  signal_type text not null default 'negative_product_feedback',
  status text not null default 'captured',
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_feedback_incidents_signal_type_check
    check (signal_type in ('negative_product_feedback')),
  constraint product_feedback_incidents_status_check
    check (status in ('captured', 'exported', 'dismissed'))
);

create index if not exists product_feedback_incidents_user_id_idx
  on public.product_feedback_incidents (user_id, created_at desc);

create index if not exists product_feedback_incidents_workspace_id_idx
  on public.product_feedback_incidents (workspace_id, created_at desc);

create index if not exists product_feedback_incidents_thread_id_idx
  on public.product_feedback_incidents (thread_id, created_at desc);

create index if not exists product_feedback_incidents_source_message_id_idx
  on public.product_feedback_incidents (source_message_id);

drop trigger if exists product_feedback_incidents_set_updated_at
  on public.product_feedback_incidents;
create trigger product_feedback_incidents_set_updated_at
before update on public.product_feedback_incidents
for each row
execute function public.set_updated_at();

alter table public.product_feedback_incidents enable row level security;

drop policy if exists "Users can read their own product feedback incidents"
  on public.product_feedback_incidents;
create policy "Users can read their own product feedback incidents"
on public.product_feedback_incidents
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own product feedback incidents"
  on public.product_feedback_incidents;
create policy "Users can create their own product feedback incidents"
on public.product_feedback_incidents
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

drop policy if exists "Users can update their own product feedback incidents"
  on public.product_feedback_incidents;
create policy "Users can update their own product feedback incidents"
on public.product_feedback_incidents
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
