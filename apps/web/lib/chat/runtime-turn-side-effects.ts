import { persistCompletedAssistantMessage } from "@/lib/chat/assistant-message-state-persistence";
import { updateOwnedThread } from "@/lib/chat/runtime-turn-context";
import { maybeWriteThreadStateAfterTurn } from "@/lib/chat/thread-state-writeback";
import { createAdminThreadStateRepository } from "@/lib/chat/thread-state-admin-repository";
import { buildThreadStateWritebackCompletedEvent } from "@/lib/chat/runtime-event-builders";
import {
  readRuntimeTimingRecord,
  buildRuntimeDebugMetadataAfterWriteback,
  buildRuntimeDebugMetadataAfterWritebackSoftFail
} from "@/lib/chat/runtime-turn-observability";
import type { ApplyRuntimeTurnSideEffectsArgs } from "@/lib/chat/runtime-turn-observability-contracts";

export async function applyRuntimeTurnSideEffects(
  args: ApplyRuntimeTurnSideEffectsArgs
) {
  const { persistenceArtifacts, writebackArtifacts, executionContext } = args;
  const { workspace, thread, assistant_message_id, supabase } =
    args.preparedRuntimeTurn.resources;
  const agent = args.preparedRuntimeTurn.role.agent;
  const runtimeSupabase = supabase as any;

  const persistAssistantStartedAt = executionContext.nowMs();
  if (
    assistant_message_id &&
    (assistant_message_id === "undefined" || assistant_message_id === "null")
  ) {
    console.warn("[runtime-turn-side-effects]", {
      issue: "invalid_assistant_message_id",
      assistant_message_id,
      thread_id: thread.id,
      workspace_id: workspace.id,
      user_id: args.userId,
      agent_id: agent.id
    });
  }
  let error: { message: string } | null = null;
  try {
    const result = await persistCompletedAssistantMessage({
      supabase: runtimeSupabase,
      assistantMessageId: assistant_message_id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: args.userId,
      payload: persistenceArtifacts.assistantPayload
    });
    error = result.error;
  } catch (persistError) {
    console.error("[runtime-turn-side-effects:persist-assistant-failed]", {
      assistant_message_id,
      thread_id: thread.id,
      workspace_id: workspace.id,
      user_id: args.userId,
      agent_id: agent.id,
      error_message:
        persistError instanceof Error ? persistError.message : String(persistError)
    });
    throw persistError;
  }
  const persistAssistantDurationMs = executionContext.elapsedMs(
    persistAssistantStartedAt
  );

  if (error) {
    throw new Error(`Failed to store assistant reply: ${error.message}`);
  }

  const updateThreadStartedAt = executionContext.nowMs();
  await updateOwnedThread({
    supabase: runtimeSupabase,
    threadId: thread.id,
    userId: args.userId,
    patch: {
      agent_id: agent.id,
      updated_at: new Date().toISOString()
    }
  });
  const updateThreadDurationMs = executionContext.elapsedMs(updateThreadStartedAt);

  try {
    const threadStateWritebackStartedAt = executionContext.nowMs();
    const threadStateWriteback = await maybeWriteThreadStateAfterTurn({
      prepared: args.preparedRuntimeTurn,
      result: writebackArtifacts.runtimeTurnResult,
      repository: createAdminThreadStateRepository(),
      repository_name: "supabase"
    });
    const threadStateWritebackDurationMs = executionContext.elapsedMs(
      threadStateWritebackStartedAt
    );

    writebackArtifacts.runtimeTurnResult.runtime_events.push(
      buildThreadStateWritebackCompletedEvent({
        status: threadStateWriteback.status,
        repository: threadStateWriteback.repository,
        anchorMode:
          threadStateWriteback.status === "written"
            ? threadStateWriteback.anchor_mode
            : null,
        focusProjectionReason:
          threadStateWriteback.status === "written"
            ? threadStateWriteback.focus_projection_reason
            : null,
        continuityProjectionReason:
          threadStateWriteback.status === "written"
            ? threadStateWriteback.continuity_projection_reason
            : null,
        reason:
          threadStateWriteback.status === "written"
            ? null
            : threadStateWriteback.reason
      })
    );

    writebackArtifacts.runtimeTurnResult.debug_metadata =
      buildRuntimeDebugMetadataAfterWriteback({
        existingDebugMetadata:
          writebackArtifacts.runtimeTurnResult.debug_metadata,
        existingRuntimeTiming: readRuntimeTimingRecord(
          writebackArtifacts.runtimeTurnResult.debug_metadata
        ),
        humanizedDeliveryPacket: executionContext.humanizedDeliveryPacket,
        threadStateWritebackDurationMs,
        threadStateWriteback:
          threadStateWriteback.status === "written"
            ? {
                status: threadStateWriteback.status,
                repository: threadStateWriteback.repository,
                anchor_mode: threadStateWriteback.anchor_mode,
                focus_projection_reason:
                  threadStateWriteback.focus_projection_reason,
                continuity_projection_reason:
                  threadStateWriteback.continuity_projection_reason
              }
            : {
                status: threadStateWriteback.status,
                repository: threadStateWriteback.repository,
              reason: threadStateWriteback.reason
              },
        knowledgeLoadDurationMs: executionContext.knowledgeLoadDurationMs,
        generateTextDurationMs: executionContext.generateTextDurationMs,
        modelProfileTimingMs: executionContext.modelProfileTimingMs,
        persistAssistantDurationMs,
        updateThreadDurationMs,
        assistantPayloadContentBytes:
          persistenceArtifacts.assistantPayloadContentBytes,
        assistantPayloadMetadataBytes:
          persistenceArtifacts.assistantPayloadMetadataBytes,
        assistantPayloadTotalBytes:
          persistenceArtifacts.assistantPayloadTotalBytes,
        promptMessageCount: executionContext.promptMessageCount,
        promptSystemChars: executionContext.promptSystemChars,
        promptSystemSectionLengths: executionContext.promptSystemSectionLengths,
        promptUserChars: executionContext.promptUserChars,
        promptAssistantChars: executionContext.promptAssistantChars,
        promptTotalChars: executionContext.promptTotalChars,
        promptTotalBytes: executionContext.promptTotalBytes,
        promptApproxTokenCount: executionContext.promptApproxTokenCount,
        runPreparedTotalDurationMs: executionContext.elapsedMs(
          executionContext.runPreparedStartedAt
        )
      });
  } catch {
    writebackArtifacts.runtimeTurnResult.debug_metadata =
      buildRuntimeDebugMetadataAfterWritebackSoftFail({
        existingDebugMetadata:
          writebackArtifacts.runtimeTurnResult.debug_metadata,
        existingRuntimeTiming: readRuntimeTimingRecord(
          writebackArtifacts.runtimeTurnResult.debug_metadata
        ),
        humanizedDeliveryPacket: executionContext.humanizedDeliveryPacket,
        knowledgeLoadDurationMs: executionContext.knowledgeLoadDurationMs,
        generateTextDurationMs: executionContext.generateTextDurationMs,
        modelProfileTimingMs: executionContext.modelProfileTimingMs,
        persistAssistantDurationMs,
        updateThreadDurationMs,
        assistantPayloadContentBytes:
          persistenceArtifacts.assistantPayloadContentBytes,
        assistantPayloadMetadataBytes:
          persistenceArtifacts.assistantPayloadMetadataBytes,
        assistantPayloadTotalBytes:
          persistenceArtifacts.assistantPayloadTotalBytes,
        promptMessageCount: executionContext.promptMessageCount,
        promptSystemChars: executionContext.promptSystemChars,
        promptSystemSectionLengths: executionContext.promptSystemSectionLengths,
        promptUserChars: executionContext.promptUserChars,
        promptAssistantChars: executionContext.promptAssistantChars,
        promptTotalChars: executionContext.promptTotalChars,
        promptTotalBytes: executionContext.promptTotalBytes,
        promptApproxTokenCount: executionContext.promptApproxTokenCount,
        runPreparedTotalDurationMs: executionContext.elapsedMs(
          executionContext.runPreparedStartedAt
        )
      });
  }

  return {
    runtimeTurnResult: writebackArtifacts.runtimeTurnResult,
    persistAssistantDurationMs,
    updateThreadDurationMs
  };
}
