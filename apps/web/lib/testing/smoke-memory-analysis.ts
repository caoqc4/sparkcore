import {
  isMemoryActive,
  isMemoryHidden,
  isMemoryIncorrect,
  isMemoryScopeValid
} from "@/lib/chat/memory-v2";
import type {
  SmokeMemoryAnalysisInput,
  SmokeMemoryAnalysisResult,
  SmokeMemoryApplicabilityInput,
  SmokeMemoryRow
} from "@/lib/testing/smoke-memory-analysis-types";

function isSmokeMemoryApplicableToThread({
  memory,
  agentId,
  threadId
}: SmokeMemoryApplicabilityInput) {
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

export function analyzeSmokeMemoryState(
  args: SmokeMemoryAnalysisInput
): SmokeMemoryAnalysisResult {
  const validExistingMemories = args.existingMemories.filter((memory) =>
    isSmokeMemoryApplicableToThread({
      memory,
      agentId: args.agentId,
      threadId: args.threadId
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

  return {
    activeMemories,
    hiddenExclusionCount,
    incorrectExclusionCount
  };
}

export type { SmokeMemoryRow };
