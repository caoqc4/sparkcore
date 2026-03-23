import { buildSmokeAssistantMetadata } from "@/lib/testing/smoke-assistant-metadata";
import type { SmokeAssistantInsertArgs } from "@/lib/testing/smoke-assistant-persistence";

export function buildSmokeAssistantMessagePayload(
  args: SmokeAssistantInsertArgs
) {
  return {
    role: "assistant" as const,
    content: args.assistantContent,
    status: "completed" as const,
    metadata: buildSmokeAssistantMetadata({
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
      recalledMemories: args.recalledMemories,
      usedMemoryTypes: args.usedMemoryTypes,
      hiddenExclusionCount: args.hiddenExclusionCount,
      incorrectExclusionCount: args.incorrectExclusionCount,
      createdTypes: args.createdTypes
    })
  };
}
