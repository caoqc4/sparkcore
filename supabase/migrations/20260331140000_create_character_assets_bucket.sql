-- Character assets bucket: stores portraits, audio samples, and other media
-- for system-defined characters (Caria, Teven, Velia) and preset options.
-- Public bucket — assets are served directly via CDN URL.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'character-assets',
  'character-assets',
  true,
  52428800, -- 50 MB
  array[
    'image/webp',
    'image/jpeg',
    'image/png',
    'audio/mpeg',
    'audio/mp4',
    'video/mp4'
  ]::text[]
)
on conflict (id) do nothing;

-- Public read policy: anyone can read character assets
create policy "character_assets_public_read"
  on storage.objects
  for select
  using (bucket_id = 'character-assets');

-- Write restricted to service role only (assets uploaded by admins, not users)
create policy "character_assets_service_write"
  on storage.objects
  for insert
  with check (
    bucket_id = 'character-assets'
    and auth.role() = 'service_role'
  );
