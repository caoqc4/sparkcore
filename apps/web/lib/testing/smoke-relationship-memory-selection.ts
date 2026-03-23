import {
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeOpenEndedSummaryQuestion
} from "@/lib/testing/smoke-answer-strategy";
import { findAndRecallSmokeRelationshipMemory } from "@/lib/testing/smoke-relationship-memory-recall";
import { maybeFindAndRecallSmokeRelationshipMemory } from "@/lib/testing/smoke-relationship-memory-optional-recall";
import type {
  SmokeActiveRelationshipMemory,
  SmokeRelationshipRecallMemoryList
} from "@/lib/testing/smoke-relationship-memory-types";

export function selectSmokeRelationshipMemories(args: {
  trimmedContent: string;
  activeMemories: SmokeActiveRelationshipMemory[];
  agentId: string;
  relationshipStylePrompt: boolean;
  sameThreadContinuity: boolean;
  recalledMemories: SmokeRelationshipRecallMemoryList;
}) {
  const relationshipCarryoverAvailable = args.activeMemories.some(
    (memory) =>
      memory.category === "relationship" &&
      memory.scope === "user_agent" &&
      memory.target_agent_id === args.agentId
  );
  const sharedNameRecallPrompt =
    args.relationshipStylePrompt ||
    isSmokeOpenEndedSummaryQuestion(args.trimmedContent) ||
    args.sameThreadContinuity;

  const nicknameMemory =
    maybeFindAndRecallSmokeRelationshipMemory({
      enabled:
        isSmokeDirectNamingQuestion(args.trimmedContent) || sharedNameRecallPrompt,
      memories: args.activeMemories,
      key: "agent_nickname",
      agentId: args.agentId,
      recalledMemories: args.recalledMemories
    });

  const preferredNameMemory =
    maybeFindAndRecallSmokeRelationshipMemory({
      enabled:
        isSmokeDirectUserPreferredNameQuestion(args.trimmedContent) ||
        sharedNameRecallPrompt,
      memories: args.activeMemories,
      key: "user_preferred_name",
      agentId: args.agentId,
      recalledMemories: args.recalledMemories
    });

  const addressStyleMemory = findAndRecallSmokeRelationshipMemory({
    memories: args.activeMemories,
    key: "user_address_style",
    agentId: args.agentId,
    recalledMemories: args.recalledMemories
  });

  return {
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory,
    relationshipCarryoverAvailable
  };
}
