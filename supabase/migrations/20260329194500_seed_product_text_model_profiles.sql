insert into public.model_profiles (
  slug,
  name,
  provider,
  model,
  temperature,
  max_output_tokens,
  metadata
)
values
  (
    'text-core-lite',
    'Text Core Lite',
    'openai',
    'gpt-4o-mini',
    0.45,
    768,
    jsonb_build_object(
      'seed', true,
      'product_billing_managed', true,
      'tier', 'free-core',
      'tier_label', 'Free core',
      'usage_note', 'Default low-cost text model for free-tier chat continuity and everyday replies.',
      'underlying_model', 'openai/gpt-4o-mini'
    )
  ),
  (
    'text-creative-lite',
    'Text Creative Lite',
    'anthropic',
    'claude-3-5-haiku-latest',
    0.65,
    768,
    jsonb_build_object(
      'seed', true,
      'product_billing_managed', true,
      'tier', 'free-creative',
      'tier_label', 'Free creative',
      'usage_note', 'Alternative free-tier text model with slightly more expressive style for lighter conversations.',
      'underlying_model', 'anthropic/claude-3-5-haiku-latest'
    )
  ),
  (
    'text-reasoning-pro',
    'Text Reasoning Pro',
    'openai',
    'gpt-5-mini',
    0.35,
    1024,
    jsonb_build_object(
      'seed', true,
      'product_billing_managed', true,
      'tier', 'pro-reasoning',
      'tier_label', 'Pro reasoning',
      'usage_note', 'Higher-quality paid text model for better reasoning, synthesis, and premium conversation quality.',
      'underlying_model', 'openai/gpt-5-mini'
    )
  )
on conflict (slug) do update
set
  name = excluded.name,
  provider = excluded.provider,
  model = excluded.model,
  temperature = excluded.temperature,
  max_output_tokens = excluded.max_output_tokens,
  metadata = public.model_profiles.metadata || excluded.metadata,
  is_active = true,
  updated_at = timezone('utc', now());
