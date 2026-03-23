import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import {
  buildSmokeEnStyleGreeting,
  buildSmokeZhStyleGreeting
} from "@/lib/testing/smoke-style-greetings";

export function buildSmokeSelfIntroReply(args: {
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

export function buildSmokeHelpIntroReply(args: {
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
