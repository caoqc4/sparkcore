import type {
  SmokeAnswerStrategy,
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import { getSmokeGroundedMemoryContext } from "@/lib/testing/smoke-grounded-memory-context";
import { buildSmokeGroundedPlanningReply } from "@/lib/testing/smoke-grounded-planning-replies";
import { buildSmokeGroundedSummaryReply } from "@/lib/testing/smoke-grounded-summary-replies";
import {
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion
} from "@/lib/testing/smoke-answer-strategy";
import type {
  SmokeRecallMemory,
  SmokeRelationshipRecallMemory
} from "@/lib/testing/smoke-recall-memory-types";

export function buildSmokeGroundedReply(args: {
  content: string;
  answerStrategy: SmokeAnswerStrategy;
  replyLanguage: SmokeReplyLanguage;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
  recalledMemories: SmokeRecallMemory[];
}) {
  const { rememberedProfession, rememberedPlanningPreference } =
    getSmokeGroundedMemoryContext(args.recalledMemories);

  if (
    args.answerStrategy === "grounded-open-ended-advice" &&
    isSmokeOpenEndedPlanningHelpQuestion(args.content)
  ) {
    return buildSmokeGroundedPlanningReply({
      replyLanguage: args.replyLanguage,
      styleValue: args.addressStyleMemory?.content ?? null,
      rememberedProfession,
      rememberedPlanningPreference
    });
  }

  if (
    args.answerStrategy === "grounded-open-ended-summary" &&
    isSmokeOpenEndedSummaryQuestion(args.content)
  ) {
    return buildSmokeGroundedSummaryReply({
      replyLanguage: args.replyLanguage,
      selfName: args.nicknameMemory?.content ?? args.agentName,
      userName: args.preferredNameMemory?.content ?? null,
      rememberedProfession
    });
  }

  return null;
}
