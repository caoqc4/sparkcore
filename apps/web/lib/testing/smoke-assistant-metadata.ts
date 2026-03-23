import { buildSmokeAssistantMetadataSummary } from "@/lib/testing/smoke-assistant-metadata-summary";
import { buildSmokeAssistantMetadataBase } from "@/lib/testing/smoke-assistant-metadata-base";
import { buildSmokeAssistantMemoryOutcome } from "@/lib/testing/smoke-assistant-memory-outcome";
import { buildSmokeAssistantMemorySummary } from "@/lib/testing/smoke-assistant-memory-summary";
import type { SmokeAssistantMetadataInput } from "@/lib/testing/smoke-assistant-metadata-types";

export function buildSmokeAssistantMetadata(args: SmokeAssistantMetadataInput) {
  const { recalledMemoryCount, memoryUsed } = buildSmokeAssistantMemorySummary({
    recalledMemories: args.recalledMemories
  });

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
