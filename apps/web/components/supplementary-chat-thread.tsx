"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, type SendMessageResult } from "@/app/chat/actions";
import { trackProductEvent } from "@/lib/product/events";

type ChatThreadProps = {
  threadId: string;
  roleName: string;
  audioPlayback: {
    enabled: boolean;
    provider: string | null;
    voiceName: string | null;
  };
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>;
};

type MessageArtifact = {
  id: string;
  type: "image" | "audio";
  status: "ready" | "failed";
  source?: "intent" | "ambient_context";
  modelSlug: string;
  url: string | null;
  alt?: string;
  voiceName?: string | null;
  provider?: string | null;
  transcript?: string;
  error?: string | null;
  billing?: {
    debitedCredits?: number;
  };
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

function getMessageArtifacts(metadata: Record<string, unknown>) {
  const rawArtifacts = Array.isArray(metadata?.artifacts) ? metadata.artifacts : [];

  return rawArtifacts.filter((item): item is MessageArtifact => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const record = item as Record<string, unknown>;
    return (
      (record.type === "image" || record.type === "audio") &&
      typeof record.id === "string"
    );
  });
}


export function SupplementaryChatThread({
  threadId,
  roleName,
  audioPlayback,
  messages,
}: ChatThreadProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState(messages);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

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

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

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
        metadata: {},
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

  async function handlePlayVoice(messageId: string) {
    if (!audioPlayback.enabled) {
      return;
    }

    setPlaybackError(null);

    if (playingMessageId === messageId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingMessageId(null);
      return;
    }

    setPlayingMessageId(messageId);

    try {
      const response = await fetch("/api/audio/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId,
          messageId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Playback failed.");
      }

      const blob = await response.blob();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.addEventListener("ended", () => {
          setPlayingMessageId(null);
        });
      }

      audioRef.current.src = objectUrl;
      await audioRef.current.play();
    } catch (err) {
      setPlayingMessageId(null);
      setPlaybackError(err instanceof Error ? err.message : "Playback failed.");
    }
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
            optimisticMessages.map((msg) => {
              const artifacts = getMessageArtifacts(msg.metadata);

              return msg.role === "assistant" ? (
                <div key={msg.id} className="chat-bubble chat-bubble-assistant">
                  <p>{msg.content}</p>
                  {artifacts.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        marginTop: 12,
                      }}
                    >
                      {artifacts.map((artifact) =>
                        artifact.type === "image" &&
                        artifact.status === "ready" &&
                        artifact.url ? (
                          <figure
                            key={artifact.id}
                            style={{
                              margin: 0,
                              border: "1px solid rgba(148, 163, 184, 0.28)",
                              borderRadius: 16,
                              overflow: "hidden",
                              background: "rgba(255,255,255,0.03)",
                            }}
                          >
                            <img
                              alt={artifact.alt}
                              src={artifact.url}
                              style={{
                                display: "block",
                                width: "100%",
                                height: "auto",
                              }}
                            />
                            <figcaption
                              style={{
                                padding: "10px 12px",
                                fontSize: 12,
                                opacity: 0.8,
                              }}
                            >
                              {artifact.modelSlug}
                              {artifact.billing?.debitedCredits
                                ? ` · ${artifact.billing.debitedCredits} credits`
                                : ""}
                            </figcaption>
                          </figure>
                        ) : artifact.type === "audio" &&
                          artifact.status === "ready" &&
                          artifact.url ? (
                          <div
                            key={artifact.id}
                            style={{
                              border: "1px solid rgba(148, 163, 184, 0.28)",
                              borderRadius: 16,
                              padding: 12,
                              background: "rgba(255,255,255,0.03)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                alignItems: "center",
                                marginBottom: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              <strong>
                                {artifact.source === "ambient_context"
                                  ? "Context-triggered voice"
                                  : "Voice reply"}
                              </strong>
                              <span style={{ fontSize: 12, opacity: 0.8 }}>
                                {artifact.provider ?? "Audio"} · {artifact.voiceName ?? artifact.modelSlug}
                                {artifact.billing?.debitedCredits
                                  ? ` · ${artifact.billing.debitedCredits} credits`
                                  : ""}
                              </span>
                            </div>
                            <audio controls preload="none" src={artifact.url} style={{ width: "100%" }} />
                            {artifact.transcript ? (
                              <p style={{ marginTop: 8, fontSize: 13, opacity: 0.82 }}>
                                {artifact.transcript}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <div
                            key={artifact.id}
                            style={{
                              border: "1px solid rgba(239, 68, 68, 0.28)",
                              borderRadius: 16,
                              padding: 12,
                            }}
                          >
                            <strong style={{ display: "block", marginBottom: 6 }}>
                              {artifact.type === "audio"
                                ? "Audio generation failed"
                                : "Image generation failed"}
                            </strong>
                            <span style={{ fontSize: 13, opacity: 0.82 }}>
                              {artifact.error ??
                                (artifact.type === "audio"
                                  ? "The audio could not be generated this time."
                                  : "The image could not be generated this time.")}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : null}
                  <span
                    className="chat-bubble-time chat-bubble-time-assistant"
                    suppressHydrationWarning
                  >
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              ) : (
                <div key={msg.id} className="chat-bubble chat-bubble-user">
                  <p>{msg.content}</p>
                  <span
                    className="chat-bubble-time chat-bubble-time-user"
                    suppressHydrationWarning
                  >
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              );
            })
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
          {playbackError ? <p className="chat-input-error">{playbackError}</p> : null}
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
