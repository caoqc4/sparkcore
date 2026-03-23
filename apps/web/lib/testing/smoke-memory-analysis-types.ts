export type SmokeMemoryRow = {
  id: string;
  memory_type: "profile" | "preference" | null;
  content: string;
  confidence: number;
  category: string | null;
  key: string | null;
  value: string | null;
  scope: string | null;
  status: string | null;
  target_agent_id: string | null;
  target_thread_id: string | null;
  metadata: Record<string, unknown> | null;
};

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
  existingMemories: SmokeMemoryRow[];
  agentId: string;
  threadId: string;
};

export type SmokeMemoryAnalysisResult = {
  activeMemories: SmokeMemoryRow[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
};
