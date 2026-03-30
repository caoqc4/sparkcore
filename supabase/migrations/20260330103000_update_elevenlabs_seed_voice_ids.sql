update public.product_audio_voice_options
set
  voice_key = 'JBFqnCBsd6RMkjVDRZzb',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'seed', true,
    'model_id', 'eleven_v3',
    'stability', 0.45,
    'similarity_boost', 0.82,
    'style', 0.28,
    'use_speaker_boost', true
  ),
  updated_at = timezone('utc', now())
where model_slug = 'audio-elevenlabs-v3'
  and display_name = 'Warm Muse';

update public.product_audio_voice_options
set
  voice_key = '21m00Tcm4TlvDq8ikWAM',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'seed', true,
    'model_id', 'eleven_v3',
    'stability', 0.5,
    'similarity_boost', 0.78,
    'style', 0.18,
    'use_speaker_boost', true
  ),
  updated_at = timezone('utc', now())
where model_slug = 'audio-elevenlabs-v3'
  and display_name = 'Calm Anchor';

update public.product_audio_voice_options
set
  voice_key = 'JBFqnCBsd6RMkjVDRZzb',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'seed', true,
    'model_id', 'eleven_multilingual_v2',
    'stability', 0.45,
    'similarity_boost', 0.82,
    'style', 0.2,
    'use_speaker_boost', true
  ),
  updated_at = timezone('utc', now())
where model_slug = 'audio-elevenlabs-multilingual-v2'
  and display_name = 'Clear Guide';

update public.product_audio_voice_options
set
  voice_key = '21m00Tcm4TlvDq8ikWAM',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'seed', true,
    'model_id', 'eleven_multilingual_v2',
    'stability', 0.52,
    'similarity_boost', 0.78,
    'style', 0.18,
    'use_speaker_boost', true
  ),
  updated_at = timezone('utc', now())
where model_slug = 'audio-elevenlabs-multilingual-v2'
  and display_name = 'Soft Companion';
