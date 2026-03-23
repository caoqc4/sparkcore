import {
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeOpenEndedSummaryQuestion
} from "@/lib/testing/smoke-answer-strategy";
import {
  findSmokeRelationshipMemory,
  prependSmokeRelationshipRecall
} from "@/lib/testing/smoke-relationship-context";

type SmokeActiveMemory = {
  category: string | null;
  scope: string | null;
  target_agent_id: string | null;
  content: string;
  confidence: number;
  key: string | null;
  value: string | null;
};

type SmokeRecalledMemory = {
  memory_type: "profile" | "preference" | "relationship";
  content: string;
  confidence: number;
};

export function selectSmokeRelationshipMemories(args: {
  trimmedContent: string;
  activeMemories: SmokeActiveMemory[];
  agentId: string;
  relationshipStylePrompt: boolean;
  sameThreadContinuity: boolean;
  recalledMemories: SmokeRecalledMemory[];
}) {
  const relationshipCarryoverAvailable = args.activeMemories.some(
    (memory) =>
      memory.category === "relationship" &&
      memory.scope === "user_agent" &&
      memory.target_agent_id === args.agentId
  );

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
