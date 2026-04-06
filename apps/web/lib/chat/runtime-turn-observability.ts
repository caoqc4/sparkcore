import { buildHumanizedDeliveryDebugMetadata, buildHumanizedDeliveryLogFields } from "@/lib/chat/runtime-humanized-observability";
import type { HumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-contracts";
import type { RuntimeTurnResult } from "@/lib/chat/runtime-contract";
import type {
  BaseRuntimeTimingArgs,
  BuildGenerateAgentReplyDebugMetadataArgs,
  BuildGenerateAgentReplyLogFieldsArgs,
  BuildPreparedRuntimeTurnLogFieldsArgs,
  BuildRuntimeDebugMetadataAfterWritebackArgs,
  BuildRuntimeDebugMetadataAfterWritebackSoftFailArgs,
  ExistingRuntimeTiming,
  RuntimeTimingRecord,
  ThreadStateWritebackResult
} from "@/lib/chat/runtime-turn-observability-contracts";

function isWrittenThreadStateWriteback(
  value: ThreadStateWritebackResult
): value is Extract<ThreadStateWritebackResult, { status: "written" }> {
  return value.status === "written";
}

function toRuntimeTimingRecord(existing: ExistingRuntimeTiming) {
  return existing &&
    typeof existing === "object" &&
    !Array.isArray(existing)
    ? existing
    : ({} as RuntimeTimingRecord);
}

export function readRuntimeTimingRecord(
  debugMetadata: RuntimeTurnResult["debug_metadata"]
): RuntimeTimingRecord {
  return debugMetadata?.runtime_timing_ms &&
    typeof debugMetadata.runtime_timing_ms === "object" &&
    !Array.isArray(debugMetadata.runtime_timing_ms)
    ? (debugMetadata.runtime_timing_ms as RuntimeTimingRecord)
    : ({} as RuntimeTimingRecord);
}

export function buildRuntimeTimingFields(args: BaseRuntimeTimingArgs) {
  return {
    knowledge_load: args.knowledgeLoadDurationMs,
    generate_text: args.generateTextDurationMs,
    resolve_model_profile_account_level:
      args.modelProfileTimingMs.account_level_lookup,
    resolve_model_profile_bound_profile:
      args.modelProfileTimingMs.bound_profile_lookup,
    resolve_model_profile_default_profile:
      args.modelProfileTimingMs.default_profile_lookup,
    resolve_model_profile_bind_default:
      args.modelProfileTimingMs.bind_default_profile,
    persist_assistant_message: args.persistAssistantDurationMs,
    update_thread: args.updateThreadDurationMs,
    assistant_payload_content_bytes: args.assistantPayloadContentBytes,
    assistant_payload_metadata_bytes: args.assistantPayloadMetadataBytes,
    assistant_payload_total_bytes: args.assistantPayloadTotalBytes,
    prompt_message_count: args.promptMessageCount,
    prompt_system_chars: args.promptSystemChars,
    prompt_system_top_sections: args.promptSystemSectionLengths,
    prompt_user_chars: args.promptUserChars,
    prompt_assistant_chars: args.promptAssistantChars,
    prompt_total_chars: args.promptTotalChars,
    prompt_total_bytes: args.promptTotalBytes,
    prompt_approx_tokens: args.promptApproxTokenCount,
    run_prepared_total: args.runPreparedTotalDurationMs
  };
}

export function buildRuntimeDebugMetadataAfterWriteback(
  args: BuildRuntimeDebugMetadataAfterWritebackArgs
) {
  return {
    ...(args.existingDebugMetadata ?? {}),
    humanized_delivery: args.humanizedDeliveryPacket
      ? {
          ...buildHumanizedDeliveryDebugMetadata(args.humanizedDeliveryPacket),
          input_conflict: args.humanizedDeliveryPacket.patternSignals.inputConflict,
          conflict_hint: args.humanizedDeliveryPacket.patternSignals.conflictHint
        }
      : null,
    runtime_timing_ms: {
      ...toRuntimeTimingRecord(args.existingRuntimeTiming),
      ...buildRuntimeTimingFields(args),
      thread_state_writeback: args.threadStateWritebackDurationMs
    },
    thread_state_writeback: isWrittenThreadStateWriteback(args.threadStateWriteback)
      ? {
          status: args.threadStateWriteback.status,
          repository: args.threadStateWriteback.repository,
          anchor_mode: args.threadStateWriteback.anchor_mode,
          focus_projection_reason:
            args.threadStateWriteback.focus_projection_reason,
          continuity_projection_reason:
            args.threadStateWriteback.continuity_projection_reason
        }
      : {
          status: args.threadStateWriteback.status,
          repository: args.threadStateWriteback.repository,
          reason: args.threadStateWriteback.reason
        }
  };
}

export function buildRuntimeDebugMetadataAfterWritebackSoftFail(
  args: BuildRuntimeDebugMetadataAfterWritebackSoftFailArgs
) {
  return {
    ...(args.existingDebugMetadata ?? {}),
    humanized_delivery: buildHumanizedDeliveryDebugMetadata(
      args.humanizedDeliveryPacket
    ),
    runtime_timing_ms: {
      ...toRuntimeTimingRecord(args.existingRuntimeTiming),
      ...buildRuntimeTimingFields(args)
    }
  };
}

export function buildPreparedRuntimeTurnLogFields(
  args: BuildPreparedRuntimeTurnLogFieldsArgs
) {
  return {
    thread_id: args.threadId,
    agent_id: args.agentId,
    knowledge_route: args.knowledgeRoute,
    knowledge_load_limit: args.knowledgeLoadLimit,
    knowledge_load_duration_ms: args.knowledgeLoadDurationMs,
    generate_text_duration_ms: args.generateTextDurationMs,
    resolve_model_profile_account_level_duration_ms:
      args.modelProfileTimingMs.account_level_lookup,
    resolve_model_profile_bound_profile_duration_ms:
      args.modelProfileTimingMs.bound_profile_lookup,
    resolve_model_profile_default_profile_duration_ms:
      args.modelProfileTimingMs.default_profile_lookup,
    resolve_model_profile_bind_default_duration_ms:
      args.modelProfileTimingMs.bind_default_profile,
    persist_assistant_message_duration_ms: args.persistAssistantDurationMs,
    update_thread_duration_ms: args.updateThreadDurationMs,
    prompt_message_count: args.promptMessageCount,
    prompt_system_chars: args.promptSystemChars,
    prompt_system_top_sections: args.promptSystemSectionLengths,
    ...buildHumanizedDeliveryLogFields(args.humanizedDeliveryPacket),
    prompt_user_chars: args.promptUserChars,
    prompt_assistant_chars: args.promptAssistantChars,
    prompt_total_chars: args.promptTotalChars,
    prompt_total_bytes: args.promptTotalBytes,
    prompt_approx_tokens: args.promptApproxTokenCount,
    assistant_payload_content_bytes: args.assistantPayloadContentBytes,
    assistant_payload_metadata_bytes: args.assistantPayloadMetadataBytes,
    assistant_payload_total_bytes: args.assistantPayloadTotalBytes,
    total_duration_ms: args.elapsedMs(args.runPreparedStartedAt)
  };
}

export function buildGenerateAgentReplyDebugMetadata(
  args: BuildGenerateAgentReplyDebugMetadataArgs
) {
  const existingRuntimeTiming = readRuntimeTimingRecord(
    args.existingDebugMetadata
  );

  return {
    ...(args.existingDebugMetadata ?? {}),
    runtime_timing_ms: {
      ...existingRuntimeTiming,
      prepare_runtime_memory: args.prepareRuntimeMemoryDurationMs,
      prepare_runtime_memory_recall:
        args.runtimeMemoryTimingMs?.memory_recall ?? 0,
      prepare_runtime_memory_nickname_recall:
        args.runtimeMemoryTimingMs?.nickname_recall ?? 0,
      prepare_runtime_memory_preferred_name_recall:
        args.runtimeMemoryTimingMs?.preferred_name_recall ?? 0,
      prepare_runtime_memory_address_style_recall:
        args.runtimeMemoryTimingMs?.address_style_recall ?? 0,
      prepare_runtime_memory_total:
        args.runtimeMemoryTimingMs?.total ?? args.prepareRuntimeMemoryDurationMs,
      resolve_model_profile: args.modelProfileDurationMs,
      prepare_runtime_turn: args.prepareRuntimeTurnDurationMs,
      run_prepared_runtime_turn: args.runPreparedRuntimeTurnDurationMs
    }
  };
}

export function buildGenerateAgentReplyLogFields(
  args: BuildGenerateAgentReplyLogFieldsArgs
) {
  return {
    thread_id: args.threadId,
    agent_id: args.agentId,
    prepare_runtime_memory_duration_ms: args.prepareRuntimeMemoryDurationMs,
    prepare_runtime_memory_recall_duration_ms:
      args.runtimeMemoryTimingMs?.memory_recall ?? 0,
    prepare_runtime_memory_nickname_recall_duration_ms:
      args.runtimeMemoryTimingMs?.nickname_recall ?? 0,
    prepare_runtime_memory_preferred_name_recall_duration_ms:
      args.runtimeMemoryTimingMs?.preferred_name_recall ?? 0,
    prepare_runtime_memory_address_style_recall_duration_ms:
      args.runtimeMemoryTimingMs?.address_style_recall ?? 0,
    resolve_model_profile_duration_ms: args.modelProfileDurationMs,
    prepare_runtime_turn_duration_ms: args.prepareRuntimeTurnDurationMs,
    run_prepared_runtime_turn_duration_ms:
      args.runPreparedRuntimeTurnDurationMs,
    total_duration_ms:
      args.prepareRuntimeMemoryDurationMs +
      args.modelProfileDurationMs +
      args.prepareRuntimeTurnDurationMs +
      args.runPreparedRuntimeTurnDurationMs
  };
}
