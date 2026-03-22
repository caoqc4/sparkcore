import type { ThreadStateRecord } from "@/lib/chat/thread-state";

export type SessionReplyLanguage = "zh-Hans" | "en" | "unknown";

export type SessionMessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type RecentRawTurn = {
  message_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type SessionContinuitySignal = {
  establishedReplyLanguage: SessionReplyLanguage;
  hasPriorAssistantTurn: boolean;
};

export type ApproxContextPressure = "low" | "medium" | "elevated" | "high";

export type SessionContext = {
  thread_id: string;
  agent_id: string;
  current_user_message: string | null;
  current_message_id?: string;
  recent_raw_turns: RecentRawTurn[];
  current_language_hint: SessionReplyLanguage;
  continuity_signals: SessionContinuitySignal;
  recent_raw_turn_count: number;
  approx_context_pressure: ApproxContextPressure;
  thread_state?: ThreadStateRecord | null;
};

function getMostRecentCompletedAssistantMessage(messages: SessionMessageRecord[]) {
  return [...messages]
    .reverse()
    .find(
      (message) => message.role === "assistant" && message.status === "completed"
    );
}

function getRecentRuntimeMessages(messages: SessionMessageRecord[]) {
  return messages.filter(
    (message) => message.status !== "failed" && message.status !== "pending"
  );
}

function getApproxContextPressure(
  recentMessages: SessionMessageRecord[]
): ApproxContextPressure {
  const approximateCharacterCount = recentMessages.reduce(
    (sum, message) => sum + message.content.trim().length,
    0
  );

  if (recentMessages.length >= 16 || approximateCharacterCount >= 4_200) {
    return "high";
  }

  if (recentMessages.length >= 10 || approximateCharacterCount >= 2_600) {
    return "elevated";
  }

  if (recentMessages.length >= 6 || approximateCharacterCount >= 1_200) {
    return "medium";
  }

  return "low";
}

function getRecordField(
  record: Record<string, unknown> | null | undefined,
  key: string
): Record<string, unknown> | null {
  const value = record?.[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getThreadContinuitySignal({
  messages,
  detectReplyLanguageFromText,
  isReplyLanguage,
  getDeveloperDiagnosticsMetadata
}: {
  messages: SessionMessageRecord[];
  detectReplyLanguageFromText: (content: string) => SessionReplyLanguage;
  isReplyLanguage: (value: unknown) => value is SessionReplyLanguage;
  getDeveloperDiagnosticsMetadata: (
    metadata: Record<string, unknown> | null | undefined
  ) => Record<string, unknown> | null;
}): SessionContinuitySignal {
  const previousAssistantMessage = getMostRecentCompletedAssistantMessage(messages);

  if (!previousAssistantMessage) {
    return {
      establishedReplyLanguage: "unknown",
      hasPriorAssistantTurn: false
    };
  }

  const diagnosticsMetadata = getDeveloperDiagnosticsMetadata(
    previousAssistantMessage.metadata
  );
  const groupedLanguageMetadata = getRecordField(
    previousAssistantMessage.metadata,
    "language"
  );
  const metadataLanguage =
    groupedLanguageMetadata?.detected ??
    diagnosticsMetadata?.reply_language_detected ??
    previousAssistantMessage.metadata?.reply_language_detected;
  const establishedReplyLanguage = isReplyLanguage(metadataLanguage)
    ? metadataLanguage
    : detectReplyLanguageFromText(previousAssistantMessage.content);

  return {
    establishedReplyLanguage,
    hasPriorAssistantTurn: true
  };
}

export function buildSessionContext({
  threadId,
  agentId,
  messages,
  threadState,
  detectReplyLanguageFromText,
  isReplyLanguage,
  getDeveloperDiagnosticsMetadata
}: {
  threadId: string;
  agentId: string;
  messages: SessionMessageRecord[];
  threadState?: ThreadStateRecord | null;
  detectReplyLanguageFromText: (content: string) => SessionReplyLanguage;
  isReplyLanguage: (value: unknown) => value is SessionReplyLanguage;
  getDeveloperDiagnosticsMetadata: (
    metadata: Record<string, unknown> | null | undefined
  ) => Record<string, unknown> | null;
}): SessionContext {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const recentRuntimeMessages = getRecentRuntimeMessages(messages);
  const continuitySignals = getThreadContinuitySignal({
    messages,
    detectReplyLanguageFromText,
    isReplyLanguage,
    getDeveloperDiagnosticsMetadata
  });

  return {
    thread_id: threadId,
    agent_id: agentId,
    current_user_message: latestUserMessage?.content ?? null,
    current_message_id: latestUserMessage?.id,
    recent_raw_turns: recentRuntimeMessages.map((message) => ({
      message_id: message.id,
      role: message.role,
      content: message.content,
      created_at: message.created_at
    })),
    current_language_hint: continuitySignals.establishedReplyLanguage,
    continuity_signals: continuitySignals,
    recent_raw_turn_count: recentRuntimeMessages.length,
    approx_context_pressure: getApproxContextPressure(recentRuntimeMessages),
    thread_state: threadState ?? null
  };
}
