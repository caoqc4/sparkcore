import { buildAssistantMetadataSummaryGroups } from "@/lib/chat/assistant-message-metadata";
import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeApproxContextPressure,
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";
import type {
  SmokeReplyLanguage,
  SmokeReplyLanguageSource
} from "@/lib/testing/smoke-role-core-packet";

export function buildSmokeAssistantMetadataSummary(args: {
  modelProfileId: string;
  modelProfileName: string;
  model: string;
  replyLanguage: SmokeReplyLanguage;
  replyLanguageDetected: SmokeReplyLanguage;
  replyLanguageSource: SmokeReplyLanguageSource;
  questionType: SmokeAnswerQuestionType;
  answerStrategy: SmokeAnswerStrategy;
  answerStrategyReasonCode: SmokeAnswerStrategyReasonCode;
  continuationReasonCode: SmokeContinuationReasonCode | null;
  recentRawTurnCount: number;
  approxContextPressure: SmokeApproxContextPressure;
  recalledMemoryCount: number;
  memoryUsed: boolean;
  usedMemoryTypes: string[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
}) {
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
    recent_raw_turn_count: args.recentRawTurnCount,
    approx_context_pressure: args.approxContextPressure,
    memory_hit_count: args.recalledMemoryCount,
    memory_used: args.memoryUsed,
    memory_types_used: args.usedMemoryTypes,
    hidden_memory_exclusion_count: args.hiddenExclusionCount,
    incorrect_memory_exclusion_count: args.incorrectExclusionCount,
    follow_up_request_count: 0
  });
}
