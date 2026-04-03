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
      category in ('profile', 'preference', 'episode', 'mood', 'key_date', 'social')
      and memory_type = category
    )
    or (
      category in ('relationship', 'goal')
      and memory_type is null
    )
  );
