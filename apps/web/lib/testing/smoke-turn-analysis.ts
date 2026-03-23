import {
  getSmokeUsedMemoryTypes
} from "@/lib/testing/smoke-relationship-context";
import {
  getSmokeRecentAssistantReply,
} from "@/lib/testing/smoke-reply-analysis";
import { getSmokeTurnMemoryContext } from "@/lib/testing/smoke-turn-memory-context";
import { getSmokeTurnStrategyContext } from "@/lib/testing/smoke-turn-strategy-context";
import type { SmokeTurnAnalysisInput } from "@/lib/testing/smoke-turn-analysis-input";
import type { SmokeTurnAnalysisResult } from "@/lib/testing/smoke-turn-analysis-result";
import type {
  SmokeContinuityReply,
  SmokeMemoryRow,
  SmokeRuntimeMessage
} from "@/lib/testing/smoke-turn-analysis-types";

export function analyzeSmokeTurnContext({
  trimmedContent,
  existingMemories,
  existingMessages,
  agentId,
  threadId
}: SmokeTurnAnalysisInput): SmokeTurnAnalysisResult {
  const recentAssistantReply = getSmokeRecentAssistantReply(existingMessages);
  const {
    activeMemories,
    recalledMemories,
    hiddenExclusionCount,
    incorrectExclusionCount
  } = getSmokeTurnMemoryContext({
    trimmedContent,
    existingMemories,
    agentId,
    threadId
  });
  const {
    addressStyleMemory,
    answerStrategyRule,
    approxContextPressure,
    longChainPressureCandidate,
    nicknameMemory,
    preferSameThreadContinuation,
    preferredNameMemory,
    recentRawTurnCount,
    sameThreadContinuationApplicable
  } = getSmokeTurnStrategyContext({
    trimmedContent,
    activeMemories,
    agentId,
    recentAssistantReply,
    existingMessages,
    recalledMemories
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
export type { SmokeTurnAnalysisResult };
