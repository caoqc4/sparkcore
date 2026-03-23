import {
  getSmokeAnswerStrategy,
  isSmokeRelationshipAnswerShapePrompt,
  isSmokeRelationshipContinuationEdgePrompt
} from "@/lib/testing/smoke-answer-strategy";
import { selectSmokeRelationshipMemories } from "@/lib/testing/smoke-relationship-memory-selection";
import type { SmokeTurnRelationshipContextInput } from "@/lib/testing/smoke-turn-relationship-context-types";

export function getSmokeTurnRelationshipContext(args: SmokeTurnRelationshipContextInput) {
  const relationshipStylePrompt =
    isSmokeRelationshipAnswerShapePrompt(args.trimmedContent);
  const sameThreadContinuity = args.recentAssistantReply !== null;
  const sameThreadContinuationApplicable =
    sameThreadContinuity &&
    isSmokeRelationshipContinuationEdgePrompt(args.trimmedContent);
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
