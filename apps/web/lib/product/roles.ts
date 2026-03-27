import {
  loadOwnedAvailableAgents,
  loadOwnedThreads,
  loadPrimaryWorkspace,
} from "@/lib/chat/runtime-turn-context";

export type ProductRoleSummary = {
  agentId: string;
  name: string;
  personaSummary: string;
  lastInteractionAt: string | null;
  currentThreadId: string | null;
  currentThreadTitle: string | null;
};

export type ProductRoleCollection = {
  workspaceId: string;
  roles: ProductRoleSummary[];
  recentRoleId: string | null;
};

type AgentNameRow = {
  id: string;
  name: string;
  persona_summary: string;
};

export async function loadProductRoleCollection(args: {
  supabase: any;
  userId: string;
}): Promise<ProductRoleCollection | null> {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.userId,
  });

  if (!workspace) {
    return null;
  }

  const [agentsResult, threadsResult] = await Promise.all([
    loadOwnedAvailableAgents({
      supabase: args.supabase,
      workspaceId: workspace.id,
      userId: args.userId,
    }),
    loadOwnedThreads({
      supabase: args.supabase,
      workspaceId: workspace.id,
      userId: args.userId,
    }),
  ]);

  const latestThreadByAgent = new Map<
    string,
    {
      id: string;
      title: string;
      updated_at?: string | null;
      created_at?: string | null;
    }
  >();

  for (const thread of threadsResult.data ?? []) {
    if (typeof thread.agent_id !== "string" || thread.agent_id.length === 0) {
      continue;
    }

    if (!latestThreadByAgent.has(thread.agent_id)) {
      latestThreadByAgent.set(thread.agent_id, thread);
    }
  }

  const agentRows: AgentNameRow[] = (agentsResult.data ?? []) as AgentNameRow[];

  const roles: ProductRoleSummary[] = agentRows.map((agent) => {
    const latestThread = latestThreadByAgent.get(agent.id);

    return {
      agentId: agent.id,
      name: agent.name,
      personaSummary: agent.persona_summary,
      lastInteractionAt:
        latestThread?.updated_at ?? latestThread?.created_at ?? null,
      currentThreadId: latestThread?.id ?? null,
      currentThreadTitle: latestThread?.title ?? null,
    };
  });

  const recentRoleId =
    (typeof threadsResult.data?.[0]?.agent_id === "string" &&
    threadsResult.data[0].agent_id.length > 0
      ? threadsResult.data[0].agent_id
      : null) ?? roles[0]?.agentId ?? null;

  return {
    workspaceId: workspace.id,
    roles,
    recentRoleId,
  };
}
