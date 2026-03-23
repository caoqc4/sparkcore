import {
  analyzeSmokeTurnContext,
  type SmokeMemoryRow,
  type SmokeRuntimeMessage
} from "@/lib/testing/smoke-turn-analysis";
import type {
  SmokeTurnExecutionState,
  SmokeTurnExecutionStateInput
} from "@/lib/testing/smoke-turn-execution-state-types";

export function prepareSmokeTurnExecutionState(
  args: SmokeTurnExecutionStateInput
): SmokeTurnExecutionState {
  const smokeExistingMemories = (args.existingMemories ?? []) as SmokeMemoryRow[];
  const smokeExistingMessages =
    (args.existingMessages ?? []) as SmokeRuntimeMessage[];
  const analysis = analyzeSmokeTurnContext({
    trimmedContent: args.trimmedContent,
    existingMemories: smokeExistingMemories,
    existingMessages: smokeExistingMessages,
    agentId: args.agentId,
    threadId: args.threadId
  });

  return {
    smokeExistingMemories,
    smokeExistingMessages,
    analysis
  };
}
