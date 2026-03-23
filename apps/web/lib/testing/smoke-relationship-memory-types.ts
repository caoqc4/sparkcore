import type { SmokeRecallMemory } from "@/lib/testing/smoke-recall-memory-types";

export type SmokeRelationshipMemoryKey =
  | "agent_nickname"
  | "user_preferred_name"
  | "user_address_style";

export type SmokeActiveRelationshipMemory = {
  category: string | null;
  scope: string | null;
  target_agent_id: string | null;
  content: string;
  confidence: number;
  key: SmokeRelationshipMemoryKey | string | null;
  value: string | null;
};

export type SmokeRelationshipRecallMemoryList = SmokeRecallMemory[];
