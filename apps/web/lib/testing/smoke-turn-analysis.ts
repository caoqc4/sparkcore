import { getSmokeUsedMemoryTypes } from "@/lib/testing/smoke-relationship-memory-accessors";
import { prepareSmokeTurnAnalysisContext } from "@/lib/testing/smoke-turn-analysis-context";
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
  const analysis = prepareSmokeTurnAnalysisContext({
    trimmedContent,
    existingMemories,
    existingMessages,
    agentId,
    threadId
  });

  return {
    ...analysis,
    usedMemoryTypes: getSmokeUsedMemoryTypes(analysis.recalledMemories)
  };
}

export type {
  SmokeContinuityReply,
  SmokeMemoryRow,
  SmokeRuntimeMessage
};
export type { SmokeTurnAnalysisResult };
