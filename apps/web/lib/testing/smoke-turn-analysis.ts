import {
  getSmokeAnswerStrategy,
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeOpenEndedSummaryQuestion,
  isSmokeRelationshipAnswerShapePrompt,
  isSmokeRelationshipContinuationEdgePrompt
} from "@/lib/testing/smoke-answer-strategy";
import {
  getSmokeUsedMemoryTypes
} from "@/lib/testing/smoke-relationship-context";
import {
  analyzeSmokeMemoryState,
  type SmokeMemoryRow
} from "@/lib/testing/smoke-memory-analysis";
import {
  getSmokeApproxContextPressure,
  getSmokeRecentAssistantReply,
  getSmokeRecentRuntimeMessages,
  type SmokeContinuityReply
} from "@/lib/testing/smoke-reply-analysis";
import { selectSmokeRecalledMemories } from "@/lib/testing/smoke-memory-recall-selection";
import { selectSmokeRelationshipMemories } from "@/lib/testing/smoke-relationship-memory-selection";

type SmokeRuntimeMessage = {
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
};

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
  const relationshipStylePrompt =
    isSmokeRelationshipAnswerShapePrompt(trimmedContent);
  const sameThreadContinuity = recentAssistantReply !== null;
  const sameThreadContinuationApplicable =
    sameThreadContinuity &&
    isSmokeRelationshipContinuationEdgePrompt(trimmedContent);
  const {
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory,
    relationshipCarryoverAvailable
  } = selectSmokeRelationshipMemories({
    trimmedContent,
    activeMemories,
    agentId,
    relationshipStylePrompt,
    sameThreadContinuity,
    recalledMemories
  });
  const answerStrategyRule = getSmokeAnswerStrategy({
    content: trimmedContent,
    sameThreadContinuity,
    relationshipStylePrompt,
    relationshipCarryoverAvailable
  });
  const preferSameThreadContinuation =
    answerStrategyRule.answerStrategy === "same-thread-continuation";
  const recentRawTurnCount =
    getSmokeRecentRuntimeMessages(existingMessages).length + 1;
  const approxContextPressure = getSmokeApproxContextPressure(
    existingMessages,
    trimmedContent
  );
  const longChainPressureCandidate =
    sameThreadContinuationApplicable &&
    recentRawTurnCount >= 10 &&
    (approxContextPressure === "elevated" || approxContextPressure === "high");

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
