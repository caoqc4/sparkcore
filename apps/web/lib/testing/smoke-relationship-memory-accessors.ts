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

export function toSmokeRelationshipRecallMemory(
  memory: SmokeRelationshipMemoryRow | null
): SmokeRelationshipRecallMemory | null {
  if (!memory) {
    return null;
  }

  return {
    memory_type: "relationship",
    content:
      typeof memory.value === "string" ? memory.value : memory.content,
    confidence: memory.confidence
  };
}

export function getSmokeRelationshipMemoryValue(
  memory: SmokeRelationshipMemoryRow | null
) {
  return memory
    ? typeof memory.value === "string"
      ? memory.value
      : memory.content
    : null;
}

export function getSmokeUsedMemoryTypes(
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
  }>
) {
  return Array.from(new Set(recalledMemories.map((memory) => memory.memory_type)));
}
