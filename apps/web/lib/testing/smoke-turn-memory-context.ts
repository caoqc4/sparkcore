import { analyzeSmokeMemoryState } from "@/lib/testing/smoke-memory-analysis";
import { selectSmokeRecalledMemories } from "@/lib/testing/smoke-memory-recall-selection";
import type { SmokeMemoryRow } from "@/lib/testing/smoke-turn-analysis-types";

export function getSmokeTurnMemoryContext(args: {
  trimmedContent: string;
  existingMemories: SmokeMemoryRow[];
  agentId: string;
  threadId: string;
}) {
  const { activeMemories, hiddenExclusionCount, incorrectExclusionCount } =
    analyzeSmokeMemoryState({
      existingMemories: args.existingMemories,
      agentId: args.agentId,
      threadId: args.threadId
    });

  const recalledMemories = selectSmokeRecalledMemories({
    trimmedContent: args.trimmedContent,
    activeMemories
  });

  return {
    activeMemories,
    recalledMemories,
    hiddenExclusionCount,
    incorrectExclusionCount
  };
}
