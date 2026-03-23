import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import {
  isSmokeBriefGreetingRequest,
  isSmokeDirectNamingQuestion,
  isSmokeDirectUserPreferredNameQuestion,
  isSmokeSelfIntroGreetingRequest
} from "@/lib/testing/smoke-answer-strategy";
import { getSmokeIntroReplyContext } from "@/lib/testing/smoke-intro-reply-context";
import type { SmokeRelationshipRecallMemory } from "@/lib/testing/smoke-recall-memory-types";
import {
  buildSmokeEnStyleGreeting,
  buildSmokeZhStyleGreeting
} from "@/lib/testing/smoke-style-greetings";

export type SmokeIntroReplyInput = {
  content: string;
  replyLanguage: SmokeReplyLanguage;
  agentName: string;
  addressStyleMemory: SmokeRelationshipRecallMemory;
  nicknameMemory: SmokeRelationshipRecallMemory;
  preferredNameMemory: SmokeRelationshipRecallMemory;
};

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

function isSmokeHelpIntroRequest(content: string) {
  return (
    content.includes("请用两句话介绍你自己") ||
    content.includes("你能如何帮助我")
  );
}

function buildSmokeSelfIntroReply(args: {
  replyLanguage: SmokeReplyLanguage;
  styleValue: string | null;
  selfName: string;
  userName: string | null;
  hasNicknameMemory: boolean;
}) {
  if (args.replyLanguage === "zh-Hans") {
    const greeting = buildSmokeZhStyleGreeting({
      styleValue: args.styleValue,
      userName: args.userName
    });

    const intro =
      args.hasNicknameMemory || args.styleValue === "friendly"
        ? `我是${args.selfName}，很高兴继续和你聊。`
        : `我是${args.selfName}，很高兴继续为你提供帮助。`;

    return `${greeting} ${intro}`;
  }

  const greeting = buildSmokeEnStyleGreeting({
    styleValue: args.styleValue,
    userName: args.userName
  });

  const intro =
    args.hasNicknameMemory || args.styleValue === "friendly"
      ? `I am ${args.selfName}, and it is good to keep chatting with you.`
      : `I am ${args.selfName}, and I am glad to keep helping you.`;

  return `${greeting} ${intro}`;
}

function buildSmokeHelpIntroReply(args: {
  styleValue: string | null;
  selfName: string;
  userName: string | null;
}) {
  const opening = buildSmokeZhStyleGreeting({
    styleValue: args.styleValue,
    userName: args.userName
  });

  return `${opening} 我是${args.selfName}，可以用中文帮助你梳理计划、整理记忆，并继续当前线程里的对话。`;
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
