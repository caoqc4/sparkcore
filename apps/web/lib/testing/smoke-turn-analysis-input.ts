import type {
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
