import {
  loadLatestOwnedThread,
  loadOwnedActiveAgent,
  loadOwnedAvailableAgents,
  loadPrimaryWorkspace
} from "@/lib/chat/runtime-turn-context";
import { resolveProductRoleCore, type ProductRoleCoreConfig } from "@/lib/product/role-core";

export type ProductProfilePageData = {
  workspaceId: string;
  role: {
    agentId: string;
    name: string;
    personaSummary: string;
    stylePrompt: string;
    systemPrompt: string;
    currentThreadTitle: string | null;
    config: ProductRoleCoreConfig;
  } | null;
};

export async function loadProductProfilePageData(args: {
  supabase: any;
  userId: string;
  agentId?: string | null;
}): Promise<ProductProfilePageData | null> {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.userId
  });

  if (!workspace) {
    return null;
  }

  const latestThreadResult = await loadLatestOwnedThread({
    supabase: args.supabase,
    workspaceId: workspace.id,
    userId: args.userId
  });

  const fallbackAgentsResult = await loadOwnedAvailableAgents({
    supabase: args.supabase,
    workspaceId: workspace.id,
    userId: args.userId
  });

  const selectedAgentId =
    (typeof args.agentId === "string" && args.agentId.length > 0
      ? args.agentId
      : latestThreadResult.data?.agent_id) ??
    fallbackAgentsResult.data?.[0]?.id ??
    null;

  if (!selectedAgentId) {
    return {
      workspaceId: workspace.id,
      role: null
    };
  }

  const { data: agent } = await loadOwnedActiveAgent({
    supabase: args.supabase,
    agentId: selectedAgentId,
    workspaceId: workspace.id,
    userId: args.userId
  });

  if (!agent) {
    return {
      workspaceId: workspace.id,
      role: null
    };
  }

  return {
    workspaceId: workspace.id,
    role: {
      agentId: agent.id,
      name: agent.name,
      personaSummary: agent.persona_summary,
      stylePrompt: agent.style_prompt,
      systemPrompt: agent.system_prompt,
      currentThreadTitle:
        latestThreadResult.data?.agent_id === agent.id ? latestThreadResult.data.title : null,
      config: resolveProductRoleCore({
        metadata: agent.metadata,
        stylePrompt: agent.style_prompt,
        systemPrompt: agent.system_prompt
      })
    }
  };
}
