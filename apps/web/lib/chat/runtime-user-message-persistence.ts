import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";
import { buildRuntimeUserMessageMetadata } from "@/lib/chat/runtime-user-message-metadata";

type UserMessageTarget = {
  supabase: any;
  threadId: string;
  workspaceId: string;
  userId: string;
};

export async function insertUserMessage(
  args: UserMessageTarget & {
    content: string;
    metadata?: Record<string, unknown>;
  }
) {
  return args.supabase
    .from("messages")
    .insert({
      thread_id: args.threadId,
      workspace_id: args.workspaceId,
      user_id: args.userId,
      role: "user",
      content: args.content,
      ...(args.metadata ? { metadata: args.metadata } : {})
    })
    .select("id")
    .single();
}

export async function persistRuntimeUserMessageMetadata(
  args: UserMessageTarget & {
    messageId: string;
    runtimeTurnInput: RuntimeTurnInput;
  }
) {
  return args.supabase
    .from("messages")
    .update({
      metadata: buildRuntimeUserMessageMetadata(args.runtimeTurnInput),
      updated_at: new Date().toISOString()
    })
    .eq("id", args.messageId)
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId);
}

export async function insertRuntimeUserMessage(
  args: UserMessageTarget & {
    content: string;
    runtimeTurnInput: RuntimeTurnInput;
  }
) {
  return insertUserMessage({
    ...args,
    content: args.content,
    metadata: buildRuntimeUserMessageMetadata(args.runtimeTurnInput)
  });
}
