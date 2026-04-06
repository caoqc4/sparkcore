type MessageTarget = {
  supabase: any;
  threadId: string;
  workspaceId: string;
  userId: string;
};

function normalizeRequiredUuidLike(field: string, value: string) {
  const trimmed =
    typeof value === "string"
      ? value.trim()
      : "";

  if (
    trimmed.length === 0 ||
    trimmed === "undefined" ||
    trimmed === "null"
  ) {
    throw new Error(`Invalid UUID-like value for ${field}.`);
  }

  return trimmed;
}

export function insertMessage(
  args: MessageTarget & {
    payload: Record<string, unknown>;
    select?: string;
  }
) {
  const threadId = normalizeRequiredUuidLike("threadId", args.threadId);
  const workspaceId = normalizeRequiredUuidLike("workspaceId", args.workspaceId);
  const userId = normalizeRequiredUuidLike("userId", args.userId);
  let query = args.supabase.from("messages").insert({
    thread_id: threadId,
    workspace_id: workspaceId,
    user_id: userId,
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
  const messageId = normalizeRequiredUuidLike("messageId", args.messageId);
  const threadId = normalizeRequiredUuidLike("threadId", args.threadId);
  const workspaceId = normalizeRequiredUuidLike("workspaceId", args.workspaceId);
  const userId = normalizeRequiredUuidLike("userId", args.userId);

  return args.supabase
    .from("messages")
    .update(args.patch)
    .eq("id", messageId)
    .eq("thread_id", threadId)
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
}
