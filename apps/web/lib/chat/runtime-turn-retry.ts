type PersistedRuntimeMessage = {
  id: string;
  role: string;
  content: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type RuntimePromptMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export function recoverRetryRuntimeTurn(args: {
  messages: PersistedRuntimeMessage[];
  failedMessageId: string;
}) {
  const failedIndex = args.messages.findIndex(
    (message) =>
      message.id === args.failedMessageId && message.status === "failed"
  );

  if (failedIndex === -1) {
    return {
      status: "failed_message_not_found" as const
    };
  }

  const failedMessage = args.messages[failedIndex] as PersistedRuntimeMessage & {
    role: "assistant";
    metadata: Record<string, unknown>;
  };

  const sourceUserMessageId =
    typeof failedMessage.metadata?.user_message_id === "string"
      ? failedMessage.metadata.user_message_id
      : null;

  const promptMessages = args.messages
    .slice(0, failedIndex)
    .filter((message) => {
      if (message.status === "failed" || message.status === "pending") {
        return false;
      }

      return message.role === "user" || message.role === "assistant";
    })
    .map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      status: message.status,
      metadata: (message.metadata ?? {}) as Record<string, unknown>,
      created_at: message.created_at
    }));

  const latestUserMessage = [...promptMessages]
    .reverse()
    .find((message) =>
      sourceUserMessageId ? message.id === sourceUserMessageId : message.role === "user"
    );

  if (!latestUserMessage) {
    return {
      status: "source_user_message_not_found" as const
    };
  }

  return {
    status: "recovered" as const,
    failedMessage,
    promptMessages,
    latestUserMessage
  };
}
