import { describeImage as describeImageWithGemini } from "@/lib/ai/client";
import { FIXED_TEXT_MODEL_ID } from "@/lib/ai/fixed-models";
import { getAzureSpeechEnv } from "@/lib/env";

function arrayBufferToDataUrl(args: {
  buffer: ArrayBuffer;
  mimeType: string;
}) {
  const base64 = Buffer.from(args.buffer).toString("base64");
  return `data:${args.mimeType};base64,${base64}`;
}

function getSafeName(name: string, fallback: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.replace(/[^\w.-]+/g, "-") : fallback;
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

  if (normalizedMime.includes("ogg")) return "ogg";
  if (normalizedMime.includes("mpeg") || normalizedMime.includes("mp3")) return "mp3";
  if (normalizedMime.includes("wav")) return "wav";
  if (normalizedMime.includes("webm")) return "webm";
  if (normalizedMime.includes("jpeg")) return "jpg";
  if (normalizedMime.includes("png")) return "png";

  return args.fallback;
}

async function describeAttachedImage(args: {
  imageBuffer: ArrayBuffer;
  mimeType: string;
  promptContext: string | null;
}) {
  return describeImageWithGemini({
    imageBuffer: args.imageBuffer,
    mimeType: args.mimeType,
    prompt: [
      "The user attached an image to a chat message.",
      args.promptContext
        ? `User text: ${args.promptContext}`
        : "There is no accompanying user text.",
      "Describe only the visually important details that help continue the conversation.",
      "Keep it concise, grounded, and conversational."
    ].join("\n")
  });
}

async function transcribeAudio(args: {
  file: File;
  audioBuffer: ArrayBuffer;
}) {
  const { apiKey, region } = getAzureSpeechEnv();
  const form = new FormData();
  const extension = inferFileExtension({
    mimeType: args.file.type || null,
    fileName: args.file.name || null,
    fallback: "webm"
  });

  form.set(
    "audio",
    new Blob([args.audioBuffer], {
      type: args.file.type || "application/octet-stream"
    }),
    `chat-input.${extension}`
  );
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

  const payload = await response.json().catch(() => null);
  const transcript = Array.isArray(payload?.combinedPhrases)
    ? payload.combinedPhrases
        .map((item: { text?: string }) =>
          typeof item?.text === "string" ? item.text.trim() : ""
        )
        .filter((item: string) => item.length > 0)
        .join(" ")
        .trim()
    : "";

  if (!response.ok || transcript.length === 0) {
    throw new Error("Audio transcription failed.");
  }

  return transcript;
}

export async function prepareWebMediaInput(args: {
  content: string;
  imageFiles?: File[];
  audioFile?: File | null;
}) {
  const trimmedContent = args.content.trim();
  const attachments: Array<Record<string, unknown>> = [];
  let displayContent = trimmedContent;
  const runtimeParts: string[] = trimmedContent.length > 0 ? [trimmedContent] : [];
  const imageFiles = args.imageFiles ?? [];
  const imageSummaries: string[] = [];

  for (const imageFile of imageFiles) {
    const imageBuffer = await imageFile.arrayBuffer();
    const mimeType = imageFile.type || "image/png";
    const imageUrl = arrayBufferToDataUrl({
      buffer: imageBuffer,
      mimeType
    });

    let summary: string | null = null;

    try {
      summary = await describeAttachedImage({
        imageBuffer,
        mimeType,
        promptContext: trimmedContent || null
      });
    } catch {
      summary = null;
    }

    attachments.push({
      kind: "image",
      url: imageUrl,
      mime_type: mimeType,
      metadata: {
        artifact_id: `web-image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        display_label: getSafeName(imageFile.name, "image"),
        ...(summary
          ? {
              analysis_summary: summary,
              analysis_model: FIXED_TEXT_MODEL_ID
            }
          : {})
      }
    });

    if (summary) {
      imageSummaries.push(summary);
    }
  }

  if (imageFiles.length > 0) {
    if (imageSummaries.length > 0) {
      runtimeParts.push(
        imageSummaries.length === 1
          ? trimmedContent.length > 0
            ? `[Attached image context: ${imageSummaries[0]}]`
            : `[The user attached an image. Visible details: ${imageSummaries[0]}]`
          : `[The user attached ${imageSummaries.length} images. Key visible details: ${imageSummaries.join(" | ")}]`
      );
    } else {
      runtimeParts.push(
        imageFiles.length === 1
          ? "[The user attached an image.]"
          : `[The user attached ${imageFiles.length} images.]`
      );
    }

    if (displayContent.length === 0) {
      displayContent = imageFiles.length === 1 ? "Image" : `${imageFiles.length} images`;
    }
  }

  if (args.audioFile) {
    const audioBuffer = await args.audioFile.arrayBuffer();
    const audioUrl = arrayBufferToDataUrl({
      buffer: audioBuffer,
      mimeType: args.audioFile.type || "audio/webm"
    });
    const transcript = await transcribeAudio({
      file: args.audioFile,
      audioBuffer
    });

    attachments.push({
      kind: "audio",
      url: audioUrl,
      mime_type: args.audioFile.type || "audio/webm",
      metadata: {
        artifact_id: `web-audio-${Date.now()}`,
        display_label: "Voice input",
        transcript
      }
    });

    runtimeParts.push(
      trimmedContent.length > 0
        ? `[Attached audio transcript: ${transcript}]`
        : transcript
    );

    if (displayContent.length === 0) {
      displayContent = transcript;
    }
  }

  return {
    displayContent,
    runtimeContent: runtimeParts.join("\n\n").trim(),
    metadata:
      attachments.length > 0
        ? {
            attachments,
            display_content: displayContent
          }
        : null
  };
}
