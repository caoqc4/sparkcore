"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  renameThread,
  retryAssistantReply,
  sendMessage,
  type RenameThreadResult,
  type RetryAssistantReplyResult,
  type SendMessageResult
} from "@/app/chat/actions";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type ChatThreadViewProps = {
  initialError?: string;
  thread: {
    id: string;
    title: string;
    status: string;
    updated_at: string;
  };
  agentName: string | null;
  workspaceDefaultAgentName: string | null;
  initialMessages: ChatMessage[];
};

type RuntimeSummary = {
  agentName: string | null;
  modelProfileName: string | null;
  memoryLabel: string | null;
};

function getRuntimeSummary(message: ChatMessage): RuntimeSummary | null {
  if (message.role !== "assistant" || message.status !== "completed") {
    return null;
  }

  const agentName =
    typeof message.metadata?.agent_name === "string" &&
    message.metadata.agent_name.trim().length > 0
      ? message.metadata.agent_name
      : null;
  const modelProfileName =
    typeof message.metadata?.model_profile_name === "string" &&
    message.metadata.model_profile_name.trim().length > 0
      ? message.metadata.model_profile_name
      : null;
  const memoryHitCount =
    typeof message.metadata?.memory_hit_count === "number"
      ? message.metadata.memory_hit_count
      : Array.isArray(message.metadata?.recalled_memories)
      ? message.metadata.recalled_memories.length
      : null;
  const memoryUsed =
    typeof message.metadata?.memory_used === "boolean"
      ? message.metadata.memory_used
      : typeof memoryHitCount === "number"
      ? memoryHitCount > 0
      : null;

  const memoryLabel =
    memoryUsed === null
      ? null
      : memoryUsed
      ? typeof memoryHitCount === "number"
        ? `${memoryHitCount} memory hit${memoryHitCount === 1 ? "" : "s"}`
        : "Yes"
      : "No";

  if (!agentName && !modelProfileName && !memoryLabel) {
    return null;
  }

  return {
    agentName,
    modelProfileName,
    memoryLabel
  };
}

export function ChatThreadView({
  initialError,
  thread,
  agentName,
  workspaceDefaultAgentName,
  initialMessages
}: ChatThreadViewProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const renameFormRef = useRef<HTMLFormElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const [pendingError, setPendingError] = useState<string | null>(initialError ?? null);
  const [optimisticMessages, setOptimisticMessages] =
    useState<ChatMessage[]>(initialMessages);
  const [threadTitle, setThreadTitle] = useState(thread.title);
  const [draftTitle, setDraftTitle] = useState(thread.title);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isSending, startSendTransition] = useTransition();
  const [isRetryPending, startRetryTransition] = useTransition();
  const [isRenamePending, startRenameTransition] = useTransition();
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);

  useEffect(() => {
    setOptimisticMessages(initialMessages);
    setPendingError(initialError ?? null);
    setThreadTitle(thread.title);
    setDraftTitle(thread.title);
    setIsRenaming(false);
  }, [initialError, initialMessages, thread.id, thread.title]);

  const isComposerDisabled = isSending || isRetryPending || isRenamePending;
  const isFirstTurn = optimisticMessages.length === 0;
  const threadAgentSummary = agentName ?? "Unassigned";
  const defaultAgentCopy = workspaceDefaultAgentName
    ? workspaceDefaultAgentName === agentName
      ? "This thread is using the workspace default agent."
      : `Workspace default agent: ${workspaceDefaultAgentName}.`
    : "No workspace default agent is set.";
  const firstTurnExamples = [
    "Help me plan my top three priorities for this week.",
    "Ask me a few questions so we can decide the best planning style for me.",
    "Let's turn my current goals into a simple weekly plan."
  ];

  const visibleMessages = useMemo(() => {
    if (!isSending && !retryingMessageId) {
      return optimisticMessages;
    }

    if (retryingMessageId) {
      return optimisticMessages.map((message) =>
        message.id === retryingMessageId
          ? {
              ...message,
              status: "pending",
              content: ""
            }
          : message
      );
    }

    return [
      ...optimisticMessages,
      {
        id: `assistant-thinking-${thread.id}`,
        role: "assistant" as const,
        content: "",
        status: "pending",
        metadata: {},
        created_at: new Date().toISOString()
      }
    ];
  }, [isSending, optimisticMessages, retryingMessageId, thread.id]);

  async function handleSubmit(formData: FormData) {
    if (isComposerDisabled) {
      return;
    }

    const content = formData.get("content");

    if (typeof content !== "string") {
      return;
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setPendingError("Type a message before sending.");
      return;
    }

    setPendingError(null);
    setOptimisticMessages((current) => [
      ...current,
      {
        id: `pending-user-${Date.now()}`,
        role: "user",
        content: trimmedContent,
        status: "completed",
        metadata: {},
        created_at: new Date().toISOString()
      }
    ]);

    formRef.current?.reset();

    startSendTransition(async () => {
      const result: SendMessageResult = await sendMessage(formData);

      if (!result.ok) {
        setPendingError(result.message);
      }

      router.refresh();
    });
  }

  function handleRetry(failedMessageId: string) {
    if (isComposerDisabled || retryingMessageId) {
      return;
    }

    setPendingError(null);
    setRetryingMessageId(failedMessageId);

    startRetryTransition(async () => {
      const retryFormData = new FormData();
      retryFormData.set("thread_id", thread.id);
      retryFormData.set("failed_message_id", failedMessageId);

      const result: RetryAssistantReplyResult = await retryAssistantReply(retryFormData);

      if (!result.ok) {
        setPendingError(result.message);
      }

      setRetryingMessageId(null);
      router.refresh();
    });
  }

  function handleRenameCancel() {
    setDraftTitle(threadTitle);
    setIsRenaming(false);
    setPendingError(initialError ?? null);
  }

  function useFirstTurnPrompt(prompt: string) {
    if (isComposerDisabled) {
      return;
    }

    messageInputRef.current?.focus();
    messageInputRef.current?.setRangeText(prompt, 0, messageInputRef.current.value.length, "end");
  }

  async function handleRename(formData: FormData) {
    if (isComposerDisabled) {
      return;
    }

    startRenameTransition(async () => {
      const result: RenameThreadResult = await renameThread(formData);

      if (!result.ok) {
        setPendingError(result.message);
        return;
      }

      setPendingError(null);
      setThreadTitle(result.title);
      setDraftTitle(result.title);
      setIsRenaming(false);
      router.refresh();
    });
  }

  return (
    <>
      {pendingError ? <div className="notice notice-error">{pendingError}</div> : null}

      <div className="thread-detail-header">
        <div className="thread-detail-copy">
          {isRenaming ? (
            <form
              action={handleRename}
              className="thread-rename-form"
              ref={renameFormRef}
            >
              <input name="thread_id" type="hidden" value={thread.id} />
              <label className="sr-only" htmlFor={`thread-title-${thread.id}`}>
                Rename thread
              </label>
              <input
                className="input thread-rename-input"
                id={`thread-title-${thread.id}`}
                maxLength={80}
                name="title"
                onChange={(event) => setDraftTitle(event.target.value)}
                required
                value={draftTitle}
              />
              <div className="thread-rename-actions">
                <button
                  className="button"
                  disabled={isRenamePending}
                  type="submit"
                >
                  {isRenamePending ? "Saving..." : "Save"}
                </button>
                <button
                  className="button button-secondary"
                  disabled={isRenamePending}
                  onClick={handleRenameCancel}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="thread-title-row">
                <h2 className="thread-detail-title">{threadTitle}</h2>
                <button
                  className="button button-secondary thread-rename-trigger"
                  disabled={isComposerDisabled}
                  onClick={() => {
                    setDraftTitle(threadTitle);
                    setIsRenaming(true);
                  }}
                  type="button"
                >
                  Rename
                </button>
              </div>
              <div className="thread-detail-meta">
                <p className="helper-copy">
                  Thread agent: {threadAgentSummary} · Updated{" "}
                  {new Date(thread.updated_at).toLocaleString()}
                </p>
                <p className="helper-copy">{defaultAgentCopy}</p>
              </div>
            </>
          )}
        </div>

        <div className="thread-detail-badges">
          <span className="thread-badge">{thread.status}</span>
          <span className="thread-badge">
            {optimisticMessages.length} message
            {optimisticMessages.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="message-list" data-thread-id={thread.id}>
        {visibleMessages.length === 0 ? (
          <div className="message message-assistant">
            <p className="message-role">Assistant</p>
            <div className="first-turn-state">
              <p className="message-content">
                This thread is ready for its first turn. Start with a goal, a planning
                problem, or a short description of what you want help with.
              </p>
              <p className="helper-copy">
                Keep it lightweight: one clear request is enough to get the
                conversation moving.
              </p>
              <div className="first-turn-examples" aria-label="First-turn examples">
                {firstTurnExamples.map((example) => (
                  <button
                    className="first-turn-chip"
                    disabled={isComposerDisabled}
                    key={example}
                    onClick={() => useFirstTurnPrompt(example)}
                    type="button"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          visibleMessages.map((message) => {
            const isThinking =
              ((isSending && message.id === `assistant-thinking-${thread.id}`) ||
                retryingMessageId === message.id ||
                message.status === "pending") &&
              message.role === "assistant";
            const isFailed =
              !isThinking &&
              message.role === "assistant" &&
              message.status === "failed";
            const errorType =
              typeof message.metadata?.error_type === "string"
                ? message.metadata.error_type
                : "generation_failed";
            const failedReason =
              typeof message.metadata?.error_message === "string"
                ? message.metadata.error_message
                : "Assistant reply failed. Retry this turn when ready.";
            const failureLabel =
              errorType === "timeout"
                ? "Reply timed out"
                : errorType === "provider_error"
                ? "Provider error"
                : "Reply failed";
            const failureHint =
              errorType === "timeout"
                ? "The reply took too long. Retry this turn without resending the user message."
                : errorType === "provider_error"
                ? "The model provider returned an error. Retry when the provider is available again."
                : "Something interrupted generation. Retry this turn when ready.";
            const runtimeSummary = getRuntimeSummary(message);

            return (
              <article
                className={`message ${
                  message.role === "user" ? "message-user" : "message-assistant"
                } ${isThinking ? "message-thinking" : ""} ${
                  isFailed ? "message-failed" : ""
                }`}
                key={message.id}
              >
                <p className="message-role">
                  {isThinking ? "Assistant thinking" : message.role}
                </p>
                {isThinking ? (
                  <div className="thinking-dots" aria-label="Assistant is thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : isFailed ? (
                  <div className="message-failure">
                    <div className="message-failure-header">
                      <span className={`thread-badge failure-badge failure-${errorType}`}>
                        {failureLabel}
                      </span>
                      <p className="message-failure-hint">{failureHint}</p>
                    </div>
                    <p className="message-content">{failedReason}</p>
                    <button
                      className="button button-secondary retry-button"
                      disabled={isComposerDisabled || Boolean(retryingMessageId)}
                      onClick={() => handleRetry(message.id)}
                      type="button"
                    >
                      {retryingMessageId === message.id ? "Retrying..." : "Retry reply"}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="message-content">{message.content}</p>
                    {runtimeSummary ? (
                      <details className="runtime-summary">
                        <summary className="runtime-summary-toggle">
                          Runtime summary
                        </summary>
                        <dl className="runtime-summary-grid">
                          {runtimeSummary.agentName ? (
                            <>
                              <dt>Replying agent</dt>
                              <dd>{runtimeSummary.agentName}</dd>
                            </>
                          ) : null}
                          {runtimeSummary.modelProfileName ? (
                            <>
                              <dt>Model profile</dt>
                              <dd>{runtimeSummary.modelProfileName}</dd>
                            </>
                          ) : null}
                          {runtimeSummary.memoryLabel ? (
                            <>
                              <dt>Memory used</dt>
                              <dd>{runtimeSummary.memoryLabel}</dd>
                            </>
                          ) : null}
                        </dl>
                      </details>
                    ) : null}
                  </>
                )}
              </article>
            );
          })
        )}
      </div>

      <form action={handleSubmit} className="composer" ref={formRef}>
        <input name="thread_id" type="hidden" value={thread.id} />
        <label className="field" htmlFor={`content-${thread.id}`}>
          <span className="label">Message</span>
          <textarea
            className="input textarea"
            disabled={isComposerDisabled}
            id={`content-${thread.id}`}
            name="content"
            placeholder={
              isFirstTurn
                ? "Start the thread with a goal, question, or planning problem..."
                : "Send a message into the active thread..."
            }
            ref={messageInputRef}
            required
            rows={4}
          />
        </label>

        <div className="composer-footer">
          <p className="helper-copy">
            {isFirstTurn
              ? "This guidance only appears for an empty thread. Once the first message is sent, the conversation continues without extra onboarding."
              : "This thread stays bound to one agent instance. Sending a message will keep feedback local to the active thread and avoid duplicate submits while pending."}
          </p>
          <button className="button" disabled={isComposerDisabled} type="submit">
            {isSending ? "Assistant thinking..." : "Send message"}
          </button>
        </div>
      </form>
    </>
  );
}
