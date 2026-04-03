insert into public.channel_platform_capabilities (
  platform,
  availability_status,
  supports_binding,
  supports_advanced_identity_fields,
  display_order,
  metadata
)
values (
  'feishu',
  'active',
  true,
  true,
  3,
  jsonb_build_object('label', 'Feishu')
)
on conflict (platform) do update
set
  availability_status = excluded.availability_status,
  supports_binding = excluded.supports_binding,
  supports_advanced_identity_fields = excluded.supports_advanced_identity_fields,
  display_order = excluded.display_order,
  metadata = excluded.metadata,
  updated_at = now();
