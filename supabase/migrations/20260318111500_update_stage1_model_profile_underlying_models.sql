update public.model_profiles
set
  provider = 'replicate',
  model = 'replicate-gpt-4o-mini',
  temperature = 0.35,
  max_output_tokens = 768,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'seed', true,
    'default', true,
    'stage1_quality', true,
    'tier', 'stable-conversation',
    'tier_label', 'Stable conversation',
    'usage_note', 'Balanced default for everyday conversation, multilingual replies, and higher-quality baseline checks.',
    'underlying_model', 'replicate/openai/gpt-4o-mini'
  ),
  is_active = true,
  updated_at = timezone('utc', now())
where slug = 'spark-default';

update public.model_profiles
set
  provider = 'replicate',
  model = 'replicate-claude-4-sonnet',
  temperature = 0.15,
  max_output_tokens = 768,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'seed', true,
    'stage1_quality', true,
    'tier', 'memory-sensitive',
    'tier_label', 'Memory-sensitive',
    'usage_note', 'Use this when you want to compare memory-grounded answers, direct follow-up fidelity, and relationship recall.',
    'underlying_model', 'replicate/anthropic/claude-4-sonnet'
  ),
  is_active = true,
  updated_at = timezone('utc', now())
where slug = 'spark-memory-sensitive';

update public.model_profiles
set
  provider = 'replicate',
  model = 'replicate-llama-3-8b',
  temperature = 0.7,
  max_output_tokens = 256,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'seed', true,
    'stage1_quality', true,
    'tier', 'low-cost-testing',
    'tier_label', 'Low-cost testing',
    'usage_note', 'Use this for cheaper smoke checks, rough language tests, and fast prompt iteration.',
    'underlying_model', 'replicate/meta/meta-llama-3-8b-instruct'
  ),
  is_active = true,
  updated_at = timezone('utc', now())
where slug = 'spark-low-cost-testing';
