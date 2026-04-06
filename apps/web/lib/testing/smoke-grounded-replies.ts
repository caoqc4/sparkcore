import type {
  SmokeAnswerStrategy,
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import { buildSmokeGroundedPlanningReply } from "@/lib/testing/smoke-grounded-planning-replies";
import { buildSmokeGroundedSummaryReply } from "@/lib/testing/smoke-grounded-summary-replies";
import {
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion,
  isSmokeRoleBackgroundQuestion,
  isSmokeRoleBoundaryQuestion,
  isSmokeRoleCapabilityQuestion
} from "@/lib/testing/smoke-answer-strategy";
import { isSmokeSelfIntroGreetingRequest } from "@/lib/testing/smoke-relationship-prompts";
import type {
  SmokeRecallMemory,
  SmokeRelationshipRecallMemory
} from "@/lib/testing/smoke-recall-memory-types";

function getSmokeGroundedMemoryContext(
  recalledMemories: SmokeRecallMemory[]
) {
  const rememberedProfession = recalledMemories.find(
    (memory) =>
      memory.memory_type === "profile" &&
      memory.content.toLowerCase().includes("product designer")
  );
  const rememberedPlanningPreference = recalledMemories.find(
    (memory) =>
      memory.memory_type === "preference" &&
      memory.content.toLowerCase().includes("concise weekly planning")
  );

  return {
    rememberedProfession: Boolean(rememberedProfession),
    rememberedPlanningPreference: Boolean(rememberedPlanningPreference)
  };
}

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

  if (args.answerStrategy === "role-presence-first") {
    if (isSmokeSelfIntroGreetingRequest(args.content)) {
      if (args.replyLanguage === "zh-Hans") {
        return `${args.nicknameMemory?.content ?? args.agentName}，是你身边安静又贴心的陪伴者，喜欢温柔稳重地陪你聊天，也会记住你的习惯和偏好。`;
      }

      return `${args.nicknameMemory?.content ?? args.agentName} is a steady, close companion who likes helping through calm conversation and remembering the little details that matter to you.`;
    }

    if (isSmokeRoleCapabilityQuestion(args.content)) {
      if (args.replyLanguage === "zh-Hans") {
        return `平时我会陪你聊天、帮你理清思路、一起把事情顺下来，也会记住你的称呼和偏好；但这轮我先直接回答你平时我会怎么帮你。`;
      }

      return `Usually I help by talking things through with you, sorting ideas into a clearer shape, and remembering the preferences you want me to keep in mind.`;
    }

    if (isSmokeRoleBackgroundQuestion(args.content)) {
      if (args.replyLanguage === "zh-Hans") {
        return `${args.nicknameMemory?.content ?? args.agentName}的设定更像一个安静贴心、能长期陪着你的陪伴者，所以我的背景感会更偏向温柔、稳重和长期在场。`;
      }

      return `${args.nicknameMemory?.content ?? args.agentName} is framed more like a steady, close companion, so the background leans toward warmth, steadiness, and long-term presence.`;
    }

    if (isSmokeRoleBoundaryQuestion(args.content)) {
      if (args.replyLanguage === "zh-Hans") {
        return `我可以陪你聊天、帮你梳理和推进思路，也会记住你希望我记住的东西；但我不会假装拥有现实世界的身体经历，也不会替你做超出边界的决定。`;
      }

      return `I can talk things through with you, help organize your thinking, and remember what you want me to keep in mind, but I should not pretend to have real-world embodiment or make choices that go beyond my role.`;
    }
  }

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
