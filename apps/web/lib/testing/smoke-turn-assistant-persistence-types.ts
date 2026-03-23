import type { persistSmokeAssistantTurnStep } from "@/lib/testing/smoke-turn-assistant-step";
import type { SmokeCreatedMemoryType } from "@/lib/testing/smoke-memory-write-types";

export type SmokeAssistantTurnAnalysisSummary = {
  answerStrategyRule: {
    questionType: Parameters<typeof persistSmokeAssistantTurnStep>[0]["questionType"];
    answerStrategy: Parameters<typeof persistSmokeAssistantTurnStep>[0]["answerStrategy"];
    reasonCode: Parameters<typeof persistSmokeAssistantTurnStep>[0]["answerStrategyReasonCode"];
    continuationReasonCode: Parameters<
      typeof persistSmokeAssistantTurnStep
    >[0]["continuationReasonCode"];
  };
  recentRawTurnCount: number;
  approxContextPressure: Parameters<
    typeof persistSmokeAssistantTurnStep
  >[0]["approxContextPressure"];
  sameThreadContinuationApplicable: boolean;
  longChainPressureCandidate: boolean;
  preferSameThreadContinuation: boolean;
  recalledMemories: Parameters<typeof persistSmokeAssistantTurnStep>[0]["recalledMemories"];
  usedMemoryTypes: string[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
};

export type SmokePreparedAssistantTurnPersistenceArgs = {
  supabase: Parameters<typeof persistSmokeAssistantTurnStep>[0]["supabase"];
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  agentName: string;
  personaSummary: string | null;
  styleGuidance: string | null;
  modelProfileId: string;
  modelProfileName: string;
  model: string;
  assistantContent: string;
  relationshipStyleValue: string | null;
  replyLanguage: Parameters<typeof persistSmokeAssistantTurnStep>[0]["replyLanguage"];
  replyLanguageSource: Parameters<
    typeof persistSmokeAssistantTurnStep
  >[0]["replyLanguageSource"];
  analysis: SmokeAssistantTurnAnalysisSummary;
  createdTypes: SmokeCreatedMemoryType[];
};
