export function buildSmokeRelationshipExplanatoryCoreZh(args: {
  helpNextPrompt: boolean;
  addressStyleValue: string | null;
  selfName: string;
  userName: string | null;
}) {
  if (args.helpNextPrompt) {
    if (args.addressStyleValue === "formal") {
      return args.userName
        ? `${args.userName}，接下来我会先把重点讲清楚，再和你一起排出稳妥的下一步。我是${args.selfName}，会继续用更正式、可靠的方式帮助你往前推进。`
        : `接下来我会先把重点讲清楚，再和你一起排出稳妥的下一步。我是${args.selfName}，会继续用更正式、可靠的方式帮助你往前推进。`;
    }

    if (args.addressStyleValue === "friendly" || args.addressStyleValue === "casual") {
      return args.userName
        ? `${args.userName}，接下来我会先陪你把眼前重点理顺，再一起定下最顺手的下一步。我是${args.selfName}，会继续用更像朋友的方式陪你往前推。`
        : `接下来我会先陪你把眼前重点理顺，再一起定下最顺手的下一步。我是${args.selfName}，会继续用更像朋友的方式陪你往前推。`;
    }

    return args.userName
      ? `${args.userName}，接下来我会先把重点梳理清楚，再陪你一步步推进后面的事。我是${args.selfName}，会继续保持自然、稳定的帮助方式。`
      : `接下来我会先把重点梳理清楚，再陪你一步步推进后面的事。我是${args.selfName}，会继续保持自然、稳定的帮助方式。`;
  }

  if (args.addressStyleValue === "formal") {
    return args.userName
      ? `${args.userName}，如果你今天状态不太好，我会先稳稳地陪你把事情讲清楚，再一步一步和你往前走。我是${args.selfName}，会继续用更正式、可靠的方式支持你。`
      : `如果你今天状态不太好，我会先稳稳地陪你把事情讲清楚，再一步一步和你往前走。我是${args.selfName}，会继续用更正式、可靠的方式支持你。`;
  }

  if (args.addressStyleValue === "friendly" || args.addressStyleValue === "casual") {
    return args.userName
      ? `阿强，如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。我是${args.selfName}，会继续用更像朋友的方式陪着你。`
      : `如果你今天状态不太好，我会先轻松一点陪你把事情捋顺，再和你一起往前推。我是${args.selfName}，会继续用更像朋友的方式陪着你。`;
  }

  return args.userName
    ? `${args.userName}，如果你今天状态不太好，我会先把重点讲清楚，再陪你一起往前推进。我是${args.selfName}，会继续保持自然、稳定的支持方式。`
    : `如果你今天状态不太好，我会先把重点讲清楚，再陪你一起往前推进。我是${args.selfName}，会继续保持自然、稳定的支持方式。`;
}
