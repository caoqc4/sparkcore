alter table public.channel_bindings
  add column if not exists character_channel_slug text;

create index if not exists channel_bindings_character_channel_slug_idx
  on public.channel_bindings (character_channel_slug);

drop index if exists public.channel_bindings_lookup_idx;

create index if not exists channel_bindings_lookup_idx
  on public.channel_bindings (
    platform,
    channel_id,
    peer_id,
    platform_user_id,
    character_channel_slug,
    status
  );

drop index if exists public.channel_bindings_active_identity_unique_idx;

create unique index if not exists channel_bindings_active_identity_channel_unique_idx
  on public.channel_bindings (
    platform,
    channel_id,
    peer_id,
    platform_user_id,
    coalesce(character_channel_slug, '')
  )
  where status = 'active';
