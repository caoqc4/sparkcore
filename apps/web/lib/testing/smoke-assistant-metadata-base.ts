import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeApproxContextPressure,
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";
import type {
  SmokeReplyLanguage,
  SmokeReplyLanguageSource,
  SmokeRoleCorePacket
} from "@/lib/testing/smoke-role-core-packet";

export function buildSmokeAssistantMetadataBase(args: {
  agentId: string;
  agentName: string;
  roleCorePacket: SmokeRoleCorePacket;
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
  sameThreadContinuationApplicable: boolean;
  longChainPressureCandidate: boolean;
  sameThreadContinuationPreferred: boolean;
  distantMemoryFallbackAllowed: boolean;
  recalledMemoryCount: number;
  memoryUsed: boolean;
  usedMemoryTypes: string[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
}) {
  return {
    agent_id: args.agentId,
    agent_name: args.agentName,
    role_core_packet: args.roleCorePacket,
    model: args.model,
    model_profile_id: args.modelProfileId,
    model_profile_name: args.modelProfileName,
    reply_language_target: args.replyLanguage,
    reply_language_detected: args.replyLanguageDetected,
    question_type: args.questionType,
    answer_strategy: args.answerStrategy,
    answer_strategy_reason_code: args.answerStrategyReasonCode,
    continuation_reason_code: args.continuationReasonCode,
    recent_raw_turn_count: args.recentRawTurnCount,
    approx_context_pressure: args.approxContextPressure,
    same_thread_continuation_applicable: args.sameThreadContinuationApplicable,
    long_chain_pressure_candidate: args.longChainPressureCandidate,
    same_thread_continuation_preferred: args.sameThreadContinuationPreferred,
    distant_memory_fallback_allowed: args.distantMemoryFallbackAllowed,
    reply_language_source: args.replyLanguageSource,
    memory_hit_count: args.recalledMemoryCount,
    memory_used: args.memoryUsed,
    memory_types_used: args.usedMemoryTypes,
    hidden_memory_exclusion_count: args.hiddenExclusionCount,
    incorrect_memory_exclusion_count: args.incorrectExclusionCount
  };
}
