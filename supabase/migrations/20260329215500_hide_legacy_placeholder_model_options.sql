update public.product_plan_model_access
set
  access_level = 'hidden',
  is_default = false,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'hidden_reason',
    'Superseded by the expanded model catalog.'
  ),
  updated_at = timezone('utc', now())
where model_capability_id in (
  select id
  from public.product_model_capabilities
  where slug in (
    'image-fast-lite',
    'image-studio-pro',
    'audio-basic-lite',
    'audio-expressive-pro'
  )
);
