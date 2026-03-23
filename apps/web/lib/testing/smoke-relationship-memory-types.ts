import type { SmokeRecallMemory } from "@/lib/testing/smoke-recall-memory-types";

export type SmokeActiveRelationshipMemory = {
  category: string | null;
  scope: string | null;
  target_agent_id: string | null;
  content: string;
  confidence: number;
  key: string | null;
  value: string | null;
};

export type SmokeRelationshipRecallMemoryList = SmokeRecallMemory[];
