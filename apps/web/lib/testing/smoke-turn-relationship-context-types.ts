import type { SmokeRelationshipRecallMemoryList } from "@/lib/testing/smoke-relationship-memory-types";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-reply-analysis";
import type { SmokeActiveRelationshipMemory } from "@/lib/testing/smoke-relationship-memory-types";

export type SmokeTurnRelationshipContextInput = {
  trimmedContent: string;
  activeMemories: SmokeActiveRelationshipMemory[];
  agentId: string;
  recentAssistantReply: SmokeContinuityReply | null;
  recalledMemories: SmokeRelationshipRecallMemoryList;
};
