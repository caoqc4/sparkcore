create table if not exists public.user_account_deletion_audits (
  id uuid primary key default gen_random_uuid(),
  deleted_user_id uuid not null,
  deleted_user_email text,
  initiated_by_user_id uuid not null,
  status text not null default 'requested',
  deletion_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_account_deletion_audits_status_check
    check (status in ('requested', 'completed', 'failed'))
);

create index if not exists user_account_deletion_audits_deleted_user_id_idx
  on public.user_account_deletion_audits (deleted_user_id);

create index if not exists user_account_deletion_audits_created_at_idx
  on public.user_account_deletion_audits (created_at desc);

drop trigger if exists user_account_deletion_audits_set_updated_at
  on public.user_account_deletion_audits;
create trigger user_account_deletion_audits_set_updated_at
before update on public.user_account_deletion_audits
for each row
execute function public.set_updated_at();

alter table public.user_account_deletion_audits enable row level security;
