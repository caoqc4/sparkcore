import { getLiteLLMEnv } from "@/lib/env";

type LiteLLMRole = "system" | "user" | "assistant";

export type LiteLLMMessage = {
  role: LiteLLMRole;
  content: string;
};

type LiteLLMChoice = {
  index: number;
  message?: LiteLLMMessage;
  finish_reason?: string | null;
};

type LiteLLMChatCompletionResponse = {
  id?: string;
  model?: string;
  choices?: LiteLLMChoice[];
};

type LiteLLMImageGenerationResponse = {
  created?: number;
  data?: Array<{
    url?: string | null;
    b64_json?: string | null;
  }>;
};

type ReplicatePredictionResponse = {
  id?: string;
  status?: string;
  output?: unknown;
  error?: string | null;
  urls?: {
    get?: string;
  };
};

export class LiteLLMError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "LiteLLMError";
    this.status = status;
    this.details = details;
  }
}

export class LiteLLMTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`The assistant reply timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    this.name = "LiteLLMTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

const DEFAULT_LITELLM_TIMEOUT_MS = 18_000;

function isSmokeModeEnabled() {
  return process.env.PLAYWRIGHT_SMOKE_MODE === "1";
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

function buildSmokeAssistantResponse(messages: LiteLLMMessage[]) {
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

  return targetLanguage === "zh-Hans"
    ? "好的，我已经记下来了，接下来可以继续帮你。"
    : "Thanks, I noted that and I am ready to help with the next step.";
}

export async function generateText({
  model,
  messages,
  temperature = 0.7,
  maxOutputTokens,
  timeoutMs = DEFAULT_LITELLM_TIMEOUT_MS
}: {
  model: string;
  messages: LiteLLMMessage[];
  temperature?: number;
  maxOutputTokens?: number | null;
  timeoutMs?: number;
}) {
  if (!model.trim()) {
    throw new Error("LiteLLM model is required.");
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

  const { baseUrl, apiKey } = getLiteLLMEnv();
  const endpoint = `${normalizeBaseUrl(baseUrl)}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        ...(typeof maxOutputTokens === "number"
          ? { max_tokens: maxOutputTokens }
          : {})
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new LiteLLMTimeoutError(timeoutMs);
    }

    throw error;
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
        : `LiteLLM request failed with status ${response.status}.`;

    throw new LiteLLMError(message, response.status, payload);
  }

  const data = payload as LiteLLMChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new LiteLLMError(
      "LiteLLM returned no assistant content.",
      response.status,
      payload
    );
  }

  return {
    id: data.id ?? null,
    model: data.model ?? model,
    content
  };
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
  if (!model.trim()) {
    throw new Error("LiteLLM image model is required.");
  }

  if (!prompt.trim()) {
    throw new Error("An image prompt is required.");
  }

  const { baseUrl, apiKey } = getLiteLLMEnv();
  const endpoint = `${normalizeBaseUrl(baseUrl)}/images/generations`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_LITELLM_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        prompt,
        size,
        n
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new LiteLLMTimeoutError(DEFAULT_LITELLM_TIMEOUT_MS);
    }

    throw error;
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
        : `LiteLLM image request failed with status ${response.status}.`;

    throw new LiteLLMError(message, response.status, payload);
  }

  const data = payload as LiteLLMImageGenerationResponse;
  const firstImage = data.data?.[0];
  const imageUrl =
    typeof firstImage?.url === "string" && firstImage.url.length > 0
      ? firstImage.url
      : typeof firstImage?.b64_json === "string" && firstImage.b64_json.length > 0
        ? `data:image/png;base64,${firstImage.b64_json}`
        : null;

  if (!imageUrl) {
    if (replicateModelRef && process.env.REPLICATE_API_KEY) {
      return generateImageViaReplicate({
        replicateModelRef,
        prompt
      });
    }

    throw new LiteLLMError(
      "LiteLLM returned no image output.",
      response.status,
      payload
    );
  }

  return {
    model,
    url: imageUrl
  };
}

async function generateImageViaReplicate(args: {
  replicateModelRef: string;
  prompt: string;
}) {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    throw new Error("REPLICATE_API_KEY is required for direct image generation fallback.");
  }

  const normalizedRef = args.replicateModelRef.replace(/^replicate\//, "");
  const [owner, name] = normalizedRef.split("/");
  if (!owner || !name) {
    throw new Error(`Invalid Replicate model ref: ${args.replicateModelRef}`);
  }

  const createResponse = await fetch(
    `https://api.replicate.com/v1/models/${owner}/${name}/predictions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
        Prefer: "wait=60"
      },
      body: JSON.stringify({
        input: {
          prompt: args.prompt
        }
      })
    }
  );

  const createPayload = (await createResponse.json().catch(() => null)) as ReplicatePredictionResponse | null;

  if (!createResponse.ok || !createPayload) {
    throw new LiteLLMError(
      createPayload?.error || `Replicate image request failed with status ${createResponse.status}.`,
      createResponse.status,
      createPayload
    );
  }

  let prediction = createPayload;
  const pollUrl = prediction.urls?.get ?? null;
  const startedAt = Date.now();

  while (
    prediction.status &&
    !["succeeded", "failed", "canceled"].includes(prediction.status)
  ) {
    if (!pollUrl) {
      break;
    }

    if (Date.now() - startedAt > 90_000) {
      throw new Error("Replicate image generation timed out.");
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const pollResponse = await fetch(pollUrl, {
      headers: {
        Authorization: `Token ${apiKey}`
      }
    });
    const polledPrediction = (await pollResponse.json().catch(() => null)) as ReplicatePredictionResponse | null;

    if (!polledPrediction) {
      throw new Error("Failed to poll Replicate image generation.");
    }

    prediction = polledPrediction;
  }

  if (!prediction || prediction.status !== "succeeded") {
    throw new Error(prediction?.error || "Replicate image generation failed.");
  }

  const output = prediction.output;
  const imageUrl =
    Array.isArray(output) && typeof output[0] === "string"
      ? output[0]
      : typeof output === "string"
        ? output
        : null;

  if (!imageUrl) {
    throw new Error("Replicate image generation returned no image output.");
  }

  return {
    model: args.replicateModelRef,
    url: imageUrl
  };
}
