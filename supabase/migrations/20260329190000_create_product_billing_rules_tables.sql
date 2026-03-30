create table if not exists public.product_billing_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  status text not null default 'active',
  billing_interval text not null default 'monthly',
  is_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_billing_plans_status_check
    check (status in ('draft', 'active', 'archived')),
  constraint product_billing_plans_billing_interval_check
    check (billing_interval in ('none', 'monthly', 'quarterly', 'yearly', 'lifetime'))
);

create table if not exists public.product_model_capabilities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  capability_type text not null,
  provider text not null,
  model_key text not null,
  display_name text not null,
  quality_tier text not null default 'free',
  availability_status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_model_capabilities_capability_type_check
    check (capability_type in ('text', 'image', 'audio', 'video')),
  constraint product_model_capabilities_quality_tier_check
    check (quality_tier in ('free', 'pro', 'premium')),
  constraint product_model_capabilities_availability_status_check
    check (availability_status in ('active', 'preview', 'disabled'))
);

create table if not exists public.product_plan_model_access (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.product_billing_plans (id) on delete cascade,
  model_capability_id uuid not null references public.product_model_capabilities (id) on delete cascade,
  access_level text not null default 'included',
  is_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_plan_model_access_access_level_check
    check (access_level in ('included', 'upgrade_required', 'credits_required', 'hidden')),
  constraint product_plan_model_access_unique_rule
    unique (plan_id, model_capability_id)
);

create table if not exists public.product_plan_entitlements (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.product_billing_plans (id) on delete cascade,
  capability_type text not null,
  entitlement_key text not null,
  model_capability_id uuid references public.product_model_capabilities (id) on delete cascade,
  included_units integer,
  reset_interval text not null default 'monthly',
  overage_mode text not null default 'blocked',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_plan_entitlements_capability_type_check
    check (capability_type in ('text', 'image', 'audio', 'video')),
  constraint product_plan_entitlements_included_units_check
    check (included_units is null or included_units >= 0),
  constraint product_plan_entitlements_reset_interval_check
    check (reset_interval in ('none', 'monthly', 'quarterly', 'yearly')),
  constraint product_plan_entitlements_overage_mode_check
    check (overage_mode in ('blocked', 'credits', 'soft_unlimited'))
);

create table if not exists public.product_credit_price_rules (
  id uuid primary key default gen_random_uuid(),
  capability_type text not null,
  billing_unit text not null,
  credits_cost integer not null,
  plan_id uuid references public.product_billing_plans (id) on delete cascade,
  model_capability_id uuid references public.product_model_capabilities (id) on delete cascade,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_credit_price_rules_capability_type_check
    check (capability_type in ('text', 'image', 'audio', 'video')),
  constraint product_credit_price_rules_billing_unit_check
    check (billing_unit in ('turn', 'generation', 'minute', 'request')),
  constraint product_credit_price_rules_credits_cost_check
    check (credits_cost >= 0)
);

create table if not exists public.user_credit_wallets (
  user_id uuid primary key references public.users (id) on delete cascade,
  balance integer not null default 0,
  lifetime_credited integer not null default 0,
  lifetime_debited integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_credit_wallets_balance_check
    check (balance >= 0),
  constraint user_credit_wallets_lifetime_credited_check
    check (lifetime_credited >= 0),
  constraint user_credit_wallets_lifetime_debited_check
    check (lifetime_debited >= 0)
);

create table if not exists public.user_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  direction text not null,
  amount integer not null,
  balance_after integer not null,
  reason text not null,
  capability_type text,
  model_capability_id uuid references public.product_model_capabilities (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_credit_ledger_direction_check
    check (direction in ('credit', 'debit')),
  constraint user_credit_ledger_amount_check
    check (amount > 0),
  constraint user_credit_ledger_balance_after_check
    check (balance_after >= 0),
  constraint user_credit_ledger_capability_type_check
    check (
      capability_type is null
      or capability_type in ('text', 'image', 'audio', 'video')
    )
);

create table if not exists public.user_capability_usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  capability_type text not null,
  metric_key text not null,
  model_capability_id uuid references public.product_model_capabilities (id) on delete set null,
  usage_period_start timestamptz not null,
  usage_period_end timestamptz not null,
  used_units integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_capability_usage_counters_capability_type_check
    check (capability_type in ('text', 'image', 'audio', 'video')),
  constraint user_capability_usage_counters_used_units_check
    check (used_units >= 0),
  constraint user_capability_usage_counters_period_check
    check (usage_period_end > usage_period_start)
);

create index if not exists product_billing_plans_status_idx
  on public.product_billing_plans (status, billing_interval);

create index if not exists product_model_capabilities_type_idx
  on public.product_model_capabilities (capability_type, availability_status, quality_tier);

create index if not exists product_plan_model_access_plan_id_idx
  on public.product_plan_model_access (plan_id, access_level, is_default desc);

create unique index if not exists product_plan_entitlements_rule_idx
  on public.product_plan_entitlements (
    plan_id,
    capability_type,
    entitlement_key,
    coalesce(model_capability_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists product_credit_price_rules_lookup_idx
  on public.product_credit_price_rules (
    capability_type,
    coalesce(plan_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(model_capability_id, '00000000-0000-0000-0000-000000000000'::uuid),
    is_active
  );

create index if not exists user_credit_ledger_user_id_idx
  on public.user_credit_ledger (user_id, created_at desc);

create index if not exists user_capability_usage_counters_user_id_idx
  on public.user_capability_usage_counters (user_id, capability_type, usage_period_start desc);

drop trigger if exists product_billing_plans_set_updated_at on public.product_billing_plans;
create trigger product_billing_plans_set_updated_at
before update on public.product_billing_plans
for each row
execute function public.set_updated_at();

drop trigger if exists product_model_capabilities_set_updated_at on public.product_model_capabilities;
create trigger product_model_capabilities_set_updated_at
before update on public.product_model_capabilities
for each row
execute function public.set_updated_at();

drop trigger if exists product_plan_model_access_set_updated_at on public.product_plan_model_access;
create trigger product_plan_model_access_set_updated_at
before update on public.product_plan_model_access
for each row
execute function public.set_updated_at();

drop trigger if exists product_plan_entitlements_set_updated_at on public.product_plan_entitlements;
create trigger product_plan_entitlements_set_updated_at
before update on public.product_plan_entitlements
for each row
execute function public.set_updated_at();

drop trigger if exists product_credit_price_rules_set_updated_at on public.product_credit_price_rules;
create trigger product_credit_price_rules_set_updated_at
before update on public.product_credit_price_rules
for each row
execute function public.set_updated_at();

drop trigger if exists user_credit_wallets_set_updated_at on public.user_credit_wallets;
create trigger user_credit_wallets_set_updated_at
before update on public.user_credit_wallets
for each row
execute function public.set_updated_at();

drop trigger if exists user_capability_usage_counters_set_updated_at on public.user_capability_usage_counters;
create trigger user_capability_usage_counters_set_updated_at
before update on public.user_capability_usage_counters
for each row
execute function public.set_updated_at();

alter table public.product_billing_plans enable row level security;
alter table public.product_model_capabilities enable row level security;
alter table public.product_plan_model_access enable row level security;
alter table public.product_plan_entitlements enable row level security;
alter table public.product_credit_price_rules enable row level security;
alter table public.user_credit_wallets enable row level security;
alter table public.user_credit_ledger enable row level security;
alter table public.user_capability_usage_counters enable row level security;

drop policy if exists "Authenticated users can read active billing plans" on public.product_billing_plans;
create policy "Authenticated users can read active billing plans"
on public.product_billing_plans
for select
to authenticated
using (status = 'active');

drop policy if exists "Authenticated users can read active product model capabilities" on public.product_model_capabilities;
create policy "Authenticated users can read active product model capabilities"
on public.product_model_capabilities
for select
to authenticated
using (availability_status in ('active', 'preview'));

drop policy if exists "Authenticated users can read plan model access rules" on public.product_plan_model_access;
create policy "Authenticated users can read plan model access rules"
on public.product_plan_model_access
for select
to authenticated
using (
  exists (
    select 1
    from public.product_billing_plans
    where product_billing_plans.id = plan_id
      and product_billing_plans.status = 'active'
  )
  and exists (
    select 1
    from public.product_model_capabilities
    where product_model_capabilities.id = model_capability_id
      and product_model_capabilities.availability_status in ('active', 'preview')
  )
);

drop policy if exists "Authenticated users can read plan entitlements" on public.product_plan_entitlements;
create policy "Authenticated users can read plan entitlements"
on public.product_plan_entitlements
for select
to authenticated
using (
  exists (
    select 1
    from public.product_billing_plans
    where product_billing_plans.id = plan_id
      and product_billing_plans.status = 'active'
  )
);

drop policy if exists "Authenticated users can read active credit price rules" on public.product_credit_price_rules;
create policy "Authenticated users can read active credit price rules"
on public.product_credit_price_rules
for select
to authenticated
using (is_active = true);

drop policy if exists "Users can read their own credit wallet" on public.user_credit_wallets;
create policy "Users can read their own credit wallet"
on public.user_credit_wallets
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their own credit ledger" on public.user_credit_ledger;
create policy "Users can read their own credit ledger"
on public.user_credit_ledger
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their own capability usage counters" on public.user_capability_usage_counters;
create policy "Users can read their own capability usage counters"
on public.user_capability_usage_counters
for select
to authenticated
using (auth.uid() = user_id);

insert into public.product_billing_plans (
  slug,
  name,
  description,
  status,
  billing_interval,
  is_default,
  metadata
)
values
  (
    'free',
    'Free',
    'Base relationship and media access with lighter model quality and lower monthly allowances.',
    'active',
    'none',
    true,
    jsonb_build_object(
      'seed', true,
      'positioning', 'entry',
      'supports_credits_top_up', true
    )
  ),
  (
    'pro',
    'Pro',
    'Higher-quality model access, larger monthly allowances, and credits support for overage.',
    'active',
    'monthly',
    false,
    jsonb_build_object(
      'seed', true,
      'positioning', 'core_paid',
      'supports_credits_top_up', true
    )
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  billing_interval = excluded.billing_interval,
  is_default = excluded.is_default,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());

insert into public.product_model_capabilities (
  slug,
  capability_type,
  provider,
  model_key,
  display_name,
  quality_tier,
  availability_status,
  metadata
)
values
  (
    'text-core-lite',
    'text',
    'openai',
    'text-core-lite',
    'Text Core Lite',
    'free',
    'active',
    jsonb_build_object('seed', true, 'supports_default_selection', true)
  ),
  (
    'text-creative-lite',
    'text',
    'anthropic',
    'text-creative-lite',
    'Text Creative Lite',
    'free',
    'active',
    jsonb_build_object('seed', true, 'supports_default_selection', true)
  ),
  (
    'text-reasoning-pro',
    'text',
    'openai',
    'text-reasoning-pro',
    'Text Reasoning Pro',
    'pro',
    'active',
    jsonb_build_object('seed', true, 'supports_default_selection', true)
  ),
  (
    'image-fast-lite',
    'image',
    'replicate',
    'image-fast-lite',
    'Image Fast Lite',
    'free',
    'active',
    jsonb_build_object('seed', true, 'supports_default_selection', true)
  ),
  (
    'image-studio-pro',
    'image',
    'replicate',
    'image-studio-pro',
    'Image Studio Pro',
    'pro',
    'active',
    jsonb_build_object('seed', true, 'supports_default_selection', true)
  ),
  (
    'audio-basic-lite',
    'audio',
    'elevenlabs',
    'audio-basic-lite',
    'Audio Basic Lite',
    'free',
    'active',
    jsonb_build_object('seed', true, 'supports_default_selection', true)
  ),
  (
    'audio-expressive-pro',
    'audio',
    'elevenlabs',
    'audio-expressive-pro',
    'Audio Expressive Pro',
    'pro',
    'active',
    jsonb_build_object('seed', true, 'supports_default_selection', true)
  ),
  (
    'video-preview-pro',
    'video',
    'runway',
    'video-preview-pro',
    'Video Preview Pro',
    'premium',
    'preview',
    jsonb_build_object('seed', true, 'reserved_for_future_rollout', true)
  )
on conflict (slug) do update
set
  capability_type = excluded.capability_type,
  provider = excluded.provider,
  model_key = excluded.model_key,
  display_name = excluded.display_name,
  quality_tier = excluded.quality_tier,
  availability_status = excluded.availability_status,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());

with plan_map as (
  select id, slug
  from public.product_billing_plans
  where slug in ('free', 'pro')
),
model_map as (
  select id, slug
  from public.product_model_capabilities
  where slug in (
    'text-core-lite',
    'text-creative-lite',
    'text-reasoning-pro',
    'image-fast-lite',
    'image-studio-pro',
    'audio-basic-lite',
    'audio-expressive-pro',
    'video-preview-pro'
  )
)
insert into public.product_plan_model_access (
  plan_id,
  model_capability_id,
  access_level,
  is_default,
  metadata
)
select
  plan_map.id,
  model_map.id,
  case
    when plan_map.slug = 'free' and model_map.slug in ('text-core-lite', 'text-creative-lite', 'image-fast-lite', 'audio-basic-lite')
      then 'included'
    when plan_map.slug = 'pro' and model_map.slug in (
      'text-core-lite',
      'text-creative-lite',
      'text-reasoning-pro',
      'image-fast-lite',
      'image-studio-pro',
      'audio-basic-lite',
      'audio-expressive-pro'
    )
      then 'included'
    when plan_map.slug = 'pro' and model_map.slug = 'video-preview-pro'
      then 'credits_required'
    else 'upgrade_required'
  end,
  case
    when plan_map.slug = 'free' and model_map.slug in ('text-core-lite', 'image-fast-lite', 'audio-basic-lite')
      then true
    when plan_map.slug = 'pro' and model_map.slug in ('text-reasoning-pro', 'image-studio-pro', 'audio-expressive-pro')
      then true
    else false
  end,
  jsonb_build_object('seed', true)
from plan_map
cross join model_map
on conflict (plan_id, model_capability_id) do update
set
  access_level = excluded.access_level,
  is_default = excluded.is_default,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());

with plan_map as (
  select id, slug
  from public.product_billing_plans
  where slug in ('free', 'pro')
),
model_map as (
  select id, slug, capability_type
  from public.product_model_capabilities
)
insert into public.product_plan_entitlements (
  plan_id,
  capability_type,
  entitlement_key,
  model_capability_id,
  included_units,
  reset_interval,
  overage_mode,
  metadata
)
values
  (
    (select id from plan_map where slug = 'free'),
    'text',
    'base_text_turns',
    (select id from model_map where slug = 'text-core-lite'),
    null,
    'monthly',
    'soft_unlimited',
    jsonb_build_object('seed', true, 'note', 'Free text stays available on the lighter model pool.')
  ),
  (
    (select id from plan_map where slug = 'free'),
    'text',
    'base_text_turns',
    (select id from model_map where slug = 'text-creative-lite'),
    null,
    'monthly',
    'soft_unlimited',
    jsonb_build_object('seed', true)
  ),
  (
    (select id from plan_map where slug = 'free'),
    'image',
    'monthly_generations',
    (select id from model_map where slug = 'image-fast-lite'),
    20,
    'monthly',
    'credits',
    jsonb_build_object('seed', true)
  ),
  (
    (select id from plan_map where slug = 'free'),
    'audio',
    'monthly_generations',
    (select id from model_map where slug = 'audio-basic-lite'),
    5,
    'monthly',
    'credits',
    jsonb_build_object('seed', true)
  ),
  (
    (select id from plan_map where slug = 'pro'),
    'text',
    'base_text_turns',
    (select id from model_map where slug = 'text-core-lite'),
    null,
    'monthly',
    'soft_unlimited',
    jsonb_build_object('seed', true)
  ),
  (
    (select id from plan_map where slug = 'pro'),
    'text',
    'base_text_turns',
    (select id from model_map where slug = 'text-creative-lite'),
    null,
    'monthly',
    'soft_unlimited',
    jsonb_build_object('seed', true)
  ),
  (
    (select id from plan_map where slug = 'pro'),
    'text',
    'monthly_premium_turns',
    (select id from model_map where slug = 'text-reasoning-pro'),
    300,
    'monthly',
    'credits',
    jsonb_build_object('seed', true)
  ),
  (
    (select id from plan_map where slug = 'pro'),
    'image',
    'monthly_generations',
    (select id from model_map where slug = 'image-fast-lite'),
    60,
    'monthly',
    'credits',
    jsonb_build_object('seed', true)
  ),
  (
    (select id from plan_map where slug = 'pro'),
    'image',
    'monthly_generations',
    (select id from model_map where slug = 'image-studio-pro'),
    120,
    'monthly',
    'credits',
    jsonb_build_object('seed', true)
  ),
  (
    (select id from plan_map where slug = 'pro'),
    'audio',
    'monthly_generations',
    (select id from model_map where slug = 'audio-basic-lite'),
    40,
    'monthly',
    'credits',
    jsonb_build_object('seed', true)
  ),
  (
    (select id from plan_map where slug = 'pro'),
    'audio',
    'monthly_generations',
    (select id from model_map where slug = 'audio-expressive-pro'),
    80,
    'monthly',
    'credits',
    jsonb_build_object('seed', true)
  ),
  (
    (select id from plan_map where slug = 'pro'),
    'video',
    'monthly_generations',
    (select id from model_map where slug = 'video-preview-pro'),
    0,
    'monthly',
    'credits',
    jsonb_build_object('seed', true, 'reserved_for_future_rollout', true)
  )
on conflict do nothing;

with plan_map as (
  select id, slug
  from public.product_billing_plans
  where slug in ('free', 'pro')
),
model_map as (
  select id, slug
  from public.product_model_capabilities
  where slug in (
    'text-reasoning-pro',
    'image-fast-lite',
    'image-studio-pro',
    'audio-basic-lite',
    'audio-expressive-pro',
    'video-preview-pro'
  )
)
insert into public.product_credit_price_rules (
  capability_type,
  billing_unit,
  credits_cost,
  plan_id,
  model_capability_id,
  is_active,
  metadata
)
values
  (
    'text',
    'turn',
    1,
    (select id from plan_map where slug = 'pro'),
    (select id from model_map where slug = 'text-reasoning-pro'),
    true,
    jsonb_build_object('seed', true, 'applies_after_included_units', true)
  ),
  (
    'image',
    'generation',
    2,
    null,
    (select id from model_map where slug = 'image-fast-lite'),
    true,
    jsonb_build_object('seed', true)
  ),
  (
    'image',
    'generation',
    5,
    (select id from plan_map where slug = 'pro'),
    (select id from model_map where slug = 'image-studio-pro'),
    true,
    jsonb_build_object('seed', true)
  ),
  (
    'audio',
    'generation',
    3,
    null,
    (select id from model_map where slug = 'audio-basic-lite'),
    true,
    jsonb_build_object('seed', true)
  ),
  (
    'audio',
    'generation',
    6,
    (select id from plan_map where slug = 'pro'),
    (select id from model_map where slug = 'audio-expressive-pro'),
    true,
    jsonb_build_object('seed', true)
  ),
  (
    'video',
    'generation',
    20,
    (select id from plan_map where slug = 'pro'),
    (select id from model_map where slug = 'video-preview-pro'),
    true,
    jsonb_build_object('seed', true, 'reserved_for_future_rollout', true)
  )
on conflict do nothing;

insert into public.user_credit_wallets (
  user_id,
  balance,
  lifetime_credited,
  lifetime_debited,
  metadata
)
select
  users.id,
  0,
  0,
  0,
  jsonb_build_object('seed', true)
from public.users
where not exists (
  select 1
  from public.user_credit_wallets
  where user_credit_wallets.user_id = users.id
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_slug text;
  workspace_name text;
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = timezone('utc', now());

  workspace_slug := 'personal-' || replace(new.id::text, '-', '');
  workspace_name := coalesce(split_part(new.email, '@', 1), 'sparkcore') || ' workspace';

  insert into public.workspaces (owner_user_id, name, slug, kind)
  values (new.id, workspace_name, workspace_slug, 'personal')
  on conflict (slug) do nothing;

  insert into public.user_credit_wallets (
    user_id,
    balance,
    lifetime_credited,
    lifetime_debited,
    metadata
  )
  values (
    new.id,
    0,
    0,
    0,
    jsonb_build_object('seed', true, 'created_from', 'handle_new_user')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;
