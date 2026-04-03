export function loadScopedMessageById(args: {
  supabase: any;
  messageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
  select: string;
}) {
  return args.supabase
    .from("messages")
    .select(args.select)
    .eq("id", args.messageId)
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId)
    .maybeSingle();
}

export function loadThreadMessages(args: {
  supabase: any;
  threadId: string;
  workspaceId: string;
  select?: string;
}) {
  return args.supabase
    .from("messages")
    .select(args.select ?? "id, role, content, status, metadata, created_at")
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .order("created_at", { ascending: true });
}

export function loadRecentThreadMessages(args: {
  supabase: any;
  threadId: string;
  workspaceId: string;
  limit: number;
  select?: string;
}) {
  return args.supabase
    .from("messages")
    .select(args.select ?? "id, role, content, status, metadata, created_at")
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .order("created_at", { ascending: false })
    .limit(args.limit);
}

export function loadMessagesByIds(args: {
  supabase: any;
  messageIds: string[];
  workspaceId: string;
  select: string;
}) {
  return args.supabase
    .from("messages")
    .select(args.select)
    .in("id", args.messageIds)
    .eq("workspace_id", args.workspaceId);
}

export function loadCompletedMessagesForThreads(args: {
  supabase: any;
  threadIds: string[];
  workspaceId: string;
  select?: string;
}) {
  return args.supabase
    .from("messages")
    .select(args.select ?? "thread_id, content, created_at, status")
    .in("thread_id", args.threadIds)
    .eq("workspace_id", args.workspaceId)
    .in("status", ["completed"])
    .order("created_at", { ascending: false });
}
