import {
  buildFailedAssistantMetadata,
  buildPendingAssistantMetadata,
  buildRetriedAssistantMetadata
} from "@/lib/chat/assistant-message-state-metadata";
import {
  insertMessage,
  updateScopedMessage
} from "@/lib/chat/message-persistence";

type AssistantMessageStateTarget = {
  supabase: any;
  threadId: string;
  workspaceId: string;
  userId: string;
};

function normalizeOptionalUuidLike(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (
    trimmed.length === 0 ||
    trimmed === "undefined" ||
    trimmed === "null"
  ) {
    return null;
  }

  return trimmed;
}

export async function insertPendingAssistantMessage(
  args: AssistantMessageStateTarget & {
    agentId: string;
    userMessageId: string;
    source?: string | null;
  }
) {
  return insertMessage({
    supabase: args.supabase,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    payload: {
      role: "assistant",
      content: "",
      status: "pending",
      metadata: buildPendingAssistantMetadata({
        agentId: args.agentId,
        userMessageId: args.userMessageId,
        source: args.source
      })
    },
    select: "id"
  }).single();
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
  return updateScopedMessage({
    supabase: args.supabase,
    messageId: args.assistantMessageId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    patch: {
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
    }
  });
}

export async function markAssistantMessageRetried(
  args: AssistantMessageStateTarget & {
    assistantMessageId: string;
    baseMetadata?: Record<string, unknown> | null;
    retriedAt?: string;
  }
) {
  return updateScopedMessage({
    supabase: args.supabase,
    messageId: args.assistantMessageId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    patch: {
      status: "pending",
      metadata: buildRetriedAssistantMetadata({
        baseMetadata: args.baseMetadata,
        retriedAt: args.retriedAt
      }),
      updated_at: new Date().toISOString()
    }
  });
}

export async function persistCompletedAssistantMessage(
  args: AssistantMessageStateTarget & {
    assistantMessageId?: string | null;
    payload: {
      role: "assistant";
      content: string;
      status: "completed";
      metadata: Record<string, unknown>;
    };
  }
) {
  const normalizedAssistantMessageId = normalizeOptionalUuidLike(
    args.assistantMessageId
  );

  return normalizedAssistantMessageId
    ? updateScopedMessage({
        supabase: args.supabase,
        messageId: normalizedAssistantMessageId,
        threadId: args.threadId,
        workspaceId: args.workspaceId,
        userId: args.userId,
        patch: {
          ...args.payload,
          updated_at: new Date().toISOString()
        }
      })
    : insertMessage({
        supabase: args.supabase,
        threadId: args.threadId,
        workspaceId: args.workspaceId,
        userId: args.userId,
        payload: args.payload
      });
}
