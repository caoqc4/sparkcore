create table if not exists public.user_payment_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  provider_payment_id text not null,
  provider_subscription_id text,
  checkout_kind text not null,
  selection_key text not null,
  status text not null default 'succeeded',
  amount_cents integer,
  currency text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_payment_receipts_provider_check
    check (provider in ('creem')),
  constraint user_payment_receipts_checkout_kind_check
    check (checkout_kind in ('subscription', 'credits')),
  constraint user_payment_receipts_status_check
    check (status in ('pending', 'succeeded', 'failed', 'canceled'))
);

create unique index if not exists user_payment_receipts_provider_payment_unique
  on public.user_payment_receipts (provider, provider_payment_id);

create index if not exists user_payment_receipts_user_id_idx
  on public.user_payment_receipts (user_id, created_at desc);

create index if not exists user_payment_receipts_provider_subscription_idx
  on public.user_payment_receipts (provider, provider_subscription_id);

drop trigger if exists user_payment_receipts_set_updated_at on public.user_payment_receipts;
create trigger user_payment_receipts_set_updated_at
before update on public.user_payment_receipts
for each row
execute function public.set_updated_at();

alter table public.user_payment_receipts enable row level security;

drop policy if exists "Users can read their own payment receipts" on public.user_payment_receipts;
create policy "Users can read their own payment receipts"
on public.user_payment_receipts
for select
to authenticated
using (auth.uid() = user_id);
