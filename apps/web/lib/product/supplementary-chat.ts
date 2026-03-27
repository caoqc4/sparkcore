import { loadThreadMessages } from "@/lib/chat/message-read";
import {
  loadLatestOwnedThread,
  loadOwnedActiveAgent,
  loadOwnedThread,
  loadPrimaryWorkspace,
} from "@/lib/chat/runtime-turn-context";
import { loadOwnedChannelBindings } from "@/lib/product/channels";

export type ProductSupplementaryChatPageData = {
  workspaceId: string;
  role: {
    agentId: string;
    name: string;
    personaSummary: string;
  } | null;
  thread: {
    threadId: string;
    title: string;
    updatedAt: string | null;
  } | null;
  bindings: {
    activeCount: number;
    platforms: string[];
  };
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    status: string;
    createdAt: string;
  }>;
};

export async function loadProductSupplementaryChatPageData(args: {
  supabase: any;
  userId: string;
  threadId?: string | null;
  roleId?: string | null;
}): Promise<ProductSupplementaryChatPageData | null> {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.userId
  });

  if (!workspace) {
    return null;
  }

  const requestedRoleId =
    typeof args.roleId === "string" && args.roleId.length > 0 ? args.roleId : null;

  const threadResult =
    typeof args.threadId === "string" && args.threadId.length > 0
      ? await loadOwnedThread({
          supabase: args.supabase,
          threadId: args.threadId,
          userId: args.userId,
          workspaceId: workspace.id,
        })
      : requestedRoleId
        ? await args.supabase
            .from("threads")
            .select("id, title, status, agent_id, updated_at, created_at")
            .eq("workspace_id", workspace.id)
            .eq("owner_user_id", args.userId)
            .eq("agent_id", requestedRoleId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : await loadLatestOwnedThread({
            supabase: args.supabase,
            workspaceId: workspace.id,
            userId: args.userId,
          });

  const thread = threadResult.data ?? null;

  const [bindings, agentResult, messagesResult] = await Promise.all([
    loadOwnedChannelBindings({
      supabase: args.supabase,
      workspaceId: workspace.id,
      userId: args.userId
    }),
    thread?.agent_id
      ? loadOwnedActiveAgent({
          supabase: args.supabase,
          agentId: thread.agent_id,
          workspaceId: workspace.id,
          userId: args.userId
        })
      : Promise.resolve({ data: null }),
    thread
      ? loadThreadMessages({
          supabase: args.supabase,
          threadId: thread.id,
          workspaceId: workspace.id
        })
      : Promise.resolve({ data: [] })
  ]);

  return {
    workspaceId: workspace.id,
    role: agentResult.data
      ? {
          agentId: agentResult.data.id,
          name: agentResult.data.name,
          personaSummary: agentResult.data.persona_summary
        }
      : null,
    thread: thread
      ? {
          threadId: thread.id,
          title: thread.title,
          updatedAt: thread.updated_at ?? thread.created_at ?? null
        }
      : null,
    bindings: {
      activeCount: bindings.filter((item) => item.status === "active").length,
      platforms: Array.from(new Set(bindings.map((item) => item.platform)))
    },
    messages: (messagesResult.data ?? []).map((message: any) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      status: message.status,
      createdAt: message.created_at
    }))
  };
}
