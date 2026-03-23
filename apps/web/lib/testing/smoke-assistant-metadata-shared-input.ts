import type { SmokeAssistantMetadataInput } from "@/lib/testing/smoke-assistant-metadata-types";

export type SmokeAssistantMetadataSharedInput = {
  modelProfileId: string;
  modelProfileName: string;
  model: string;
  replyLanguage: SmokeAssistantMetadataInput["replyLanguage"];
  replyLanguageDetected: SmokeAssistantMetadataInput["replyLanguageDetected"];
  replyLanguageSource: SmokeAssistantMetadataInput["replyLanguageSource"];
  questionType: SmokeAssistantMetadataInput["questionType"];
  answerStrategy: SmokeAssistantMetadataInput["answerStrategy"];
  answerStrategyReasonCode: SmokeAssistantMetadataInput["answerStrategyReasonCode"];
  continuationReasonCode: SmokeAssistantMetadataInput["continuationReasonCode"];
  recentRawTurnCount: number;
  approxContextPressure: SmokeAssistantMetadataInput["approxContextPressure"];
  sameThreadContinuationApplicable: boolean;
  longChainPressureCandidate: boolean;
  sameThreadContinuationPreferred: boolean;
  distantMemoryFallbackAllowed: boolean;
  recalledMemoryCount: number;
  memoryUsed: boolean;
  usedMemoryTypes: string[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
};

export function buildSmokeAssistantMetadataSharedInput(args: {
  metadata: SmokeAssistantMetadataInput;
  recalledMemoryCount: number;
  memoryUsed: boolean;
}): SmokeAssistantMetadataSharedInput {
  return {
    modelProfileId: args.metadata.modelProfileId,
    modelProfileName: args.metadata.modelProfileName,
    model: args.metadata.model,
    replyLanguage: args.metadata.replyLanguage,
    replyLanguageDetected: args.metadata.replyLanguageDetected,
    replyLanguageSource: args.metadata.replyLanguageSource,
    questionType: args.metadata.questionType,
    answerStrategy: args.metadata.answerStrategy,
    answerStrategyReasonCode: args.metadata.answerStrategyReasonCode,
    continuationReasonCode: args.metadata.continuationReasonCode,
    recentRawTurnCount: args.metadata.recentRawTurnCount,
    approxContextPressure: args.metadata.approxContextPressure,
    sameThreadContinuationApplicable:
      args.metadata.sameThreadContinuationApplicable,
    longChainPressureCandidate: args.metadata.longChainPressureCandidate,
    sameThreadContinuationPreferred:
      args.metadata.sameThreadContinuationPreferred,
    distantMemoryFallbackAllowed:
      args.metadata.distantMemoryFallbackAllowed,
    recalledMemoryCount: args.recalledMemoryCount,
    memoryUsed: args.memoryUsed,
    usedMemoryTypes: args.metadata.usedMemoryTypes,
    hiddenExclusionCount: args.metadata.hiddenExclusionCount,
    incorrectExclusionCount: args.metadata.incorrectExclusionCount
  };
}
