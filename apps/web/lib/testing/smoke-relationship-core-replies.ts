import { buildSmokeRelationshipExplanatoryCoreReply } from "@/lib/testing/smoke-relationship-explanatory-core";
import { buildSmokeRelationshipSupportiveCoreReply } from "@/lib/testing/smoke-relationship-supportive-core";
import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";

export {
  buildSmokeRelationshipExplanatoryCoreReply,
  buildSmokeRelationshipSupportiveCoreReply
};

type Args = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  addressStyleValue: string | null;
  selfName: string;
  userName: string | null;
};

export function buildSmokeRelationshipClosingCoreReply(args: {
  replyLanguage: SmokeReplyLanguage;
  addressStyleValue: string | null;
  userName: string | null;
}) {
  if (args.replyLanguage === "zh-Hans") {
    if (args.addressStyleValue === "formal") {
      return args.userName
        ? `${args.userName}，我们就先稳稳推进到这里。接下来我会继续正式、清楚地陪你把事情往前落。`
        : `我们就先稳稳推进到这里。接下来我会继续正式、清楚地陪你把事情往前落。`;
    }

    if (
      args.addressStyleValue === "friendly" ||
      args.addressStyleValue === "casual"
    ) {
      return args.userName
        ? `阿强，我们就先推进到这里吧。我会继续轻松一点陪你把事情往前带，你不用一个人扛着。`
        : `我们就先推进到这里吧。我会继续轻松一点陪你把事情往前带，你不用一个人扛着。`;
    }

    return args.userName
      ? `${args.userName}，我们先收在这里。接下来我会继续自然、稳定地陪你把事情推进下去。`
      : `我们先收在这里。接下来我会继续自然、稳定地陪你把事情推进下去。`;
  }

  if (args.addressStyleValue === "formal") {
    return args.userName
      ? `${args.userName}, we can pause here for now. I will keep helping you move this forward in a clear, formal, steady way.`
      : `We can pause here for now. I will keep helping you move this forward in a clear, formal, steady way.`;
  }

  if (
    args.addressStyleValue === "friendly" ||
    args.addressStyleValue === "casual"
  ) {
    return args.userName
      ? `${args.userName}, let's wrap this part here for now. I will keep helping you move it forward in a lighter, friendlier way.`
      : `Let's wrap this part here for now. I will keep helping you move it forward in a lighter, friendlier way.`;
  }

  return args.userName
    ? `${args.userName}, we can wrap here for now. I will keep helping you move this forward in a steady, natural way.`
    : `We can wrap here for now. I will keep helping you move this forward in a steady, natural way.`;
}
