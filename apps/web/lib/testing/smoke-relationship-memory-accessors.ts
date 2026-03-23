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
