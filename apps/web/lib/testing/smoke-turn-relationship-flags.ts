import {
  isSmokeRelationshipAnswerShapePrompt,
  isSmokeRelationshipContinuationEdgePrompt
} from "@/lib/testing/smoke-answer-strategy";

export function getSmokeTurnRelationshipFlags(args: {
  trimmedContent: string;
  recentAssistantReply: unknown | null;
}) {
  const relationshipStylePrompt =
    isSmokeRelationshipAnswerShapePrompt(args.trimmedContent);
  const sameThreadContinuity = args.recentAssistantReply !== null;

  return {
    relationshipStylePrompt,
    sameThreadContinuity,
    sameThreadContinuationApplicable:
      sameThreadContinuity &&
      isSmokeRelationshipContinuationEdgePrompt(args.trimmedContent)
  };
}
