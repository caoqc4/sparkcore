"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
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

type ComposerAttachment = {
  id: string;
  file: File;
  url: string;
  kind: "image" | "audio";
  label?: string;
};

const MAX_COMPOSER_IMAGES = 3;
const THREAD_LAST_SEEN_STORAGE_KEY_PREFIX = "sparkcore:thread-last-seen:";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateDivider(iso: string) {
  const date = new Date(iso);
  const today = startOfDay(new Date());
  const targetDay = startOfDay(date);
  const diffDays = Math.round(
    (today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  const sameYear = today.getFullYear() === targetDay.getFullYear();

  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

function getThreadLastSeenStorageKey(threadId: string) {
  return `${THREAD_LAST_SEEN_STORAGE_KEY_PREFIX}${threadId}`;
}

function buildMessageFingerprint(message: ChatThreadProps["messages"][number]) {
  const artifacts = Array.isArray(message.metadata?.artifacts) ? message.metadata.artifacts : [];
  const artifactFingerprint = artifacts
    .map((artifact) => {
      if (!artifact || typeof artifact !== "object") {
        return "invalid";
      }

      const record = artifact as Record<string, unknown>;
      return [
        typeof record.id === "string" ? record.id : "",
        typeof record.type === "string" ? record.type : "",
        typeof record.status === "string" ? record.status : "",
        typeof record.url === "string" ? record.url : "",
        typeof record.error === "string" ? record.error : ""
      ].join(":");
    })
    .join("|");

  return [
    message.id,
    message.status,
    message.content,
    artifactFingerprint
  ].join("::");
}

function getMessageSource(message: ChatThreadProps["messages"][number]) {
  return typeof message.metadata?.source === "string" ? message.metadata.source : null;
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
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

function getVisibleMessageContent(message: ChatThreadProps["messages"][number]) {
  const adapterMetadata =
    message.metadata?.adapter_metadata &&
    typeof message.metadata.adapter_metadata === "object" &&
    !Array.isArray(message.metadata.adapter_metadata)
      ? (message.metadata.adapter_metadata as Record<string, unknown>)
      : null;

  const displayContent =
    typeof adapterMetadata?.display_content === "string"
      ? adapterMetadata.display_content
      : typeof message.metadata?.display_content === "string"
        ? message.metadata.display_content
        : null;

  return displayContent ?? message.content;
}

function shouldHideArtifactPlaceholderText(args: {
  content: string;
  artifacts: MessageArtifact[];
}) {
  if (args.artifacts.length === 0) {
    return false;
  }

  const trimmed = args.content.trim();
  if (trimmed.length === 0) {
    return true;
  }

  return (
    trimmed === "Image" ||
    trimmed === "Voice input" ||
    trimmed === "Voice message" ||
    trimmed === "Audio file" ||
    /^\d+\s+images$/i.test(trimmed)
  );
}

function shouldRenderArtifactsBeforeText(args: {
  role: "user" | "assistant";
  artifacts: MessageArtifact[];
}) {
  return (
    args.role === "assistant" &&
    args.artifacts.some((artifact) => artifact.source === "intent")
  );
}

function shouldHideAssistantTextForAudioArtifact(args: {
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  artifacts: MessageArtifact[];
}) {
  if (args.role !== "assistant") {
    return false;
  }

  const trimmedContent = args.content.trim();
  if (trimmedContent.length === 0) {
    return false;
  }

  const readyIntentAudio = args.artifacts.find(
    (artifact) =>
      artifact.type === "audio" &&
      artifact.status === "ready" &&
      artifact.source === "intent" &&
      typeof artifact.transcript === "string" &&
      artifact.transcript.trim().length > 0
  );

  if (readyIntentAudio?.transcript?.trim() === trimmedContent) {
    return true;
  }

  const imDelivery =
    args.metadata?.im_delivery &&
    typeof args.metadata.im_delivery === "object" &&
    !Array.isArray(args.metadata.im_delivery)
      ? (args.metadata.im_delivery as Record<string, unknown>)
      : null;
  const source = typeof args.metadata?.source === "string" ? args.metadata.source : null;
  const artifactGenerationStatus =
    typeof imDelivery?.artifact_generation_status === "string"
      ? imDelivery.artifact_generation_status
      : null;
  const artifactFirst =
    typeof imDelivery?.explicit_media_delivery_mode === "string" &&
    imDelivery.explicit_media_delivery_mode === "artifact_first";
  const explicitAudioRequested = imDelivery?.explicit_audio_requested === true;

  return (
    source === "im" &&
    artifactFirst &&
    explicitAudioRequested &&
    args.artifacts.every((artifact) => artifact.type !== "audio" || artifact.status !== "ready") &&
    (artifactGenerationStatus === "running" || artifactGenerationStatus === "scheduled")
  );
}

function buildImageGridLayout(count: number) {
  if (count <= 1) {
    return {
      columns: "1fr",
      maxWidth: 280
    };
  }

  if (count === 2) {
    return {
      columns: "repeat(2, minmax(0, 1fr))",
      maxWidth: 420
    };
  }

  return {
    columns: "repeat(2, minmax(0, 1fr))",
    maxWidth: 420
  };
}

function renderArtifactGallery(args: {
  artifacts: MessageArtifact[];
  tone: "user" | "assistant";
}) {
  const imageArtifacts = args.artifacts.filter(
    (artifact) => artifact.type === "image" && artifact.status === "ready" && artifact.url
  );
  const audioArtifacts = args.artifacts.filter(
    (artifact) => artifact.type === "audio" && artifact.status === "ready" && artifact.url
  );
  const failedArtifacts = args.artifacts.filter((artifact) => artifact.status !== "ready");
  const imageLayout = buildImageGridLayout(imageArtifacts.length);
  const imageBorder =
    args.tone === "user"
      ? "1px solid rgba(255,255,255,0.22)"
      : "1px solid rgba(148, 163, 184, 0.28)";
  const imageSurface =
    args.tone === "user" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)";

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        marginTop: 12
      }}
    >
      {imageArtifacts.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: imageLayout.columns,
            maxWidth: imageLayout.maxWidth,
            width: "100%"
          }}
        >
          {imageArtifacts.map((artifact, index) => {
            const shouldSpanFullWidth =
              imageArtifacts.length === 3 && index === 2;

            return (
              <figure
                key={artifact.id}
                style={{
                  margin: 0,
                  border: imageBorder,
                  borderRadius: 18,
                  overflow: "hidden",
                  background: imageSurface,
                  minHeight: 120,
                  ...(shouldSpanFullWidth ? { gridColumn: "1 / -1" } : {})
                }}
              >
                <img
                  alt={artifact.alt}
                  src={artifact.url ?? undefined}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    minHeight: shouldSpanFullWidth ? 180 : 140,
                    objectFit: "cover"
                  }}
                />
              </figure>
            );
          })}
        </div>
      ) : null}

      {audioArtifacts.map((artifact) => (
        <div
          key={artifact.id}
          style={{
            border:
              args.tone === "user"
                ? "1px solid rgba(255,255,255,0.22)"
                : "1px solid rgba(148, 163, 184, 0.28)",
            borderRadius: 16,
            padding: 12,
            background: imageSurface,
            maxWidth: 420
          }}
        >
          <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.82 }}>
            {artifact.provider ?? "Audio"} · {artifact.voiceName ?? artifact.modelSlug}
          </div>
          <audio controls preload="none" src={artifact.url ?? undefined} style={{ width: "100%" }} />
          {args.tone === "assistant" && artifact.transcript ? (
            <p style={{ marginTop: 8, fontSize: 13, opacity: 0.82 }}>
              {artifact.transcript}
            </p>
          ) : null}
        </div>
      ))}

      {failedArtifacts.map((artifact) => (
        <div
          key={artifact.id}
          style={{
            border: "1px solid rgba(239, 68, 68, 0.28)",
            borderRadius: 16,
            padding: 12
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>
            {artifact.type === "audio" ? "Audio generation failed" : "Image generation failed"}
          </strong>
          <span style={{ fontSize: 13, opacity: 0.82 }}>
            {artifact.error ??
              (artifact.type === "audio"
                ? "The audio could not be generated this time."
                : "The image could not be generated this time.")}
          </span>
        </div>
      ))}
    </div>
  );
}

function shouldHideMessage(message: ChatThreadProps["messages"][number]) {
  const trimmedContent = message.content.trim();
  const source =
    typeof message.metadata?.source === "string" ? message.metadata.source : null;

  if (message.role !== "assistant") {
    return false;
  }

  if (trimmedContent.length > 0) {
    return false;
  }

  return source === "im" && (message.status === "pending" || message.status === "failed");
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
  const offlineDividerRef = useRef<HTMLDivElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState(messages);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<ComposerAttachment[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<ComposerAttachment | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedAudioChunksRef = useRef<Blob[]>([]);
  const selectedImagesRef = useRef<ComposerAttachment[]>([]);
  const selectedAudioRef = useRef<ComposerAttachment | null>(null);
  const latestVisibleTimestampRef = useRef<number | null>(null);
  const pollInFlightRef = useRef(false);
  const sessionStartedAtRef = useRef(Date.now());
  const latestMessageFingerprintRef = useRef(
    messages.map((message) => buildMessageFingerprint(message)).join("|")
  );
  const [offlineSeenCutoff, setOfflineSeenCutoff] = useState<number | null>(null);
  const [hasDismissedOfflineJump, setHasDismissedOfflineJump] = useState(false);

  const visibleMessages = optimisticMessages.filter((m) => !shouldHideMessage(m));
  const lastVisibleMessageId = visibleMessages[visibleMessages.length - 1]?.id ?? "";
  const firstOfflineSyncedMessageId =
    offlineSeenCutoff === null
      ? null
      : (() => {
          const sessionStartedAt = sessionStartedAtRef.current;
          const hasOfflineImMessages = visibleMessages.some((message) => {
            const createdAt = new Date(message.createdAt).getTime();
            return (
              getMessageSource(message) === "im" &&
              createdAt > offlineSeenCutoff &&
              createdAt <= sessionStartedAt
            );
          });

          if (!hasOfflineImMessages) {
            return null;
          }

          const firstMessage = visibleMessages.find((message) => {
            const createdAt = new Date(message.createdAt).getTime();
            return createdAt > offlineSeenCutoff && createdAt <= sessionStartedAt;
          });

          return firstMessage?.id ?? null;
        })();

  // Detect IM-sourced message waiting for a reply, with two safety checks:
  // 1. The last message overall (including hidden) must not be a settled assistant message
  //    (handles the case where processing failed and the failed placeholder is hidden)
  // 2. The last user message must be recent enough (handles stuck-pending if the server was killed)
  const IM_REPLY_TIMEOUT_MS = 3 * 60 * 1000;
  const lastOverallMessage = optimisticMessages[optimisticMessages.length - 1];
  const lastVisibleIsImUser =
    visibleMessages.length > 0 &&
    visibleMessages[visibleMessages.length - 1]?.role === "user" &&
    visibleMessages[visibleMessages.length - 1]?.metadata?.source === "im";
  const lastVisibleUserAge = lastVisibleIsImUser
    ? Date.now() - new Date(visibleMessages[visibleMessages.length - 1].createdAt).getTime()
    : Infinity;
  const lastAssistantIsSettled =
    lastOverallMessage?.role === "assistant" &&
    (lastOverallMessage.status === "completed" || lastOverallMessage.status === "failed");
  const imMessageInFlight =
    !isPending &&
    lastVisibleIsImUser &&
    lastVisibleUserAge < IM_REPLY_TIMEOUT_MS &&
    !lastAssistantIsSettled;

  // Scroll to bottom when the last visible message changes or pending state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lastVisibleMessageId, isPending]);

  // Sync server messages on refresh
  useEffect(() => {
    setOptimisticMessages(messages);
    latestMessageFingerprintRef.current = messages
      .map((message) => buildMessageFingerprint(message))
      .join("|");
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawValue = window.localStorage.getItem(
        getThreadLastSeenStorageKey(threadId)
      );
      const parsedValue = rawValue ? Number(rawValue) : Number.NaN;
      setOfflineSeenCutoff(Number.isFinite(parsedValue) ? parsedValue : null);
    } catch {
      setOfflineSeenCutoff(null);
    }
  }, [threadId]);

  useEffect(() => {
    setHasDismissedOfflineJump(false);
  }, [firstOfflineSyncedMessageId]);

  useEffect(() => {
    if (visibleMessages.length === 0) {
      latestVisibleTimestampRef.current = null;
      return;
    }

    const latestVisibleTimestamp = new Date(
      visibleMessages[visibleMessages.length - 1].createdAt
    ).getTime();

    latestVisibleTimestampRef.current = Number.isFinite(latestVisibleTimestamp)
      ? latestVisibleTimestamp
      : null;
  }, [visibleMessages]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncMessagesIfVisible = async () => {
      if (
        document.visibilityState !== "visible" ||
        isPending ||
        pollInFlightRef.current
      ) {
        return;
      }

      pollInFlightRef.current = true;

      try {
        const response = await fetch(
          `/api/chat/thread-messages?threadId=${encodeURIComponent(threadId)}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin"
          }
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          messages?: ChatThreadProps["messages"];
        };
        const nextMessages = Array.isArray(payload.messages) ? payload.messages : [];
        const nextFingerprint = nextMessages
          .map((message) => buildMessageFingerprint(message))
          .join("|");

        if (
          nextMessages.length > 0 &&
          nextFingerprint !== latestMessageFingerprintRef.current
        ) {
          latestMessageFingerprintRef.current = nextFingerprint;
          setOptimisticMessages(nextMessages);
        }
      } catch {
        // Silent polling should not surface transient refresh errors to the chat UI.
      } finally {
        pollInFlightRef.current = false;
      }
    };

    const pollInterval = imMessageInFlight ? 2000 : 5000;
    const intervalId = window.setInterval(() => {
      void syncMessagesIfVisible();
    }, pollInterval);
    const handleFocus = () => {
      void syncMessagesIfVisible();
    };
    const handleVisibilityChange = () => {
      void syncMessagesIfVisible();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPending, imMessageInFlight, threadId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const persistLastSeen = () => {
      if (latestVisibleTimestampRef.current === null) {
        return;
      }

      try {
        window.localStorage.setItem(
          getThreadLastSeenStorageKey(threadId),
          String(latestVisibleTimestampRef.current)
        );
      } catch {
        // Ignore storage failures; this is only for lightweight unread affordances.
      }
    };

    window.addEventListener("pagehide", persistLastSeen);

    return () => {
      persistLastSeen();
      window.removeEventListener("pagehide", persistLastSeen);
    };
  }, [threadId]);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    selectedAudioRef.current = selectedAudio;
  }, [selectedAudio]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      selectedImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
      if (selectedAudioRef.current?.url) {
        URL.revokeObjectURL(selectedAudioRef.current.url);
      }
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!error && !playbackError) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setError(null);
      setPlaybackError(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [error, playbackError]);

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageFiles = Array.from(e.clipboardData.items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);

    if (imageFiles.length === 0) return;
    appendImages(imageFiles);
  }

  function appendImages(files: File[]) {
    setSelectedImages((current) => {
      const remainingSlots = MAX_COMPOSER_IMAGES - current.length;

      if (remainingSlots <= 0) {
        setError(`You can attach up to ${MAX_COMPOSER_IMAGES} images at a time.`);
        return current;
      }

      const acceptedFiles = files.slice(0, remainingSlots);
      const skippedCount = files.length - acceptedFiles.length;
      const nextImages = acceptedFiles.map((file, index) => ({
        id: `image-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        url: URL.createObjectURL(file),
        kind: "image" as const,
        label: file.name || "Image"
      }));

      if (skippedCount > 0) {
        setError(`You can attach up to ${MAX_COMPOSER_IMAGES} images at a time.`);
      } else {
        setError(null);
      }

      return [...current, ...nextImages];
    });
  }

  function clearSelectedImage(id: string, options?: { revokeUrl?: boolean }) {
    setSelectedImages((current) => {
      const nextImages: ComposerAttachment[] = [];

      for (const image of current) {
        if (image.id === id) {
          if (options?.revokeUrl !== false) {
            URL.revokeObjectURL(image.url);
          }
          continue;
        }

        nextImages.push(image);
      }

      return nextImages;
    });
  }

  function clearSelectedAudio(options?: { revokeUrl?: boolean }) {
    setSelectedAudio((current) => {
      if (options?.revokeUrl !== false && current?.url) {
        URL.revokeObjectURL(current.url);
      }

      return null;
    });
  }

  function handleImageSelection(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    appendImages(Array.from(files));
  }

  function handleAudioSelection(file: File | null) {
    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setSelectedAudio((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }

      return {
        id: `audio-${Date.now()}`,
        file,
        url: nextUrl,
        kind: "audio",
        label: file.name || "Voice input"
      };
    });
  }

  async function handleVoiceButtonClick() {
    setError(null);

    if (isRecordingAudio && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      return;
    }

    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedAudioChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          recordedAudioChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const extension = mimeType.includes("ogg")
          ? "ogg"
          : mimeType.includes("mpeg") || mimeType.includes("mp3")
            ? "mp3"
            : "webm";
        const blob = new Blob(recordedAudioChunksRef.current, { type: mimeType });
        const file = new File([blob], `voice-note-${Date.now()}.${extension}`, {
          type: mimeType
        });
        handleAudioSelection(file);
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
          recordedAudioChunksRef.current = [];
      });

      recorder.start();
      setIsRecordingAudio(true);
    } catch (recordingError) {
      setIsRecordingAudio(false);
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      setError(
          recordingError instanceof Error
            ? recordingError.message
            : "Microphone access was not available."
      );
    }
  }

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
    const hasAttachment = Boolean(selectedImages.length > 0 || selectedAudio);

    if (!trimmedContent && !hasAttachment) return;

    setError(null);
    trackProductEvent("supplementary_chat_send", { surface: "dashboard_chat" });

    formData.delete("image_file");
    for (const image of selectedImages) {
      formData.append("image_file", image.file);
    }

    if (selectedAudio) {
      formData.set("audio_file", selectedAudio.file);
    }

    const optimisticArtifacts: Array<MessageArtifact> = [];

    if (selectedImages.length > 0) {
      for (const image of selectedImages) {
      optimisticArtifacts.push({
        id: image.id,
        type: "image",
        status: "ready",
        modelSlug: "web-image",
        url: image.url,
        alt: trimmedContent || image.label || "Image"
      });
      }
    }

    if (selectedAudio) {
      optimisticArtifacts.push({
        id: selectedAudio.id,
        type: "audio",
        status: "ready",
        modelSlug: "web-audio",
        url: selectedAudio.url,
        provider: "Web",
        voiceName: selectedAudio.label ?? "Voice input"
      });
    }

    flushSync(() => {
      setOptimisticMessages((current) => [
        ...current,
        {
          id: `pending-user-${Date.now()}`,
          role: "user",
          content:
            trimmedContent ||
            (selectedAudio
              ? "Voice input"
              : selectedImages.length > 1
                ? `${selectedImages.length} images`
                : selectedImages.length === 1
                  ? "Image"
                  : ""),
          status: "completed",
          metadata: {
            ...(optimisticArtifacts.length > 0 ? { artifacts: optimisticArtifacts } : {}),
            ...(trimmedContent
              ? { display_content: trimmedContent }
              : selectedAudio
                ? { display_content: "Voice input" }
                : selectedImages.length > 1
                  ? { display_content: `${selectedImages.length} images` }
                  : selectedImages.length === 1
                    ? { display_content: "Image" }
                    : {})
          },
          createdAt: new Date().toISOString(),
        },
      ]);

      setSelectedImages([]);
      setSelectedAudio(null);
    });

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

  function handleJumpToOfflineMessages() {
    if (typeof window !== "undefined" && latestVisibleTimestampRef.current !== null) {
      try {
        window.localStorage.setItem(
          getThreadLastSeenStorageKey(threadId),
          String(latestVisibleTimestampRef.current)
        );
      } catch {
        // Ignore storage failures.
      }
    }

    offlineDividerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    setHasDismissedOfflineJump(true);
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
            visibleMessages
              .map((msg, index) => {
                const artifacts = getMessageArtifacts(msg.metadata);
                const previousMessage = index > 0 ? visibleMessages[index - 1] : null;
                const previousDay = previousMessage
                  ? startOfDay(new Date(previousMessage.createdAt)).getTime()
                  : null;
                const currentDay = startOfDay(new Date(msg.createdAt)).getTime();
                const shouldShowDateDivider = previousDay !== currentDay;

                return (
                  <div key={msg.id}>
                    {firstOfflineSyncedMessageId === msg.id ? (
                      <div
                        ref={offlineDividerRef}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          margin: "4px 0 12px",
                        }}
                      >
                        <div style={{ flex: 1, height: 1, background: "rgba(148, 163, 184, 0.2)" }} />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "rgba(100, 116, 139, 0.82)",
                            letterSpacing: "0.02em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          New while you were away
                        </span>
                        <div style={{ flex: 1, height: 1, background: "rgba(148, 163, 184, 0.2)" }} />
                      </div>
                    ) : null}
                    {shouldShowDateDivider ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          margin: "16px 0 8px",
                        }}
                      >
                        <div style={{ flex: 1, height: 1, background: "rgba(148, 163, 184, 0.2)" }} />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "rgba(100, 116, 139, 0.7)",
                            letterSpacing: "0.02em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDateDivider(msg.createdAt)}
                        </span>
                        <div style={{ flex: 1, height: 1, background: "rgba(148, 163, 184, 0.2)" }} />
                      </div>
                    ) : null}

                    {msg.role === "assistant" ? (
                      <div className="chat-bubble chat-bubble-assistant">
                        {(() => {
                          const visibleContent = getVisibleMessageContent(msg);
                          const artifactFirst = shouldRenderArtifactsBeforeText({
                            role: "assistant",
                            artifacts
                          });
                          const hideText = shouldHideAssistantTextForAudioArtifact({
                            role: "assistant",
                            content: visibleContent,
                            metadata: msg.metadata,
                            artifacts
                          });
                          const textNode =
                            visibleContent.trim().length > 0 && !hideText ? (
                              <p>{visibleContent}</p>
                            ) : null;
                          const artifactNode =
                            artifacts.length > 0
                              ? renderArtifactGallery({ artifacts, tone: "assistant" })
                              : null;

                          return (
                            <>
                              {artifactFirst ? artifactNode : textNode}
                              {artifactFirst ? textNode : artifactNode}
                            </>
                          );
                        })()}
                        <span
                          className="chat-bubble-time chat-bubble-time-assistant"
                          suppressHydrationWarning
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    ) : (
                      <div className="chat-bubble chat-bubble-user">
                        {(() => {
                          const visibleContent = getVisibleMessageContent(msg);
                          return visibleContent.trim().length > 0 &&
                            !shouldHideArtifactPlaceholderText({
                              content: visibleContent,
                              artifacts
                            }) ? (
                            <p>{visibleContent}</p>
                          ) : null;
                        })()}
                        {artifacts.length > 0 ? renderArtifactGallery({ artifacts, tone: "user" }) : null}
                        <span
                          className="chat-bubble-time chat-bubble-time-user"
                          suppressHydrationWarning
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
          )}

          {isPending || imMessageInFlight ? (
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
          {firstOfflineSyncedMessageId && !hasDismissedOfflineJump ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 6
              }}
            >
              <button
                type="button"
                onClick={handleJumpToOfflineMessages}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.28)",
                  background: "rgba(255,255,255,0.96)",
                  color: "rgba(71, 85, 105, 0.96)",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1,
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                  cursor: "pointer"
                }}
              >
                New messages while you were away
              </button>
            </div>
          ) : null}
          {error ? <p className="chat-input-error">{error}</p> : null}
          {playbackError ? <p className="chat-input-error">{playbackError}</p> : null}
          {selectedImages.length > 0 || selectedAudio ? (
            <div className="chat-input-image-previews">
              {selectedImages.map((selectedImage) => (
                <div key={selectedImage.id} className="chat-input-image-preview">
                  <img src={selectedImage.url} alt={selectedImage.label ?? "Selected image"} />
                  <button
                    type="button"
                    className="chat-input-image-remove"
                    onClick={() => clearSelectedImage(selectedImage.id)}
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedAudio ? (
                <div
                  style={{
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    borderRadius: 14,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.82)",
                    display: "grid",
                    gap: 8
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#475569" }}>
                      {selectedAudio.label ?? "Voice input"}
                    </span>
                    <button
                      type="button"
                      className="chat-input-image-remove"
                      onClick={() => clearSelectedAudio()}
                      aria-label="Remove audio"
                    >
                      ×
                    </button>
                  </div>
                  <audio controls preload="metadata" src={selectedAudio.url} style={{ width: "100%" }} />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="chat-input-wrap">
            <button
              type="button"
              className="chat-media-btn"
              onClick={() => imageInputRef.current?.click()}
              title="Attach image"
              aria-label="Attach image"
            >
              <ImageIcon />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              multiple
              onChange={(event) => {
                handleImageSelection(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            <textarea
              ref={textareaRef}
              className="chat-input-textarea"
              name="content"
              rows={1}
              placeholder="Message... (paste image to preview)"
              onInput={handleTextareaInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
            />
            <button
              type="button"
              className="chat-media-btn"
              onClick={() => void handleVoiceButtonClick()}
              title={isRecordingAudio ? "Stop recording" : "Record voice"}
              aria-label="Voice message"
            >
              <MicIcon />
            </button>
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
            {isRecordingAudio
              ? "Recording... tap the mic again to finish"
              : "Enter to send · Shift+Enter for new line"}
          </p>
        </div>
      </form>
    </div>
  );
}
