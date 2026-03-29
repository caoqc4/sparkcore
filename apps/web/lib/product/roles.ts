import {
  loadOwnedAvailableAgents,
  loadOwnedThreads,
  loadPrimaryWorkspace,
  loadRecentOwnedMemories,
} from "@/lib/chat/runtime-turn-context";
import { getMemoryScope, getMemoryStatus } from "@/lib/chat/memory-v2";
import {
  resolveStoredProductRoleAppearance,
  type ProductRoleAppearanceSummary,
} from "@/lib/product/role-core";

export type ProductRoleSummary = {
  agentId: string;
  name: string;
  personaSummary: string;
  lastInteractionAt: string | null;
  currentThreadId: string | null;
  currentThreadTitle: string | null;
  appearance: ProductRoleAppearanceSummary;
  memorySummary: {
    savedCount: number;
    recentCount: number;
    reviewCount: number;
  };
};

export type ProductRoleCollection = {
  workspaceId: string;
  roles: ProductRoleSummary[];
  recentRoleId: string | null;
};

export type ProductRolePageSummary = {
  agentId: string;
  name: string;
  currentThreadId: string | null;
  currentThreadTitle: string | null;
  lastInteractionAt: string | null;
  appearance: ProductRoleAppearanceSummary;
  memorySummary: {
    savedCount: number;
    recentCount: number;
    reviewCount: number;
  };
};

export type ProductRolePageData = {
  workspaceId: string;
  selectedRole: ProductRolePageSummary | null;
  roleCollection: ProductRoleCollection;
};

type AgentRow = {
  id: string;
  name: string;
  persona_summary: string;
  metadata?: unknown;
};

type MemoryCounter = {
  savedCount: number;
  recentCount: number;
  reviewCount: number;
};

function createEmptyMemoryCounter(): MemoryCounter {
  return {
    savedCount: 0,
    recentCount: 0,
    reviewCount: 0,
  };
}

function summarizeRoleMemories(memories: any[]) {
  const summaryByAgent = new Map<string, MemoryCounter>();

  for (const memory of memories) {
    const targetAgentId =
      typeof memory?.target_agent_id === "string" && memory.target_agent_id.length > 0
        ? memory.target_agent_id
        : null;

    if (!targetAgentId) {
      continue;
    }

    const scope = getMemoryScope(memory);
    const status = getMemoryStatus(memory);
    const counter = summaryByAgent.get(targetAgentId) ?? createEmptyMemoryCounter();

    if (status === "hidden" || status === "incorrect") {
      counter.reviewCount += 1;
    }

    if (
      status === "active" &&
      (scope === "user_global" || scope === "user_agent")
    ) {
      counter.savedCount += 1;
    }

    if (status === "active" && scope === "thread_local") {
      counter.recentCount += 1;
    }

    summaryByAgent.set(targetAgentId, counter);
  }

  return summaryByAgent;
}

async function loadRoleCollectionBase(args: {
  supabase: any;
  userId: string;
}) {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.userId,
  });

  if (!workspace) {
    return null;
  }

  const [agentsResult, threadsResult, memoriesResult] = await Promise.all([
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
    loadRecentOwnedMemories({
      supabase: args.supabase,
      workspaceId: workspace.id,
      userId: args.userId,
      limit: 240,
    }),
  ]);

  return {
    workspace,
    agentRows: (agentsResult.data ?? []) as AgentRow[],
    threads: threadsResult.data ?? [],
    memories: memoriesResult.data ?? [],
  };
}

export async function loadProductRoleCollection(args: {
  supabase: any;
  userId: string;
}): Promise<ProductRoleCollection | null> {
  const base = await loadRoleCollectionBase(args);

  if (!base) {
    return null;
  }

  const latestThreadByAgent = new Map<
    string,
    {
      id: string;
      title: string;
      updated_at?: string | null;
      created_at?: string | null;
    }
  >();

  for (const thread of base.threads) {
    if (typeof thread.agent_id !== "string" || thread.agent_id.length === 0) {
      continue;
    }

    if (!latestThreadByAgent.has(thread.agent_id)) {
      latestThreadByAgent.set(thread.agent_id, thread);
    }
  }

  const memorySummaryByAgent = summarizeRoleMemories(base.memories);

  const roles: ProductRoleSummary[] = base.agentRows.map((agent) => {
    const latestThread = latestThreadByAgent.get(agent.id);

    return {
      agentId: agent.id,
      name: agent.name,
      personaSummary: agent.persona_summary,
      lastInteractionAt: latestThread?.updated_at ?? latestThread?.created_at ?? null,
      currentThreadId: latestThread?.id ?? null,
      currentThreadTitle: latestThread?.title ?? null,
      appearance: resolveStoredProductRoleAppearance(agent.metadata),
      memorySummary: memorySummaryByAgent.get(agent.id) ?? createEmptyMemoryCounter(),
    };
  });

  const recentRoleId =
    (typeof base.threads[0]?.agent_id === "string" && base.threads[0].agent_id.length > 0
      ? base.threads[0].agent_id
      : null) ?? roles[0]?.agentId ?? null;

  return {
    workspaceId: base.workspace.id,
    roles,
    recentRoleId,
  };
}

export async function loadProductRolePageData(args: {
  supabase: any;
  userId: string;
  roleId?: string | null;
}): Promise<ProductRolePageData | null> {
  const roleCollection = await loadProductRoleCollection({
    supabase: args.supabase,
    userId: args.userId,
  });

  if (!roleCollection) {
    return null;
  }

  const selectedRoleId =
    typeof args.roleId === "string" && args.roleId.length > 0
      ? args.roleId
      : roleCollection.recentRoleId;

  const selectedRole =
    roleCollection.roles.find((role) => role.agentId === selectedRoleId) ?? null;

  return {
    workspaceId: roleCollection.workspaceId,
    selectedRole: selectedRole
      ? {
          agentId: selectedRole.agentId,
          name: selectedRole.name,
          currentThreadId: selectedRole.currentThreadId,
          currentThreadTitle: selectedRole.currentThreadTitle,
          lastInteractionAt: selectedRole.lastInteractionAt,
          appearance: selectedRole.appearance,
          memorySummary: selectedRole.memorySummary,
        }
      : null,
    roleCollection,
  };
}
