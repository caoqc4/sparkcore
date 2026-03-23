import {
  getSmokeRelationshipMemoryValue,
  toSmokeRelationshipRecallMemory
} from "@/lib/testing/smoke-relationship-memory-accessors";
import { buildSmokeAssistantReply } from "@/lib/testing/smoke-assistant-reply";
import { resolveSmokeReplyLanguage } from "@/lib/testing/smoke-reply-language-resolution";
import type { SmokeAssistantTurnPrepInput } from "@/lib/testing/smoke-turn-assistant-types";

export function prepareSmokeAssistantTurn(args: SmokeAssistantTurnPrepInput) {
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
