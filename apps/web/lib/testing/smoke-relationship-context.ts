import type {
  SmokeRelationshipMemoryRow
} from "@/lib/testing/smoke-relationship-context-types";
import { toSmokeRelationshipRecallMemory } from "@/lib/testing/smoke-relationship-memory-accessors";
import type { SmokeRelationshipMemoryKey } from "@/lib/testing/smoke-relationship-memory-types";

export function findSmokeRelationshipMemory(args: {
  memories: SmokeRelationshipMemoryRow[];
  key: SmokeRelationshipMemoryKey;
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
