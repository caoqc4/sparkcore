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
}: {
  trimmedContent: string;
  existingMemories: SmokeMemoryRow[];
  existingMessages: SmokeRuntimeMessage[];
  agentId: string;
  threadId: string;
}) {
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

export type { SmokeContinuityReply, SmokeMemoryRow, SmokeRuntimeMessage };
