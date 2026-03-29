alter table public.memory_items
  drop constraint if exists memory_items_category_check;

alter table public.memory_items
  add constraint memory_items_category_check
  check (
    category in (
      'profile',
      'preference',
      'relationship',
      'goal',
      'episode',
      'mood',
      'key_date',
      'social'
    )
    or category is null
  );
