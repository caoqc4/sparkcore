export function buildSmokeZhStyleGreeting(args: {
  styleValue: string | null;
  userName: string | null;
}) {
  return args.styleValue === "formal"
    ? args.userName
      ? `您好，${args.userName}。`
      : "您好。"
    : args.styleValue === "friendly"
      ? args.userName
        ? `嗨，${args.userName}。`
        : "嗨，朋友。"
      : args.styleValue === "casual"
        ? args.userName
          ? `嗨，${args.userName}。`
          : "嗨。"
        : args.userName
          ? `你好，${args.userName}。`
          : "你好。";
}

export function buildSmokeEnStyleGreeting(args: {
  styleValue: string | null;
  userName: string | null;
}) {
  return args.styleValue === "formal"
    ? args.userName
      ? `Hello, ${args.userName}.`
      : "Hello."
    : args.styleValue === "friendly"
      ? args.userName
        ? `Hey, ${args.userName}.`
        : "Hey, friend."
      : args.styleValue === "casual"
        ? args.userName
          ? `Hey, ${args.userName}.`
          : "Hey."
        : args.userName
          ? `Hello, ${args.userName}.`
          : "Hello.";
}
