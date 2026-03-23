export function loadOwnedMemoryItemById(args: {
  supabase: any;
  memoryItemId: string;
  userId: string;
  select: string;
}) {
  return args.supabase
    .from("memory_items")
    .select(args.select)
    .eq("id", args.memoryItemId)
    .eq("user_id", args.userId)
    .maybeSingle();
}

export function loadActiveSingleSlotMemoryRows(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
  category: string;
  key: string;
  scope: string;
  excludedMemoryItemId?: string;
  targetAgentId?: string | null;
  targetThreadId?: string | null;
  select?: string;
}) {
  let query = args.supabase
    .from("memory_items")
    .select(args.select ?? "id, metadata")
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId)
    .eq("category", args.category)
    .eq("key", args.key)
    .eq("scope", args.scope)
    .eq("status", "active");

  if (args.excludedMemoryItemId) {
    query = query.neq("id", args.excludedMemoryItemId);
  }

  query =
    args.scope === "user_agent"
      ? query.eq("target_agent_id", args.targetAgentId)
      : query.is("target_agent_id", null);

  query =
    args.scope === "thread_local"
      ? query.eq("target_thread_id", args.targetThreadId)
      : query.is("target_thread_id", null);

  return query;
}
