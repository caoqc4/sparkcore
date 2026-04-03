-- Deactivate portrait asset records whose storage paths point to files that no
-- longer exist in the bucket.  The original seed migration (20260331152000)
-- created placeholder records under the old path conventions:
--   character-assets/caria/portrait-main.webp
--   character-assets/teven/portrait-main.webp
--   character-assets/velia/portrait-main.webp
--   character-assets/presets/*.webp   (aurora, luna, atlas, hana, nova, …)
--
-- Real portrait files are now stored under:
--   portrait-pool/realistic/female/caria-main.webp
--   portrait-pool/realistic/male/teven-main.webp
--   etc.
-- and were inserted via the import script with is_active = true.
--
-- Setting is_active = false on the stale records hides them from all queries
-- without losing the audit trail.

update public.product_portrait_assets
set
  is_active   = false,
  updated_at  = timezone('utc', now())
where source_type = 'preset'
  and (
    storage_path like 'character-assets/caria/%'
    or storage_path like 'character-assets/teven/%'
    or storage_path like 'character-assets/velia/%'
    or storage_path like 'character-assets/presets/%'
  );
