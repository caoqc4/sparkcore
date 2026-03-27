import type { StoredMemory } from "@/lib/chat/memory-shared";
import {
  getMemoryCategory,
  getMemoryScope,
  getMemoryStatus
} from "@/lib/chat/memory-v2";
import { classifyStoredMemorySemanticTarget } from "@/lib/chat/memory-records";
import {
  loadOwnedActiveAgentsByIds,
  loadOwnedThreadTitlesByIds,
  loadPrimaryWorkspace,
  loadRecentOwnedMemories,
  loadSourceMessagesByIds
} from "@/lib/chat/runtime-turn-context";

export type ProductMemoryItem = StoredMemory & {
  status: string;
  categoryLabel: string;
  scopeLabel: string;
  statusLabel: string;
  semanticTargetLabel: string;
  sourceThreadTitle: string | null;
  sourceThreadId: string | null;
  sourceTimestamp: string | null;
  sourceExcerpt: string | null;
  sourceRole: "user" | "assistant" | null;
  targetAgentName: string | null;
};

export type ProductMemoryPageData = {
  workspaceId: string;
  items: ProductMemoryItem[];
};

type SourceMessageRow = {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  created_at: string | null;
};

type ThreadTitleRow = {
  id: string;
  title: string;
};

type AgentNameRow = {
  id: string;
  name: string;
};

export function getMemoryCategoryLabel(category: string) {
  switch (category) {
    case "profile":
      return "Profile";
    case "preference":
      return "Preference";
    case "relationship":
      return "Relationship";
    case "goal":
      return "Goal";
    default:
      return category;
  }
}

export function getMemoryScopeLabel(scope: string) {
  switch (scope) {
    case "user_global":
      return "Global";
    case "user_agent":
      return "This role";
    case "thread_local":
      return "This thread";
    default:
      return scope;
  }
}

export function getMemoryStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "hidden":
      return "Hidden";
    case "incorrect":
      return "Incorrect";
    case "superseded":
      return "Superseded";
    default:
      return status;
  }
}

export function getMemorySemanticTargetLabel(memory: StoredMemory) {
  switch (classifyStoredMemorySemanticTarget(memory)) {
    case "static_profile":
      return "Static profile";
    case "dynamic_profile":
      return "Dynamic profile";
    case "memory_record":
      return "Memory record";
    case "thread_state_candidate":
      return "Thread state";
    default:
      return "Unclassified";
  }
}

export function getMemoryEffectHint(memory: StoredMemory) {
  const status = getMemoryStatus(memory);
  const scope = getMemoryScope(memory);

  if (status === "hidden") {
    return "Hidden memories stay out of recall until restored.";
  }

  if (status === "incorrect") {
    return "Marked incorrect memories stay out of recall until restored.";
  }

  if (status === "superseded") {
    return "Superseded memories have been replaced by a newer value.";
  }

  if (scope === "thread_local") {
    return "This memory mainly affects the current thread.";
  }

  if (scope === "user_agent") {
    return "This memory mainly affects the current role.";
  }

  return "This memory can affect the relationship across threads.";
}

export async function loadProductMemoryPageData(args: {
  supabase: any;
  userId: string;
  roleId?: string | null;
  threadId?: string | null;
}) : Promise<ProductMemoryPageData | null> {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.userId
  });

  if (!workspace) {
    return null;
  }

  const { data: memories } = await loadRecentOwnedMemories({
    supabase: args.supabase,
    workspaceId: workspace.id,
    userId: args.userId,
    limit: 120
  });

  const requestedRoleId =
    typeof args.roleId === "string" && args.roleId.length > 0 ? args.roleId : null;
  const requestedThreadId =
    typeof args.threadId === "string" && args.threadId.length > 0 ? args.threadId : null;

  const filteredMemories = (memories ?? []).filter((item: StoredMemory) => {
    if (requestedThreadId) {
      return item.target_thread_id === requestedThreadId;
    }

    if (!requestedRoleId) {
      return true;
    }

    if (item.scope === "thread_local") {
      return item.target_agent_id === requestedRoleId;
    }

    if (item.scope === "user_agent") {
      return item.target_agent_id === requestedRoleId;
    }

    return true;
  });

  const sourceMessageIds: string[] = Array.from(
    new Set(
      filteredMemories
        .map((item: any) => item.source_message_id)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const { data: sourceMessages } =
    sourceMessageIds.length > 0
      ? await loadSourceMessagesByIds({
          supabase: args.supabase,
          sourceMessageIds,
          workspaceId: workspace.id
        })
      : { data: [] as SourceMessageRow[] };

  const sourceThreadIds: string[] = Array.from(
    new Set(
      (sourceMessages ?? [])
        .map((item: SourceMessageRow) => item.thread_id)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const targetAgentIds: string[] = Array.from(
    new Set(
      filteredMemories
        .map((item: any) => item.target_agent_id)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const [{ data: threadTitles }, { data: targetAgents }] = await Promise.all([
    sourceThreadIds.length > 0
      ? loadOwnedThreadTitlesByIds({
          supabase: args.supabase,
          threadIds: sourceThreadIds,
          workspaceId: workspace.id,
          userId: args.userId
        })
      : Promise.resolve({ data: [] as ThreadTitleRow[] }),
    targetAgentIds.length > 0
      ? loadOwnedActiveAgentsByIds({
          supabase: args.supabase,
          agentIds: targetAgentIds,
          workspaceId: workspace.id,
          userId: args.userId
        })
      : Promise.resolve({ data: [] as AgentNameRow[] })
  ]);

  const sourceMessageMap = new Map<string, SourceMessageRow>(
    (sourceMessages ?? []).map((item: SourceMessageRow) => [item.id, item])
  );
  const threadTitleMap = new Map<string, string>(
    (threadTitles ?? []).map((item: ThreadTitleRow) => [item.id, item.title])
  );
  const targetAgentMap = new Map<string, string>(
    (targetAgents ?? []).map((item: AgentNameRow) => [item.id, item.name])
  );

  const items = filteredMemories.map((memory: StoredMemory) => {
    const status = getMemoryStatus(memory);
    const sourceMessage =
      typeof memory.source_message_id === "string"
        ? sourceMessageMap.get(memory.source_message_id)
        : null;

    return {
      ...memory,
      status,
      categoryLabel: getMemoryCategoryLabel(getMemoryCategory(memory)),
      scopeLabel: getMemoryScopeLabel(getMemoryScope(memory)),
      statusLabel: getMemoryStatusLabel(status),
      semanticTargetLabel: getMemorySemanticTargetLabel(memory),
      sourceThreadTitle:
        sourceMessage?.thread_id ? threadTitleMap.get(sourceMessage.thread_id) ?? null : null,
      sourceThreadId: sourceMessage?.thread_id ?? null,
      sourceTimestamp: sourceMessage?.created_at ?? null,
      sourceExcerpt: sourceMessage?.content?.trim() ? sourceMessage.content.trim() : null,
      sourceRole: sourceMessage?.role ?? null,
      targetAgentName:
        typeof memory.target_agent_id === "string"
          ? targetAgentMap.get(memory.target_agent_id) ?? null
          : null
    } satisfies ProductMemoryItem;
  });

  return {
    workspaceId: workspace.id,
    items
  };
}
