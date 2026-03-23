import {
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeOpenEndedSummaryQuestion
} from "@/lib/testing/smoke-answer-strategy";
import { hasSmokeRelationshipCarryover } from "@/lib/testing/smoke-relationship-carryover";
import { findAndRecallSmokeRelationshipMemory } from "@/lib/testing/smoke-relationship-memory-recall";
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
  const relationshipCarryoverAvailable = hasSmokeRelationshipCarryover({
    activeMemories: args.activeMemories,
    agentId: args.agentId
  });
  const sharedNameRecallPrompt =
    args.relationshipStylePrompt ||
    isSmokeOpenEndedSummaryQuestion(args.trimmedContent) ||
    args.sameThreadContinuity;

  const nicknameMemory =
    isSmokeDirectNamingQuestion(args.trimmedContent) ||
    sharedNameRecallPrompt
      ? findAndRecallSmokeRelationshipMemory({
          memories: args.activeMemories,
          key: "agent_nickname",
          agentId: args.agentId,
          recalledMemories: args.recalledMemories
        })
      : null;

  const preferredNameMemory =
    isSmokeDirectUserPreferredNameQuestion(args.trimmedContent) ||
    sharedNameRecallPrompt
      ? findAndRecallSmokeRelationshipMemory({
          memories: args.activeMemories,
          key: "user_preferred_name",
          agentId: args.agentId,
          recalledMemories: args.recalledMemories
        })
      : null;

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
