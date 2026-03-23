import { isSmokeOneLineSoftCatchPrompt } from "@/lib/testing/smoke-follow-up-prompts";
import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import {
  buildSmokeEnSoftCatchReply,
  buildSmokeZhSoftCatchReply
} from "@/lib/testing/smoke-soft-catch-replies";

export function buildSmokeRelationshipSoftCatchReply(args: {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  userName: string | null;
}) {
  if (!isSmokeOneLineSoftCatchPrompt(args.content)) {
    return null;
  }

  return args.replyLanguage === "zh-Hans"
    ? buildSmokeZhSoftCatchReply(args.userName)
    : buildSmokeEnSoftCatchReply(args.userName);
}
