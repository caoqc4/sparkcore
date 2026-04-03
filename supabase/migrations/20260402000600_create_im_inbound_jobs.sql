create table if not exists public.im_inbound_jobs (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.im_inbound_receipts(id) on delete cascade,
  platform text not null,
  channel_slug text not null,
  job_type text not null,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  claimed_by text,
  claimed_at timestamptz,
  available_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint im_inbound_jobs_status_check check (
    status in (
      'queued',
      'claimed',
      'processing',
      'completed',
      'failed',
      'cancelled'
    )
  )
);

create unique index if not exists im_inbound_jobs_receipt_job_type_idx
  on public.im_inbound_jobs (receipt_id, job_type);

create index if not exists im_inbound_jobs_status_available_at_idx
  on public.im_inbound_jobs (status, available_at asc);

create index if not exists im_inbound_jobs_platform_channel_slug_idx
  on public.im_inbound_jobs (platform, channel_slug, created_at desc);

drop trigger if exists im_inbound_jobs_set_updated_at on public.im_inbound_jobs;
create trigger im_inbound_jobs_set_updated_at
before update on public.im_inbound_jobs
for each row
execute function public.set_updated_at();

alter table public.im_inbound_jobs enable row level security;
