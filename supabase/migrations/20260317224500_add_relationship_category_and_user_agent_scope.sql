alter table public.memory_items
  alter column memory_type drop not null;

alter table public.memory_items
  drop constraint if exists memory_items_memory_type_check;

alter table public.memory_items
  add constraint memory_items_memory_type_check
  check (
    (
      category is null
      and memory_type in ('profile', 'preference')
    )
    or (
      category in ('profile', 'preference')
      and memory_type in ('profile', 'preference')
    )
    or (
      category in ('relationship', 'goal')
      and memory_type is null
    )
  );

alter table public.memory_items
  drop constraint if exists memory_items_user_agent_target_check;

alter table public.memory_items
  add constraint memory_items_user_agent_target_check
  check (
    scope <> 'user_agent'
    or target_agent_id is not null
  );
