import type { SupabaseClient } from "@supabase/supabase-js";
import { insertMessage } from "@/lib/chat/message-persistence";
import { buildSmokeAssistantMessagePayload } from "@/lib/testing/smoke-assistant-message-payload";
import type { SmokeAssistantInsertArgs } from "@/lib/testing/smoke-assistant-persistence-types";

export async function insertSmokeAssistantReply(args: SmokeAssistantInsertArgs) {
  const { data: insertedAssistantMessage, error: insertedAssistantMessageError } =
    await insertMessage({
      supabase: args.supabase as SupabaseClient,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      payload: buildSmokeAssistantMessagePayload(args),
      select: "id"
    }).single();

  if (insertedAssistantMessageError || !insertedAssistantMessage) {
    throw new Error(
      insertedAssistantMessageError?.message ??
        "Failed to insert the smoke assistant reply."
    );
  }

  return insertedAssistantMessage;
}
