"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, type SendMessageResult } from "@/app/chat/actions";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  initialMessages: ChatMessage[];
};

export function ChatThreadView({
  initialError,
  thread,
  agentName,
  initialMessages
}: ChatThreadViewProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pendingError, setPendingError] = useState<string | null>(initialError ?? null);
  const [optimisticMessages, setOptimisticMessages] =
    useState<ChatMessage[]>(initialMessages);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOptimisticMessages(initialMessages);
    setPendingError(initialError ?? null);
  }, [initialError, initialMessages, thread.id]);

  const visibleMessages = useMemo(() => {
    if (!isPending) {
      return optimisticMessages;
    }

    return [
      ...optimisticMessages,
      {
        id: `assistant-thinking-${thread.id}`,
        role: "assistant" as const,
        content: "",
        created_at: new Date().toISOString()
      }
    ];
  }, [isPending, optimisticMessages, thread.id]);

  async function handleSubmit(formData: FormData) {
    if (isPending) {
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
        created_at: new Date().toISOString()
      }
    ]);

    formRef.current?.reset();

    startTransition(async () => {
      const result: SendMessageResult = await sendMessage(formData);

      if (!result.ok) {
        setPendingError(result.message);
      }

      router.refresh();
    });
  }

  return (
    <>
      {pendingError ? <div className="notice notice-error">{pendingError}</div> : null}

      <div className="thread-detail-header">
        <div>
          <h2 className="thread-detail-title">{thread.title}</h2>
          <p className="helper-copy">
            Bound agent: {agentName ?? "Unassigned"} · Updated{" "}
            {new Date(thread.updated_at).toLocaleString()}
          </p>
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
            <p className="message-content">
              No messages yet. Send the first user message to create the initial
              chat history for this thread.
            </p>
          </div>
        ) : (
          visibleMessages.map((message) => {
            const isThinking =
              isPending &&
              message.id === `assistant-thinking-${thread.id}` &&
              message.role === "assistant";

            return (
              <article
                className={`message ${
                  message.role === "user" ? "message-user" : "message-assistant"
                } ${isThinking ? "message-thinking" : ""}`}
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
                ) : (
                  <p className="message-content">{message.content}</p>
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
            disabled={isPending}
            id={`content-${thread.id}`}
            name="content"
            placeholder="Send a message into the active thread..."
            required
            rows={4}
          />
        </label>

        <div className="composer-footer">
          <p className="helper-copy">
            This thread stays bound to one agent instance. Sending a message
            will keep feedback local to the active thread and avoid duplicate
            submits while pending.
          </p>
          <button className="button" disabled={isPending} type="submit">
            {isPending ? "Assistant thinking..." : "Send message"}
          </button>
        </div>
      </form>
    </>
  );
}
