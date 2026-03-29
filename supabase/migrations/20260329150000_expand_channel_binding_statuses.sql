alter table public.channel_bindings
  drop constraint if exists channel_bindings_status_check;

alter table public.channel_bindings
  add constraint channel_bindings_status_check
  check (status in ('active', 'inactive', 'invalid'));

create index if not exists channel_bindings_status_idx
  on public.channel_bindings (status);
