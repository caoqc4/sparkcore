create table if not exists public.im_inbound_receipts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  event_id text,
  dedupe_key text not null,
  channel_id text not null,
  peer_id text not null,
  platform_user_id text not null,
  status text not null default 'received',
  attempt_count integer not null default 1,
  last_error text,
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  first_received_at timestamptz not null default timezone('utc', now()),
  last_received_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint im_inbound_receipts_status_check check (
    status in (
      'received',
      'processing',
      'processed',
      'binding_not_found',
      'processing_failed',
      'duplicate'
    )
  )
);

create unique index if not exists im_inbound_receipts_platform_dedupe_key_idx
  on public.im_inbound_receipts (platform, dedupe_key);

create unique index if not exists im_inbound_receipts_platform_event_id_idx
  on public.im_inbound_receipts (platform, event_id)
  where event_id is not null and length(trim(event_id)) > 0;

create index if not exists im_inbound_receipts_status_idx
  on public.im_inbound_receipts (status);

create index if not exists im_inbound_receipts_last_received_at_idx
  on public.im_inbound_receipts (last_received_at desc);

drop trigger if exists im_inbound_receipts_set_updated_at on public.im_inbound_receipts;
create trigger im_inbound_receipts_set_updated_at
before update on public.im_inbound_receipts
for each row
execute function public.set_updated_at();

alter table public.im_inbound_receipts enable row level security;
