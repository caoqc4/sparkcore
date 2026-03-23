import { isSmokeLightStyleSofteningPrompt } from "@/lib/testing/smoke-continuation-prompts";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

export function buildSmokeEnDefaultContinuationReply(args: {
  content: string;
  addressStyleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  if (args.addressStyleValue === "formal") {
    return args.userName
      ? `Certainly, ${args.userName}. I will continue in a more formal way.`
      : "Certainly. I will continue in a more formal way.";
  }

  if (args.addressStyleValue === "friendly") {
    return args.userName
      ? `Sure, ${args.userName}. Let's keep chatting.`
      : "Sure, let's keep chatting.";
  }

  if (args.addressStyleValue === "casual") {
    return args.userName
      ? isSmokeLightStyleSofteningPrompt(args.content)
        ? `Sure, ${args.userName}. I can keep it lighter while we continue.`
        : `Sure, ${args.userName}. We can keep going.`
      : isSmokeLightStyleSofteningPrompt(args.content)
        ? "Sure, I can keep it lighter while we continue."
        : "Sure, we can keep going.";
  }

  if (args.recentAssistantReply?.replyLanguage === "en") {
    return args.userName
      ? `Sure, ${args.userName}. We can keep going.`
      : "Sure, we can keep going.";
  }

  return "Thanks, I noted that and I am ready to help with the next step.";
}
