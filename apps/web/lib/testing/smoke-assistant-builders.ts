import { buildAssistantMetadataSummaryGroups } from "@/lib/chat/assistant-message-metadata";

export type SmokeReplyLanguage = "zh-Hans" | "en" | "unknown";
export type SmokeAnswerQuestionType =
  | "direct-fact"
  | "direct-relationship-confirmation"
  | "open-ended-advice"
  | "open-ended-summary"
  | "fuzzy-follow-up"
  | "other";
export type SmokeAnswerStrategy =
  | "structured-recall-first"
  | "relationship-recall-first"
  | "grounded-open-ended-advice"
  | "grounded-open-ended-summary"
  | "same-thread-continuation"
  | "default-grounded";
export type SmokeAnswerStrategyReasonCode =
  | "direct-relationship-question"
  | "direct-memory-question"
  | "open-ended-advice-prompt"
  | "open-ended-summary-prompt"
  | "relationship-answer-shape-prompt"
  | "same-thread-edge-carryover"
  | "default-grounded-fallback";
export type SmokeContinuationReasonCode =
  | "short-fuzzy-follow-up"
  | "brief-supportive-carryover"
  | "brief-summary-carryover";
export type SmokeReplyLanguageSource =
  | "latest-user-message"
  | "thread-continuity-fallback"
  | "no-latest-user-message";
export type SmokeApproxContextPressure = "low" | "medium" | "elevated" | "high";
type SmokeRoleCoreRelationshipStance =
  | "default-agent-profile"
  | "formal"
  | "friendly"
  | "casual"
  | "no_full_name";

export type SmokeRoleCorePacket = {
  packet_version: "v1";
  identity: {
    agent_id: string;
    agent_name: string;
  };
  persona_summary: string | null;
  style_guidance: string | null;
  relationship_stance: {
    effective: SmokeRoleCoreRelationshipStance;
    source: "agent_profile_default" | "relationship_memory";
  };
  language_behavior: {
    reply_language_target: SmokeReplyLanguage;
    reply_language_source: SmokeReplyLanguageSource;
    same_thread_continuation_preferred: boolean;
  };
};

function getSmokeRoleCoreRelationshipStance(
  styleValue: string | null
): SmokeRoleCorePacket["relationship_stance"] {
  if (
    styleValue === "formal" ||
    styleValue === "friendly" ||
    styleValue === "casual" ||
    styleValue === "no_full_name"
  ) {
    return {
      effective: styleValue,
      source: "relationship_memory"
    };
  }

  return {
    effective: "default-agent-profile",
    source: "agent_profile_default"
  };
}

export function buildSmokeRoleCorePacket(args: {
  agentId: string;
  agentName: string;
  personaSummary: string | null;
  styleGuidance: string | null;
  relationshipStyleValue: string | null;
  replyLanguage: SmokeReplyLanguage;
  replyLanguageSource: SmokeReplyLanguageSource;
  preferSameThreadContinuation: boolean;
}): SmokeRoleCorePacket {
  return {
    packet_version: "v1",
    identity: {
      agent_id: args.agentId,
      agent_name: args.agentName
    },
    persona_summary: args.personaSummary,
    style_guidance: args.styleGuidance,
    relationship_stance: getSmokeRoleCoreRelationshipStance(
      args.relationshipStyleValue
    ),
    language_behavior: {
      reply_language_target: args.replyLanguage,
      reply_language_source: args.replyLanguageSource,
      same_thread_continuation_preferred: args.preferSameThreadContinuation
    }
  };
}

export function buildSmokeAssistantMetadata(args: {
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
  recalledMemories: Array<{
    memory_type: string | null;
    content: string;
    confidence: number | null;
  }>;
  usedMemoryTypes: string[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
  createdTypes: string[];
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
    memory_hit_count: args.recalledMemories.length,
    memory_used: args.recalledMemories.length > 0,
    memory_types_used: args.usedMemoryTypes,
    hidden_memory_exclusion_count: args.hiddenExclusionCount,
    incorrect_memory_exclusion_count: args.incorrectExclusionCount,
    ...buildAssistantMetadataSummaryGroups({
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
      memory_hit_count: args.recalledMemories.length,
      memory_used: args.recalledMemories.length > 0,
      memory_types_used: args.usedMemoryTypes,
      hidden_memory_exclusion_count: args.hiddenExclusionCount,
      incorrect_memory_exclusion_count: args.incorrectExclusionCount,
      follow_up_request_count: 0
    }),
    recalled_memories: args.recalledMemories.map((memory) => ({
      memory_type: memory.memory_type,
      content: memory.content,
      confidence: memory.confidence
    })),
    memory_write_count: args.createdTypes.length,
    memory_write_types: args.createdTypes,
    new_memory_count: args.createdTypes.length,
    updated_memory_count: 0
  };
}
