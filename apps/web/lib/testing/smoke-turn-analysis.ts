import { getSmokeUsedMemoryTypes } from "@/lib/testing/smoke-relationship-memory-accessors";
import { prepareSmokeTurnAnalysisContext } from "@/lib/testing/smoke-turn-analysis-context";
import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeApproxContextPressure,
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-assistant-continuity";
import type { SmokeMemoryRow } from "@/lib/testing/smoke-memory-analysis";

export type SmokeRuntimeMessage = {
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
};

export type SmokeAnswerStrategyRule = {
  questionType: SmokeAnswerQuestionType;
  answerStrategy: SmokeAnswerStrategy;
  reasonCode: SmokeAnswerStrategyReasonCode;
  continuationReasonCode: SmokeContinuationReasonCode | null;
};

export type SmokeTurnAnalysisInput = {
  trimmedContent: string;
  existingMemories: SmokeMemoryRow[];
  existingMessages: SmokeRuntimeMessage[];
  agentId: string;
  threadId: string;
};

export type SmokeTurnAnalysisResult = {
  activeMemories: SmokeMemoryRow[];
  addressStyleMemory: import("@/lib/testing/smoke-turn-strategy-context").SmokeTurnStrategyContext["addressStyleMemory"];
  answerStrategyRule: SmokeAnswerStrategyRule;
  approxContextPressure: SmokeApproxContextPressure;
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
  longChainPressureCandidate: boolean;
  nicknameMemory: import("@/lib/testing/smoke-turn-strategy-context").SmokeTurnStrategyContext["nicknameMemory"];
  preferredNameMemory: import("@/lib/testing/smoke-turn-strategy-context").SmokeTurnStrategyContext["preferredNameMemory"];
  preferSameThreadContinuation: boolean;
  relationshipStylePrompt: boolean;
  recentAssistantReply: SmokeContinuityReply | null;
  recentRawTurnCount: number;
  recalledMemories: import("@/lib/testing/smoke-turn-memory-context").SmokeTurnMemoryContext["recalledMemories"];
  sameThreadContinuity: boolean;
  sameThreadContinuationApplicable: boolean;
  usedMemoryTypes: string[];
};

export function analyzeSmokeTurnContext({
  trimmedContent,
  existingMemories,
  existingMessages,
  agentId,
  threadId
}: SmokeTurnAnalysisInput): SmokeTurnAnalysisResult {
  const analysis = prepareSmokeTurnAnalysisContext({
    trimmedContent,
    existingMemories,
    existingMessages,
    agentId,
    threadId
  });

  return {
    ...analysis,
    usedMemoryTypes: getSmokeUsedMemoryTypes(analysis.recalledMemories)
  };
}

export type { SmokeContinuityReply, SmokeMemoryRow };
