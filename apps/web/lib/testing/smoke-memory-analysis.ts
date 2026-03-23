import {
  isMemoryActive,
  isMemoryHidden,
  isMemoryIncorrect
} from "@/lib/chat/memory-v2";
import type {
  SmokeMemoryAnalysisInput,
  SmokeMemoryAnalysisResult,
  SmokeMemoryRow
} from "@/lib/testing/smoke-memory-analysis-types";
import { isSmokeMemoryApplicableToThread } from "@/lib/testing/smoke-memory-applicability";

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
