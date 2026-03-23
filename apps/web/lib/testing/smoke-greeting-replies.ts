import type {
  SmokeBriefGreetingReplyInput,
  SmokeNamingReplyInput,
  SmokePreferredNameReplyInput
} from "@/lib/testing/smoke-greeting-reply-types";

export function buildSmokeBriefGreetingReply(args: SmokeBriefGreetingReplyInput) {
  if (args.styleValue === "formal") {
    return args.replyLanguage === "zh-Hans"
      ? "您好，很高兴继续为您提供帮助。"
      : "Hello, I am glad to continue assisting you.";
  }

  if (args.styleValue === "friendly") {
    return args.replyLanguage === "zh-Hans"
      ? "嗨，朋友，很高兴又见到你。"
      : "Hey friend, it is good to see you again.";
  }

  if (args.styleValue === "casual") {
    return args.replyLanguage === "zh-Hans"
      ? "嗨，很高兴继续和你聊。"
      : "Hey, good to keep chatting with you.";
  }

  return args.replyLanguage === "zh-Hans"
    ? "你好，很高兴见到你。"
    : "Hello, it is good to see you.";
}

export function buildSmokeNamingReply(args: SmokeNamingReplyInput) {
  if (args.nickname) {
    return args.replyLanguage === "zh-Hans"
      ? `哈哈，我叫${args.nickname}！`
      : `You can call me ${args.nickname}.`;
  }

  return args.replyLanguage === "zh-Hans"
    ? `我叫${args.agentName}。`
    : `My name is ${args.agentName}.`;
}

export function buildSmokePreferredNameReply(args: SmokePreferredNameReplyInput) {
  if (args.preferredName) {
    return args.replyLanguage === "zh-Hans"
      ? `我应该叫你${args.preferredName}。`
      : `I should call you ${args.preferredName}.`;
  }

  return args.replyLanguage === "zh-Hans"
    ? "我还没有记住你偏好的称呼。"
    : "I have not stored your preferred name yet.";
}
