insert into public.user_app_settings (
  user_id,
  theme,
  interface_language,
  notifications_enabled,
  memory_retention_policy,
  data_region
)
select
  users.id,
  'system',
  'en',
  false,
  'standard',
  'global'
from public.users
where not exists (
  select 1
  from public.user_app_settings
  where user_app_settings.user_id = users.id
);

insert into public.user_subscription_snapshots (
  user_id,
  plan_status
)
select
  users.id,
  'inactive'
from public.users
where not exists (
  select 1
  from public.user_subscription_snapshots
  where user_subscription_snapshots.user_id = users.id
);
