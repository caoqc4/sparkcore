import { buildAssistantMetadataSummaryGroups } from "@/lib/chat/assistant-message-metadata";
import type { SmokeAssistantMetadataSharedInput } from "@/lib/testing/smoke-assistant-metadata-shared-input";

export function buildSmokeAssistantMetadataSummary(
  args: SmokeAssistantMetadataSharedInput
) {
  return buildAssistantMetadataSummaryGroups({
    model_profile_id: args.modelProfileId,
    model_profile_name: args.modelProfileName,
    model_profile_tier_label: null,
    model_profile_usage_note: null,
    underlying_model_label: args.model,
    reply_language_target: args.replyLanguage,
    reply_language_detected: args.replyLanguageDetected,
    reply_language_source: args.replyLanguageSource,
    question_type: args.questionType,
    answer_strategy: args.answerStrategy,
    answer_strategy_reason_code: args.answerStrategyReasonCode,
    answer_strategy_priority: null,
    answer_strategy_priority_label: null,
    continuation_reason_code: args.continuationReasonCode,
    thread_state_lifecycle_status: null,
    thread_state_focus_mode: null,
    thread_state_continuity_status: null,
    thread_state_current_language_hint: null,
    recent_raw_turn_count: args.recentRawTurnCount,
    approx_context_pressure: args.approxContextPressure,
    memory_hit_count: args.recalledMemoryCount,
    memory_used: args.memoryUsed,
    memory_types_used: args.usedMemoryTypes,
    profile_snapshot: [],
    hidden_memory_exclusion_count: args.hiddenExclusionCount,
    incorrect_memory_exclusion_count: args.incorrectExclusionCount,
    follow_up_request_count: 0
  });
}
