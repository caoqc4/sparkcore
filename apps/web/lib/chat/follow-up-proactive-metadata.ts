export function buildProactiveMessageMetadata(args: {
  replyLanguage: "zh-Hans" | "en";
  messageTemplate: string;
}) {
  return {
    reply_language: args.replyLanguage,
    message_template: args.messageTemplate
  };
}

export function buildProactiveSendResultMetadata(args: {
  sender: string;
  fields?: Record<string, unknown>;
}) {
  return {
    sender: args.sender,
    ...(args.fields ?? {})
  };
}
