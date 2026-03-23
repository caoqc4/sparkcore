import type { SupabaseClient } from "@supabase/supabase-js";
import { insertMessage } from "@/lib/chat/message-persistence";
import { buildThreadActivityPatch } from "@/lib/chat/thread-activity";
import { updateOwnedThread } from "@/lib/chat/runtime-turn-context";

export async function insertSmokeUserTurn(args: {
  supabase: SupabaseClient;
  threadId: string;
  workspaceId: string;
  userId: string;
  content: string;
}) {
  const { data: insertedUserMessage, error: insertedUserMessageError } =
    await insertMessage({
      supabase: args.supabase,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      payload: {
        role: "user",
        content: args.content
      },
      select: "id"
    }).single();

  if (insertedUserMessageError || !insertedUserMessage) {
    throw new Error(
      insertedUserMessageError?.message ?? "Failed to insert the smoke user message."
    );
  }

  return insertedUserMessage;
}

export async function patchSmokeThreadAfterUserTurn(args: {
  supabase: SupabaseClient;
  threadId: string;
  userId: string;
  title: string;
  content: string;
}) {
  const threadPatch = buildThreadActivityPatch({
    content: args.content,
    shouldSummarizeTitle: args.title === "New chat"
  });

  const { error: threadUpdateError } = await updateOwnedThread({
    supabase: args.supabase,
    threadId: args.threadId,
    userId: args.userId,
    patch: threadPatch
  });

  if (threadUpdateError) {
    throw new Error(
      `Failed to update the smoke thread: ${threadUpdateError.message}`
    );
  }
}
