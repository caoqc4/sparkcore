export async function updateAssistantPreviewMetadata(args: {
  supabase: any;
  assistantMessageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
  updates:
    | Record<string, unknown>
    | ((currentMetadata: Record<string, unknown> | null) => Record<string, unknown>);
}) {
  const { data: assistantMessage } = await args.supabase
    .from("messages")
    .select("metadata")
    .eq("id", args.assistantMessageId)
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId)
    .maybeSingle();

  const currentMetadata =
    assistantMessage?.metadata &&
    typeof assistantMessage.metadata === "object" &&
    !Array.isArray(assistantMessage.metadata)
      ? (assistantMessage.metadata as Record<string, unknown>)
      : null;
  const nextUpdates =
    typeof args.updates === "function"
      ? args.updates(currentMetadata)
      : args.updates;

  await args.supabase
    .from("messages")
    .update({
      metadata: {
        ...(currentMetadata ?? {}),
        ...nextUpdates
      },
      updated_at: new Date().toISOString()
    })
    .eq("id", args.assistantMessageId)
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId);
}
