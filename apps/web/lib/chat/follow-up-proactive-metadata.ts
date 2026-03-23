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

export function buildReplyOutboundMetadata(args: {
  language?: string | null;
  messageMetadata?: Record<string, unknown> | null;
}) {
  return {
    runtime_message_language: args.language ?? null,
    runtime_message_metadata: args.messageMetadata ?? {}
  };
}

export function buildProactiveOutboundMetadata(args: {
  kind: string;
  triggerAt: string;
  reason: string;
  payload?: Record<string, unknown> | null;
}) {
  return {
    follow_up_kind: args.kind,
    follow_up_trigger_at: args.triggerAt,
    follow_up_reason: args.reason,
    follow_up_payload: args.payload ?? {}
  };
}

export function buildBindingNotFoundMetadata(args: {
  reason?: string | null;
}) {
  return {
    binding_status: "not_found",
    binding_reason: args.reason ?? null
  };
}
