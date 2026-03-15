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

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export async function generateText({
  model,
  messages,
  temperature = 0.7,
  maxOutputTokens
}: {
  model: string;
  messages: LiteLLMMessage[];
  temperature?: number;
  maxOutputTokens?: number | null;
}) {
  if (!model.trim()) {
    throw new Error("LiteLLM model is required.");
  }

  if (messages.length === 0) {
    throw new Error("At least one message is required.");
  }

  const { baseUrl, apiKey } = getLiteLLMEnv();
  const endpoint = `${normalizeBaseUrl(baseUrl)}/chat/completions`;

  const response = await fetch(endpoint, {
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
    })
  });

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
