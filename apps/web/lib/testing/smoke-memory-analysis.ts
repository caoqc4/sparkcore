import {
  isMemoryActive,
  isMemoryHidden,
  isMemoryIncorrect,
  isMemoryScopeValid
} from "@/lib/chat/memory-v2";
import type {
  SmokeMemoryAnalysisInput,
  SmokeMemoryAnalysisResult,
  SmokeMemoryApplicabilityInput
} from "@/lib/testing/smoke-memory-analysis-types";

export type SmokeMemoryRow = {
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
