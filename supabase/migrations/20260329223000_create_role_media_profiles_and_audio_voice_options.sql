create table if not exists public.product_audio_voice_options (
  id uuid primary key default gen_random_uuid(),
  model_slug text not null,
  provider text not null,
  voice_key text not null,
  display_name text not null,
  gender_presentation text,
  style_tags jsonb not null default '[]'::jsonb,
  sort_order integer not null default 100,
  is_default boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_audio_voice_options_model_voice_unique
    unique (model_slug, voice_key),
  constraint product_audio_voice_options_gender_presentation_check
    check (
      gender_presentation is null
      or gender_presentation in ('female', 'male', 'neutral')
    )
);

create index if not exists product_audio_voice_options_model_slug_idx
  on public.product_audio_voice_options (model_slug);

create index if not exists product_audio_voice_options_provider_idx
  on public.product_audio_voice_options (provider);

create index if not exists product_audio_voice_options_is_active_idx
  on public.product_audio_voice_options (is_active);

drop trigger if exists product_audio_voice_options_set_updated_at on public.product_audio_voice_options;
create trigger product_audio_voice_options_set_updated_at
before update on public.product_audio_voice_options
for each row
execute function public.set_updated_at();

alter table public.product_audio_voice_options enable row level security;

drop policy if exists "Authenticated users can read active audio voice options" on public.product_audio_voice_options;
create policy "Authenticated users can read active audio voice options"
on public.product_audio_voice_options
for select
to authenticated
using (is_active = true);

create table if not exists public.role_media_profiles (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null unique references public.agents (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  portrait_preset_id text,
  portrait_style text,
  portrait_gender text,
  portrait_source_type text,
  portrait_storage_path text,
  portrait_public_url text,
  portrait_reference_enabled_by_default boolean not null default true,
  portrait_style_notes text not null default '',
  audio_voice_option_id uuid references public.product_audio_voice_options (id) on delete set null,
  audio_provider text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint role_media_profiles_portrait_style_check
    check (
      portrait_style is null
      or portrait_style in ('realistic', 'anime', 'illustrated')
    ),
  constraint role_media_profiles_portrait_gender_check
    check (
      portrait_gender is null
      or portrait_gender in ('female', 'male', 'neutral')
    ),
  constraint role_media_profiles_portrait_source_type_check
    check (
      portrait_source_type is null
      or portrait_source_type in ('preset', 'upload', 'generated')
    )
);

create index if not exists role_media_profiles_workspace_id_idx
  on public.role_media_profiles (workspace_id);

create index if not exists role_media_profiles_owner_user_id_idx
  on public.role_media_profiles (owner_user_id);

create index if not exists role_media_profiles_audio_voice_option_id_idx
  on public.role_media_profiles (audio_voice_option_id);

drop trigger if exists role_media_profiles_set_updated_at on public.role_media_profiles;
create trigger role_media_profiles_set_updated_at
before update on public.role_media_profiles
for each row
execute function public.set_updated_at();

alter table public.role_media_profiles enable row level security;

drop policy if exists "Users can read their own role media profiles" on public.role_media_profiles;
create policy "Users can read their own role media profiles"
on public.role_media_profiles
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "Users can create their own role media profiles" on public.role_media_profiles;
create policy "Users can create their own role media profiles"
on public.role_media_profiles
for insert
to authenticated
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can update their own role media profiles" on public.role_media_profiles;
create policy "Users can update their own role media profiles"
on public.role_media_profiles
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own role media profiles" on public.role_media_profiles;
create policy "Users can delete their own role media profiles"
on public.role_media_profiles
for delete
to authenticated
using (auth.uid() = owner_user_id);

create or replace function public.sync_role_media_profile_from_agent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  appearance jsonb;
begin
  appearance :=
    case
      when new.metadata is not null
        and jsonb_typeof(new.metadata) = 'object'
        and jsonb_typeof(new.metadata -> 'product_role_appearance') = 'object'
      then new.metadata -> 'product_role_appearance'
      else '{}'::jsonb
    end;

  insert into public.role_media_profiles (
    agent_id,
    workspace_id,
    owner_user_id,
    portrait_preset_id,
    portrait_style,
    portrait_gender,
    portrait_source_type
  )
  values (
    new.id,
    new.workspace_id,
    new.owner_user_id,
    nullif(appearance ->> 'avatar_preset_id', ''),
    nullif(appearance ->> 'avatar_style', ''),
    nullif(appearance ->> 'avatar_gender', ''),
    nullif(appearance ->> 'avatar_origin', '')
  )
  on conflict (agent_id) do update
  set
    workspace_id = excluded.workspace_id,
    owner_user_id = excluded.owner_user_id,
    portrait_preset_id = excluded.portrait_preset_id,
    portrait_style = excluded.portrait_style,
    portrait_gender = excluded.portrait_gender,
    portrait_source_type = excluded.portrait_source_type,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists agents_sync_role_media_profile on public.agents;
create trigger agents_sync_role_media_profile
after insert or update of metadata, workspace_id, owner_user_id
on public.agents
for each row
execute function public.sync_role_media_profile_from_agent();

insert into public.role_media_profiles (
  agent_id,
  workspace_id,
  owner_user_id,
  portrait_preset_id,
  portrait_style,
  portrait_gender,
  portrait_source_type
)
select
  agents.id,
  agents.workspace_id,
  agents.owner_user_id,
  nullif(agents.metadata #>> '{product_role_appearance,avatar_preset_id}', ''),
  nullif(agents.metadata #>> '{product_role_appearance,avatar_style}', ''),
  nullif(agents.metadata #>> '{product_role_appearance,avatar_gender}', ''),
  nullif(agents.metadata #>> '{product_role_appearance,avatar_origin}', '')
from public.agents
left join public.role_media_profiles
  on role_media_profiles.agent_id = agents.id
where role_media_profiles.agent_id is null
on conflict (agent_id) do nothing;

insert into public.product_audio_voice_options (
  model_slug,
  provider,
  voice_key,
  display_name,
  gender_presentation,
  style_tags,
  sort_order,
  is_default,
  metadata
)
values
  (
    'audio-minimax-speech',
    'MiniMax',
    'minimax-warm-companion-f',
    'Warm Companion',
    'female',
    jsonb_build_array('Warm', 'Soft'),
    10,
    true,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-minimax-speech',
    'MiniMax',
    'minimax-steady-guide-m',
    'Steady Guide',
    'male',
    jsonb_build_array('Calm', 'Clear'),
    20,
    false,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-gemini-2-5-flash-tts',
    'Google',
    'gemini-flash-bright-f',
    'Bright Reply',
    'female',
    jsonb_build_array('Bright', 'Fast'),
    10,
    true,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-gemini-2-5-flash-tts',
    'Google',
    'gemini-flash-grounded-n',
    'Grounded Reply',
    'neutral',
    jsonb_build_array('Grounded', 'Clear'),
    20,
    false,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-gemini-2-5-pro-tts',
    'Google',
    'gemini-pro-expressive-f',
    'Expressive Lead',
    'female',
    jsonb_build_array('Expressive', 'Premium'),
    10,
    true,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-gemini-2-5-pro-tts',
    'Google',
    'gemini-pro-composed-m',
    'Composed Lead',
    'male',
    jsonb_build_array('Calm', 'Premium'),
    20,
    false,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-elevenlabs-v3',
    'ElevenLabs',
    'eleven-v3-warm-muse',
    'Warm Muse',
    'female',
    jsonb_build_array('Warm', 'Expressive'),
    10,
    true,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-elevenlabs-v3',
    'ElevenLabs',
    'eleven-v3-calm-anchor',
    'Calm Anchor',
    'male',
    jsonb_build_array('Calm', 'Deep'),
    20,
    false,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-elevenlabs-multilingual-v2',
    'ElevenLabs',
    'eleven-multi-clear-guide',
    'Clear Guide',
    'neutral',
    jsonb_build_array('Clear', 'Multilingual'),
    10,
    true,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-elevenlabs-multilingual-v2',
    'ElevenLabs',
    'eleven-multi-soft-companion',
    'Soft Companion',
    'female',
    jsonb_build_array('Soft', 'Multilingual'),
    20,
    false,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-aws-polly-neural',
    'AWS',
    'polly-neural-reliable-f',
    'Reliable Voice',
    'female',
    jsonb_build_array('Reliable', 'Low cost'),
    10,
    true,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-aws-polly-neural',
    'AWS',
    'polly-neural-clear-m',
    'Clear Voice',
    'male',
    jsonb_build_array('Reliable', 'Clear'),
    20,
    false,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-aws-polly-generative',
    'AWS',
    'polly-generative-premium-f',
    'Premium Voice',
    'female',
    jsonb_build_array('Premium', 'Reliable'),
    10,
    true,
    jsonb_build_object('seed', true)
  ),
  (
    'audio-aws-polly-generative',
    'AWS',
    'polly-generative-steady-n',
    'Steady Voice',
    'neutral',
    jsonb_build_array('Premium', 'Steady'),
    20,
    false,
    jsonb_build_object('seed', true)
  )
on conflict (model_slug, voice_key) do update
set
  provider = excluded.provider,
  display_name = excluded.display_name,
  gender_presentation = excluded.gender_presentation,
  style_tags = excluded.style_tags,
  sort_order = excluded.sort_order,
  is_default = excluded.is_default,
  is_active = true,
  metadata = excluded.metadata,
  updated_at = timezone('utc', now());
