import { insertPendingAssistantMessage } from "@/lib/chat/assistant-message-state-persistence";
import { buildThreadActivityPatch } from "@/lib/chat/thread-activity";
import { loadThreadMessages } from "@/lib/chat/thread-message-persistence";

type RuntimeTurnBootstrapTarget = {
  supabase: any;
  thread: {
    id: string;
    title: string;
    agent_id: string;
    created_at: string;
    updated_at: string;
    status: string;
  };
  workspaceId: string;
  userId: string;
  content: string;
  userMessageId: string;
  source?: string | null;
};

export async function bootstrapRuntimeAssistantTurn(
  args: RuntimeTurnBootstrapTarget
) {
  const threadPatch = buildThreadActivityPatch({
    content: args.content,
    shouldSummarizeTitle: args.thread.title === "New chat"
  });

  await args.supabase
    .from("threads")
    .update(threadPatch)
    .eq("id", args.thread.id)
    .eq("owner_user_id", args.userId);

  const { data: persistedMessages, error: persistedMessagesError } =
    await loadThreadMessages({
      supabase: args.supabase,
      threadId: args.thread.id,
      workspaceId: args.workspaceId
    });

  if (persistedMessagesError) {
    throw new Error(persistedMessagesError.message);
  }

  const { data: assistantPlaceholder, error: assistantPlaceholderError } =
    await insertPendingAssistantMessage({
      supabase: args.supabase,
      threadId: args.thread.id,
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.thread.agent_id,
      userMessageId: args.userMessageId,
      source: args.source
    });

  if (assistantPlaceholderError || !assistantPlaceholder) {
    throw new Error(
      assistantPlaceholderError?.message ??
        "Failed to initialize the assistant reply placeholder."
    );
  }

  return {
    threadPatch,
    persistedMessages: (persistedMessages ?? []) as Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      status: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }>,
    assistantPlaceholder
  };
}
