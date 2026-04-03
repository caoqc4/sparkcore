import { loadThreadMessages } from "@/lib/chat/message-read";
import type { LoadThreadStateResult } from "@/lib/chat/thread-state";
import { SupabaseThreadStateRepository } from "@/lib/chat/thread-state-supabase-repository";
import {
  loadLatestOwnedThread,
  loadOwnedActiveAgent,
  loadOwnedThread,
  loadPrimaryWorkspace,
} from "@/lib/chat/runtime-turn-context";
import { loadOwnedChannelBindings } from "@/lib/product/channels";

type UnknownRecord = Record<string, unknown>;

function getRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function readMessageSourceMetadata(metadata: unknown) {
  const metadataRecord = getRecord(metadata);
  const runtimeInput = getRecord(metadataRecord?.runtime_turn_input);
  const runtimeContext = getRecord(runtimeInput?.context);
  const surface = typeof metadataRecord?.source === "string" ? metadataRecord.source : null;
  const platform =
    typeof runtimeContext?.source_platform === "string" ? runtimeContext.source_platform : null;
  const bindingId =
    typeof runtimeContext?.binding_id === "string" ? runtimeContext.binding_id : null;

  return {
    sourceSurface: surface,
    sourcePlatform: platform,
    sourceBindingId: bindingId
  };
}

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
  messageSummary: {
    totalCount: number;
    userCount: number;
    assistantCount: number;
  };
  sourceSummary: {
    webCount: number;
    imCount: number;
    platformCounts: Array<{
      platform: string;
      count: number;
    }>;
  };
  threadStatus: {
    connectionStatus: "connected" | "needs_attention" | "web_only";
    lifecycleStatus: string | null;
    continuityStatus: string | null;
    focusMode: string | null;
    pendingFollowUpCount: number;
    nextTriggerAt: string | null;
  };
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    sourceSurface: string | null;
    sourcePlatform: string | null;
    sourceBindingId: string | null;
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
  const activeBindings = bindings.filter((item) => item.status === "active");
  const scopedBindings = thread?.id
    ? bindings.filter((item) => item.threadId === thread.id)
    : bindings;
  const scopedActiveBindings = scopedBindings.filter((item) => item.status === "active");
  const messages = (messagesResult.data ?? []).map((message: any) => ({
    ...readMessageSourceMetadata(message.metadata),
    id: message.id,
    role: message.role,
    content: message.content,
    status: message.status,
    metadata: getRecord(message.metadata) ?? {},
    createdAt: message.created_at
  }));
  const messageSummary = {
    totalCount: messages.length,
    userCount: messages.filter((message: (typeof messages)[number]) => message.role === "user").length,
    assistantCount: messages.filter((message: (typeof messages)[number]) => message.role === "assistant").length
  };
  const platformCountsMap = new Map<string, number>();
  let webCount = 0;
  let imCount = 0;
  for (const message of messages) {
    if (message.sourceSurface === "im") {
      imCount += 1;
      const platform = message.sourcePlatform ?? "im";
      platformCountsMap.set(platform, (platformCountsMap.get(platform) ?? 0) + 1);
    } else {
      webCount += 1;
    }
  }
  const platformCounts = Array.from(platformCountsMap.entries()).map(([platform, count]) => ({
    platform,
    count
  }));

  let threadState: LoadThreadStateResult = { status: "not_found" };
  if (thread?.agent_id) {
    try {
      threadState = await new SupabaseThreadStateRepository(args.supabase).loadThreadState({
        threadId: thread.id,
        agentId: thread.agent_id
      });
    } catch (error) {
      console.warn("[supplementary-chat] thread state load degraded", {
        thread_id: thread.id,
        agent_id: thread.agent_id,
        error_message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const pendingFollowUpsResult = await (
    thread
      ? args.supabase
          .from("pending_follow_ups")
          .select("trigger_at")
          .eq("workspace_id", workspace.id)
          .eq("user_id", args.userId)
          .eq("thread_id", thread.id)
          .eq("status", "pending")
          .order("trigger_at", { ascending: true })
      : Promise.resolve({ data: [] as Array<{ trigger_at: string | null }> })
  );

  const pendingFollowUps = pendingFollowUpsResult.data ?? [];
  const connectionStatus =
    scopedBindings.length > 0
      ? scopedBindings.some((item) => item.status === "invalid")
        ? "needs_attention"
        : scopedActiveBindings.length > 0
          ? "connected"
          : "web_only"
      : bindings.some((item) => item.status === "invalid")
        ? "needs_attention"
        : "web_only";

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
      activeCount: activeBindings.length,
      platforms: Array.from(new Set(activeBindings.map((item) => item.platform)))
    },
    messageSummary,
    sourceSummary: {
      webCount,
      imCount,
      platformCounts
    },
    threadStatus: {
      connectionStatus,
      lifecycleStatus:
        threadState.status === "found" ? threadState.thread_state.lifecycle_status ?? null : null,
      continuityStatus:
        threadState.status === "found" ? threadState.thread_state.continuity_status ?? null : null,
      focusMode:
        threadState.status === "found" ? threadState.thread_state.focus_mode ?? null : null,
      pendingFollowUpCount: pendingFollowUps.length,
      nextTriggerAt: pendingFollowUps[0]?.trigger_at ?? null
    },
    messages
  };
}
