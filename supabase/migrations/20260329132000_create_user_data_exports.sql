create table if not exists public.user_data_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  format text not null default 'json',
  status text not null default 'completed',
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_data_exports_format_check
    check (format in ('json')),
  constraint user_data_exports_status_check
    check (status in ('queued', 'processing', 'completed', 'failed'))
);

create index if not exists user_data_exports_user_id_idx
  on public.user_data_exports (user_id);

create index if not exists user_data_exports_created_at_idx
  on public.user_data_exports (created_at desc);

drop trigger if exists user_data_exports_set_updated_at on public.user_data_exports;
create trigger user_data_exports_set_updated_at
before update on public.user_data_exports
for each row
execute function public.set_updated_at();

alter table public.user_data_exports enable row level security;

drop policy if exists "Users can read their own data exports" on public.user_data_exports;
create policy "Users can read their own data exports"
on public.user_data_exports
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own data exports" on public.user_data_exports;
create policy "Users can create their own data exports"
on public.user_data_exports
for insert
to authenticated
with check (auth.uid() = user_id);

