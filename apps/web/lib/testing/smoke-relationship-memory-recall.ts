import {
  findSmokeRelationshipMemory,
  prependSmokeRelationshipRecall
} from "@/lib/testing/smoke-relationship-context";
import type {
  SmokeActiveRelationshipMemory,
  SmokeRelationshipRecallMemoryList
} from "@/lib/testing/smoke-relationship-memory-types";

export function findAndRecallSmokeRelationshipMemory(args: {
  memories: SmokeActiveRelationshipMemory[];
  key: "agent_nickname" | "user_preferred_name" | "user_address_style";
  agentId: string;
  recalledMemories: SmokeRelationshipRecallMemoryList;
}) {
  const memory = findSmokeRelationshipMemory({
    memories: args.memories,
    key: args.key,
    agentId: args.agentId
  });

  prependSmokeRelationshipRecall(args.recalledMemories, memory);
  return memory;
}
