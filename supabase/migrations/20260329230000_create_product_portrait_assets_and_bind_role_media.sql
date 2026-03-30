create table if not exists public.product_portrait_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  provider text,
  source_type text not null,
  storage_path text,
  public_url text,
  display_name text,
  gender_presentation text,
  style_tags jsonb not null default '[]'::jsonb,
  is_shared boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_portrait_assets_source_type_check
    check (source_type in ('preset', 'upload', 'generated')),
  constraint product_portrait_assets_gender_presentation_check
    check (
      gender_presentation is null
      or gender_presentation in ('female', 'male', 'neutral')
    )
);

create index if not exists product_portrait_assets_owner_user_id_idx
  on public.product_portrait_assets (owner_user_id);

create index if not exists product_portrait_assets_workspace_id_idx
  on public.product_portrait_assets (workspace_id);

create index if not exists product_portrait_assets_source_type_idx
  on public.product_portrait_assets (source_type);

create index if not exists product_portrait_assets_is_active_idx
  on public.product_portrait_assets (is_active);

drop trigger if exists product_portrait_assets_set_updated_at on public.product_portrait_assets;
create trigger product_portrait_assets_set_updated_at
before update on public.product_portrait_assets
for each row
execute function public.set_updated_at();

alter table public.product_portrait_assets enable row level security;

drop policy if exists "Authenticated users can read shared or owned portrait assets" on public.product_portrait_assets;
create policy "Authenticated users can read shared or owned portrait assets"
on public.product_portrait_assets
for select
to authenticated
using (
  is_active = true
  and (
    is_shared = true
    or owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can create their own portrait assets" on public.product_portrait_assets;
create policy "Users can create their own portrait assets"
on public.product_portrait_assets
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspaces
      where workspaces.id = workspace_id
        and workspaces.owner_user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update their own portrait assets" on public.product_portrait_assets;
create policy "Users can update their own portrait assets"
on public.product_portrait_assets
for update
to authenticated
using (owner_user_id = auth.uid())
with check (
  owner_user_id = auth.uid()
  and (
    workspace_id is null
    or exists (
      select 1
      from public.workspaces
      where workspaces.id = workspace_id
        and workspaces.owner_user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can delete their own portrait assets" on public.product_portrait_assets;
create policy "Users can delete their own portrait assets"
on public.product_portrait_assets
for delete
to authenticated
using (owner_user_id = auth.uid());

alter table public.role_media_profiles
  add column if not exists portrait_asset_id uuid references public.product_portrait_assets (id) on delete set null;

create index if not exists role_media_profiles_portrait_asset_id_idx
  on public.role_media_profiles (portrait_asset_id);

with inserted_assets as (
  insert into public.product_portrait_assets (
    owner_user_id,
    workspace_id,
    source_type,
    storage_path,
    public_url,
    display_name,
    gender_presentation,
    metadata
  )
  select
    role_media_profiles.owner_user_id,
    role_media_profiles.workspace_id,
    coalesce(role_media_profiles.portrait_source_type, 'preset'),
    role_media_profiles.portrait_storage_path,
    role_media_profiles.portrait_public_url,
    case
      when role_media_profiles.portrait_preset_id is not null
        then 'Portrait ' || role_media_profiles.portrait_preset_id
      else 'Role portrait'
    end,
    role_media_profiles.portrait_gender,
      jsonb_strip_nulls(
        jsonb_build_object(
          'seed', true,
          'seed_role_media_profile_id', role_media_profiles.id,
          'portrait_preset_id', role_media_profiles.portrait_preset_id,
          'portrait_style', role_media_profiles.portrait_style,
          'portrait_style_notes', nullif(role_media_profiles.portrait_style_notes, '')
        )
      )
  from public.role_media_profiles
  where role_media_profiles.portrait_asset_id is null
    and (
      role_media_profiles.portrait_preset_id is not null
      or role_media_profiles.portrait_storage_path is not null
      or role_media_profiles.portrait_public_url is not null
    )
  returning id, owner_user_id, workspace_id, created_at, metadata
)
update public.role_media_profiles
set portrait_asset_id = inserted_assets.id,
    updated_at = timezone('utc', now())
from inserted_assets
where public.role_media_profiles.portrait_asset_id is null
  and public.role_media_profiles.id::text = inserted_assets.metadata ->> 'seed_role_media_profile_id';
