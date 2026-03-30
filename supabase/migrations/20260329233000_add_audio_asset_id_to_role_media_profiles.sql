alter table public.role_media_profiles
  add column if not exists audio_asset_id uuid references public.product_audio_voice_options (id) on delete set null;

create index if not exists role_media_profiles_audio_asset_id_idx
  on public.role_media_profiles (audio_asset_id);

update public.role_media_profiles
set audio_asset_id = audio_voice_option_id,
    updated_at = timezone('utc', now())
where audio_asset_id is null
  and audio_voice_option_id is not null;
