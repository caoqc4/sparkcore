import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";
import { buildSmokeZhContinuationPromptReply } from "@/lib/testing/smoke-zh-continuation-prompt-replies";
import { buildSmokeZhContinuationStyleReply } from "@/lib/testing/smoke-zh-continuation-style-replies";

export function buildSmokeZhContinuationTail(args: {
  content: string;
  normalized: string;
  styleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  return (
    buildSmokeZhContinuationPromptReply(args) ??
    buildSmokeZhContinuationStyleReply(args)
  );
}
