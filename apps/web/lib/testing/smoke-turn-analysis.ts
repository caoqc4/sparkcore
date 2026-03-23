import { buildSmokeTurnAnalysisResult } from "@/lib/testing/smoke-turn-analysis-builders";
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
  return buildSmokeTurnAnalysisResult(
    prepareSmokeTurnAnalysisContext({
      trimmedContent,
      existingMemories,
      existingMessages,
      agentId,
      threadId
    })
  );
}

export type {
  SmokeContinuityReply,
  SmokeMemoryRow,
  SmokeRuntimeMessage
};
export type { SmokeTurnAnalysisResult };
