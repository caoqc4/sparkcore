export function buildPendingAssistantMetadata(args: {
  agentId: string;
  userMessageId: string;
  source?: string | null;
}) {
  return {
    agent_id: args.agentId,
    user_message_id: args.userMessageId,
    ...(args.source ? { source: args.source } : {})
  };
}

export function buildFailedAssistantMetadata(args: {
  errorType: string;
  errorMessage: string;
  baseMetadata?: Record<string, unknown> | null;
  agentId?: string | null;
  userMessageId?: string | null;
  source?: string | null;
}) {
  return {
    ...(args.baseMetadata ?? {}),
    ...(args.agentId ? { agent_id: args.agentId } : {}),
    ...(args.userMessageId ? { user_message_id: args.userMessageId } : {}),
    error_type: args.errorType,
    error_message: args.errorMessage,
    ...(args.source ? { source: args.source } : {})
  };
}
