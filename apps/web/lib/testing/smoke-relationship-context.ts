import type {
  SmokeRelationshipMemoryRow,
  SmokeRelationshipRecallMemory
} from "@/lib/testing/smoke-relationship-context-types";

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

export function findSmokeRelationshipMemory(args: {
  memories: SmokeRelationshipMemoryRow[];
  key: "agent_nickname" | "user_preferred_name" | "user_address_style";
  agentId: string;
}) {
  return (
    args.memories.find(
      (memory) =>
        memory.category === "relationship" &&
        memory.key === args.key &&
        memory.scope === "user_agent" &&
        memory.target_agent_id === args.agentId
    ) ?? null
  );
}

export function prependSmokeRelationshipRecall(
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>,
  memory: SmokeRelationshipMemoryRow | null
) {
  const recallMemory = toSmokeRelationshipRecallMemory(memory);

  if (recallMemory) {
    recalledMemories.unshift(recallMemory);
  }
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
