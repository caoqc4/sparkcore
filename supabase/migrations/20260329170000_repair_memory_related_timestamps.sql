-- Repair legacy timestamp drift for product-console memory surfaces.
-- This migration is intentionally idempotent: it only normalizes
-- created_at / updated_at pairs when they are missing or inverted.

update public.threads
set
  created_at = coalesce(created_at, updated_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, created_at, timezone('utc', now()))
where created_at is null
   or updated_at is null;

update public.threads
set updated_at = created_at
where updated_at < created_at;

update public.messages
set
  created_at = coalesce(created_at, updated_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, created_at, timezone('utc', now()))
where created_at is null
   or updated_at is null;

update public.messages
set updated_at = created_at
where updated_at < created_at;

update public.memory_items
set
  created_at = coalesce(created_at, updated_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, created_at, timezone('utc', now()))
where created_at is null
   or updated_at is null;

update public.memory_items
set updated_at = created_at
where updated_at < created_at;
