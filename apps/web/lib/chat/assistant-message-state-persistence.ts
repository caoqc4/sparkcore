import {
  buildFailedAssistantMetadata,
  buildPendingAssistantMetadata
} from "@/lib/chat/assistant-message-state-metadata";

type AssistantMessageStateTarget = {
  supabase: any;
  threadId: string;
  workspaceId: string;
  userId: string;
};

export async function insertPendingAssistantMessage(
  args: AssistantMessageStateTarget & {
    agentId: string;
    userMessageId: string;
    source?: string | null;
  }
) {
  return args.supabase
    .from("messages")
    .insert({
      thread_id: args.threadId,
      workspace_id: args.workspaceId,
      user_id: args.userId,
      role: "assistant",
      content: "",
      status: "pending",
      metadata: buildPendingAssistantMetadata({
        agentId: args.agentId,
        userMessageId: args.userMessageId,
        source: args.source
      })
    })
    .select("id")
    .single();
}

export async function markAssistantMessageFailed(
  args: AssistantMessageStateTarget & {
    assistantMessageId: string;
    agentId?: string | null;
    userMessageId?: string | null;
    source?: string | null;
    errorType: string;
    errorMessage: string;
    baseMetadata?: Record<string, unknown> | null;
  }
) {
  return args.supabase
    .from("messages")
    .update({
      status: "failed",
      content: "",
      metadata: buildFailedAssistantMetadata({
        agentId: args.agentId,
        userMessageId: args.userMessageId,
        source: args.source,
        errorType: args.errorType,
        errorMessage: args.errorMessage,
        baseMetadata: args.baseMetadata
      }),
      updated_at: new Date().toISOString()
    })
    .eq("id", args.assistantMessageId)
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .eq("user_id", args.userId);
}
