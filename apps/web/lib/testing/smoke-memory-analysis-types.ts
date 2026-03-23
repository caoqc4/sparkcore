export type SmokeMemoryApplicabilityInput = {
  memory: {
    scope?: string | null;
    target_agent_id?: string | null;
    target_thread_id?: string | null;
  };
  agentId: string;
  threadId: string;
};

export type SmokeMemoryAnalysisInput = {
  existingMemories: import("@/lib/testing/smoke-memory-analysis").SmokeMemoryRow[];
  agentId: string;
  threadId: string;
};

export type SmokeMemoryAnalysisResult = {
  activeMemories: import("@/lib/testing/smoke-memory-analysis").SmokeMemoryRow[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
};
