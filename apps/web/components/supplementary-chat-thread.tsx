"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, type SendMessageResult } from "@/app/chat/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { trackProductEvent } from "@/lib/product/events";

type SupplementaryChatThreadProps = {
  threadId: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    status: string;
    createdAt: string;
  }>;
};

type FeedbackState = {
  tone: "error" | "success";
  message: string;
} | null;

export function SupplementaryChatThread({
  threadId,
  messages
}: SupplementaryChatThreadProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [optimisticMessages, setOptimisticMessages] = useState(messages);

  async function handleSubmit(formData: FormData) {
    const content = formData.get("content");
    const trimmedContent = typeof content === "string" ? content.trim() : "";

    if (!trimmedContent) {
      setFeedback({
        tone: "error",
        message: "Type a message before sending."
      });
      return;
    }

    setFeedback(null);
    trackProductEvent("supplementary_chat_send", {
      surface: "dashboard_chat"
    });
    setOptimisticMessages((current) => [
      ...current,
      {
        id: `pending-user-${Date.now()}`,
        role: "user",
        content: trimmedContent,
        status: "completed",
        createdAt: new Date().toISOString()
      }
    ]);
    formRef.current?.reset();

    startTransition(async () => {
      const result: SendMessageResult = await sendMessage(formData);

      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.message
        });
      }

      router.refresh();
    });
  }

  return (
    <section className="site-card supplementary-chat-shell">
      <div className="supplementary-chat-header">
        <div className="supplementary-chat-meta-strip">
          <span className="site-inline-pill">Canonical thread</span>
          <span className="supplementary-chat-count">
            {optimisticMessages.length} message{optimisticMessages.length === 1 ? "" : "s"}
          </span>
        </div>
        <h2>Supplementary chat</h2>
        <p className="helper-copy">
          Send from web when you need corrective continuation, not a second inbox.
        </p>
      </div>

      {feedback ? <div className={`notice notice-${feedback.tone}`}>{feedback.message}</div> : null}

      <div className="supplementary-chat-log">
        {optimisticMessages.length > 0 ? (
          optimisticMessages.map((message) => (
            <article
              className={`supplementary-chat-message supplementary-chat-message-${message.role}`}
              key={message.id}
            >
              <div className="supplementary-chat-message-meta">
                <span>{message.role === "user" ? "You" : "Role"}</span>
                <span>{new Date(message.createdAt).toLocaleString()}</span>
              </div>
              <p>{message.content}</p>
            </article>
          ))
        ) : (
          <div className="empty-state supplementary-chat-empty">
            <p className="helper-copy">No messages in this thread yet. Start the continuity here or in IM.</p>
          </div>
        )}

        {isPending ? (
          <article className="supplementary-chat-message supplementary-chat-message-assistant supplementary-chat-thinking">
            <div className="supplementary-chat-message-meta">
              <span>Role</span>
              <span>Thinking...</span>
            </div>
            <p>Preparing a reply in the same canonical thread.</p>
          </article>
        ) : null}
      </div>

      <form action={handleSubmit} className="stack supplementary-chat-form" ref={formRef}>
        <input name="thread_id" type="hidden" value={threadId} />
        <div className="field">
          <label className="label" htmlFor="supplementary-chat-content">
            Message
          </label>
          <textarea
            className="input textarea"
            id="supplementary-chat-content"
            name="content"
            placeholder="Send a message into the current relationship thread..."
            rows={4}
          />
        </div>
        <p className="helper-copy supplementary-chat-form-note">
          This writes into the same relationship state already carried by the canonical thread.
        </p>
        <FormSubmitButton idleText="Send to this thread" pendingText="Sending..." />
      </form>
    </section>
  );
}
