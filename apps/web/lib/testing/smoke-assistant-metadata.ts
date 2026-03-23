import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeApproxContextPressure,
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";
import { buildSmokeAssistantMetadataSummary } from "@/lib/testing/smoke-assistant-metadata-summary";
import type {
  SmokeReplyLanguage,
  SmokeReplyLanguageSource,
  SmokeRoleCorePacket
} from "@/lib/testing/smoke-role-core-packet";
import { buildSmokeAssistantMetadataBase } from "@/lib/testing/smoke-assistant-metadata-base";
import { buildSmokeAssistantMemoryOutcome } from "@/lib/testing/smoke-assistant-memory-outcome";

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
  const recalledMemoryCount = args.recalledMemories.length;
  const memoryUsed = recalledMemoryCount > 0;

  return {
    ...buildSmokeAssistantMetadataBase({
      agentId: args.agentId,
      agentName: args.agentName,
      roleCorePacket: args.roleCorePacket,
      modelProfileId: args.modelProfileId,
      modelProfileName: args.modelProfileName,
      model: args.model,
      replyLanguage: args.replyLanguage,
      replyLanguageDetected: args.replyLanguageDetected,
      replyLanguageSource: args.replyLanguageSource,
      questionType: args.questionType,
      answerStrategy: args.answerStrategy,
      answerStrategyReasonCode: args.answerStrategyReasonCode,
      continuationReasonCode: args.continuationReasonCode,
      recentRawTurnCount: args.recentRawTurnCount,
      approxContextPressure: args.approxContextPressure,
      sameThreadContinuationApplicable: args.sameThreadContinuationApplicable,
      longChainPressureCandidate: args.longChainPressureCandidate,
      sameThreadContinuationPreferred: args.sameThreadContinuationPreferred,
      distantMemoryFallbackAllowed: args.distantMemoryFallbackAllowed,
      recalledMemoryCount,
      memoryUsed,
      usedMemoryTypes: args.usedMemoryTypes,
      hiddenExclusionCount: args.hiddenExclusionCount,
      incorrectExclusionCount: args.incorrectExclusionCount
    }),
    ...buildSmokeAssistantMetadataSummary({
      modelProfileId: args.modelProfileId,
      modelProfileName: args.modelProfileName,
      model: args.model,
      replyLanguage: args.replyLanguage,
      replyLanguageDetected: args.replyLanguageDetected,
      replyLanguageSource: args.replyLanguageSource,
      questionType: args.questionType,
      answerStrategy: args.answerStrategy,
      answerStrategyReasonCode: args.answerStrategyReasonCode,
      continuationReasonCode: args.continuationReasonCode,
      recentRawTurnCount: args.recentRawTurnCount,
      approxContextPressure: args.approxContextPressure,
      recalledMemoryCount,
      memoryUsed,
      usedMemoryTypes: args.usedMemoryTypes,
      hiddenExclusionCount: args.hiddenExclusionCount,
      incorrectExclusionCount: args.incorrectExclusionCount
    }),
    ...buildSmokeAssistantMemoryOutcome({
      recalledMemories: args.recalledMemories,
      createdTypes: args.createdTypes
    })
  };
}
