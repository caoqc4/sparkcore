import { SupabaseThreadStateRepository } from "@/lib/chat/thread-state-supabase-repository";
import {
  loadCompletedMessagesForThreads,
  loadOwnedActiveAgent,
  loadOwnedThread,
  loadPrimaryWorkspace,
  loadRecentOwnedMemories,
} from "@/lib/chat/runtime-turn-context";

export type DashboardOverview = {
  workspaceId: string;
  relationshipState: string;
  relationshipSummary: {
    label: string;
    headline: string;
    body: string;
  };
  nextStep: {
    title: string;
    body: string;
    href: string;
  };
  lastInteractionAt: string | null;
  recentActivity: {
    userMessage: string | null;
    assistantMessage: string | null;
  };
  threadState: {
    lifecycleStatus: string | null;
    continuityStatus: string | null;
    focusMode: string | null;
    currentLanguageHint: string | null;
  };
  followUpSummary: {
    pendingCount: number;
    nextTriggerAt: string | null;
  };
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

function summarizeRelationshipState(state: string) {
  switch (state) {
    case "continuous":
      return {
        label: "Continuous",
        headline: "The relationship is carrying forward with clear continuity.",
        body: "Recent interaction, live thread state, and memory are all reinforcing the sense of the same ongoing relationship.",
      };
    case "active_in_im":
      return {
        label: "Active in IM",
        headline: "The relationship is active and already attached to an IM channel.",
        body: "Daily conversation can continue in IM while the website stays focused on memory, profile, and channel control.",
      };
    case "active_on_web":
      return {
        label: "Active on web",
        headline: "The relationship is active, but its main channel is still web-first.",
        body: "The role and thread are live. The next leverage point is moving the relationship loop into IM.",
      };
    case "remembering":
      return {
        label: "Remembering",
        headline: "Memory is forming even if the rhythm is still settling.",
        body: "The system is already retaining useful context, but the relationship loop still needs stronger day-to-day continuity.",
      };
    case "connected":
      return {
        label: "Connected",
        headline: "An IM channel is attached, but the relationship still needs more continuity.",
        body: "The connection layer is ready. The next step is using the role in-channel until memory and thread state become richer.",
      };
    default:
      return {
        label: "Setup needed",
        headline: "The relationship shell exists, but the loop is not fully established yet.",
        body: "Finish channel setup and start interacting through the chosen role so continuity, memory, and state can accumulate.",
      };
  }
}

function summarizeNextStep(args: {
  relationshipState: string;
  hasRole: boolean;
  hasThread: boolean;
  hasBindings: boolean;
  pendingFollowUps: number;
}) {
  if (!args.hasRole || !args.hasThread) {
    return {
      title: "Create your first role",
      body: "You need a role and canonical thread before the relationship control center can really start accumulating state.",
      href: "/create",
    };
  }

  if (!args.hasBindings) {
    return {
      title: "Connect an IM channel",
      body: "Move the relationship into IM so the main interaction loop lives where conversation can continue naturally.",
      href: "/connect-im",
    };
  }

  if (args.pendingFollowUps > 0) {
    return {
      title: "Check follow-up readiness",
      body: "There are follow-up actions queued. Make sure the active channel stays healthy so proactive continuity can land.",
      href: "/app/channels",
    };
  }

  if (
    args.relationshipState === "active_in_im" ||
    args.relationshipState === "continuous"
  ) {
    return {
      title: "Review role memory",
      body: "The relationship loop is active. Now the highest-leverage task is making sure memory stays correct and visible.",
      href: "/app/role",
    };
  }

  return {
    title: "Refine the companion",
    body: "Tune tone, relationship mode, and boundaries so the ongoing interaction feels more intentional and consistent.",
    href: "/app/role",
  };
}

function truncatePreview(content: string | null | undefined, maxLength: number) {
  if (!content) {
    return null;
  }

  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export async function loadDashboardOverview(args: {
  supabase: any;
  userId: string;
  threadId?: string | null;
  roleId?: string | null;
}): Promise<DashboardOverview | null> {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.userId,
  });

  if (!workspace) {
    return null;
  }

  const requestedRoleId =
    typeof args.roleId === "string" && args.roleId.length > 0 ? args.roleId : null;

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
      workspaceId: workspace.id,
    });
    threadRow = data ?? null;
  }

  if (!threadRow && requestedRoleId) {
    const { data } = await args.supabase
      .from("threads")
      .select("id, title, status, agent_id, updated_at, created_at")
      .eq("workspace_id", workspace.id)
      .eq("owner_user_id", args.userId)
      .eq("agent_id", requestedRoleId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    threadRow = data ?? null;
  }

  if (!threadRow && !requestedRoleId) {
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
    requestedRoleId ??
    (typeof threadRow?.agent_id === "string" && threadRow.agent_id.length > 0
      ? threadRow.agent_id
      : null);

  const threadState =
    threadRow && agentId
      ? await new SupabaseThreadStateRepository(args.supabase).loadThreadState({
          threadId: threadRow.id,
          agentId,
        })
      : { status: "not_found" as const };

  const threadStateSnapshot =
    threadState.status === "found"
      ? {
          lifecycleStatus: threadState.thread_state.lifecycle_status ?? null,
          continuityStatus: threadState.thread_state.continuity_status ?? null,
          focusMode: threadState.thread_state.focus_mode ?? null,
          currentLanguageHint:
            threadState.thread_state.current_language_hint ?? null,
        }
      : {
          lifecycleStatus: threadRow?.status ?? null,
          continuityStatus: null,
          focusMode: null,
          currentLanguageHint: null,
        };

  const { data: memories } = await loadRecentOwnedMemories({
    supabase: args.supabase,
    workspaceId: workspace.id,
    userId: args.userId,
    limit: 80,
  });

  const { data: channelBindings } = await args.supabase
    .from("channel_bindings")
    .select("platform, status, updated_at")
    .eq("workspace_id", workspace.id)
    .eq("user_id", args.userId)
    .order("updated_at", { ascending: false });

  const { data: pendingFollowUps } = await args.supabase
    .from("pending_follow_ups")
    .select("status, trigger_at")
    .eq("workspace_id", workspace.id)
    .eq("user_id", args.userId)
    .eq("status", "pending")
    .order("trigger_at", { ascending: true });

  const agent = agentId
    ? (
        await loadOwnedActiveAgent({
          supabase: args.supabase,
          agentId,
          workspaceId: workspace.id,
          userId: args.userId,
        })
      ).data
    : null;

  const messagePreview = threadRow
    ? (
        await loadCompletedMessagesForThreads({
          supabase: args.supabase,
          threadIds: [threadRow.id],
          workspaceId: workspace.id,
          select: "thread_id, role, content, created_at, status",
        })
      ).data
    : [];

  const lastInteractionAt =
    messagePreview && messagePreview.length > 0
      ? messagePreview[messagePreview.length - 1]?.created_at ??
        threadRow?.updated_at ??
        null
      : threadRow?.updated_at ?? null;

  const memorySummary = {
    total: memories?.length ?? 0,
    active: memories?.filter((item: any) => item.status === "active").length ?? 0,
    hidden: memories?.filter((item: any) => item.status === "hidden").length ?? 0,
    incorrect:
      memories?.filter((item: any) => item.status === "incorrect").length ?? 0,
  };

  const platforms: string[] = Array.from(
    new Set(
      (channelBindings ?? [])
        .map((item: any) => item.platform)
        .filter((value: unknown): value is string => typeof value === "string"),
    ),
  );

  const channelSummary = {
    total: channelBindings?.length ?? 0,
    active:
      channelBindings?.filter((item: any) => item.status === "active").length ?? 0,
    platforms,
  };

  const relationshipState = deriveRelationshipState({
    continuityStatus: threadStateSnapshot.continuityStatus,
    lifecycleStatus: threadStateSnapshot.lifecycleStatus,
    hasBindings: channelSummary.active > 0,
    hasMemories: memorySummary.active > 0,
  });

  const latestUserMessage =
    [...(messagePreview ?? [])]
      .reverse()
      .find((item: any) => item.role === "user")?.content ?? null;
  const latestAssistantMessage =
    [...(messagePreview ?? [])]
      .reverse()
      .find((item: any) => item.role === "assistant")?.content ?? null;
  const pendingCount = pendingFollowUps?.length ?? 0;

  return {
    workspaceId: workspace.id,
    relationshipState,
    relationshipSummary: summarizeRelationshipState(relationshipState),
    nextStep: summarizeNextStep({
      relationshipState,
      hasRole: Boolean(agent),
      hasThread: Boolean(threadRow),
      hasBindings: channelSummary.active > 0,
      pendingFollowUps: pendingCount,
    }),
    lastInteractionAt,
    recentActivity: {
      userMessage: truncatePreview(latestUserMessage, 120),
      assistantMessage: truncatePreview(latestAssistantMessage, 140),
    },
    threadState: threadStateSnapshot,
    followUpSummary: {
      pendingCount,
      nextTriggerAt: pendingFollowUps?.[0]?.trigger_at ?? null,
    },
    memorySummary,
    channelSummary,
    currentRole: agent
      ? {
          agentId: agent.id,
          name: agent.name,
          personaSummary: agent.persona_summary,
        }
      : null,
    currentThread: threadRow
      ? {
          threadId: threadRow.id,
          title: threadRow.title,
          updatedAt: threadRow.updated_at ?? threadRow.created_at ?? null,
        }
      : null,
  };
}
