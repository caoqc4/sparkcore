-- Allow anonymous (unauthenticated) reads of portrait assets that are shared and active.
-- This is required for the public homepage to display preset character portraits without
-- requiring the visitor to be signed in.

drop policy if exists "Anon users can read shared active portrait assets" on public.product_portrait_assets;
create policy "Anon users can read shared active portrait assets"
on public.product_portrait_assets
for select
to anon
using (
  is_active = true
  and is_shared = true
);
