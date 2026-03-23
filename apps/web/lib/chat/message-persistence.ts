type MessageTarget = {
  supabase: any;
  threadId: string;
  workspaceId: string;
  userId: string;
};

export function insertMessage(
  args: MessageTarget & {
    payload: Record<string, unknown>;
    select?: string;
  }
) {
  let query = args.supabase.from("messages").insert({
    thread_id: args.threadId,
    workspace_id: args.workspaceId,
    user_id: args.userId,
    ...args.payload
  });

  if (args.select) {
    query = query.select(args.select);
  }

  return query;
}

export function updateScopedMessage(
  args: MessageTarget & {
    messageId: string;
    patch: Record<string, unknown>;
  }
) {
  return args.supabase
    .from("messages")
    .update(args.patch)
    .eq("id", args.messageId)
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId);
}
