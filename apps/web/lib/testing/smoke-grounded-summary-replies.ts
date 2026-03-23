import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";

export function buildSmokeGroundedSummaryReply(args: {
  replyLanguage: SmokeReplyLanguage;
  selfName: string;
  userName: string | null;
  rememberedProfession: boolean;
}) {
  if (args.replyLanguage === "zh-Hans") {
    if (args.rememberedProfession && args.userName) {
      return `我记得你叫${args.userName}，是一名产品设计师。现在由${args.selfName}继续陪你把事情往前推进。`;
    }

    if (args.rememberedProfession) {
      return `我记得你是一名产品设计师，现在由${args.selfName}继续陪你把事情往前推进。`;
    }

    return `现在由${args.selfName}继续陪你往前推进，我会结合已经记得的内容来帮助你。`;
  }

  if (args.rememberedProfession && args.userName) {
    return `I remember that you go by ${args.userName} and work as a product designer. ${args.selfName} can keep helping you move things forward from here.`;
  }

  if (args.rememberedProfession) {
    return `I remember that you work as a product designer. ${args.selfName} can keep helping you move things forward from here.`;
  }

  return `${args.selfName} can keep helping you move things forward from here with the context already remembered.`;
}
