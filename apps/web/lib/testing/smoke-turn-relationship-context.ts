import {
  getSmokeAnswerStrategy
} from "@/lib/testing/smoke-answer-strategy";
import { selectSmokeRelationshipMemories } from "@/lib/testing/smoke-relationship-memory-selection";
import { getSmokeTurnRelationshipFlags } from "@/lib/testing/smoke-turn-relationship-flags";
import type { SmokeTurnRelationshipContextInput } from "@/lib/testing/smoke-turn-relationship-context-types";

export function getSmokeTurnRelationshipContext(args: SmokeTurnRelationshipContextInput) {
  const {
    relationshipStylePrompt,
    sameThreadContinuity,
    sameThreadContinuationApplicable
  } = getSmokeTurnRelationshipFlags({
    trimmedContent: args.trimmedContent,
    recentAssistantReply: args.recentAssistantReply
  });
  const relationshipMemoryContext = selectSmokeRelationshipMemories({
    trimmedContent: args.trimmedContent,
    activeMemories: args.activeMemories,
    agentId: args.agentId,
    relationshipStylePrompt,
    sameThreadContinuity,
    recalledMemories: args.recalledMemories
  });
  const answerStrategyRule = getSmokeAnswerStrategy({
    content: args.trimmedContent,
    sameThreadContinuity,
    relationshipStylePrompt,
    relationshipCarryoverAvailable:
      relationshipMemoryContext.relationshipCarryoverAvailable
  });

  return {
    relationshipStylePrompt,
    sameThreadContinuity,
    sameThreadContinuationApplicable,
    answerStrategyRule,
    ...relationshipMemoryContext
  };
}
