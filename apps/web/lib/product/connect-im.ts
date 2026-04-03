import {
  loadLatestOwnedThread,
  loadLatestOwnedThreadForAgent,
  loadOwnedActiveAgent,
  loadOwnedThread,
  loadPrimaryWorkspace
} from "@/lib/chat/runtime-turn-context";
import { loadLatestOwnedWeChatOpenILinkSession } from "@/lib/integrations/wechat-openilink-sessions";
import { loadOwnedChannelBindings, type ProductChannelBinding } from "@/lib/product/channels";
import {
  resolveProductRoleCore,
  resolveStoredProductRoleAppearance,
  type ProductRoleAvatarGender,
  type ProductRoleMode
} from "@/lib/product/role-core";

export type ProductConnectImPageData = {
  workspaceId: string;
  role: {
    agentId: string;
    name: string;
    personaSummary: string;
    mode: ProductRoleMode;
    avatarGender: ProductRoleAvatarGender | null;
  } | null;
  thread: {
    threadId: string;
    title: string;
  } | null;
  bindings: ProductChannelBinding[];
  wechatSession: {
    id: string;
    status: "pending" | "active" | "expired" | "revoked";
    wechatUserId: string | null;
    lastConnectedAt: string | null;
    lastSeenAt: string | null;
    expiredAt: string | null;
  } | null;
};

export async function loadProductConnectImPageData(args: {
  supabase: any;
  userId: string;
  threadId?: string | null;
  agentId?: string | null;
}): Promise<ProductConnectImPageData | null> {
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
  const requestedAgentId =
    typeof args.agentId === "string" && args.agentId.length > 0 ? args.agentId : null;

  const latestThreadForRequestedAgentResult = requestedAgentId
    ? await loadLatestOwnedThreadForAgent({
        supabase: args.supabase,
        workspaceId: workspace.id,
        userId: args.userId,
        agentId: requestedAgentId
      })
    : { data: null };

  const threadResult =
    typeof args.threadId === "string" && args.threadId.length > 0
      ? await loadOwnedThread({
          supabase: args.supabase,
          threadId: args.threadId,
          userId: args.userId,
          workspaceId: workspace.id
        })
      : latestThreadForRequestedAgentResult.data
        ? latestThreadForRequestedAgentResult
        : latestThreadResult;

  const resolvedAgentId =
    threadResult.data?.agent_id ??
    requestedAgentId ??
    latestThreadResult.data?.agent_id ??
    null;

  const [bindings, agentResult, wechatSession] = await Promise.all([
    loadOwnedChannelBindings({
      supabase: args.supabase,
      workspaceId: workspace.id,
      userId: args.userId
    }),
    resolvedAgentId
      ? loadOwnedActiveAgent({
          supabase: args.supabase,
          agentId: resolvedAgentId,
          workspaceId: workspace.id,
          userId: args.userId
        })
      : Promise.resolve({ data: null }),
    loadLatestOwnedWeChatOpenILinkSession({
      supabase: args.supabase,
      workspaceId: workspace.id,
      userId: args.userId
    })
  ]);

  return {
    workspaceId: workspace.id,
    role: agentResult.data
      ? (() => {
          const roleCore = resolveProductRoleCore({
            metadata: agentResult.data.metadata,
            stylePrompt: agentResult.data.style_prompt,
            systemPrompt: agentResult.data.system_prompt
          });
          const appearance = resolveStoredProductRoleAppearance(agentResult.data.metadata);

          return {
            agentId: agentResult.data.id,
            name: agentResult.data.name,
            personaSummary: agentResult.data.persona_summary,
            mode: roleCore.mode,
            avatarGender: appearance.avatarGender
          };
        })()
      : null,
    thread: threadResult.data
      ? {
          threadId: threadResult.data.id,
          title: threadResult.data.title
        }
      : null,
    bindings,
    wechatSession: wechatSession
      ? {
          id: wechatSession.id,
          status: wechatSession.status,
          wechatUserId: wechatSession.wechat_user_id,
          lastConnectedAt: wechatSession.last_connected_at,
          lastSeenAt: wechatSession.last_seen_at,
          expiredAt: wechatSession.expired_at
        }
      : null
  };
}
