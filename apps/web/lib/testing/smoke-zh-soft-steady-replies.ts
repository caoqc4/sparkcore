export function buildSmokeZhBriefSteadyingReply(userName: string | null) {
  return userName
    ? `${userName}，先缓一下，我陪着你。`
    : "先缓一下，我陪着你。";
}

export function buildSmokeZhGuidedNextStepReply(userName: string | null) {
  return userName
    ? `${userName}，我们先只理眼前这一小步，我陪你慢慢顺。`
    : "我们先只理眼前这一小步，我陪你慢慢顺。";
}

export function buildSmokeZhCarryForwardReply(userName: string | null) {
  return userName
    ? `${userName}，先缓一下，我陪你往下顺一点。`
    : "先缓一下，我陪你往下顺一点。";
}

export function buildSmokeZhSharedPushReply(args: {
  userName: string | null;
  isImmediatePush: boolean;
}) {
  if (args.isImmediatePush) {
    return args.userName
      ? `${args.userName}，好，我先陪你把眼前这一下弄过去。`
      : "好，我先陪你把眼前这一下弄过去。";
  }

  return args.userName
    ? `${args.userName}，好，我们先一起把这一点弄过去。`
    : "好，我们先一起把这一点弄过去。";
}
