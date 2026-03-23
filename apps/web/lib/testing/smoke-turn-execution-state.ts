import {
  analyzeSmokeTurnContext,
  type SmokeMemoryRow,
  type SmokeRuntimeMessage,
  type SmokeTurnAnalysisResult
} from "@/lib/testing/smoke-turn-analysis";

export type SmokeTurnExecutionStateInput = {
  trimmedContent: string;
  existingMemories: unknown[] | null | undefined;
  existingMessages: Array<{
    role: "user" | "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
  }> | null | undefined;
  agentId: string;
  threadId: string;
};

export type SmokeTurnExecutionState = {
  smokeExistingMemories: SmokeMemoryRow[];
  smokeExistingMessages: SmokeRuntimeMessage[];
  analysis: SmokeTurnAnalysisResult;
};

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
