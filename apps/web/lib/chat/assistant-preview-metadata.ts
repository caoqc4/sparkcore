export async function updateAssistantPreviewMetadata(args: {
  supabase: any;
  assistantMessageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
  updates: Record<string, unknown>;
}) {
  const { data: assistantMessage } = await args.supabase
    .from("messages")
    .select("metadata")
    .eq("id", args.assistantMessageId)
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId)
    .maybeSingle();

  await args.supabase
    .from("messages")
    .update({
      metadata: {
        ...(assistantMessage?.metadata ?? {}),
        ...args.updates
      },
      updated_at: new Date().toISOString()
    })
    .eq("id", args.assistantMessageId)
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId);
}
