update public.product_model_capabilities
set
  provider = 'replicate',
  model_key = 'replicate-gpt-4o-mini',
  display_name = 'OpenAI GPT-4o mini',
  quality_tier = 'free',
  availability_status = 'active',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'runtime_model_profile_slug', 'text-core-lite',
    'underlying_model', 'replicate/openai/gpt-4o-mini',
    'coming_soon', false
  ),
  updated_at = timezone('utc', now())
where slug = 'text-core-lite';

update public.product_model_capabilities
set
  provider = 'replicate',
  model_key = 'replicate-llama-3-8b',
  display_name = 'Meta Llama 3 8B',
  quality_tier = 'free',
  availability_status = 'active',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'runtime_model_profile_slug', 'text-creative-lite',
    'underlying_model', 'replicate/meta/meta-llama-3-8b-instruct',
    'coming_soon', false
  ),
  updated_at = timezone('utc', now())
where slug = 'text-creative-lite';

update public.product_model_capabilities
set
  provider = 'replicate',
  model_key = 'replicate-claude-4-sonnet',
  display_name = 'Anthropic Claude 4 Sonnet',
  quality_tier = 'pro',
  availability_status = 'active',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'runtime_model_profile_slug', 'text-reasoning-pro',
    'underlying_model', 'replicate/anthropic/claude-4-sonnet',
    'coming_soon', false
  ),
  updated_at = timezone('utc', now())
where slug = 'text-reasoning-pro';

update public.product_model_capabilities
set
  provider = 'placeholder',
  model_key = 'image-generation-coming-soon',
  display_name = 'Image Generation (Coming soon)',
  availability_status = 'preview',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'coming_soon', true
  ),
  updated_at = timezone('utc', now())
where slug = 'image-fast-lite';

update public.product_model_capabilities
set
  provider = 'placeholder',
  model_key = 'image-studio-pro-coming-soon',
  display_name = 'Image Studio Pro (Coming soon)',
  availability_status = 'preview',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'coming_soon', true
  ),
  updated_at = timezone('utc', now())
where slug = 'image-studio-pro';

update public.product_model_capabilities
set
  provider = 'placeholder',
  model_key = 'audio-reply-lite-coming-soon',
  display_name = 'Audio Reply Lite (Coming soon)',
  availability_status = 'preview',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'coming_soon', true
  ),
  updated_at = timezone('utc', now())
where slug = 'audio-basic-lite';

update public.product_model_capabilities
set
  provider = 'placeholder',
  model_key = 'audio-reply-pro-coming-soon',
  display_name = 'Audio Reply Pro (Coming soon)',
  availability_status = 'preview',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'coming_soon', true
  ),
  updated_at = timezone('utc', now())
where slug = 'audio-expressive-pro';

update public.product_plan_model_access
set
  access_level = 'upgrade_required',
  is_default = false,
  updated_at = timezone('utc', now())
where model_capability_id in (
  select id
  from public.product_model_capabilities
  where slug in ('image-fast-lite', 'image-studio-pro', 'audio-basic-lite', 'audio-expressive-pro')
);

update public.model_profiles
set
  name = 'OpenAI GPT-4o mini',
  provider = 'replicate',
  model = 'replicate-gpt-4o-mini',
  temperature = 0.45,
  max_output_tokens = 768,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'product_billing_managed', true,
    'tier', 'free-core',
    'tier_label', 'Free',
    'usage_note', 'Default low-cost text model for free-tier chat continuity and everyday replies.',
    'underlying_model', 'replicate/openai/gpt-4o-mini'
  ),
  is_active = true,
  updated_at = timezone('utc', now())
where slug = 'text-core-lite';

update public.model_profiles
set
  name = 'Meta Llama 3 8B',
  provider = 'replicate',
  model = 'replicate-llama-3-8b',
  temperature = 0.7,
  max_output_tokens = 512,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'product_billing_managed', true,
    'tier', 'free-open',
    'tier_label', 'Free',
    'usage_note', 'Open-weight free-tier text model for cheaper and faster everyday conversation.',
    'underlying_model', 'replicate/meta/meta-llama-3-8b-instruct'
  ),
  is_active = true,
  updated_at = timezone('utc', now())
where slug = 'text-creative-lite';

update public.model_profiles
set
  name = 'Anthropic Claude 4 Sonnet',
  provider = 'replicate',
  model = 'replicate-claude-4-sonnet',
  temperature = 0.2,
  max_output_tokens = 1024,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'product_billing_managed', true,
    'tier', 'pro-reasoning',
    'tier_label', 'Pro',
    'usage_note', 'Higher-quality paid text model for better reasoning, synthesis, and premium conversation quality.',
    'underlying_model', 'replicate/anthropic/claude-4-sonnet'
  ),
  is_active = true,
  updated_at = timezone('utc', now())
where slug = 'text-reasoning-pro';
