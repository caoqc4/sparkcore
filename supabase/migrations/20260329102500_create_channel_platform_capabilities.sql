create table if not exists public.channel_platform_capabilities (
  platform text primary key,
  availability_status text not null default 'coming_soon',
  supports_binding boolean not null default false,
  supports_advanced_identity_fields boolean not null default false,
  display_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint channel_platform_capabilities_availability_status_check
    check (availability_status in ('active', 'coming_soon', 'disabled'))
);

create index if not exists channel_platform_capabilities_display_order_idx
  on public.channel_platform_capabilities (display_order asc);

drop trigger if exists channel_platform_capabilities_set_updated_at on public.channel_platform_capabilities;
create trigger channel_platform_capabilities_set_updated_at
before update on public.channel_platform_capabilities
for each row
execute function public.set_updated_at();

alter table public.channel_platform_capabilities enable row level security;

drop policy if exists "Authenticated users can read channel platform capabilities" on public.channel_platform_capabilities;
create policy "Authenticated users can read channel platform capabilities"
on public.channel_platform_capabilities
for select
to authenticated
using (true);

insert into public.channel_platform_capabilities (
  platform,
  availability_status,
  supports_binding,
  supports_advanced_identity_fields,
  display_order,
  metadata
)
values
  (
    'telegram',
    'active',
    true,
    true,
    1,
    jsonb_build_object('label', 'Telegram')
  ),
  (
    'wechat',
    'coming_soon',
    false,
    false,
    2,
    jsonb_build_object('label', 'WeChat')
  ),
  (
    'discord',
    'coming_soon',
    false,
    false,
    3,
    jsonb_build_object('label', 'Discord')
  )
on conflict (platform) do update
set
  availability_status = excluded.availability_status,
  supports_binding = excluded.supports_binding,
  supports_advanced_identity_fields = excluded.supports_advanced_identity_fields,
  display_order = excluded.display_order,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());
