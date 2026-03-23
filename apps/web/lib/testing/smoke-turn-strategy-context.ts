import { getSmokeTurnContinuityContext } from "@/lib/testing/smoke-turn-continuity-context";
import { getSmokeTurnRelationshipContext } from "@/lib/testing/smoke-turn-relationship-context";
import type { SmokeContinuityReply, SmokeMemoryRow } from "@/lib/testing/smoke-turn-analysis-types";

export function getSmokeTurnStrategyContext(args: {
  trimmedContent: string;
  activeMemories: SmokeMemoryRow[];
  agentId: string;
  recentAssistantReply: SmokeContinuityReply | null;
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>;
  existingMessages: Array<{
    role: "user" | "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
  }>;
}) {
  const relationshipContext = getSmokeTurnRelationshipContext({
    trimmedContent: args.trimmedContent,
    activeMemories: args.activeMemories,
    agentId: args.agentId,
    recentAssistantReply: args.recentAssistantReply,
    recalledMemories: args.recalledMemories
  });
  const preferSameThreadContinuation =
    relationshipContext.answerStrategyRule.answerStrategy ===
    "same-thread-continuation";
  const continuityContext = getSmokeTurnContinuityContext({
    trimmedContent: args.trimmedContent,
    existingMessages: args.existingMessages,
    sameThreadContinuationApplicable:
      relationshipContext.sameThreadContinuationApplicable
  });

  return {
    ...relationshipContext,
    ...continuityContext,
    preferSameThreadContinuation
  };
}

export type SmokeTurnStrategyContext = ReturnType<
  typeof getSmokeTurnStrategyContext
>;
