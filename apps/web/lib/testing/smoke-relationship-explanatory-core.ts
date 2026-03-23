import { isSmokeRelationshipHelpNextPrompt } from "@/lib/testing/smoke-answer-strategy";
import { buildSmokeRelationshipExplanatoryCoreEn } from "@/lib/testing/smoke-relationship-explanatory-core-en";
import { buildSmokeRelationshipExplanatoryCoreZh } from "@/lib/testing/smoke-relationship-explanatory-core-zh";
import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";

type Args = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  addressStyleValue: string | null;
  selfName: string;
  userName: string | null;
};

export function buildSmokeRelationshipExplanatoryCoreReply({
  content,
  replyLanguage,
  addressStyleValue,
  selfName,
  userName
}: Args) {
  const helpNextPrompt = isSmokeRelationshipHelpNextPrompt(content);

  if (replyLanguage === "zh-Hans") {
    return buildSmokeRelationshipExplanatoryCoreZh({
      helpNextPrompt,
      addressStyleValue,
      selfName,
      userName
    });
  }

  return buildSmokeRelationshipExplanatoryCoreEn({
    helpNextPrompt,
    addressStyleValue,
    selfName,
    userName
  });
}
