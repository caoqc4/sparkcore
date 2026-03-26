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

  return (data ?? []).map((item: any) => ({
    id: item.id,
    platform: item.platform,
    channelId: item.channel_id,
    peerId: item.peer_id,
    platformUserId: item.platform_user_id,
    status: item.status,
    threadId: item.thread_id ?? null,
    agentId: item.agent_id,
    updatedAt: item.updated_at ?? null
  })) as ProductChannelBinding[];
}

