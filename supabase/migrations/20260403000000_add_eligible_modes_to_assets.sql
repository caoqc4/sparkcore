-- Add eligible_modes column to product_portrait_assets and product_audio_voice_options.
--
-- eligible_modes text[] — an empty array (default) means "no restriction, all modes".
-- Non-empty values restrict the asset to the listed role modes only.
-- Valid values: 'companion', 'assistant'.
--
-- This allows a single asset to be:
--   []                              — usable by all modes (default)
--   ['companion']                   — companion roles only
--   ['assistant']                   — assistant roles only
--   ['companion', 'assistant']      — explicitly both (same as empty, explicit form)

alter table public.product_portrait_assets
  add column if not exists eligible_modes text[] not null default '{}';

alter table public.product_portrait_assets
  add constraint product_portrait_assets_eligible_modes_check
  check (
    eligible_modes <@ array['companion', 'assistant']::text[]
  );

create index if not exists product_portrait_assets_eligible_modes_idx
  on public.product_portrait_assets using gin (eligible_modes);

alter table public.product_audio_voice_options
  add column if not exists eligible_modes text[] not null default '{}';

alter table public.product_audio_voice_options
  add constraint product_audio_voice_options_eligible_modes_check
  check (
    eligible_modes <@ array['companion', 'assistant']::text[]
  );

create index if not exists product_audio_voice_options_eligible_modes_idx
  on public.product_audio_voice_options using gin (eligible_modes);
