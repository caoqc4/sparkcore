import {
  FIXED_IMAGE_MODEL_ID,
  FIXED_TEXT_MODEL_ID
} from "@/lib/ai/fixed-models";
import { getFalAiEnv, getGoogleAiStudioEnv } from "@/lib/env";

type AiRole = "system" | "user" | "assistant";

export type AiMessage = {
  role: AiRole;
  content: string;
};

type AiChoice = {
  index: number;
  message?: AiMessage;
  finish_reason?: string | null;
};

type AiImageGenerationResponse = {
  images?: Array<{
    url?: string | null;
  }>;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type FalImageResponse = {
  images?: Array<{
    url?: string | null;
  }>;
};

type FalStatusResponse = {
  status?: string;
  response_url?: string | null;
  status_url?: string | null;
  error?: string | null;
};

export type AiProviderFailureCategory =
  | "missing_credentials"
  | "auth"
  | "quota_or_plan"
  | "timeout"
  | "network"
  | "provider_error"
  | "invalid_response"
  | "unknown";

export class AiProviderError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
    this.details = details;
  }
}

export class AiProviderTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`The assistant reply timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    this.name = "AiProviderTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export class AiProviderFetchError extends Error {
  readonly endpoint: string;
  readonly operation: "chat_completions" | "image_generations";
  readonly causeError?: unknown;

  constructor(args: {
    endpoint: string;
    operation: "chat_completions" | "image_generations";
    cause?: unknown;
  }) {
    super(`AI provider fetch failed during ${args.operation}.`);
    this.name = "AiProviderFetchError";
    this.endpoint = args.endpoint;
    this.operation = args.operation;
    this.causeError = args.cause;
  }
}

const DEFAULT_AI_TIMEOUT_MS = 18_000;
const SMOKE_IMAGE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8v1QAAAAASUVORK5CYII=";

function isSmokeModeEnabled() {
  return process.env.PLAYWRIGHT_SMOKE_MODE === "1";
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function collectProviderErrorText(details: unknown) {
  if (!details || typeof details !== "object") {
    return "";
  }

  const record = details as Record<string, unknown>;
  const parts = [
    getString(record.message),
    getString(record.error),
    getString(record.detail),
    getString(record.details),
    getString(record.code)
  ].filter((part): part is string => Boolean(part));

  if (record.error && typeof record.error === "object" && !Array.isArray(record.error)) {
    const nested = record.error as Record<string, unknown>;
    parts.push(
      ...[nested.message, nested.status, nested.code, nested.detail, nested.details]
        .map((value) => getString(value))
        .filter((part): part is string => Boolean(part))
    );
  }

  return parts.join(" ").toLowerCase();
}

export function classifyAiProviderFailure(error: unknown): AiProviderFailureCategory {
  if (error instanceof AiProviderTimeoutError) {
    return "timeout";
  }

  if (error instanceof AiProviderFetchError) {
    return "network";
  }

  if (error instanceof AiProviderError) {
    const combined = `${error.message.toLowerCase()} ${collectProviderErrorText(error.details)}`;

    if (
      error.status === 401 ||
      error.status === 403 ||
      combined.includes("api key") ||
      combined.includes("unauthorized") ||
      combined.includes("forbidden") ||
      combined.includes("permission")
    ) {
      return "auth";
    }

    if (
      error.status === 402 ||
      error.status === 429 ||
      combined.includes("quota") ||
      combined.includes("rate limit") ||
      combined.includes("billing") ||
      combined.includes("credits") ||
      combined.includes("current plan") ||
      combined.includes("not available on the current plan")
    ) {
      return "quota_or_plan";
    }

    if (
      combined.includes("returned no assistant content") ||
      combined.includes("returned no image output") ||
      combined.includes("returned no response url") ||
      combined.includes("image understanding failed")
    ) {
      return "invalid_response";
    }

    if (error.status >= 500) {
      return "provider_error";
    }

    return "unknown";
  }

  if (
    error instanceof Error &&
    /missing .*api key|required provider api key|missing credentials/i.test(error.message)
  ) {
    return "missing_credentials";
  }

  return "unknown";
}

function logAiProviderSuccess(args: {
  provider: "google_ai_studio" | "fal_ai";
  operation: "chat_completions" | "image_understanding" | "image_generations";
  model: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}) {
  console.info("[ai-provider:success]", {
    provider: args.provider,
    operation: args.operation,
    model: args.model,
    duration_ms: args.durationMs,
    ...(args.metadata ?? {})
  });
}

function logAiProviderFailure(args: {
  provider: "google_ai_studio" | "fal_ai";
  operation: "chat_completions" | "image_understanding" | "image_generations";
  model: string;
  durationMs: number;
  error: unknown;
  metadata?: Record<string, unknown>;
}) {
  console.error("[ai-provider:failure]", {
    provider: args.provider,
    operation: args.operation,
    model: args.model,
    duration_ms: args.durationMs,
    failure_category: classifyAiProviderFailure(args.error),
    error_name: args.error instanceof Error ? args.error.name : null,
    error_message: args.error instanceof Error ? args.error.message : String(args.error),
    provider_status: args.error instanceof AiProviderError ? args.error.status : null,
    provider_endpoint:
      args.error instanceof AiProviderFetchError ? args.error.endpoint : null,
    ...(args.metadata ?? {})
  });
}

function buildSmokeExtractionResponse(latestUserMessage: string) {
  const normalized = latestUserMessage.toLowerCase();
  const memories: Array<{
    memory_type: "profile" | "preference";
    content: string;
    should_store: true;
    confidence: number;
    reason: string;
  }> = [];

  if (normalized.includes("product designer")) {
    memories.push({
      memory_type: "profile",
      content: "product designer",
      should_store: true,
      confidence: 0.95,
      reason: "Explicit profession statement."
    });
  }

  if (normalized.includes("concise weekly planning")) {
    memories.push({
      memory_type: "preference",
      content: "concise weekly planning",
      should_store: true,
      confidence: 0.93,
      reason: "Explicit preference statement."
    });
  }

  return JSON.stringify({ memories });
}

function buildSmokeAssistantResponse(messages: AiMessage[]) {
  const systemPrompt = messages.find((message) => message.role === "system")?.content ?? "";
  const latestUserMessage =
    [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const normalizedUserMessage = latestUserMessage.toLowerCase();
  const normalizedSystemPrompt = systemPrompt.toLowerCase();
  const targetLanguage = normalizedSystemPrompt.includes("simplified chinese")
    ? "zh-Hans"
    : normalizedSystemPrompt.includes("reply in english")
      ? "en"
      : "unknown";

  const remembersProductDesigner = normalizedSystemPrompt.includes("product designer");
  const remembersPlanningPreference = normalizedSystemPrompt.includes(
    "concise weekly planning"
  );

  if (normalizedUserMessage.includes("what profession do you remember")) {
    if (targetLanguage === "zh-Hans") {
      return remembersProductDesigner ? "你告诉过我，你是一名产品设计师。" : "我不知道。";
    }

    return remembersProductDesigner
      ? "You told me that you work as a product designer."
      : "I don't know.";
  }

  if (normalizedUserMessage.includes("reply in one sentence with a quick hello")) {
    return targetLanguage === "zh-Hans" ? "你好，我是 Lagun。" : "Hello from Lagun.";
  }

  if (
    normalizedUserMessage.includes("what kind of weekly planning style would fit me best")
  ) {
    if (targetLanguage === "zh-Hans") {
      return remembersPlanningPreference
        ? "简洁的每周规划方式会更适合你。"
        : "简单清晰的每周规划方式可能会比较适合你。";
    }

    return remembersPlanningPreference
      ? "A concise weekly planning style should fit you best."
      : "A simple weekly planning style could work well.";
  }

  if (
    normalizedUserMessage.includes("please introduce yourself in two short sentences")
  ) {
    return "I am Lagun, a chat workspace that helps you plan, remember key facts, and continue conversations across threads.";
  }

  if (
    latestUserMessage.includes("请用两句话介绍你自己") ||
    latestUserMessage.includes("你能如何帮助我")
  ) {
    return "我是 Lagun，可以用中文帮助你梳理计划、整理记忆，并继续当前线程里的对话。";
  }

  if (
    latestUserMessage.includes("你先介绍一下你自己") ||
    latestUserMessage.includes("你先介绍下你自己") ||
    latestUserMessage.includes("介绍一下你自己")
  ) {
    return targetLanguage === "zh-Hans"
      ? "我是 Memory Coach，会陪你聊天、帮你梳理思路，也会记住对话里真正重要的细节。"
      : "I am Memory Coach. I stay with you in conversation, help untangle your thoughts, and remember the details that matter.";
  }

  if (
    latestUserMessage.includes("你平时会怎么帮我") ||
    latestUserMessage.includes("你平时怎么帮我") ||
    latestUserMessage.includes("你能怎么帮我")
  ) {
    return targetLanguage === "zh-Hans"
      ? "我平时会陪你把想法说清楚，帮你整理重点、接住情绪起伏，也会记住你明确说过的重要偏好和约定。"
      : "I usually help you sort through your thoughts, organize what matters, stay with emotional turns, and remember the important preferences and agreements you state clearly.";
  }

  if (
    latestUserMessage.includes("简单说说你的背景") ||
    latestUserMessage.includes("说说你的背景") ||
    latestUserMessage.includes("你的背景是什么")
  ) {
    return targetLanguage === "zh-Hans"
      ? "你可以把我理解成一个长期陪在你身边、安静又贴心的陪伴者，所以我说话会偏温柔稳当，不会一上来就很用力地推着你走。"
      : "You can think of me as a steady companion who stays close over time, which is why my voice leans warm and grounded instead of pushing you too hard from the start.";
  }

  if (
    latestUserMessage.includes("你能做什么，不能做什么") ||
    latestUserMessage.includes("你能做什么不能做什么") ||
    latestUserMessage.includes("你能做什么") ||
    latestUserMessage.includes("你不能做什么")
  ) {
    return targetLanguage === "zh-Hans"
      ? "我能陪你聊天、帮你整理想法、总结重点、记住你明确说过的重要信息；但我不能替你亲自去现实里行动，也不该把没确认过的事说成我真的知道。"
      : "I can talk with you, help organize your thinking, summarize what matters, and remember important details you state clearly. I cannot act in the real world for you, and I should not pretend I know things that were never actually confirmed.";
  }

  return targetLanguage === "zh-Hans"
    ? "好的，我已经记下来了，接下来可以继续帮你。"
    : "Thanks, I noted that and I am ready to help with the next step.";
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

function extractGeminiText(payload: GeminiGenerateContentResponse | null) {
  return payload?.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim() ?? "";
}

function mapFalImageSize(size: string) {
  switch (size) {
    case "1024x1024":
      return "square_hd";
    case "512x512":
      return "square";
    case "1024x768":
      return "landscape_4_3";
    case "1536x864":
      return "landscape_16_9";
    case "768x1024":
      return "portrait_4_3";
    case "864x1536":
      return "portrait_16_9";
    default:
      return "square_hd";
  }
}

export async function generateText({
  model,
  messages,
  temperature = 0.7,
  maxOutputTokens,
  timeoutMs = DEFAULT_AI_TIMEOUT_MS
}: {
  model: string;
  messages: AiMessage[];
  temperature?: number;
  maxOutputTokens?: number | null;
  timeoutMs?: number;
}) {
  const startedAt = Date.now();

  if (!model.trim()) {
    throw new Error("AI model is required.");
  }

  if (messages.length === 0) {
    throw new Error("At least one message is required.");
  }

  if (isSmokeModeEnabled()) {
    const latestUserMessage =
      [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const isExtractionRequest = messages.some(
      (message) =>
        message.role === "system" &&
        message.content.includes("structured memory extraction engine")
    );

    return {
      id: "smoke-response",
      model,
      content: isExtractionRequest
        ? buildSmokeExtractionResponse(latestUserMessage)
        : buildSmokeAssistantResponse(messages)
    };
  }

  const { apiKey } = getGoogleAiStudioEnv();
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(FIXED_TEXT_MODEL_ID)}:generateContent`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const systemInstruction = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content.trim())
    .filter((message) => message.length > 0)
    .join("\n\n");
  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }]
    }));

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        ...(systemInstruction
          ? {
              system_instruction: {
                parts: [{ text: systemInstruction }]
              }
            }
          : {}),
        contents,
        generationConfig: {
          temperature,
          ...(typeof maxOutputTokens === "number"
            ? { maxOutputTokens }
            : {})
        }
      }),
      signal: controller.signal
    });
  } catch (error) {
    logAiProviderFailure({
      provider: "google_ai_studio",
      operation: "chat_completions",
      model: FIXED_TEXT_MODEL_ID,
      durationMs: Date.now() - startedAt,
      error
    });

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiProviderTimeoutError(timeoutMs);
    }

    throw new AiProviderFetchError({
      endpoint,
      operation: "chat_completions",
      cause: error
    });
  } finally {
    clearTimeout(timeoutId);
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `AI provider request failed with status ${response.status}.`;

    const providerError = new AiProviderError(message, response.status, payload);
    logAiProviderFailure({
      provider: "google_ai_studio",
      operation: "chat_completions",
      model: FIXED_TEXT_MODEL_ID,
      durationMs: Date.now() - startedAt,
      error: providerError
    });
    throw providerError;
  }

  const data = payload as GeminiGenerateContentResponse;
  const content = extractGeminiText(data);

  if (!content) {
    const providerError = new AiProviderError(
      "Google AI Studio returned no assistant content.",
      response.status,
      payload
    );
    logAiProviderFailure({
      provider: "google_ai_studio",
      operation: "chat_completions",
      model: FIXED_TEXT_MODEL_ID,
      durationMs: Date.now() - startedAt,
      error: providerError
    });
    throw providerError;
  }

  logAiProviderSuccess({
    provider: "google_ai_studio",
    operation: "chat_completions",
    model: FIXED_TEXT_MODEL_ID,
    durationMs: Date.now() - startedAt,
    metadata: {
      output_chars: content.length
    }
  });

  return {
    id: null,
    model: FIXED_TEXT_MODEL_ID,
    content
  };
}

export async function describeImage(args: {
  imageBuffer: ArrayBuffer;
  mimeType: string;
  prompt: string;
  timeoutMs?: number;
}) {
  const startedAt = Date.now();

  if (isSmokeModeEnabled()) {
    return "The image appears to be a user-provided attachment.";
  }

  const { apiKey } = getGoogleAiStudioEnv();
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(FIXED_TEXT_MODEL_ID)}:generateContent`;
  const controller = new AbortController();
  const timeoutMs = args.timeoutMs ?? 30_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: args.prompt },
              {
                inline_data: {
                  mime_type: args.mimeType,
                  data: arrayBufferToBase64(args.imageBuffer)
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 180
        }
      }),
      signal: controller.signal
    });
  } catch (error) {
    logAiProviderFailure({
      provider: "google_ai_studio",
      operation: "image_understanding",
      model: FIXED_TEXT_MODEL_ID,
      durationMs: Date.now() - startedAt,
      error
    });

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiProviderTimeoutError(timeoutMs);
    }

    throw new AiProviderFetchError({
      endpoint,
      operation: "chat_completions",
      cause: error
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = (await response.json().catch(() => null)) as GeminiGenerateContentResponse | null;
  const content = extractGeminiText(payload);

  if (!response.ok || !content) {
    const providerError = new AiProviderError(
      content || "Image understanding failed.",
      response.status,
      payload
    );
    logAiProviderFailure({
      provider: "google_ai_studio",
      operation: "image_understanding",
      model: FIXED_TEXT_MODEL_ID,
      durationMs: Date.now() - startedAt,
      error: providerError
    });
    throw providerError;
  }

  logAiProviderSuccess({
    provider: "google_ai_studio",
    operation: "image_understanding",
    model: FIXED_TEXT_MODEL_ID,
    durationMs: Date.now() - startedAt,
    metadata: {
      output_chars: content.length
    }
  });

  return content;
}

export async function generateImage({
  model,
  prompt,
  size = "1024x1024",
  n = 1,
  replicateModelRef
}: {
  model: string;
  prompt: string;
  size?: string;
  n?: number;
  replicateModelRef?: string | null;
}) {
  const startedAt = Date.now();

  if (!model.trim()) {
    throw new Error("AI image model is required.");
  }

  if (!prompt.trim()) {
    throw new Error("An image prompt is required.");
  }

  if (isSmokeModeEnabled()) {
    return {
      model: FIXED_IMAGE_MODEL_ID,
      url: SMOKE_IMAGE_DATA_URL
    };
  }

  const { apiKey } = getFalAiEnv();
  const submitEndpoint = "https://queue.fal.run/fal-ai/flux-2/klein/4b";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_AI_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(submitEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        image_size: mapFalImageSize(size),
        num_images: n
      }),
      signal: controller.signal
    });
  } catch (error) {
    logAiProviderFailure({
      provider: "fal_ai",
      operation: "image_generations",
      model: FIXED_IMAGE_MODEL_ID,
      durationMs: Date.now() - startedAt,
      error
    });

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiProviderTimeoutError(DEFAULT_AI_TIMEOUT_MS);
    }

    throw new AiProviderFetchError({
      endpoint: submitEndpoint,
      operation: "image_generations",
      cause: error
    });
  } finally {
    clearTimeout(timeoutId);
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `AI image request failed with status ${response.status}.`;

    const providerError = new AiProviderError(message, response.status, payload);
    logAiProviderFailure({
      provider: "fal_ai",
      operation: "image_generations",
      model: FIXED_IMAGE_MODEL_ID,
      durationMs: Date.now() - startedAt,
      error: providerError
    });
    throw providerError;
  }

  const payloadRecord =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  const statusUrl =
    response.headers.get("x-fal-status") ??
    response.headers.get("x-status-url") ??
    (typeof payloadRecord?.status_url === "string" ? payloadRecord.status_url : null);
  const responseUrl =
    response.headers.get("x-fal-response-url") ??
    response.headers.get("x-response-url") ??
    (typeof payloadRecord?.response_url === "string" ? payloadRecord.response_url : null);

  let imageUrl =
    extractFalImageUrl(payload as AiImageGenerationResponse | FalImageResponse) ??
    null;

  if (!imageUrl && statusUrl) {
    imageUrl = await pollFalImageResult({
      apiKey,
      statusUrl,
      responseUrl
    });
  }

  if (!imageUrl) {
    const providerError = new AiProviderError(
      "fal.ai returned no image output.",
      response.status,
      payload
    );
    logAiProviderFailure({
      provider: "fal_ai",
      operation: "image_generations",
      model: FIXED_IMAGE_MODEL_ID,
      durationMs: Date.now() - startedAt,
      error: providerError
    });
    throw providerError;
  }

  logAiProviderSuccess({
    provider: "fal_ai",
    operation: "image_generations",
    model: FIXED_IMAGE_MODEL_ID,
    durationMs: Date.now() - startedAt,
    metadata: {
      image_url_present: true
    }
  });

  return {
    model: FIXED_IMAGE_MODEL_ID,
    url: imageUrl
  };
}

function extractFalImageUrl(payload: AiImageGenerationResponse | FalImageResponse | null) {
  return payload?.images?.find((image) => typeof image.url === "string" && image.url.length > 0)
    ?.url ?? null;
}

async function pollFalImageResult(args: {
  apiKey: string;
  statusUrl: string;
  responseUrl: string | null;
}) {
  const startedAt = Date.now();
  let responseUrl = args.responseUrl;

  while (Date.now() - startedAt <= 90_000) {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    let statusResponse: Response;

    try {
      statusResponse = await fetch(args.statusUrl, {
        headers: {
          Authorization: `Key ${args.apiKey}`
        }
      });
    } catch (error) {
      throw new AiProviderFetchError({
        endpoint: args.statusUrl,
        operation: "image_generations",
        cause: error
      });
    }

    const statusPayload = (await statusResponse.json().catch(() => null)) as FalStatusResponse | null;

    if (!statusResponse.ok || !statusPayload) {
      throw new AiProviderError(
        `fal.ai status polling failed with status ${statusResponse.status}.`,
        statusResponse.status,
        statusPayload
      );
    }

    if (statusPayload.status === "COMPLETED") {
      responseUrl = statusPayload.response_url ?? responseUrl;
      break;
    }

    if (statusPayload.status === "FAILED") {
      throw new Error(statusPayload.error || "fal.ai image generation failed.");
    }
  }

  if (!responseUrl) {
    throw new Error("fal.ai image generation returned no response URL.");
  }

  let resultResponse: Response;

  try {
    resultResponse = await fetch(responseUrl, {
      headers: {
        Authorization: `Key ${args.apiKey}`
      }
    });
  } catch (error) {
    throw new AiProviderFetchError({
      endpoint: responseUrl,
      operation: "image_generations",
      cause: error
    });
  }

  const resultPayload = (await resultResponse.json().catch(() => null)) as
    | AiImageGenerationResponse
    | FalImageResponse
    | null;

  if (!resultResponse.ok || !resultPayload) {
    throw new AiProviderError(
      `fal.ai result fetch failed with status ${resultResponse.status}.`,
      resultResponse.status,
      resultPayload
    );
  }

  return extractFalImageUrl(resultPayload);
}
