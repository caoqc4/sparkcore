import type {
  SmokeAnswerStrategy,
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import { buildSmokeDirectOrGroundedReply } from "@/lib/testing/smoke-direct-replies";
import {
  buildSmokeRelationshipOrContinuationReply,
  type SmokeRelationshipRecallMemory
} from "@/lib/testing/smoke-relationship-reply-branch";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

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

  return buildSmokeRelationshipOrContinuationReply({
    content,
    replyLanguage,
    recentAssistantReply,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory
  });
}
