import {
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeOpenEndedSummaryQuestion
} from "@/lib/testing/smoke-answer-strategy";
import {
  findSmokeRelationshipMemory,
  prependSmokeRelationshipRecall
} from "@/lib/testing/smoke-relationship-context";
import { hasSmokeRelationshipCarryover } from "@/lib/testing/smoke-relationship-carryover";
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

  const nicknameMemory =
    isSmokeDirectNamingQuestion(args.trimmedContent) ||
    args.relationshipStylePrompt ||
    isSmokeOpenEndedSummaryQuestion(args.trimmedContent) ||
    args.sameThreadContinuity
      ? findSmokeRelationshipMemory({
          memories: args.activeMemories,
          key: "agent_nickname",
          agentId: args.agentId
        })
      : null;

  prependSmokeRelationshipRecall(args.recalledMemories, nicknameMemory);

  const preferredNameMemory =
    isSmokeDirectUserPreferredNameQuestion(args.trimmedContent) ||
    args.relationshipStylePrompt ||
    isSmokeOpenEndedSummaryQuestion(args.trimmedContent) ||
    args.sameThreadContinuity
      ? findSmokeRelationshipMemory({
          memories: args.activeMemories,
          key: "user_preferred_name",
          agentId: args.agentId
        })
      : null;

  prependSmokeRelationshipRecall(args.recalledMemories, preferredNameMemory);

  const addressStyleMemory = findSmokeRelationshipMemory({
    memories: args.activeMemories,
    key: "user_address_style",
    agentId: args.agentId
  });

  prependSmokeRelationshipRecall(args.recalledMemories, addressStyleMemory);

  return {
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory,
    relationshipCarryoverAvailable
  };
}
