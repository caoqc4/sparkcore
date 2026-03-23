export type SmokeRelationshipMemoryRow = {
  category: string | null;
  key: string | null;
  scope: string | null;
  target_agent_id: string | null;
  value: string | null;
  content: string;
  confidence: number;
};

export type SmokeRelationshipRecallMemory = {
  memory_type: "relationship";
  content: string;
  confidence: number;
};
