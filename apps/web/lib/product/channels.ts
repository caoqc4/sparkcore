import {
  loadOwnedActiveAgentsByIds,
  loadOwnedThreadTitlesByIds
} from "@/lib/chat/runtime-turn-context";

export type ProductChannelBinding = {
  id: string;
  platform: string;
  channelId: string;
  peerId: string;
  platformUserId: string;
  status: "active" | "inactive";
  threadId: string | null;
  agentId: string;
  updatedAt: string | null;
  threadTitle: string | null;
  agentName: string | null;
};

type ThreadTitleRow = {
  id: string;
  title: string;
};

type AgentNameRow = {
  id: string;
  name: string;
};

export async function loadOwnedChannelBindings(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
}) {
  const { data, error } = await args.supabase
    .from("channel_bindings")
    .select(
      "id, platform, channel_id, peer_id, platform_user_id, status, thread_id, agent_id, updated_at"
    )
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load channel bindings: ${error.message}`);
  }

  const threadIds: string[] = Array.from(
    new Set(
      (data ?? [])
        .map((item: any) => item.thread_id)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const agentIds: string[] = Array.from(
    new Set(
      (data ?? [])
        .map((item: any) => item.agent_id)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const [{ data: threads }, { data: agents }] = await Promise.all([
    threadIds.length > 0
      ? loadOwnedThreadTitlesByIds({
          supabase: args.supabase,
          threadIds,
          workspaceId: args.workspaceId,
          userId: args.userId
        })
      : Promise.resolve({ data: [] as ThreadTitleRow[] }),
    agentIds.length > 0
      ? loadOwnedActiveAgentsByIds({
          supabase: args.supabase,
          agentIds,
          workspaceId: args.workspaceId,
          userId: args.userId
        })
      : Promise.resolve({ data: [] as AgentNameRow[] })
  ]);

  const threadTitleMap = new Map<string, string>(
    (threads ?? []).map((item: ThreadTitleRow) => [item.id, item.title])
  );
  const agentNameMap = new Map<string, string>(
    (agents ?? []).map((item: AgentNameRow) => [item.id, item.name])
  );

  return (data ?? []).map((item: any) => ({
    id: item.id,
    platform: item.platform,
    channelId: item.channel_id,
    peerId: item.peer_id,
    platformUserId: item.platform_user_id,
    status: item.status,
    threadId: item.thread_id ?? null,
    agentId: item.agent_id,
    updatedAt: item.updated_at ?? null,
    threadTitle:
      typeof item.thread_id === "string" ? threadTitleMap.get(item.thread_id) ?? null : null,
    agentName:
      typeof item.agent_id === "string" ? agentNameMap.get(item.agent_id) ?? null : null
  })) as ProductChannelBinding[];
}
