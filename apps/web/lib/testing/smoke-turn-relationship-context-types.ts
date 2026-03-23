import type { SmokeRelationshipRecallMemoryList } from "@/lib/testing/smoke-relationship-memory-types";
import type { SmokeActiveRelationshipMemory } from "@/lib/testing/smoke-relationship-memory-types";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-reply-language";

export type SmokeTurnRelationshipContextInput = {
  trimmedContent: string;
  activeMemories: SmokeActiveRelationshipMemory[];
  agentId: string;
  recentAssistantReply: SmokeContinuityReply | null;
  recalledMemories: SmokeRelationshipRecallMemoryList;
};
