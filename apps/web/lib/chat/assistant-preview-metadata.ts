import {
  buildRuntimeFollowUpExecutionMetadata,
  buildRuntimeMemoryUsageMetadata,
  buildRuntimeFollowUpRequestMetadata,
  buildRuntimeMemoryWriteOutcomeMetadata,
  buildRuntimeMemoryWriteRequestMetadata,
  getRuntimePreviewMetadataGroup
} from "@/lib/chat/runtime-preview-metadata";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import { loadScopedMessageById } from "@/lib/chat/message-read";
import { updateScopedMessage } from "@/lib/chat/message-persistence";

type AssistantPreviewTarget = {
  supabase: any;
  assistantMessageId: string;
  threadId: string;
  workspaceId: string;
  userId: string;
};

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
  const { data: assistantMessage } = await loadScopedMessageById({
    supabase: args.supabase,
    messageId: args.assistantMessageId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    select: "metadata"
  });

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

  await updateScopedMessage({
    supabase: args.supabase,
    messageId: args.assistantMessageId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    patch: {
      metadata: {
        ...(currentMetadata ?? {}),
        ...nextUpdates
      },
      updated_at: new Date().toISOString()
    }
  });
}

export async function updateAssistantMemoryWriteRequestPreview(
  args: AssistantPreviewTarget & {
    requests: Parameters<typeof buildRuntimeMemoryWriteRequestMetadata>[0];
    activeNamespace?: ActiveRuntimeMemoryNamespace | null;
    extraPlannerCandidates?: Parameters<
      typeof buildRuntimeMemoryWriteRequestMetadata
    >[2];
  }
) {
  return updateAssistantPreviewMetadata({
    ...args,
    updates: buildRuntimeMemoryWriteRequestMetadata(
      args.requests,
      args.activeNamespace ?? null,
      args.extraPlannerCandidates ?? []
    )
  });
}

export async function updateAssistantFollowUpRequestPreview(
  args: AssistantPreviewTarget & {
    requests: Parameters<typeof buildRuntimeFollowUpRequestMetadata>[0];
  }
) {
  return updateAssistantPreviewMetadata({
    ...args,
    updates: buildRuntimeFollowUpRequestMetadata(args.requests)
  });
}

export async function updateAssistantMemoryWriteOutcomePreview(
  args: AssistantPreviewTarget & {
    outcome: Parameters<typeof buildRuntimeMemoryWriteOutcomeMetadata>[0];
  }
) {
  return updateAssistantPreviewMetadata({
    ...args,
    updates: (currentMetadata) =>
      buildRuntimeMemoryWriteOutcomeMetadata(
        args.outcome,
        getRuntimePreviewMetadataGroup(currentMetadata, "runtime_memory_writes")
      )
  });
}

export async function updateAssistantFollowUpExecutionPreview(
  args: AssistantPreviewTarget & {
    execution: Parameters<typeof buildRuntimeFollowUpExecutionMetadata>[0];
  }
) {
  return updateAssistantPreviewMetadata({
    ...args,
    updates: buildRuntimeFollowUpExecutionMetadata(args.execution)
  });
}

export async function updateAssistantMemoryUsagePreview(
  args: AssistantPreviewTarget & {
    usage: Parameters<typeof buildRuntimeMemoryUsageMetadata>[0];
  }
) {
  return updateAssistantPreviewMetadata({
    ...args,
    updates: buildRuntimeMemoryUsageMetadata(args.usage)
  });
}
