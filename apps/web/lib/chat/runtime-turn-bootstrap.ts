import { insertPendingAssistantMessage } from "@/lib/chat/assistant-message-state-persistence";
import { updateOwnedThread } from "@/lib/chat/runtime-turn-context";
import { buildThreadActivityPatch } from "@/lib/chat/thread-activity";
import { loadRecentThreadMessages } from "@/lib/chat/message-read";

const IM_BOOTSTRAP_RECENT_MESSAGE_LIMIT = 24;

function nowMs() {
  return Date.now();
}

function elapsedMs(startedAt: number) {
  return Math.max(0, nowMs() - startedAt);
}

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
  const bootstrapStartedAt = nowMs();
  const threadPatch = buildThreadActivityPatch({
    content: args.content,
    shouldSummarizeTitle: args.thread.title === "New chat"
  });

  const updateThreadStartedAt = nowMs();
  await updateOwnedThread({
    supabase: args.supabase,
    threadId: args.thread.id,
    userId: args.userId,
    patch: threadPatch
  });
  const updateThreadDurationMs = elapsedMs(updateThreadStartedAt);

  const loadMessagesStartedAt = nowMs();
  const { data: persistedMessages, error: persistedMessagesError } =
    await loadRecentThreadMessages({
      supabase: args.supabase,
      threadId: args.thread.id,
      workspaceId: args.workspaceId,
      limit: IM_BOOTSTRAP_RECENT_MESSAGE_LIMIT
    });
  const loadMessagesDurationMs = elapsedMs(loadMessagesStartedAt);

  if (persistedMessagesError) {
    throw new Error(persistedMessagesError.message);
  }

  const assistantPlaceholderStartedAt = nowMs();
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
  const assistantPlaceholderDurationMs = elapsedMs(assistantPlaceholderStartedAt);

  if (assistantPlaceholderError || !assistantPlaceholder) {
    throw new Error(
      assistantPlaceholderError?.message ??
        "Failed to initialize the assistant reply placeholder."
    );
  }

  return {
    threadPatch,
    timing: {
      total: elapsedMs(bootstrapStartedAt),
      update_thread: updateThreadDurationMs,
      load_thread_messages: loadMessagesDurationMs,
      insert_assistant_placeholder: assistantPlaceholderDurationMs
    },
    persistedMessages: [...((persistedMessages ?? []) as Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      status: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }>)].reverse(),
    assistantPlaceholder
  };
}
