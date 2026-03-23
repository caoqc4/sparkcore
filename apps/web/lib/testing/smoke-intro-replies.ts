import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeBriefGreetingRequest,
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-answer-strategy";

type SmokeRelationshipRecallMemory = {
  memory_type: "relationship";
  content: string;
  confidence: number;
} | null;

export function buildSmokeIntroReply(args: {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
}) {
  if (isSmokeSelfIntroGreetingRequest(args.content)) {
    const styleValue = args.addressStyleMemory?.content ?? null;
    const selfName = args.nicknameMemory?.content ?? args.agentName;
    const userName = args.preferredNameMemory?.content ?? null;

    if (args.replyLanguage === "zh-Hans") {
      const greeting =
        styleValue === "formal"
          ? userName
            ? `您好，${userName}。`
            : "您好。"
          : styleValue === "friendly"
            ? userName
              ? `嗨，${userName}。`
              : "嗨，朋友。"
            : styleValue === "casual"
              ? userName
                ? `嗨，${userName}。`
                : "嗨。"
              : userName
                ? `你好，${userName}。`
                : "你好。";

      const intro =
        args.nicknameMemory || styleValue === "friendly"
          ? `我是${selfName}，很高兴继续和你聊。`
          : `我是${selfName}，很高兴继续为你提供帮助。`;

      return `${greeting} ${intro}`;
    }

    const greeting =
      styleValue === "formal"
        ? userName
          ? `Hello, ${userName}.`
          : "Hello."
        : styleValue === "friendly"
          ? userName
            ? `Hey, ${userName}.`
            : "Hey, friend."
          : styleValue === "casual"
            ? userName
              ? `Hey, ${userName}.`
              : "Hey."
            : userName
              ? `Hello, ${userName}.`
              : "Hello.";

    const intro =
      args.nicknameMemory || styleValue === "friendly"
        ? `I am ${selfName}, and it is good to keep chatting with you.`
        : `I am ${selfName}, and I am glad to keep helping you.`;

    return `${greeting} ${intro}`;
  }

  if (isSmokeBriefGreetingRequest(args.content)) {
    const styleValue = args.addressStyleMemory?.content ?? null;

    if (styleValue === "formal") {
      return args.replyLanguage === "zh-Hans"
        ? "您好，很高兴继续为您提供帮助。"
        : "Hello, I am glad to continue assisting you.";
    }

    if (styleValue === "friendly") {
      return args.replyLanguage === "zh-Hans"
        ? "嗨，朋友，很高兴又见到你。"
        : "Hey friend, it is good to see you again.";
    }

    if (styleValue === "casual") {
      return args.replyLanguage === "zh-Hans"
        ? "嗨，很高兴继续和你聊。"
        : "Hey, good to keep chatting with you.";
    }

    return args.replyLanguage === "zh-Hans"
      ? "你好，很高兴见到你。"
      : "Hello, it is good to see you.";
  }

  if (isSmokeDirectNamingQuestion(args.content)) {
    if (args.nicknameMemory) {
      return args.replyLanguage === "zh-Hans"
        ? `哈哈，我叫${args.nicknameMemory.content}！`
        : `You can call me ${args.nicknameMemory.content}.`;
    }

    return args.replyLanguage === "zh-Hans"
      ? `我叫${args.agentName}。`
      : `My name is ${args.agentName}.`;
  }

  if (isSmokeDirectUserPreferredNameQuestion(args.content)) {
    if (args.preferredNameMemory) {
      return args.replyLanguage === "zh-Hans"
        ? `我应该叫你${args.preferredNameMemory.content}。`
        : `I should call you ${args.preferredNameMemory.content}.`;
    }

    return args.replyLanguage === "zh-Hans"
      ? "我还没有记住你偏好的称呼。"
      : "I have not stored your preferred name yet.";
  }

  if (
    args.content.includes("请用两句话介绍你自己") ||
    args.content.includes("你能如何帮助我")
  ) {
    const styleValue = args.addressStyleMemory?.content ?? null;
    const selfName = args.nicknameMemory?.content ?? "SparkCore";
    const userName = args.preferredNameMemory?.content ?? null;
    const opening =
      styleValue === "formal"
        ? userName
          ? `您好，${userName}。`
          : "您好。"
        : styleValue === "friendly"
          ? userName
            ? `嗨，${userName}。`
            : "嗨，朋友。"
          : styleValue === "casual"
            ? userName
              ? `嗨，${userName}。`
              : "嗨。"
            : userName
              ? `你好，${userName}。`
              : "你好。";

    return `${opening} 我是${selfName}，可以用中文帮助你梳理计划、整理记忆，并继续当前线程里的对话。`;
  }

  return null;
}
