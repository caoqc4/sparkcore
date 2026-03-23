import type { SmokeActiveRelationshipMemory } from "@/lib/testing/smoke-relationship-memory-types";

export function hasSmokeRelationshipCarryover(args: {
  activeMemories: SmokeActiveRelationshipMemory[];
  agentId: string;
}) {
  return args.activeMemories.some(
    (memory) =>
      memory.category === "relationship" &&
      memory.scope === "user_agent" &&
      memory.target_agent_id === args.agentId
  );
}
