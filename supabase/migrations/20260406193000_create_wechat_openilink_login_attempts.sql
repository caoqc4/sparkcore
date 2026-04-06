create table if not exists public.wechat_openilink_login_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'starting',
  qr_url text,
  error_message text,
  bot_id text,
  wechat_user_id text,
  channel_id text,
  peer_id text,
  platform_user_id text,
  connected_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint wechat_openilink_login_attempts_status_check check (
    status in ('starting', 'qr_ready', 'scanned', 'connected', 'identity_ready', 'error')
  )
);

create index if not exists wechat_openilink_login_attempts_workspace_id_idx
  on public.wechat_openilink_login_attempts (workspace_id);

create index if not exists wechat_openilink_login_attempts_user_id_idx
  on public.wechat_openilink_login_attempts (user_id);

create index if not exists wechat_openilink_login_attempts_status_idx
  on public.wechat_openilink_login_attempts (status);

create index if not exists wechat_openilink_login_attempts_updated_at_idx
  on public.wechat_openilink_login_attempts (updated_at desc);

drop trigger if exists wechat_openilink_login_attempts_set_updated_at on public.wechat_openilink_login_attempts;
create trigger wechat_openilink_login_attempts_set_updated_at
before update on public.wechat_openilink_login_attempts
for each row
execute function public.set_updated_at();

alter table public.wechat_openilink_login_attempts enable row level security;

drop policy if exists "Users can read their own wechat openilink login attempts" on public.wechat_openilink_login_attempts;
create policy "Users can read their own wechat openilink login attempts"
on public.wechat_openilink_login_attempts
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can create their own wechat openilink login attempts" on public.wechat_openilink_login_attempts;
create policy "Users can create their own wechat openilink login attempts"
on public.wechat_openilink_login_attempts
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);
