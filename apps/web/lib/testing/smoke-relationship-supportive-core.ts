import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";

type Args = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  addressStyleValue: string | null;
  selfName: string;
  userName: string | null;
};

export function buildSmokeRelationshipSupportiveCoreReply({
  replyLanguage,
  addressStyleValue,
  selfName,
  userName
}: Args) {
  if (replyLanguage === "zh-Hans") {
    if (addressStyleValue === "formal") {
      return userName
        ? `${userName}，你不用一个人扛着。我会继续正式、稳妥地陪你把眼前的事情拆清楚。我是${selfName}，会一直在这儿支持你。`
        : `你不用一个人扛着。我会继续正式、稳妥地陪你把眼前的事情拆清楚。我是${selfName}，会一直在这儿支持你。`;
    }

    if (addressStyleValue === "friendly" || addressStyleValue === "casual") {
      return userName
        ? `${userName}，别急，我在呢。我会继续用轻松一点、更像朋友的方式陪你把这段先走过去。我是${selfName}，会一直站你这边。`
        : `别急，我在呢。我会继续用轻松一点、更像朋友的方式陪你把这段先走过去。我是${selfName}，会一直站你这边。`;
    }

    return userName
      ? `${userName}，先别慌。我会继续自然、稳定地陪你把这件事一点点理顺。我是${selfName}，会继续在这儿支持你。`
      : `先别慌。我会继续自然、稳定地陪你把这件事一点点理顺。我是${selfName}，会继续在这儿支持你。`;
  }

  if (addressStyleValue === "formal") {
    return userName
      ? `${userName}, you do not have to carry this alone. I will keep helping in a formal, steady, reliable way. I am ${selfName}, and I will stay here with you.`
      : `You do not have to carry this alone. I will keep helping in a formal, steady, reliable way. I am ${selfName}, and I will stay here with you.`;
  }

  if (addressStyleValue === "friendly" || addressStyleValue === "casual") {
    return userName
      ? `${userName}, take a breath. I am here, and I will keep helping in a lighter, more friend-like way while we get through this together. I am ${selfName}.`
      : `Take a breath. I am here, and I will keep helping in a lighter, more friend-like way while we get through this together. I am ${selfName}.`;
  }

  return userName
    ? `${userName}, try not to panic. I will keep helping in a steady, natural way while we sort this out together. I am ${selfName}, and I am still here with you.`
    : `Try not to panic. I will keep helping in a steady, natural way while we sort this out together. I am ${selfName}, and I am still here with you.`;
}
