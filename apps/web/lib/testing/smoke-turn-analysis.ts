import {
  getSmokeUsedMemoryTypes
} from "@/lib/testing/smoke-relationship-context";
import {
  analyzeSmokeMemoryState,
} from "@/lib/testing/smoke-memory-analysis";
import {
  getSmokeRecentAssistantReply,
} from "@/lib/testing/smoke-reply-analysis";
import { getSmokeTurnContinuityContext } from "@/lib/testing/smoke-turn-continuity-context";
import { selectSmokeRecalledMemories } from "@/lib/testing/smoke-memory-recall-selection";
import { getSmokeTurnRelationshipContext } from "@/lib/testing/smoke-turn-relationship-context";
import type { SmokeTurnAnalysisInput } from "@/lib/testing/smoke-turn-analysis-input";
import type { SmokeApproxContextPressure } from "@/lib/testing/smoke-assistant-builders";
import type {
  SmokeAnswerStrategyRule,
  SmokeContinuityReply,
  SmokeMemoryRow,
  SmokeRuntimeMessage
} from "@/lib/testing/smoke-turn-analysis-types";

export type SmokeTurnAnalysisResult = {
  activeMemories: SmokeMemoryRow[];
  addressStyleMemory: ReturnType<
    typeof getSmokeTurnRelationshipContext
  >["addressStyleMemory"];
  answerStrategyRule: SmokeAnswerStrategyRule;
  approxContextPressure: SmokeApproxContextPressure;
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
  longChainPressureCandidate: boolean;
  nicknameMemory: ReturnType<typeof getSmokeTurnRelationshipContext>["nicknameMemory"];
  preferredNameMemory: ReturnType<
    typeof getSmokeTurnRelationshipContext
  >["preferredNameMemory"];
  preferSameThreadContinuation: boolean;
  recentAssistantReply: SmokeContinuityReply | null;
  recentRawTurnCount: number;
  recalledMemories: ReturnType<typeof selectSmokeRecalledMemories>;
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
  const recentAssistantReply = getSmokeRecentAssistantReply(existingMessages);
  const { activeMemories, hiddenExclusionCount, incorrectExclusionCount } =
    analyzeSmokeMemoryState({
      existingMemories,
      agentId,
      threadId
    });

  const recalledMemories = selectSmokeRecalledMemories({
    trimmedContent,
    activeMemories
  });
  const {
    addressStyleMemory,
    answerStrategyRule,
    nicknameMemory,
    preferredNameMemory,
    sameThreadContinuationApplicable
  } = getSmokeTurnRelationshipContext({
    trimmedContent,
    activeMemories,
    agentId,
    recentAssistantReply,
    recalledMemories
  });
  const preferSameThreadContinuation =
    answerStrategyRule.answerStrategy === "same-thread-continuation";
  const {
    recentRawTurnCount,
    approxContextPressure,
    longChainPressureCandidate
  } = getSmokeTurnContinuityContext({
    trimmedContent,
    existingMessages,
    sameThreadContinuationApplicable
  });

  return {
    activeMemories,
    addressStyleMemory,
    answerStrategyRule,
    approxContextPressure,
    hiddenExclusionCount,
    incorrectExclusionCount,
    longChainPressureCandidate,
    nicknameMemory,
    preferredNameMemory,
    preferSameThreadContinuation,
    recentAssistantReply,
    recentRawTurnCount,
    recalledMemories,
    sameThreadContinuationApplicable,
    usedMemoryTypes: getSmokeUsedMemoryTypes(recalledMemories)
  };
}

export type {
  SmokeContinuityReply,
  SmokeMemoryRow,
  SmokeRuntimeMessage
};
