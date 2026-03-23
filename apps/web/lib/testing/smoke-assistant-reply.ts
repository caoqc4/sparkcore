import type {
  SmokeAnswerStrategy,
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import { buildSmokeDirectOrGroundedReply } from "@/lib/testing/smoke-direct-replies";
import {
  isSmokeRelationshipClosingPrompt,
  isSmokeRelationshipExplanatoryPrompt,
  isSmokeRelationshipSupportivePrompt
} from "@/lib/testing/smoke-answer-strategy";
import {
  buildSmokeDefaultContinuationReply,
  buildSmokeRelationshipClosingReply,
  buildSmokeRelationshipExplanatoryReply,
  buildSmokeRelationshipSupportiveReply
} from "@/lib/testing/smoke-relationship-replies";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

type SmokeRelationshipRecallMemory = {
  memory_type: "relationship";
  content: string;
  confidence: number;
} | null;

export function buildSmokeAssistantReply({
  content,
  answerStrategy,
  modelProfileName,
  replyLanguage,
  recentAssistantReply,
  recalledMemories,
  agentName,
  addressStyleMemory,
  nicknameMemory,
  preferredNameMemory
}: {
  content: string;
  answerStrategy: SmokeAnswerStrategy;
  modelProfileName: string;
  replyLanguage: SmokeReplyLanguage;
  recentAssistantReply: SmokeContinuityReply | null;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>;
}) {
  const directOrGroundedReply = buildSmokeDirectOrGroundedReply({
    content,
    answerStrategy,
    modelProfileName,
    replyLanguage,
    recalledMemories,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory
  });

  if (directOrGroundedReply) {
    return directOrGroundedReply;
  }

  if (isSmokeRelationshipExplanatoryPrompt(content)) {
    return buildSmokeRelationshipExplanatoryReply({
      content,
      replyLanguage,
      addressStyleValue: addressStyleMemory?.content ?? null,
      selfName: nicknameMemory?.content ?? agentName,
      userName: preferredNameMemory?.content ?? null
    });
  }

  if (isSmokeRelationshipSupportivePrompt(content)) {
    return buildSmokeRelationshipSupportiveReply({
      content,
      replyLanguage,
      addressStyleValue: addressStyleMemory?.content ?? null,
      selfName: nicknameMemory?.content ?? agentName,
      userName: preferredNameMemory?.content ?? null
    });
  }

  if (isSmokeRelationshipClosingPrompt(content)) {
    return buildSmokeRelationshipClosingReply({
      replyLanguage,
      addressStyleValue: addressStyleMemory?.content ?? null,
      userName: preferredNameMemory?.content ?? null
    });
  }

  return buildSmokeDefaultContinuationReply({
    content,
    replyLanguage,
    addressStyleValue: addressStyleMemory?.content ?? null,
    userName: preferredNameMemory?.content ?? null,
    recentAssistantReply
  });
}
