alter table public.product_audio_voice_options
  add column if not exists tier text not null default 'free';

alter table public.product_audio_voice_options
  drop constraint if exists product_audio_voice_options_tier_check;

alter table public.product_audio_voice_options
  add constraint product_audio_voice_options_tier_check
  check (tier in ('free', 'pro'));

create index if not exists product_audio_voice_options_tier_idx
  on public.product_audio_voice_options (tier);

update public.product_audio_voice_options
set tier =
  case
    when model_slug in (
      'audio-gemini-2-5-pro-tts',
      'audio-elevenlabs-v3',
      'audio-elevenlabs-multilingual-v2',
      'audio-aws-polly-generative'
    ) then 'pro'
    else 'free'
  end
where tier is distinct from
  case
    when model_slug in (
      'audio-gemini-2-5-pro-tts',
      'audio-elevenlabs-v3',
      'audio-elevenlabs-multilingual-v2',
      'audio-aws-polly-generative'
    ) then 'pro'
    else 'free'
  end;

alter table public.role_media_profiles
  add column if not exists portrait_locked_at timestamptz;

create index if not exists role_media_profiles_portrait_locked_at_idx
  on public.role_media_profiles (portrait_locked_at);
