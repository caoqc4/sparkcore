import {
  getSmokeAnswerStrategy,
  isSmokeDirectNamingQuestion,
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion,
  isSmokeRelationshipAnswerShapePrompt,
  isSmokeRelationshipContinuationEdgePrompt
} from "@/lib/testing/smoke-answer-strategy";
import {
  findSmokeRelationshipMemory,
  getSmokeUsedMemoryTypes,
  prependSmokeRelationshipRecall
} from "@/lib/testing/smoke-relationship-context";
import {
  getSmokeApproxContextPressure,
  getSmokeRecentAssistantReply,
  getSmokeRecentRuntimeMessages,
  type SmokeContinuityReply
} from "@/lib/testing/smoke-reply-analysis";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";
import {
  isMemoryActive,
  isMemoryHidden,
  isMemoryIncorrect,
  isMemoryScopeValid
} from "@/lib/chat/memory-v2";

type SmokeMemoryRow = {
  id: string;
  memory_type: "profile" | "preference" | null;
  content: string;
  confidence: number;
  category: string | null;
  key: string | null;
  value: string | null;
  scope: string | null;
  status: string | null;
  target_agent_id: string | null;
  target_thread_id: string | null;
  metadata: Record<string, unknown> | null;
};

type SmokeRuntimeMessage = {
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
};

function isSmokeMemoryApplicableToThread({
  memory,
  agentId,
  threadId
}: {
  memory: {
    scope?: string | null;
    target_agent_id?: string | null;
    target_thread_id?: string | null;
  };
  agentId: string;
  threadId: string;
}) {
  if (!isMemoryScopeValid(memory)) {
    return false;
  }

  if (memory.scope === "user_agent") {
    return memory.target_agent_id === agentId;
  }

  if (memory.scope === "thread_local") {
    return memory.target_thread_id === threadId;
  }

  return true;
}

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
  const normalizedContent = normalizeSmokePrompt(trimmedContent);
  const recentAssistantReply = getSmokeRecentAssistantReply(existingMessages);
  const validExistingMemories = existingMemories.filter((memory) =>
    isSmokeMemoryApplicableToThread({
      memory,
      agentId,
      threadId
    })
  );
  const activeMemories = validExistingMemories.filter((memory) =>
    isMemoryActive(memory)
  );
  const hiddenExclusionCount = validExistingMemories.filter((memory) =>
    isMemoryHidden(memory)
  ).length;
  const incorrectExclusionCount = validExistingMemories.filter((memory) =>
    isMemoryIncorrect(memory)
  ).length;

  const recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }> = activeMemories
    .filter((memory) => {
      const normalizedMemoryContent = memory.content.toLowerCase();
      return (
        (normalizedContent.includes("profession") &&
          normalizedMemoryContent.includes("product designer")) ||
        (isSmokeOpenEndedSummaryQuestion(trimmedContent) &&
          normalizedMemoryContent.includes("product designer")) ||
        (isSmokeDirectProfessionQuestion(trimmedContent) &&
          normalizedMemoryContent.includes("product designer")) ||
        ((normalizedContent.includes("weekly planning") ||
          isSmokeOpenEndedPlanningHelpQuestion(trimmedContent) ||
          isSmokeOpenEndedSummaryQuestion(trimmedContent) ||
          isSmokeDirectPlanningPreferenceQuestion(trimmedContent)) &&
          normalizedMemoryContent.includes("concise weekly planning"))
      );
    })
    .map((memory) => ({
      memory_type:
        memory.memory_type === "preference" ? "preference" : "profile",
      content: memory.content,
      confidence: memory.confidence
    }));
  const relationshipStylePrompt =
    isSmokeRelationshipAnswerShapePrompt(trimmedContent);
  const sameThreadContinuity = recentAssistantReply !== null;
  const sameThreadContinuationApplicable =
    sameThreadContinuity &&
    isSmokeRelationshipContinuationEdgePrompt(trimmedContent);
  const relationshipCarryoverAvailable = activeMemories.some(
    (memory) =>
      memory.category === "relationship" &&
      memory.scope === "user_agent" &&
      memory.target_agent_id === agentId
  );
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
  const nicknameMemory =
    isSmokeDirectNamingQuestion(trimmedContent) ||
    relationshipStylePrompt ||
    isSmokeOpenEndedSummaryQuestion(trimmedContent) ||
    sameThreadContinuity
      ? findSmokeRelationshipMemory({
          memories: activeMemories,
          key: "agent_nickname",
          agentId
        })
      : null;

  prependSmokeRelationshipRecall(recalledMemories, nicknameMemory);
  const preferredNameMemory =
    isSmokeDirectUserPreferredNameQuestion(trimmedContent) ||
    relationshipStylePrompt ||
    isSmokeOpenEndedSummaryQuestion(trimmedContent) ||
    sameThreadContinuity
      ? findSmokeRelationshipMemory({
          memories: activeMemories,
          key: "user_preferred_name",
          agentId
        })
      : null;

  prependSmokeRelationshipRecall(recalledMemories, preferredNameMemory);

  const addressStyleMemory = findSmokeRelationshipMemory({
    memories: activeMemories,
    key: "user_address_style",
    agentId
  });

  prependSmokeRelationshipRecall(recalledMemories, addressStyleMemory);

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
