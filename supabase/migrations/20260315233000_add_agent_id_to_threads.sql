alter table public.threads
add column if not exists agent_id uuid references public.agents (id) on delete set null;

create index if not exists threads_agent_id_idx
  on public.threads (agent_id);
