insert into public.product_portrait_assets (
  owner_user_id,
  workspace_id,
  provider,
  source_type,
  storage_path,
  public_url,
  display_name,
  gender_presentation,
  style_tags,
  is_shared,
  metadata
)
values
  (
    null,
    null,
    'SparkCore',
    'preset',
    'character-assets/caria/portrait-main.webp',
    null,
    'Caria',
    'female',
    jsonb_build_array('realistic', 'warm'),
    true,
    jsonb_build_object('character_slug', 'caria', 'variant', 'main')
  ),
  (
    null,
    null,
    'SparkCore',
    'preset',
    'character-assets/teven/portrait-main.webp',
    null,
    'Teven',
    'male',
    jsonb_build_array('realistic', 'steady'),
    true,
    jsonb_build_object('character_slug', 'teven', 'variant', 'main')
  ),
  (
    null,
    null,
    'SparkCore',
    'preset',
    'character-assets/velia/portrait-main.webp',
    null,
    'Velia',
    'female',
    jsonb_build_array('illustrated', 'playful'),
    true,
    jsonb_build_object('character_slug', 'velia', 'variant', 'main')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/aurora.webp', null,
    'Aurora', 'female', jsonb_build_array('realistic'), true, jsonb_build_object('preset_id', 'aurora')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/luna.webp', null,
    'Luna', 'female', jsonb_build_array('realistic'), true, jsonb_build_object('preset_id', 'luna')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/sage.webp', null,
    'Sage', 'female', jsonb_build_array('realistic'), true, jsonb_build_object('preset_id', 'sage')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/ember.webp', null,
    'Ember', 'female', jsonb_build_array('realistic'), true, jsonb_build_object('preset_id', 'ember')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/atlas.webp', null,
    'Atlas', 'male', jsonb_build_array('realistic'), true, jsonb_build_object('preset_id', 'atlas')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/river.webp', null,
    'River', 'male', jsonb_build_array('realistic'), true, jsonb_build_object('preset_id', 'river')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/orion.webp', null,
    'Orion', 'male', jsonb_build_array('realistic'), true, jsonb_build_object('preset_id', 'orion')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/hana.webp', null,
    'Hana', 'female', jsonb_build_array('anime'), true, jsonb_build_object('preset_id', 'hana')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/yuki.webp', null,
    'Yuki', 'female', jsonb_build_array('anime'), true, jsonb_build_object('preset_id', 'yuki')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/akari.webp', null,
    'Akari', 'female', jsonb_build_array('anime'), true, jsonb_build_object('preset_id', 'akari')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/kaito.webp', null,
    'Kaito', 'male', jsonb_build_array('anime'), true, jsonb_build_object('preset_id', 'kaito')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/ren.webp', null,
    'Ren', 'male', jsonb_build_array('anime'), true, jsonb_build_object('preset_id', 'ren')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/nova.webp', null,
    'Nova', 'neutral', jsonb_build_array('illustrated'), true, jsonb_build_object('preset_id', 'nova')
  ),
  (
    null, null, 'SparkCore', 'preset', 'character-assets/presets/echo.webp', null,
    'Echo', 'neutral', jsonb_build_array('illustrated'), true, jsonb_build_object('preset_id', 'echo')
  )
on conflict do nothing;
