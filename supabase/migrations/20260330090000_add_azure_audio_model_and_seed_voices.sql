with upserted_model as (
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
  values (
    'audio-azure-ai-speech',
    'audio',
    'azure',
    'azure-ai-speech',
    'Azure AI Speech',
    'free',
    'active',
    jsonb_build_object(
      'tags', jsonb_build_array('Natural voice', 'Neural'),
      'status_label', 'Available now',
      'managed_by_catalog_migration', true
    )
  )
  on conflict (slug) do update
  set
    capability_type = excluded.capability_type,
    provider = excluded.provider,
    model_key = excluded.model_key,
    display_name = excluded.display_name,
    quality_tier = excluded.quality_tier,
    availability_status = excluded.availability_status,
    metadata = coalesce(public.product_model_capabilities.metadata, '{}'::jsonb) || excluded.metadata,
    updated_at = timezone('utc', now())
  returning id
),
plan_rows as (
  select id, slug
  from public.product_billing_plans
  where slug in ('free', 'pro')
)
insert into public.product_plan_model_access (
  plan_id,
  model_capability_id,
  access_level,
  is_default,
  metadata
)
select
  plan_rows.id,
  upserted_model.id,
  case
    when plan_rows.slug = 'free' then 'included'
    else 'included'
  end,
  case
    when plan_rows.slug = 'free' then true
    else false
  end,
  jsonb_build_object('managed_by_catalog_migration', true)
from upserted_model
cross join plan_rows
on conflict (plan_id, model_capability_id) do update
set
  access_level = excluded.access_level,
  is_default = excluded.is_default,
  metadata = coalesce(public.product_plan_model_access.metadata, '{}'::jsonb) || excluded.metadata,
  updated_at = timezone('utc', now());

insert into public.product_audio_voice_options (
  model_slug,
  provider,
  voice_key,
  display_name,
  gender_presentation,
  style_tags,
  sort_order,
  is_default,
  metadata
)
values
  (
    'audio-azure-ai-speech',
    'Azure',
    'en-US-JennyNeural',
    'Warm Guide',
    'female',
    jsonb_build_array('Warm', 'Natural'),
    10,
    true,
    jsonb_build_object(
      'seed', true,
      'locale', 'en-US',
      'style', 'friendly',
      'rate_percent', 0
    )
  ),
  (
    'audio-azure-ai-speech',
    'Azure',
    'en-US-GuyNeural',
    'Steady Guide',
    'male',
    jsonb_build_array('Calm', 'Clear'),
    20,
    false,
    jsonb_build_object(
      'seed', true,
      'locale', 'en-US',
      'style', 'customerservice',
      'rate_percent', 0
    )
  )
on conflict (model_slug, voice_key) do update
set
  provider = excluded.provider,
  display_name = excluded.display_name,
  gender_presentation = excluded.gender_presentation,
  style_tags = excluded.style_tags,
  sort_order = excluded.sort_order,
  is_default = excluded.is_default,
  is_active = true,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());
