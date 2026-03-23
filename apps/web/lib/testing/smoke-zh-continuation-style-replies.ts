import { isSmokeLightStyleSofteningPrompt } from "@/lib/testing/smoke-answer-strategy";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-turn-analysis";

export function buildSmokeZhContinuationStyleReply(args: {
  content: string;
  styleValue: string | null;
  userName: string | null;
  recentAssistantReply: SmokeContinuityReply | null;
}) {
  if (args.styleValue === "formal") {
    return args.userName
      ? `好的，${args.userName}，我会继续用正式一点的方式协助你。`
      : "好的，我会继续用正式一点的方式协助你。";
  }

  if (args.styleValue === "friendly") {
    return args.userName ? `好呀，${args.userName}，我们继续聊。` : "好呀，我们继续聊。";
  }

  if (args.styleValue === "casual") {
    return args.userName
      ? isSmokeLightStyleSofteningPrompt(args.content)
        ? `好呀，${args.userName}，我就轻一点和你说，我们继续。`
        : `好呀，${args.userName}，我们继续。`
      : isSmokeLightStyleSofteningPrompt(args.content)
        ? "好呀，我就轻一点和你说，我们继续。"
        : "好呀，我们继续。";
  }

  if (args.recentAssistantReply?.replyLanguage === "zh-Hans") {
    return args.userName ? `好的，${args.userName}，我们继续。` : "好的，我们继续。";
  }

  return "好的，我已经记下来了，接下来可以继续帮你。";
}
