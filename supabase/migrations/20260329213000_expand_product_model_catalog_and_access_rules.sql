with model_capability_rows as (
  select *
  from (
    values
      (
        'text-core-lite',
        'text',
        'replicate',
        'replicate-gpt-4o-mini',
        'OpenAI GPT-4o mini',
        'free',
        'active',
        jsonb_build_object(
          'runtime_model_profile_slug', 'text-core-lite',
          'underlying_model', 'replicate/openai/gpt-4o-mini',
          'tags', jsonb_build_array('Fast', 'Low cost'),
          'status_label', 'Available now',
          'coming_soon', false
        )
      ),
      (
        'text-creative-lite',
        'text',
        'replicate',
        'replicate-llama-3-8b',
        'Meta Llama 3 8B',
        'free',
        'active',
        jsonb_build_object(
          'runtime_model_profile_slug', 'text-creative-lite',
          'underlying_model', 'replicate/meta/meta-llama-3-8b-instruct',
          'tags', jsonb_build_array('Low cost', 'Open-weight'),
          'status_label', 'Available now',
          'coming_soon', false
        )
      ),
      (
        'text-reasoning-pro',
        'text',
        'replicate',
        'replicate-claude-4-sonnet',
        'Anthropic Claude Sonnet 4',
        'pro',
        'active',
        jsonb_build_object(
          'runtime_model_profile_slug', 'text-reasoning-pro',
          'underlying_model', 'replicate/anthropic/claude-4-sonnet',
          'tags', jsonb_build_array('Natural companion', 'Reasoning'),
          'status_label', 'Available now',
          'coming_soon', false
        )
      ),
      (
        'text-gpt-4-1',
        'text',
        'replicate',
        'replicate-gpt-4.1',
        'OpenAI GPT-4.1',
        'pro',
        'active',
        jsonb_build_object(
          'runtime_model_profile_slug', 'text-gpt-4-1',
          'underlying_model', 'replicate/openai/gpt-4.1',
          'tags', jsonb_build_array('Balanced quality', 'Reliable'),
          'status_label', 'Available now',
          'coming_soon', false
        )
      ),
      (
        'text-gemini-2-5-pro',
        'text',
        'google',
        'gemini-2.5-pro',
        'Google Gemini 2.5 Pro',
        'pro',
        'disabled',
        jsonb_build_object(
          'tags', jsonb_build_array('Reasoning', 'Multimodal-ready'),
          'status_label', 'Official integration planned',
          'coming_soon', true
        )
      ),
      (
        'text-deepseek-chat',
        'text',
        'deepseek',
        'deepseek-chat',
        'DeepSeek Chat',
        'free',
        'disabled',
        jsonb_build_object(
          'tags', jsonb_build_array('Chinese-friendly', 'Low cost'),
          'status_label', 'Official integration planned',
          'coming_soon', true
        )
      ),
      (
        'image-nano-banana',
        'image',
        'replicate',
        'google/nano-banana',
        'Google Nano Banana',
        'free',
        'active',
        jsonb_build_object(
          'tags', jsonb_build_array('Fast', 'Mainstream'),
          'status_label', 'Available now',
          'coming_soon', false
        )
      ),
      (
        'image-flux-2-pro',
        'image',
        'replicate',
        'black-forest-labs/flux-2-pro',
        'FLUX.2 Pro',
        'free',
        'active',
        jsonb_build_object(
          'tags', jsonb_build_array('High quality', 'Design-friendly'),
          'status_label', 'Available now',
          'coming_soon', false
        )
      ),
      (
        'image-nano-banana-pro',
        'image',
        'google',
        'gemini-3-pro-image-preview',
        'Google Nano Banana Pro',
        'pro',
        'disabled',
        jsonb_build_object(
          'tags', jsonb_build_array('Portrait quality', 'Premium'),
          'status_label', 'Official integration planned',
          'coming_soon', true
        )
      ),
      (
        'image-ideogram-3',
        'image',
        'ideogram',
        'ideogram-3.0',
        'Ideogram 3.0',
        'pro',
        'disabled',
        jsonb_build_object(
          'tags', jsonb_build_array('Poster text', 'Design-focused'),
          'status_label', 'Official integration planned',
          'coming_soon', true
        )
      ),
      (
        'image-recraft-v4-pro',
        'image',
        'recraft',
        'recraft-v4-pro',
        'Recraft V4 Pro',
        'pro',
        'disabled',
        jsonb_build_object(
          'tags', jsonb_build_array('Design-focused', 'Brand visual'),
          'status_label', 'Official integration planned',
          'coming_soon', true
        )
      ),
      (
        'audio-minimax-speech',
        'audio',
        'minimax',
        'minimax-speech',
        'MiniMax Speech',
        'free',
        'disabled',
        jsonb_build_object(
          'tags', jsonb_build_array('Chinese-friendly', 'Fast'),
          'status_label', 'Official integration planned',
          'coming_soon', true
        )
      ),
      (
        'audio-gemini-flash-tts',
        'audio',
        'google',
        'gemini-2.5-flash-tts',
        'Google Gemini 2.5 Flash TTS',
        'free',
        'disabled',
        jsonb_build_object(
          'tags', jsonb_build_array('Fast', 'Expressive voice'),
          'status_label', 'Official integration planned',
          'coming_soon', true
        )
      ),
      (
        'audio-elevenlabs-v3',
        'audio',
        'elevenlabs',
        'eleven-v3',
        'ElevenLabs Eleven v3',
        'pro',
        'disabled',
        jsonb_build_object(
          'tags', jsonb_build_array('Human-like voice', 'Expressive voice'),
          'status_label', 'Official integration planned',
          'coming_soon', true
        )
      ),
      (
        'audio-gemini-pro-tts',
        'audio',
        'google',
        'gemini-2.5-pro-tts',
        'Google Gemini 2.5 Pro TTS',
        'pro',
        'disabled',
        jsonb_build_object(
          'tags', jsonb_build_array('Expressive voice', 'Premium'),
          'status_label', 'Official integration planned',
          'coming_soon', true
        )
      )
  ) as rows (
    slug,
    capability_type,
    provider,
    model_key,
    display_name,
    quality_tier,
    availability_status,
    metadata
  )
),
upserted_models as (
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
  select
    slug,
    capability_type,
    provider,
    model_key,
    display_name,
    quality_tier,
    availability_status,
    metadata
  from model_capability_rows
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
  returning id, slug
),
plan_map as (
  select id, slug
  from public.product_billing_plans
  where slug in ('free', 'pro')
),
access_rows as (
  select *
  from (
    values
      ('free', 'text-core-lite', 'included', true),
      ('free', 'text-creative-lite', 'included', false),
      ('free', 'text-reasoning-pro', 'upgrade_required', false),
      ('free', 'text-gpt-4-1', 'upgrade_required', false),
      ('free', 'text-gemini-2-5-pro', 'upgrade_required', false),
      ('free', 'text-deepseek-chat', 'included', false),
      ('pro', 'text-core-lite', 'included', false),
      ('pro', 'text-creative-lite', 'included', false),
      ('pro', 'text-reasoning-pro', 'included', true),
      ('pro', 'text-gpt-4-1', 'included', false),
      ('pro', 'text-gemini-2-5-pro', 'included', false),
      ('pro', 'text-deepseek-chat', 'included', false),
      ('free', 'image-nano-banana', 'included', true),
      ('free', 'image-flux-2-pro', 'included', false),
      ('free', 'image-nano-banana-pro', 'upgrade_required', false),
      ('free', 'image-ideogram-3', 'upgrade_required', false),
      ('free', 'image-recraft-v4-pro', 'upgrade_required', false),
      ('pro', 'image-nano-banana', 'included', false),
      ('pro', 'image-flux-2-pro', 'included', false),
      ('pro', 'image-nano-banana-pro', 'included', true),
      ('pro', 'image-ideogram-3', 'included', false),
      ('pro', 'image-recraft-v4-pro', 'included', false),
      ('free', 'audio-minimax-speech', 'included', true),
      ('free', 'audio-gemini-flash-tts', 'included', false),
      ('free', 'audio-elevenlabs-v3', 'upgrade_required', false),
      ('free', 'audio-gemini-pro-tts', 'upgrade_required', false),
      ('pro', 'audio-minimax-speech', 'included', false),
      ('pro', 'audio-gemini-flash-tts', 'included', false),
      ('pro', 'audio-elevenlabs-v3', 'included', true),
      ('pro', 'audio-gemini-pro-tts', 'included', false)
  ) as rows (plan_slug, model_slug, access_level, is_default)
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
  access_rows.access_level,
  access_rows.is_default,
  jsonb_build_object('managed_by_catalog_migration', true)
from access_rows
join plan_map on plan_map.slug = access_rows.plan_slug
join upserted_models as model_map on model_map.slug = access_rows.model_slug
on conflict (plan_id, model_capability_id) do update
set
  access_level = excluded.access_level,
  is_default = excluded.is_default,
  metadata = coalesce(public.product_plan_model_access.metadata, '{}'::jsonb) || excluded.metadata,
  updated_at = timezone('utc', now());

insert into public.model_profiles (
  slug,
  name,
  provider,
  model,
  temperature,
  max_output_tokens,
  metadata,
  is_active
)
values (
  'text-gpt-4-1',
  'OpenAI GPT-4.1',
  'replicate',
  'replicate-gpt-4.1',
  0.35,
  1024,
  jsonb_build_object(
    'product_billing_managed', true,
    'tier', 'pro-balanced',
    'tier_label', 'Pro',
    'usage_note', 'Balanced premium text model for stronger general quality and instruction following.',
    'underlying_model', 'replicate/openai/gpt-4.1'
  ),
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  provider = excluded.provider,
  model = excluded.model,
  temperature = excluded.temperature,
  max_output_tokens = excluded.max_output_tokens,
  metadata = coalesce(public.model_profiles.metadata, '{}'::jsonb) || excluded.metadata,
  is_active = true,
  updated_at = timezone('utc', now());
