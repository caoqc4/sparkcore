import { loadThreadMessages } from "@/lib/chat/message-read";
import { loadRecentOwnedMemories } from "@/lib/chat/memory-item-read";

export async function loadSmokeTurnExistingState(args: {
  supabase: Parameters<typeof loadRecentOwnedMemories>[0]["supabase"];
  threadId: string;
  workspaceId: string;
  userId: string;
}) {
  const { data: existingMemories, error: memoriesError } =
    await loadRecentOwnedMemories({
      supabase: args.supabase,
      workspaceId: args.workspaceId,
      userId: args.userId,
      select:
        "id, memory_type, content, confidence, category, key, value, scope, status, target_agent_id, target_thread_id, metadata",
      limit: 200
    });

  if (memoriesError) {
    throw new Error(`Failed to load smoke memories: ${memoriesError.message}`);
  }

  const { data: existingMessages, error: messagesError } =
    await loadThreadMessages({
      supabase: args.supabase,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      select: "role, content, status, metadata"
    });

  if (messagesError) {
    throw new Error(`Failed to load smoke messages: ${messagesError.message}`);
  }

  return {
    existingMemories,
    existingMessages
  };
}
