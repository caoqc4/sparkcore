"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, type SendMessageResult } from "@/app/chat/actions";
import { trackProductEvent } from "@/lib/product/events";

type ChatThreadProps = {
  threadId: string;
  roleName: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    status: string;
    createdAt: string;
  }>;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 2L8.5 8M14 2L9.5 14L8.5 8M14 2L2 6L8.5 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


export function SupplementaryChatThread({
  threadId,
  roleName,
  messages,
}: ChatThreadProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState(messages);

  // Scroll to bottom when messages or pending state change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [optimisticMessages.length, isPending]);

  // Sync server messages on refresh
  useEffect(() => {
    setOptimisticMessages(messages);
  }, [messages]);

  function handleTextareaInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isPending) formRef.current?.requestSubmit();
    }
  }

  async function handleSubmit(formData: FormData) {
    const content = formData.get("content");
    const trimmedContent = typeof content === "string" ? content.trim() : "";

    if (!trimmedContent) return;

    setError(null);
    trackProductEvent("supplementary_chat_send", { surface: "dashboard_chat" });

    setOptimisticMessages((current) => [
      ...current,
      {
        id: `pending-user-${Date.now()}`,
        role: "user",
        content: trimmedContent,
        status: "completed",
        createdAt: new Date().toISOString(),
      },
    ]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    formRef.current?.reset();

    startTransition(async () => {
      const result: SendMessageResult = await sendMessage(formData);
      if (!result.ok) {
        setError(result.message);
      }
      router.refresh();
    });
  }

  return (
    <div className="chat-thread">
      {/* Messages */}
      <div className="chat-messages" ref={scrollRef}>
        <div className="chat-messages-inner">
          {optimisticMessages.length === 0 && !isPending ? (
            <div className="chat-empty">
              <div className="chat-empty-inner">
                <p className="chat-empty-title">No messages yet</p>
                <p className="chat-empty-text">
                  Send a message to continue this relationship thread.
                </p>
              </div>
            </div>
          ) : (
            optimisticMessages.map((msg) =>
              msg.role === "assistant" ? (
                <div key={msg.id} className="chat-bubble chat-bubble-assistant">
                  <p>{msg.content}</p>
                  <span className="chat-bubble-time chat-bubble-time-assistant">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              ) : (
                <div key={msg.id} className="chat-bubble chat-bubble-user">
                  <p>{msg.content}</p>
                  <span className="chat-bubble-time chat-bubble-time-user">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              )
            )
          )}

          {isPending ? (
            <div className="chat-bubble chat-bubble-assistant">
              <div className="chat-typing" aria-label="Thinking">
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Input bar */}
      <form action={handleSubmit} className="chat-input-bar" ref={formRef}>
        <input name="thread_id" type="hidden" value={threadId} />
        <div className="chat-input-inner">
          {error ? <p className="chat-input-error">{error}</p> : null}
          <div className="chat-input-wrap">
            <textarea
              ref={textareaRef}
              className="chat-input-textarea"
              name="content"
              rows={1}
              placeholder="Message..."
              onInput={handleTextareaInput}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={isPending}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <p className="chat-input-hint">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </form>
    </div>
  );
}
