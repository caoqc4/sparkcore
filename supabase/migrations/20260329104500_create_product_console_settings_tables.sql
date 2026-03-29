create table if not exists public.user_app_settings (
  user_id uuid primary key references public.users (id) on delete cascade,
  theme text not null default 'system',
  interface_language text not null default 'en',
  notifications_enabled boolean not null default false,
  memory_retention_policy text not null default 'standard',
  data_region text not null default 'global',
  default_model_provider text,
  default_model_id text,
  custom_api_key_present boolean not null default false,
  custom_model_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_app_settings_theme_check
    check (theme in ('light', 'dark', 'system')),
  constraint user_app_settings_memory_retention_policy_check
    check (memory_retention_policy in ('standard', 'extended', 'minimal'))
);

create table if not exists public.user_subscription_snapshots (
  user_id uuid primary key references public.users (id) on delete cascade,
  plan_name text,
  plan_status text not null default 'inactive',
  message_quota integer,
  renewal_date timestamptz,
  upgrade_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_subscription_snapshots_plan_status_check
    check (plan_status in ('inactive', 'trial', 'active', 'past_due', 'canceled'))
);

drop trigger if exists user_app_settings_set_updated_at on public.user_app_settings;
create trigger user_app_settings_set_updated_at
before update on public.user_app_settings
for each row
execute function public.set_updated_at();

drop trigger if exists user_subscription_snapshots_set_updated_at on public.user_subscription_snapshots;
create trigger user_subscription_snapshots_set_updated_at
before update on public.user_subscription_snapshots
for each row
execute function public.set_updated_at();

alter table public.user_app_settings enable row level security;
alter table public.user_subscription_snapshots enable row level security;

drop policy if exists "Users can read their own app settings" on public.user_app_settings;
create policy "Users can read their own app settings"
on public.user_app_settings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own app settings" on public.user_app_settings;
create policy "Users can create their own app settings"
on public.user_app_settings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own app settings" on public.user_app_settings;
create policy "Users can update their own app settings"
on public.user_app_settings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read their own subscription snapshots" on public.user_subscription_snapshots;
create policy "Users can read their own subscription snapshots"
on public.user_subscription_snapshots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own subscription snapshots" on public.user_subscription_snapshots;
create policy "Users can create their own subscription snapshots"
on public.user_subscription_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own subscription snapshots" on public.user_subscription_snapshots;
create policy "Users can update their own subscription snapshots"
on public.user_subscription_snapshots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
