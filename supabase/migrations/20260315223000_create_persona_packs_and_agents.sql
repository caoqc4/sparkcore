create table if not exists public.persona_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  persona_summary text not null default '',
  style_prompt text not null default '',
  system_prompt text not null default '',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  source_persona_pack_id uuid references public.persona_packs (id) on delete set null,
  name text not null,
  persona_summary text not null default '',
  style_prompt text not null default '',
  system_prompt text not null default '',
  is_custom boolean not null default false,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists persona_packs_is_active_idx
  on public.persona_packs (is_active);

create index if not exists agents_workspace_id_idx
  on public.agents (workspace_id);

create index if not exists agents_owner_user_id_idx
  on public.agents (owner_user_id);

create index if not exists agents_source_persona_pack_id_idx
  on public.agents (source_persona_pack_id);

create index if not exists agents_created_at_idx
  on public.agents (created_at desc);

drop trigger if exists persona_packs_set_updated_at on public.persona_packs;
create trigger persona_packs_set_updated_at
before update on public.persona_packs
for each row
execute function public.set_updated_at();

drop trigger if exists agents_set_updated_at on public.agents;
create trigger agents_set_updated_at
before update on public.agents
for each row
execute function public.set_updated_at();

alter table public.persona_packs enable row level security;
alter table public.agents enable row level security;

drop policy if exists "Authenticated users can read active persona packs" on public.persona_packs;
create policy "Authenticated users can read active persona packs"
on public.persona_packs
for select
to authenticated
using (is_active = true);

drop policy if exists "Users can read their own agents" on public.agents;
create policy "Users can read their own agents"
on public.agents
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "Users can create their own agents" on public.agents;
create policy "Users can create their own agents"
on public.agents
for insert
to authenticated
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can update their own agents" on public.agents;
create policy "Users can update their own agents"
on public.agents
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.workspaces
    where workspaces.id = workspace_id
      and workspaces.owner_user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own agents" on public.agents;
create policy "Users can delete their own agents"
on public.agents
for delete
to authenticated
using (auth.uid() = owner_user_id);

insert into public.persona_packs (
  slug,
  name,
  description,
  persona_summary,
  style_prompt,
  system_prompt,
  metadata
)
values
  (
    'spark-guide',
    'Spark Guide',
    'A clear, grounded assistant for onboarding and product guidance.',
    'Helpful, steady, and practical. Good at clarifying product setup and next actions.',
    'Use concise, structured language. Be warm and reliable. Prefer practical next steps over abstract discussion.',
    'You are Spark Guide, the default onboarding persona for SparkCore. Help users make progress quickly, explain decisions clearly, and avoid overcomplicating the path forward.',
    jsonb_build_object('seed', true, 'category', 'general')
  ),
  (
    'memory-coach',
    'Memory Coach',
    'A persona focused on memory continuity and reflective follow-up.',
    'Attentive, context-aware, and good at recalling prior details without sounding robotic.',
    'Use calm, thoughtful phrasing. Highlight continuity across conversations. Summarize key user preferences when helpful.',
    'You are Memory Coach, a persona designed to demonstrate how SparkCore can use long-term memory. Make continuity visible, but keep replies natural and useful.',
    jsonb_build_object('seed', true, 'category', 'memory')
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  persona_summary = excluded.persona_summary,
  style_prompt = excluded.style_prompt,
  system_prompt = excluded.system_prompt,
  metadata = excluded.metadata,
  is_active = true,
  updated_at = timezone('utc', now());
