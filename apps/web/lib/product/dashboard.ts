import { SupabaseThreadStateRepository } from "@/lib/chat/thread-state-supabase-repository";
import { loadCompletedMessagesForThreads, loadOwnedActiveAgent, loadOwnedThread, loadPrimaryWorkspace, loadRecentOwnedMemories } from "@/lib/chat/runtime-turn-context";

export type DashboardOverview = {
  workspaceId: string;
  relationshipState: string;
  lastInteractionAt: string | null;
  memorySummary: {
    total: number;
    active: number;
    hidden: number;
    incorrect: number;
  };
  channelSummary: {
    total: number;
    active: number;
    platforms: string[];
  };
  currentRole: {
    agentId: string;
    name: string;
    personaSummary: string;
  } | null;
  currentThread: {
    threadId: string;
    title: string;
    updatedAt: string | null;
  } | null;
};

function deriveRelationshipState(args: {
  continuityStatus: string | null;
  lifecycleStatus: string | null;
  hasBindings: boolean;
  hasMemories: boolean;
}) {
  if (args.continuityStatus === "continuous") {
    return "continuous";
  }

  if (args.lifecycleStatus === "active") {
    return args.hasBindings ? "active_in_im" : "active_on_web";
  }

  if (args.hasBindings && args.hasMemories) {
    return "remembering";
  }

  if (args.hasBindings) {
    return "connected";
  }

  return "setup_needed";
}

export async function loadDashboardOverview(args: {
  supabase: any;
  userId: string;
  threadId?: string | null;
}) : Promise<DashboardOverview | null> {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.userId
  });

  if (!workspace) {
    return null;
  }

  let threadRow: {
    id: string;
    title: string;
    status?: string | null;
    agent_id?: string | null;
    updated_at?: string | null;
    created_at?: string | null;
  } | null = null;

  if (args.threadId) {
    const { data } = await loadOwnedThread({
      supabase: args.supabase,
      threadId: args.threadId,
      userId: args.userId,
      workspaceId: workspace.id
    });
    threadRow = data ?? null;
  }

  if (!threadRow) {
    const { data } = await args.supabase
      .from("threads")
      .select("id, title, status, agent_id, updated_at, created_at")
      .eq("workspace_id", workspace.id)
      .eq("owner_user_id", args.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    threadRow = data ?? null;
  }

  const agentId =
    typeof threadRow?.agent_id === "string" && threadRow.agent_id.length > 0
      ? threadRow.agent_id
      : null;

  const threadState =
    threadRow && agentId
      ? await new SupabaseThreadStateRepository(args.supabase).loadThreadState({
          threadId: threadRow.id,
          agentId
        })
      : { status: "not_found" as const };

  const { data: memories } = await loadRecentOwnedMemories({
    supabase: args.supabase,
    workspaceId: workspace.id,
    userId: args.userId,
    limit: 80
  });

  const { data: channelBindings } = await args.supabase
    .from("channel_bindings")
    .select("platform, status, updated_at")
    .eq("workspace_id", workspace.id)
    .eq("user_id", args.userId)
    .order("updated_at", { ascending: false });

  const agent =
    agentId
      ? (
          await loadOwnedActiveAgent({
            supabase: args.supabase,
            agentId,
            workspaceId: workspace.id,
            userId: args.userId
          })
        ).data
      : null;

  const messagePreview =
    threadRow
      ? (
          await loadCompletedMessagesForThreads({
            supabase: args.supabase,
            threadIds: [threadRow.id],
            workspaceId: workspace.id
          })
        ).data
      : [];

  const lastInteractionAt =
    messagePreview && messagePreview.length > 0
      ? messagePreview[messagePreview.length - 1]?.created_at ?? threadRow?.updated_at ?? null
      : threadRow?.updated_at ?? null;

  const memorySummary = {
    total: memories?.length ?? 0,
    active: memories?.filter((item: any) => item.status === "active").length ?? 0,
    hidden: memories?.filter((item: any) => item.status === "hidden").length ?? 0,
    incorrect:
      memories?.filter((item: any) => item.status === "incorrect").length ?? 0
  };

  const platforms: string[] = Array.from(
    new Set(
      (channelBindings ?? [])
        .map((item: any) => item.platform)
        .filter((value: unknown): value is string => typeof value === "string")
    )
  );

  const channelSummary = {
    total: channelBindings?.length ?? 0,
    active:
      channelBindings?.filter((item: any) => item.status === "active").length ?? 0,
    platforms
  };

  return {
    workspaceId: workspace.id,
    relationshipState: deriveRelationshipState({
      continuityStatus:
        threadState.status === "found"
          ? threadState.thread_state.continuity_status ?? null
          : null,
      lifecycleStatus:
        threadState.status === "found"
          ? threadState.thread_state.lifecycle_status
          : threadRow?.status ?? null,
      hasBindings: channelSummary.active > 0,
      hasMemories: memorySummary.active > 0
    }),
    lastInteractionAt,
    memorySummary,
    channelSummary,
    currentRole: agent
      ? {
          agentId: agent.id,
          name: agent.name,
          personaSummary: agent.persona_summary
        }
      : null,
    currentThread: threadRow
      ? {
          threadId: threadRow.id,
          title: threadRow.title,
          updatedAt: threadRow.updated_at ?? threadRow.created_at ?? null
        }
      : null
  };
}
