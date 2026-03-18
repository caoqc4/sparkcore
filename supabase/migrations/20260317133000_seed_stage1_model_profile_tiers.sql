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
    'spark-default',
    'Spark Default',
    'replicate',
    'replicate-gpt-4o-mini',
    0.35,
    768,
    jsonb_build_object(
      'seed', true,
      'default', true,
      'stage1_quality', true,
      'tier', 'stable-conversation',
      'tier_label', 'Stable conversation',
      'usage_note', 'Balanced default for everyday conversation, multilingual replies, and higher-quality baseline checks.',
      'underlying_model', 'replicate/openai/gpt-4o-mini'
    )
  ),
  (
    'spark-memory-sensitive',
    'Spark Memory Sensitive',
    'replicate',
    'replicate-claude-4-sonnet',
    0.15,
    768,
    jsonb_build_object(
      'seed', true,
      'stage1_quality', true,
      'tier', 'memory-sensitive',
      'tier_label', 'Memory-sensitive',
      'usage_note', 'Use this when you want to compare memory-grounded answers, direct follow-up fidelity, and relationship recall.',
      'underlying_model', 'replicate/anthropic/claude-4-sonnet'
    )
  ),
  (
    'spark-low-cost-testing',
    'Spark Low-Cost Testing',
    'replicate',
    'replicate-llama-3-8b',
    0.7,
    256,
    jsonb_build_object(
      'seed', true,
      'stage1_quality', true,
      'tier', 'low-cost-testing',
      'tier_label', 'Low-cost testing',
      'usage_note', 'Use this for cheaper smoke checks, rough language tests, and fast prompt iteration.',
      'underlying_model', 'replicate/meta/meta-llama-3-8b-instruct'
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
