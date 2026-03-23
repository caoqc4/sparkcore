import type {
  SmokeMemoryRow,
  SmokeRuntimeMessage,
  SmokeTurnAnalysisResult,
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
