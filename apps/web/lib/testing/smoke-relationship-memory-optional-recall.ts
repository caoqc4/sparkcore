import { findAndRecallSmokeRelationshipMemory } from "@/lib/testing/smoke-relationship-memory-recall";
import type {
  SmokeActiveRelationshipMemory,
  SmokeRelationshipMemoryKey,
  SmokeRelationshipRecallMemoryList
} from "@/lib/testing/smoke-relationship-memory-types";

export function maybeFindAndRecallSmokeRelationshipMemory(args: {
  enabled: boolean;
  memories: SmokeActiveRelationshipMemory[];
  key: SmokeRelationshipMemoryKey;
  agentId: string;
  recalledMemories: SmokeRelationshipRecallMemoryList;
}) {
  if (!args.enabled) {
    return null;
  }

  return findAndRecallSmokeRelationshipMemory({
    memories: args.memories,
    key: args.key,
    agentId: args.agentId,
    recalledMemories: args.recalledMemories
  });
}
