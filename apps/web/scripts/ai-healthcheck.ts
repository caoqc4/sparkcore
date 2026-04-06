import {
  FIXED_IMAGE_MODEL_ID,
  FIXED_IMAGE_MODEL_NAME,
  FIXED_TEXT_MODEL_ID,
  FIXED_TEXT_MODEL_NAME
} from "@/lib/ai/fixed-models";
import {
  AiProviderError,
  AiProviderFetchError,
  AiProviderTimeoutError,
  generateImage,
  generateText
} from "@/lib/ai/client";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv();

type CheckResult =
  | {
      name: string;
      ok: true;
      durationMs: number;
      summary: string;
      details?: Record<string, unknown>;
    }
  | {
      name: string;
      ok: false;
      durationMs: number;
      summary: string;
      details?: Record<string, unknown>;
    };

type FailureCategory =
  | "missing_credentials"
  | "auth"
  | "quota_or_plan"
  | "timeout"
  | "network"
  | "provider_error"
  | "invalid_response"
  | "unknown";

type AttemptResult = {
  ok: boolean;
  durationMs: number;
  summary?: string;
  details?: Record<string, unknown>;
  error?: unknown;
};

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getNumericArgValue(flag: string, fallback: number) {
  const raw = getArgValue(flag);
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function nowMs() {
  return Date.now();
}

function elapsedMs(startedAt: number) {
  return Date.now() - startedAt;
}

function formatDuration(durationMs: number) {
  return `${(durationMs / 1000).toFixed(2)}s`;
}

function getProviderEnvStatus() {
  return {
    googleAiStudio:
      Boolean(process.env.GOOGLE_AI_STUDIO_API_KEY) || Boolean(process.env.GEMINI_API_KEY),
    falAi: Boolean(process.env.FAL_KEY) || Boolean(process.env.FAL_API_KEY)
  };
}

function printSection(title: string) {
  console.log(`\n=== ${title} ===`);
}

function printCheck(result: CheckResult) {
  const status = result.ok ? "OK" : "FAIL";
  console.log(`[${status}] ${result.name} (${formatDuration(result.durationMs)})`);
  console.log(result.summary);

  if (result.details && Object.keys(result.details).length > 0) {
    console.log(JSON.stringify(result.details, null, 2));
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function collectErrorText(details: unknown) {
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

function getFailureHint(category: FailureCategory) {
  switch (category) {
    case "missing_credentials":
      return "Check that the required provider API key is set in apps/web/.env.local.";
    case "auth":
      return "Verify the API key value and provider account permissions.";
    case "quota_or_plan":
      return "Check provider quota, billing status, or plan entitlements.";
    case "timeout":
      return "The provider was reachable but too slow. Retry and check provider latency.";
    case "network":
      return "Check outbound network connectivity, DNS, or temporary provider reachability.";
    case "provider_error":
      return "The provider returned an upstream error. Retry once, then inspect the returned payload.";
    case "invalid_response":
      return "The provider responded, but the payload shape was not usable. Inspect the response body.";
    case "unknown":
    default:
      return "Inspect the error details below for the next debugging step.";
  }
}

function classifyProviderError(error: unknown): {
  category: FailureCategory;
  hint: string;
} {
  if (error instanceof AiProviderTimeoutError) {
    return {
      category: "timeout",
      hint: getFailureHint("timeout")
    };
  }

  if (error instanceof AiProviderFetchError) {
    return {
      category: "network",
      hint: getFailureHint("network")
    };
  }

  if (error instanceof AiProviderError) {
    const message = error.message.toLowerCase();
    const detailsText = collectErrorText(error.details);
    const combined = `${message} ${detailsText}`;

    if (
      error.status === 401 ||
      error.status === 403 ||
      combined.includes("api key") ||
      combined.includes("unauthorized") ||
      combined.includes("forbidden") ||
      combined.includes("permission")
    ) {
      return {
        category: "auth",
        hint: getFailureHint("auth")
      };
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
      return {
        category: "quota_or_plan",
        hint: getFailureHint("quota_or_plan")
      };
    }

    if (
      combined.includes("returned no assistant content") ||
      combined.includes("returned no image output") ||
      combined.includes("image generation returned no response url") ||
      combined.includes("image understanding failed")
    ) {
      return {
        category: "invalid_response",
        hint: getFailureHint("invalid_response")
      };
    }

    if (error.status >= 500) {
      return {
        category: "provider_error",
        hint: getFailureHint("provider_error")
      };
    }

    return {
      category: "unknown",
      hint: getFailureHint("unknown")
    };
  }

  if (
    error instanceof Error &&
    /missing .*api key|required provider api key|missing credentials/i.test(error.message)
  ) {
    return {
      category: "missing_credentials",
      hint: getFailureHint("missing_credentials")
    };
  }

  return {
    category: "unknown",
    hint: getFailureHint("unknown")
  };
}

function summarizeError(error: unknown) {
  const classified = classifyProviderError(error);

  if (error instanceof AiProviderTimeoutError) {
    return {
      summary: error.message,
      details: {
        category: classified.category,
        hint: classified.hint,
        type: error.name,
        timeoutMs: error.timeoutMs
      }
    };
  }

  if (error instanceof AiProviderFetchError) {
    return {
      summary: error.message,
      details: {
        category: classified.category,
        hint: classified.hint,
        type: error.name,
        operation: error.operation,
        endpoint: error.endpoint,
        cause: error.causeError instanceof Error ? error.causeError.message : null
      }
    };
  }

  if (error instanceof AiProviderError) {
    return {
      summary: error.message,
      details: {
        category: classified.category,
        hint: classified.hint,
        type: error.name,
        status: error.status,
        providerDetails: error.details ?? null
      }
    };
  }

  if (error instanceof Error) {
    return {
      summary: error.message,
      details: {
        category: classified.category,
        hint: classified.hint,
        type: error.name
      }
    };
  }

  return {
    summary: "Unknown provider failure.",
    details: {
      category: classified.category,
      hint: classified.hint
    }
  };
}

function isRetryableError(error: unknown) {
  if (error instanceof AiProviderTimeoutError || error instanceof AiProviderFetchError) {
    return true;
  }

  if (error instanceof AiProviderError) {
    return error.status === 429 || error.status >= 500;
  }

  return false;
}

async function runWithRetry(args: {
  name: string;
  maxRetries: number;
  attempt: () => Promise<AttemptResult>;
}): Promise<CheckResult> {
  const attemptDetails: Array<Record<string, unknown>> = [];

  for (let attemptIndex = 0; attemptIndex <= args.maxRetries; attemptIndex += 1) {
    const result = await args.attempt();
    attemptDetails.push({
      attempt: attemptIndex + 1,
      ok: result.ok,
      durationMs: result.durationMs,
      ...(result.ok
        ? {}
        : {
            errorSummary: result.summary ?? null,
            errorDetails: result.details ?? null
          })
    });

    if (result.ok) {
      return {
        name: args.name,
        ok: true,
        durationMs: attemptDetails.reduce(
          (total, item) => total + Number(item.durationMs ?? 0),
          0
        ),
        summary:
          attemptIndex === 0
            ? result.summary ?? "Check passed."
            : `${result.summary ?? "Check passed."} Recovered after ${attemptIndex} retr${attemptIndex === 1 ? "y" : "ies"}.`,
        details: {
          ...(result.details ?? {}),
          attempts: attemptDetails
        }
      };
    }

    if (attemptIndex === args.maxRetries || !isRetryableError(result.error)) {
      return {
        name: args.name,
        ok: false,
        durationMs: attemptDetails.reduce(
          (total, item) => total + Number(item.durationMs ?? 0),
          0
        ),
        summary: result.summary ?? "Check failed.",
        details: {
          ...(result.details ?? {}),
          attempts: attemptDetails
        }
      };
    }

    await sleep(1200 * (attemptIndex + 1));
  }

  return {
    name: args.name,
    ok: false,
    durationMs: 0,
    summary: "Check failed before a retry decision was made."
  };
}

async function runTextCheck(prompt: string, maxRetries: number): Promise<CheckResult> {
  return runWithRetry({
    name: "Text provider",
    maxRetries,
    attempt: async () => {
      const startedAt = nowMs();

      try {
        const result = await generateText({
          model: FIXED_TEXT_MODEL_ID,
          messages: [{ role: "user", content: prompt }]
        });

        return {
          ok: true,
          durationMs: elapsedMs(startedAt),
          summary: `Model ${result.model} returned ${result.content.length} chars.`,
          details: {
            configuredModel: FIXED_TEXT_MODEL_NAME,
            outputPreview: result.content.slice(0, 240)
          }
        };
      } catch (error) {
        const summarized = summarizeError(error);
        return {
          ok: false,
          durationMs: elapsedMs(startedAt),
          summary: summarized.summary,
          details: {
            configuredModel: FIXED_TEXT_MODEL_NAME,
            ...summarized.details
          },
          error
        };
      }
    }
  });
}

async function runImageCheck(prompt: string, maxRetries: number): Promise<CheckResult> {
  return runWithRetry({
    name: "Image provider",
    maxRetries,
    attempt: async () => {
      const startedAt = nowMs();

      try {
        const result = await generateImage({
          model: FIXED_IMAGE_MODEL_ID,
          prompt
        });

        return {
          ok: true,
          durationMs: elapsedMs(startedAt),
          summary: `Model ${result.model} returned an image URL.`,
          details: {
            configuredModel: FIXED_IMAGE_MODEL_NAME,
            imageUrl: result.url
          }
        };
      } catch (error) {
        const summarized = summarizeError(error);
        return {
          ok: false,
          durationMs: elapsedMs(startedAt),
          summary: summarized.summary,
          details: {
            configuredModel: FIXED_IMAGE_MODEL_NAME,
            ...summarized.details
          },
          error
        };
      }
    }
  });
}

async function main() {
  const textPrompt =
    getArgValue("--prompt") ??
    "Write a short healthcheck greeting for the SparkCore provider diagnostics.";
  const imagePrompt =
    getArgValue("--image-prompt") ??
    "A minimal watercolor postcard of Shanghai skyline at sunrise, soft light, clean composition.";
  const maxRetries = getNumericArgValue("--retry", 1);

  const envStatus = getProviderEnvStatus();
  const results: CheckResult[] = [];

  printSection("Environment");
  console.log(JSON.stringify(envStatus, null, 2));

  printSection("Checks");
  results.push(await runTextCheck(textPrompt, maxRetries));
  results.push(await runImageCheck(imagePrompt, maxRetries));

  for (const result of results) {
    printCheck(result);
  }

  printSection("Summary");
  const failed = results.filter((result) => !result.ok);
  if (failed.length === 0) {
    console.log("All configured provider checks passed.");
    return;
  }

  console.log(`${failed.length} provider check(s) failed.`);
  process.exitCode = 1;
}

void main();
