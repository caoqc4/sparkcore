import { getSmokeUsedMemoryTypes } from "@/lib/testing/smoke-relationship-memory-accessors";
import { prepareSmokeTurnAnalysisContext } from "@/lib/testing/smoke-turn-analysis-context";
import type { SmokeTurnAnalysisResult } from "@/lib/testing/smoke-turn-analysis-result";
import type {
  SmokeContinuityReply,
  SmokeMemoryRow,
  SmokeRuntimeMessage
} from "@/lib/testing/smoke-turn-analysis-types";

export type SmokeTurnAnalysisInput = {
  trimmedContent: string;
  existingMemories: SmokeMemoryRow[];
  existingMessages: SmokeRuntimeMessage[];
  agentId: string;
  threadId: string;
};

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
