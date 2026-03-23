import type {
  SmokeAnswerStrategy,
  SmokeReplyLanguage
} from "@/lib/testing/smoke-assistant-builders";
import { buildSmokeFactReply } from "@/lib/testing/smoke-fact-replies";
import { buildSmokeGroundedReply } from "@/lib/testing/smoke-grounded-replies";
import { buildSmokeIntroReply } from "@/lib/testing/smoke-intro-replies";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

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

export function buildSmokeDirectOrGroundedReply({
  content,
  answerStrategy,
  modelProfileName,
  replyLanguage,
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
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
  recalledMemories: SmokeRecallMemory[];
}) {
  const normalized = normalizeSmokePrompt(content);

  if (normalized.includes("reply in one sentence with a quick hello")) {
    return replyLanguage === "zh-Hans"
      ? `你好，我是通过 ${modelProfileName} 回复的 SparkCore。`
      : `Hello from SparkCore via ${modelProfileName}.`;
  }

  const introReply = buildSmokeIntroReply({
    content,
    replyLanguage,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory
  });

  if (introReply) {
    return introReply;
  }

  const factReply = buildSmokeFactReply({
    content,
    replyLanguage,
    normalizedContent: normalized,
    recalledMemories,
    addressStyleMemory
  });

  if (factReply) {
    return factReply;
  }

  const groundedReply = buildSmokeGroundedReply({
    content,
    answerStrategy,
    replyLanguage,
    agentName,
    addressStyleMemory,
    nicknameMemory,
    preferredNameMemory,
    recalledMemories
  });

  if (groundedReply) {
    return groundedReply;
  }

  return null;
}
