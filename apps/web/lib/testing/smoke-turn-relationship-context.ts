import {
  getSmokeAnswerStrategy,
  isSmokeRelationshipAnswerShapePrompt,
  isSmokeRelationshipContinuationEdgePrompt
} from "@/lib/testing/smoke-answer-strategy";
import { selectSmokeRelationshipMemories } from "@/lib/testing/smoke-relationship-memory-selection";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-reply-analysis";

export function getSmokeTurnRelationshipContext(args: {
  trimmedContent: string;
  activeMemories: Array<{
    category: string | null;
    scope: string | null;
    target_agent_id: string | null;
    content: string;
    confidence: number;
    key: string | null;
    value: string | null;
  }>;
  agentId: string;
  recentAssistantReply: SmokeContinuityReply | null;
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>;
}) {
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
