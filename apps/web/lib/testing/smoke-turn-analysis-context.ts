import { getSmokeRecentAssistantReply } from "@/lib/testing/smoke-assistant-continuity";
import { getSmokeTurnMemoryContext } from "@/lib/testing/smoke-turn-memory-context";
import { getSmokeTurnStrategyContext } from "@/lib/testing/smoke-turn-strategy-context";
import type { SmokeTurnAnalysisInput } from "@/lib/testing/smoke-turn-analysis";
import type { SmokeTurnAnalysisResult } from "@/lib/testing/smoke-turn-analysis-result";

export function prepareSmokeTurnAnalysisContext({
  trimmedContent,
  existingMemories,
  existingMessages,
  agentId,
  threadId
}: SmokeTurnAnalysisInput): Omit<SmokeTurnAnalysisResult, "usedMemoryTypes"> {
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
    sameThreadContinuationApplicable
  };
}
