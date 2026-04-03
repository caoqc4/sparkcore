create table if not exists public.wechat_openilink_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'pending',
  bot_token text not null,
  base_url text not null,
  bot_id text,
  wechat_user_id text,
  sync_buf text,
  last_connected_at timestamptz,
  last_seen_at timestamptz,
  expired_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint wechat_openilink_sessions_status_check check (
    status in ('pending', 'active', 'expired', 'revoked')
  )
);

create index if not exists wechat_openilink_sessions_workspace_id_idx
  on public.wechat_openilink_sessions (workspace_id);

create index if not exists wechat_openilink_sessions_user_id_idx
  on public.wechat_openilink_sessions (user_id);

create index if not exists wechat_openilink_sessions_status_idx
  on public.wechat_openilink_sessions (status);

create index if not exists wechat_openilink_sessions_last_seen_at_idx
  on public.wechat_openilink_sessions (last_seen_at desc);

create unique index if not exists wechat_openilink_sessions_active_user_unique_idx
  on public.wechat_openilink_sessions (user_id)
  where status = 'active';

drop trigger if exists wechat_openilink_sessions_set_updated_at on public.wechat_openilink_sessions;
create trigger wechat_openilink_sessions_set_updated_at
before update on public.wechat_openilink_sessions
for each row
execute function public.set_updated_at();

alter table public.wechat_openilink_sessions enable row level security;
