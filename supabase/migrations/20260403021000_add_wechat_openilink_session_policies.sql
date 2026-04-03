drop policy if exists "Users can read their own wechat openilink sessions" on public.wechat_openilink_sessions;
create policy "Users can read their own wechat openilink sessions"
on public.wechat_openilink_sessions
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

drop policy if exists "Users can update their own wechat openilink sessions" on public.wechat_openilink_sessions;
create policy "Users can update their own wechat openilink sessions"
on public.wechat_openilink_sessions
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);
