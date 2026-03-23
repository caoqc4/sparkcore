import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeBriefGreetingRequest,
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-answer-strategy";
import { isSmokeHelpIntroRequest } from "@/lib/testing/smoke-help-intro-prompts";
import { getSmokeIntroReplyContext } from "@/lib/testing/smoke-intro-reply-context";
import type { SmokeIntroReplyInput } from "@/lib/testing/smoke-intro-reply-types";
import {
  buildSmokeHelpIntroReply,
  buildSmokeSelfIntroReply
} from "@/lib/testing/smoke-self-intro-replies";

function buildSmokeBriefGreetingReply(args: {
  replyLanguage: SmokeReplyLanguage;
  styleValue: string | null;
}) {
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

function buildSmokeNamingReply(args: {
  replyLanguage: SmokeReplyLanguage;
  agentName: string;
  nickname: string | null;
}) {
  if (args.nickname) {
    return args.replyLanguage === "zh-Hans"
      ? `哈哈，我叫${args.nickname}！`
      : `You can call me ${args.nickname}.`;
  }

  return args.replyLanguage === "zh-Hans"
    ? `我叫${args.agentName}。`
    : `My name is ${args.agentName}.`;
}

function buildSmokePreferredNameReply(args: {
  replyLanguage: SmokeReplyLanguage;
  preferredName: string | null;
}) {
  if (args.preferredName) {
    return args.replyLanguage === "zh-Hans"
      ? `我应该叫你${args.preferredName}。`
      : `I should call you ${args.preferredName}.`;
  }

  return args.replyLanguage === "zh-Hans"
    ? "我还没有记住你偏好的称呼。"
    : "I have not stored your preferred name yet.";
}

export function buildSmokeIntroReply(args: SmokeIntroReplyInput) {
  const introContext = getSmokeIntroReplyContext({
    agentName: args.agentName,
    addressStyleMemory: args.addressStyleMemory,
    nicknameMemory: args.nicknameMemory,
    preferredNameMemory: args.preferredNameMemory
  });

  if (isSmokeSelfIntroGreetingRequest(args.content)) {
    return buildSmokeSelfIntroReply({
      replyLanguage: args.replyLanguage,
      styleValue: introContext.styleValue,
      selfName: introContext.selfName,
      userName: introContext.userName,
      hasNicknameMemory: introContext.hasNicknameMemory
    });
  }

  let promptReply: string | null = null;

  if (isSmokeBriefGreetingRequest(args.content)) {
    promptReply = buildSmokeBriefGreetingReply({
      replyLanguage: args.replyLanguage,
      styleValue: introContext.styleValue
    });
  } else if (isSmokeDirectNamingQuestion(args.content)) {
    promptReply = buildSmokeNamingReply({
      replyLanguage: args.replyLanguage,
      agentName: args.agentName,
      nickname: introContext.nickname
    });
  } else if (isSmokeDirectUserPreferredNameQuestion(args.content)) {
    promptReply = buildSmokePreferredNameReply({
      replyLanguage: args.replyLanguage,
      preferredName: introContext.preferredName
    });
  }

  if (promptReply) {
    return promptReply;
  }

  if (isSmokeHelpIntroRequest(args.content)) {
    return buildSmokeHelpIntroReply({
      styleValue: introContext.styleValue,
      selfName: introContext.selfName,
      userName: introContext.userName
    });
  }

  return null;
}
