create table if not exists public.model_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  provider text not null,
  model text not null,
  temperature double precision not null default 0.7,
  max_output_tokens integer,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists model_profiles_is_active_idx
  on public.model_profiles (is_active);

create index if not exists model_profiles_created_at_idx
  on public.model_profiles (created_at desc);

drop trigger if exists model_profiles_set_updated_at on public.model_profiles;
create trigger model_profiles_set_updated_at
before update on public.model_profiles
for each row
execute function public.set_updated_at();

alter table public.model_profiles enable row level security;

drop policy if exists "Authenticated users can read active model profiles" on public.model_profiles;
create policy "Authenticated users can read active model profiles"
on public.model_profiles
for select
to authenticated
using (is_active = true);

insert into public.model_profiles (
  slug,
  name,
  provider,
  model,
  temperature,
  max_output_tokens,
  metadata
)
values (
  'spark-default',
  'Spark Default',
  'replicate',
  'replicate-llama-3-8b',
  0.7,
  null,
  jsonb_build_object('seed', true, 'default', true)
)
on conflict (slug) do update
set
  name = excluded.name,
  provider = excluded.provider,
  model = excluded.model,
  temperature = excluded.temperature,
  max_output_tokens = excluded.max_output_tokens,
  metadata = excluded.metadata,
  is_active = true,
  updated_at = timezone('utc', now());

alter table public.agents
add column if not exists default_model_profile_id uuid references public.model_profiles (id) on delete set null;

create index if not exists agents_default_model_profile_id_idx
  on public.agents (default_model_profile_id);

update public.agents
set default_model_profile_id = model_profiles.id,
    metadata = metadata - 'default_model',
    updated_at = timezone('utc', now())
from public.model_profiles
where model_profiles.slug = 'spark-default'
  and public.agents.default_model_profile_id is null;
