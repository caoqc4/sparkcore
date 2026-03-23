export function buildSmokeRelationshipExplanatoryCoreEn(args: {
  helpNextPrompt: boolean;
  addressStyleValue: string | null;
  selfName: string;
  userName: string | null;
}) {
  if (args.helpNextPrompt) {
    if (args.addressStyleValue === "formal") {
      return args.userName
        ? `${args.userName}, next I would clarify the key points, lay out a steady next step, and keep helping in a more formal, reliable way. I am ${args.selfName}.`
        : `Next I would clarify the key points, lay out a steady next step, and keep helping in a more formal, reliable way. I am ${args.selfName}.`;
    }

    if (args.addressStyleValue === "friendly" || args.addressStyleValue === "casual") {
      return args.userName
        ? `${args.userName}, next I would help you sort the important bits out, pick the easiest next step, and keep moving with you in that friendlier tone. I am ${args.selfName}.`
        : `Next I would help you sort the important bits out, pick the easiest next step, and keep moving with you in that friendlier tone. I am ${args.selfName}.`;
    }

    return args.userName
      ? `${args.userName}, next I would clarify the priorities and keep moving with you one step at a time. I am ${args.selfName}, and I would keep the tone steady and supportive.`
      : `Next I would clarify the priorities and keep moving with you one step at a time. I am ${args.selfName}, and I would keep the tone steady and supportive.`;
  }

  if (args.addressStyleValue === "formal") {
    return args.userName
      ? `${args.userName}, if you were having a rough day, I would slow things down, explain them clearly, and stay steady with you. I am ${args.selfName}, and I would keep helping in a more formal, reliable way.`
      : `If you were having a rough day, I would slow things down, explain them clearly, and stay steady with you. I am ${args.selfName}, and I would keep helping in a more formal, reliable way.`;
  }

  if (args.addressStyleValue === "friendly" || args.addressStyleValue === "casual") {
    return args.userName
      ? `${args.userName}, if you were having a rough day, I would keep things warm and easy, help you sort them out, and stay with you through the next step. I am ${args.selfName}, and I would keep showing up in that friendlier tone.`
      : `If you were having a rough day, I would keep things warm and easy, help you sort them out, and stay with you through the next step. I am ${args.selfName}, and I would keep showing up in that friendlier tone.`;
  }

  return args.userName
    ? `${args.userName}, if you were having a rough day, I would explain things clearly and keep moving with you step by step. I am ${args.selfName}, and I would keep the tone steady and supportive.`
    : `If you were having a rough day, I would explain things clearly and keep moving with you step by step. I am ${args.selfName}, and I would keep the tone steady and supportive.`;
}
