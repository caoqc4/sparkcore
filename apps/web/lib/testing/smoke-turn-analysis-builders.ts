import { getSmokeUsedMemoryTypes } from "@/lib/testing/smoke-relationship-context";
import type { SmokeTurnAnalysisResult } from "@/lib/testing/smoke-turn-analysis-result";

export function buildSmokeTurnAnalysisResult(args: Omit<SmokeTurnAnalysisResult, "usedMemoryTypes">) {
  return {
    ...args,
    usedMemoryTypes: getSmokeUsedMemoryTypes(args.recalledMemories)
  };
}
