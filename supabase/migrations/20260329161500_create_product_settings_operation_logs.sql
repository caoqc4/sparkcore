create table if not exists public.product_settings_operation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  action text not null,
  status text not null default 'completed',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint product_settings_operation_logs_action_check
    check (
      action in (
        'save_app_settings',
        'save_model_settings',
        'save_data_privacy_settings',
        'save_subscription_snapshot',
        'export_data',
        'sign_out_all_sessions',
        'delete_account'
      )
    ),
  constraint product_settings_operation_logs_status_check
    check (status in ('started', 'completed', 'failed'))
);

create index if not exists product_settings_operation_logs_user_id_idx
  on public.product_settings_operation_logs (user_id, created_at desc);

alter table public.product_settings_operation_logs enable row level security;

drop policy if exists "Users can read their own settings operation logs" on public.product_settings_operation_logs;
create policy "Users can read their own settings operation logs"
on public.product_settings_operation_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own settings operation logs" on public.product_settings_operation_logs;
create policy "Users can create their own settings operation logs"
on public.product_settings_operation_logs
for insert
to authenticated
with check (auth.uid() = user_id);
