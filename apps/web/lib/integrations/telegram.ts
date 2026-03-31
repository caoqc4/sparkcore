import { getAzureSpeechEnv, getLiteLLMEnv } from "@/lib/env";
import type {
  InboundChannelMessage,
  OutboundChannelMessage
} from "@/lib/integrations/im-adapter";

type TelegramUser = {
  id: number;
};

type TelegramChat = {
  id: number;
};

type TelegramPhotoSize = {
  file_id: string;
  file_unique_id?: string;
  width?: number;
  height?: number;
  file_size?: number;
};

type TelegramVoice = {
  file_id: string;
  file_unique_id?: string;
  duration?: number;
  mime_type?: string;
  file_size?: number;
};

type TelegramAudio = {
  file_id: string;
  file_unique_id?: string;
  duration?: number;
  mime_type?: string;
  file_name?: string;
  performer?: string;
  title?: string;
  file_size?: number;
};

type TelegramMessage = {
  message_id: number;
  date: number;
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
  voice?: TelegramVoice;
  audio?: TelegramAudio;
  from?: TelegramUser;
  chat: TelegramChat;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

type TelegramFile = {
  file_id: string;
  file_unique_id?: string;
  file_path?: string;
  file_size?: number;
};

type AzureFastTranscriptionResponse = {
  combinedPhrases?: Array<{
    text?: string;
    locale?: string;
  }>;
};

const TELEGRAM_VISION_MODEL = "replicate-gpt-4o-mini";

function getTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function buildTelegramArtifactId(args: {
  messageId: number;
  kind: "image" | "voice" | "audio";
}) {
  return `telegram-${args.kind}-${args.messageId}`;
}

function getPhotoAttachment(message: TelegramMessage) {
  const photo = Array.isArray(message.photo) ? message.photo : [];
  const selected = photo[photo.length - 1];

  if (!selected?.file_id) {
    return null;
  }

  return {
    kind: "image" as const,
    mime_type: "image/jpeg",
    metadata: {
      artifact_id: buildTelegramArtifactId({
        messageId: message.message_id,
        kind: "image"
      }),
      telegram_kind: "photo",
      telegram_file_id: selected.file_id,
      telegram_file_unique_id: selected.file_unique_id ?? null,
      width: selected.width ?? null,
      height: selected.height ?? null,
      file_size: selected.file_size ?? null,
      display_label: "Photo"
    }
  };
}

function getVoiceAttachment(message: TelegramMessage) {
  if (!message.voice?.file_id) {
    return null;
  }

  return {
    kind: "audio" as const,
    mime_type: message.voice.mime_type ?? "audio/ogg",
    metadata: {
      artifact_id: buildTelegramArtifactId({
        messageId: message.message_id,
        kind: "voice"
      }),
      telegram_kind: "voice",
      telegram_file_id: message.voice.file_id,
      telegram_file_unique_id: message.voice.file_unique_id ?? null,
      duration_seconds: message.voice.duration ?? null,
      file_size: message.voice.file_size ?? null,
      display_label: "Voice note"
    }
  };
}

function getAudioAttachment(message: TelegramMessage) {
  if (!message.audio?.file_id) {
    return null;
  }

  return {
    kind: "audio" as const,
    mime_type: message.audio.mime_type ?? "audio/mpeg",
    metadata: {
      artifact_id: buildTelegramArtifactId({
        messageId: message.message_id,
        kind: "audio"
      }),
      telegram_kind: "audio",
      telegram_file_id: message.audio.file_id,
      telegram_file_unique_id: message.audio.file_unique_id ?? null,
      duration_seconds: message.audio.duration ?? null,
      file_size: message.audio.file_size ?? null,
      file_name: message.audio.file_name ?? null,
      performer: message.audio.performer ?? null,
      title: message.audio.title ?? null,
      display_label: message.audio.title ?? message.audio.file_name ?? "Audio file"
    }
  };
}

export function normalizeTelegramUpdate(
  update: TelegramUpdate
): InboundChannelMessage | null {
  const message = update.message;

  if (!message?.from) {
    return null;
  }

  const text = getTrimmedString(message.text);
  if (text) {
    return {
      platform: "telegram",
      event_id: String(update.update_id),
      channel_id: String(message.chat.id),
      peer_id: String(message.from.id),
      platform_user_id: String(message.from.id),
      message_id: String(message.message_id),
      message_type: "text",
      content: text,
      timestamp: new Date(message.date * 1000).toISOString(),
      raw_event: update
    };
  }

  const caption = getTrimmedString(message.caption);
  const photoAttachment = getPhotoAttachment(message);
  if (photoAttachment) {
    return {
      platform: "telegram",
      event_id: String(update.update_id),
      channel_id: String(message.chat.id),
      peer_id: String(message.from.id),
      platform_user_id: String(message.from.id),
      message_id: String(message.message_id),
      message_type: "image",
      content: caption ?? "Photo",
      attachments: [photoAttachment],
      timestamp: new Date(message.date * 1000).toISOString(),
      raw_event: update,
      metadata: {
        telegram_media_kind: "photo",
        caption_present: Boolean(caption)
      }
    };
  }

  const voiceAttachment = getVoiceAttachment(message);
  if (voiceAttachment) {
    return {
      platform: "telegram",
      event_id: String(update.update_id),
      channel_id: String(message.chat.id),
      peer_id: String(message.from.id),
      platform_user_id: String(message.from.id),
      message_id: String(message.message_id),
      message_type: "attachment",
      content: caption ?? "Voice message",
      attachments: [voiceAttachment],
      timestamp: new Date(message.date * 1000).toISOString(),
      raw_event: update,
      metadata: {
        telegram_media_kind: "voice",
        caption_present: Boolean(caption)
      }
    };
  }

  const audioAttachment = getAudioAttachment(message);
  if (audioAttachment) {
    return {
      platform: "telegram",
      event_id: String(update.update_id),
      channel_id: String(message.chat.id),
      peer_id: String(message.from.id),
      platform_user_id: String(message.from.id),
      message_id: String(message.message_id),
      message_type: "attachment",
      content: caption ?? "Audio file",
      attachments: [audioAttachment],
      timestamp: new Date(message.date * 1000).toISOString(),
      raw_event: update,
      metadata: {
        telegram_media_kind: "audio",
        caption_present: Boolean(caption)
      }
    };
  }

  return null;
}

export function isValidTelegramWebhookSecret(args: {
  headerValue: string | null;
  configuredSecret: string | null;
}) {
  if (!args.configuredSecret) {
    return true;
  }

  return args.headerValue === args.configuredSecret;
}

export function isTelegramInvalidBindingDescription(description: string | null | undefined) {
  if (!description) {
    return false;
  }

  const normalized = description.toLowerCase();

  return (
    normalized.includes("chat not found") ||
    normalized.includes("user not found") ||
    normalized.includes("bot was blocked by the user") ||
    normalized.includes("forbidden: bot was blocked") ||
    normalized.includes("forbidden: user is deactivated") ||
    normalized.includes("have no rights to send a message")
  );
}

export function isTelegramInvalidDeliveryResponse(response: {
  ok: boolean;
  body: unknown;
}) {
  if (response.ok) {
    return false;
  }

  const body =
    response.body && typeof response.body === "object" && !Array.isArray(response.body)
      ? (response.body as Record<string, unknown>)
      : null;
  const description =
    typeof body?.description === "string" ? body.description : null;

  return isTelegramInvalidBindingDescription(description);
}

export async function sendTelegramOutboundMessages(args: {
  botToken: string;
  messages: OutboundChannelMessage[];
}) {
  const responses: Array<{
    chat_id: string;
    ok: boolean;
    status: number;
    body: unknown;
  }> = [];

  function getFirstAttachment(message: OutboundChannelMessage) {
    return Array.isArray(message.attachments) ? message.attachments[0] ?? null : null;
  }

  function parseDataUrl(url: string) {
    const match = /^data:([^;]+);base64,([\s\S]+)$/.exec(url);
    if (!match) {
      return null;
    }

    return {
      mimeType: match[1],
      buffer: Buffer.from(match[2], "base64")
    };
  }

  async function buildFileUpload(args: {
    url: string;
    fallbackMimeType: string;
    fallbackFilename: string;
  }) {
    const dataUrl = parseDataUrl(args.url);
    if (dataUrl) {
      return {
        mimeType: dataUrl.mimeType,
        buffer: dataUrl.buffer,
      };
    }

    const response = await fetch(args.url, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch outbound attachment (${response.status}) from ${args.url}`
      );
    }

    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim() ||
      args.fallbackMimeType;
    const arrayBuffer = await response.arrayBuffer();

    return {
      mimeType: contentType,
      buffer: Buffer.from(arrayBuffer),
      filename: args.fallbackFilename,
    };
  }

  for (const message of args.messages) {
    try {
      if (message.message_type === "text") {
        const response = await fetch(
          `https://api.telegram.org/bot${args.botToken}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              chat_id: message.channel_id,
              text: message.content
            })
          }
        );
        const body = await response.json().catch(() => null);

        responses.push({
          chat_id: message.channel_id,
          ok: response.ok,
          status: response.status,
          body
        });
        continue;
      }

      const attachment = getFirstAttachment(message);
      if (!attachment?.url) {
        responses.push({
          chat_id: message.channel_id,
          ok: false,
          status: 400,
          body: {
            error: "missing_attachment_url",
            message_type: message.message_type
          }
        });
        continue;
      }

      if (message.message_type === "image" && attachment.kind === "image") {
        const upload = await buildFileUpload({
          url: attachment.url,
          fallbackMimeType: "image/jpeg",
          fallbackFilename: "sparkcore-image.jpg",
        });
        const form = new FormData();
        form.set("chat_id", message.channel_id);
        form.set(
          "photo",
          new Blob([upload.buffer], { type: upload.mimeType }),
          upload.filename ?? "sparkcore-image.jpg"
        );

        const response = await fetch(
          `https://api.telegram.org/bot${args.botToken}/sendPhoto`,
          {
            method: "POST",
            body: form
          }
        );
        const body = await response.json().catch(() => null);

        responses.push({
          chat_id: message.channel_id,
          ok: response.ok,
          status: response.status,
          body
        });
        continue;
      }

      if (message.message_type === "attachment" && attachment.kind === "audio") {
        const dataUrl = parseDataUrl(attachment.url);
        const contentType =
          typeof attachment.metadata?.content_type === "string"
            ? attachment.metadata.content_type
            : dataUrl?.mimeType ?? "audio/mpeg";
        const apiMethod =
          contentType.includes("ogg") || contentType.includes("opus")
            ? "sendVoice"
            : "sendAudio";

        const upload = await buildFileUpload({
          url: attachment.url,
          fallbackMimeType: contentType,
          fallbackFilename:
            apiMethod === "sendVoice" ? "sparkcore-voice.ogg" : "sparkcore-audio.mp3",
        });
        const form = new FormData();
        form.set("chat_id", message.channel_id);
        form.set(
          apiMethod === "sendVoice" ? "voice" : "audio",
          new Blob([upload.buffer], { type: upload.mimeType }),
          upload.filename ??
            (apiMethod === "sendVoice" ? "sparkcore-voice.ogg" : "sparkcore-audio.mp3")
        );

        const response = await fetch(
          `https://api.telegram.org/bot${args.botToken}/${apiMethod}`,
          {
            method: "POST",
            body: form
          }
        );
        const body = await response.json().catch(() => null);

        responses.push({
          chat_id: message.channel_id,
          ok: response.ok,
          status: response.status,
          body
        });
        continue;
      }

      responses.push({
        chat_id: message.channel_id,
        ok: false,
        status: 400,
        body: {
          error: "unsupported_message_type",
          message_type: message.message_type,
          attachment_kind: attachment.kind
        }
      });
    } catch (error) {
      responses.push({
        chat_id: message.channel_id,
        ok: false,
        status: 500,
        body: {
          error: "telegram_delivery_failed",
          message: error instanceof Error ? error.message : "unknown_delivery_error"
        }
      });
    }
  }

  return responses;
}

export async function resolveTelegramFileDownloadResponse(args: {
  botToken: string;
  fileId: string;
}) {
  const fileResponse = await fetch(
    `https://api.telegram.org/bot${args.botToken}/getFile?file_id=${encodeURIComponent(args.fileId)}`,
    {
      cache: "no-store"
    }
  );

  const payload = (await fileResponse.json().catch(() => null)) as TelegramApiResponse<TelegramFile> | null;

  if (!fileResponse.ok || !payload?.ok || !payload.result?.file_path) {
    const description = payload?.description ?? "Unknown Telegram file lookup error.";
    throw new Error(`Telegram getFile failed: ${description}`);
  }

  return fetch(
    `https://api.telegram.org/file/bot${args.botToken}/${payload.result.file_path}`,
    {
      cache: "no-store"
    }
  );
}

function inferFileExtension(args: {
  mimeType: string | null;
  fileName?: string | null;
  fallback: string;
}) {
  const normalizedMime = args.mimeType?.toLowerCase() ?? "";

  if (args.fileName && args.fileName.includes(".")) {
    return args.fileName.split(".").pop() ?? args.fallback;
  }

  if (normalizedMime.includes("ogg")) {
    return "ogg";
  }
  if (normalizedMime.includes("mpeg") || normalizedMime.includes("mp3")) {
    return "mp3";
  }
  if (normalizedMime.includes("wav")) {
    return "wav";
  }
  if (normalizedMime.includes("webm")) {
    return "webm";
  }
  if (normalizedMime.includes("jpeg")) {
    return "jpg";
  }
  if (normalizedMime.includes("png")) {
    return "png";
  }

  return args.fallback;
}

function arrayBufferToDataUrl(args: {
  buffer: ArrayBuffer;
  mimeType: string;
}) {
  const base64 = Buffer.from(args.buffer).toString("base64");
  return `data:${args.mimeType};base64,${base64}`;
}

async function describeTelegramImage(args: {
  imageBuffer: ArrayBuffer;
  mimeType: string;
  caption: string | null;
}) {
  const { baseUrl, apiKey } = getLiteLLMEnv();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(
      `${normalizeBaseUrl(baseUrl)}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: TELEGRAM_VISION_MODEL,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: [
                    "The user sent an image in Telegram.",
                    args.caption ? `User caption: ${args.caption}` : "There is no user caption.",
                    "Describe only the details that matter for continuing the conversation.",
                    "Keep it concise and grounded in what is actually visible."
                  ].join("\n")
                },
                {
                  type: "image_url",
                  image_url: {
                    url: arrayBufferToDataUrl({
                      buffer: args.imageBuffer,
                      mimeType: args.mimeType
                    }),
                    detail: "low"
                  }
                }
              ]
            }
          ],
          temperature: 0.2,
          max_tokens: 180
        }),
        signal: controller.signal
      }
    );

    const payload = await response.json().catch(() => null);
    const content =
      typeof payload?.choices?.[0]?.message?.content === "string"
        ? payload.choices[0].message.content.trim()
        : null;

    if (!response.ok || !content) {
      throw new Error(
        typeof payload?.error?.message === "string"
          ? payload.error.message
          : "Image understanding failed."
      );
    }

    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function transcribeTelegramAudio(args: {
  audioBuffer: ArrayBuffer;
  mimeType: string;
  fileName?: string | null;
}) {
  const { apiKey, region } = getAzureSpeechEnv();
  const form = new FormData();
  const extension = inferFileExtension({
    mimeType: args.mimeType,
    fileName: args.fileName,
    fallback: "ogg"
  });
  const fileName = `telegram-input.${extension}`;
  const blob = new Blob([args.audioBuffer], {
    type: args.mimeType || "application/octet-stream"
  });

  form.set("audio", blob, fileName);
  form.set(
    "definition",
    JSON.stringify({
      locales: ["zh-CN", "en-US"],
      profanityFilterMode: "Masked"
    })
  );

  const response = await fetch(
    `https://${region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2025-10-15`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey
      },
      body: form,
      cache: "no-store"
    }
  );

  const payload = (await response.json().catch(() => null)) as AzureFastTranscriptionResponse | null;
  const transcript = payload?.combinedPhrases
    ?.map((item) => (typeof item.text === "string" ? item.text.trim() : ""))
    .filter((item) => item.length > 0)
    .join(" ")
    .trim();

  if (!response.ok || !transcript) {
    throw new Error("Audio transcription failed.");
  }

  return transcript;
}

function getPrimaryAttachment(
  inbound: InboundChannelMessage
) {
  return Array.isArray(inbound.attachments) ? inbound.attachments[0] ?? null : null;
}

export async function enrichTelegramInboundMessage(args: {
  botToken: string;
  inbound: InboundChannelMessage;
}) {
  const attachment = getPrimaryAttachment(args.inbound);
  if (!attachment) {
    return args.inbound;
  }

  const metadata =
    attachment.metadata && typeof attachment.metadata === "object" && !Array.isArray(attachment.metadata)
      ? { ...(attachment.metadata as Record<string, unknown>) }
      : {};
  const fileId = getTrimmedString(metadata.telegram_file_id);
  if (!fileId) {
    return args.inbound;
  }

  const enrichedInbound: InboundChannelMessage = {
    ...args.inbound,
    metadata: {
      ...(args.inbound.metadata ?? {})
    },
    attachments: [
      {
        ...attachment,
        metadata
      },
      ...(args.inbound.attachments?.slice(1) ?? [])
    ]
  };

  try {
    const fileResponse = await resolveTelegramFileDownloadResponse({
      botToken: args.botToken,
      fileId
    });

    if (!fileResponse.ok) {
      return enrichedInbound;
    }

    const buffer = await fileResponse.arrayBuffer();
    const responseMimeType =
      fileResponse.headers.get("Content-Type") ??
      attachment.mime_type ??
      "application/octet-stream";

    if (attachment.kind === "image") {
      const caption = getTrimmedString(args.inbound.content);
      const summary = await describeTelegramImage({
        imageBuffer: buffer,
        mimeType: responseMimeType,
        caption
      });

      metadata.analysis_summary = summary;
      metadata.analysis_model = TELEGRAM_VISION_MODEL;

      const visibleContent = caption ?? "Photo";
      const runtimeContent = caption
        ? `${caption}\n\n[Image context: ${summary}]`
        : `[The user sent an image on Telegram. Visible image details: ${summary}]`;

      return {
        ...enrichedInbound,
        content: runtimeContent,
        metadata: {
          ...(enrichedInbound.metadata ?? {}),
          display_content: visibleContent,
          image_analysis_summary: summary
        },
        attachments: [
          {
            ...attachment,
            mime_type: responseMimeType,
            metadata
          },
          ...(args.inbound.attachments?.slice(1) ?? [])
        ]
      };
    }

    if (attachment.kind === "audio") {
      const transcript = await transcribeTelegramAudio({
        audioBuffer: buffer,
        mimeType: responseMimeType,
        fileName: getTrimmedString(metadata.file_name)
      });

      metadata.transcript = transcript;

      return {
        ...enrichedInbound,
        content: transcript,
        metadata: {
          ...(enrichedInbound.metadata ?? {}),
          display_content: transcript,
          transcribed_from_audio: true
        },
        attachments: [
          {
            ...attachment,
            mime_type: responseMimeType,
            metadata
          },
          ...(args.inbound.attachments?.slice(1) ?? [])
        ]
      };
    }

    return enrichedInbound;
  } catch (error) {
    return {
      ...enrichedInbound,
      metadata: {
        ...(enrichedInbound.metadata ?? {}),
        attachment_enrichment_error:
          error instanceof Error ? error.message : "telegram_attachment_enrichment_failed"
      }
    };
  }
}
