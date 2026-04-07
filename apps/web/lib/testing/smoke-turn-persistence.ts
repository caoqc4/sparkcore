import type { SupabaseClient } from "@supabase/supabase-js";
import { insertMessage } from "@/lib/chat/message-persistence";
import { buildThreadActivityPatch } from "@/lib/chat/thread-activity";
import { updateOwnedThread } from "@/lib/chat/runtime-turn-context";
import { isTransientSmokeConstraintVisibilityError } from "@/lib/testing/smoke-retry";

export async function insertSmokeUserTurn(args: {
  supabase: SupabaseClient;
  threadId: string;
  workspaceId: string;
  userId: string;
  content: string;
}) {
  let insertedUserMessage: { id: string } | null = null;
  let insertedUserMessageError: { message: string } | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await insertMessage({
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

    insertedUserMessage = result.data;
    insertedUserMessageError = result.error;

    if (!insertedUserMessageError || attempt === 3) {
      break;
    }

    if (!isTransientSmokeConstraintVisibilityError(insertedUserMessageError)) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }

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
