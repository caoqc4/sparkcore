import type {
  SmokeAnswerStrategy,
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import { buildSmokeGroundedPlanningReply } from "@/lib/testing/smoke-grounded-planning-replies";
import { buildSmokeGroundedSummaryReply } from "@/lib/testing/smoke-grounded-summary-replies";
import {
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion
} from "@/lib/testing/smoke-answer-strategy";

type SmokeRelationshipRecallMemory = {
  memory_type: "relationship";
  content: string;
  confidence: number;
} | null;

type SmokeRecallMemory = {
  memory_type: "profile" | "preference" | "relationship";
  content: string;
  confidence: number;
};

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
  const rememberedProfession = args.recalledMemories.find(
    (memory) =>
      memory.memory_type === "profile" &&
      memory.content.toLowerCase().includes("product designer")
  );
  const rememberedPlanningPreference = args.recalledMemories.find(
    (memory) =>
      memory.memory_type === "preference" &&
      memory.content.toLowerCase().includes("concise weekly planning")
  );

  if (
    args.answerStrategy === "grounded-open-ended-advice" &&
    isSmokeOpenEndedPlanningHelpQuestion(args.content)
  ) {
    return buildSmokeGroundedPlanningReply({
      replyLanguage: args.replyLanguage,
      styleValue: args.addressStyleMemory?.content ?? null,
      rememberedProfession: Boolean(rememberedProfession),
      rememberedPlanningPreference: Boolean(rememberedPlanningPreference)
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
      rememberedProfession: Boolean(rememberedProfession)
    });
  }

  return null;
}
