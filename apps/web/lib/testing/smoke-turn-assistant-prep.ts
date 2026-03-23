import {
  getSmokeRelationshipMemoryValue,
  toSmokeRelationshipRecallMemory
} from "@/lib/testing/smoke-relationship-context";
import { buildSmokeAssistantReply } from "@/lib/testing/smoke-assistant-reply";
import { resolveSmokeReplyLanguage, type SmokeContinuityReply } from "@/lib/testing/smoke-reply-analysis";
import type {
  SmokeAnswerQuestionType,
  SmokeAnswerStrategy,
  SmokeAnswerStrategyReasonCode,
  SmokeContinuationReasonCode
} from "@/lib/testing/smoke-assistant-builders";

export function prepareSmokeAssistantTurn(args: {
  trimmedContent: string;
  modelProfileName: string;
  agentName: string;
  recentAssistantReply: SmokeContinuityReply | null;
  addressStyleMemory: unknown;
  nicknameMemory: unknown;
  preferredNameMemory: unknown;
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>;
  answerStrategyRule: {
    questionType: SmokeAnswerQuestionType;
    answerStrategy: SmokeAnswerStrategy;
    reasonCode: SmokeAnswerStrategyReasonCode;
    continuationReasonCode: SmokeContinuationReasonCode | null;
  };
}) {
  const replyLanguageDecision = resolveSmokeReplyLanguage({
    content: args.trimmedContent,
    recentAssistantReply: args.recentAssistantReply
  });
  const replyLanguage = replyLanguageDecision.replyLanguage;
  const effectiveAddressStyleValue = getSmokeRelationshipMemoryValue(
    args.addressStyleMemory as never
  );

  const assistantContent = buildSmokeAssistantReply({
    content: args.trimmedContent,
    answerStrategy: args.answerStrategyRule.answerStrategy,
    modelProfileName: args.modelProfileName,
    replyLanguage,
    recentAssistantReply: args.recentAssistantReply,
    agentName: args.agentName,
    addressStyleMemory: toSmokeRelationshipRecallMemory(
      args.addressStyleMemory as never
    ),
    nicknameMemory: toSmokeRelationshipRecallMemory(args.nicknameMemory as never),
    preferredNameMemory: toSmokeRelationshipRecallMemory(
      args.preferredNameMemory as never
    ),
    recalledMemories: args.recalledMemories
  });

  return {
    assistantContent,
    effectiveAddressStyleValue,
    replyLanguage,
    replyLanguageSource: replyLanguageDecision.source
  };
}
