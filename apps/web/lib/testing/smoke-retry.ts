function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const code =
    "code" in error && typeof error.code === "string"
      ? error.code
      : "cause" in error &&
          error.cause &&
          typeof error.cause === "object" &&
          "code" in error.cause &&
          typeof error.cause.code === "string"
        ? error.cause.code
        : null;

  return code;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function isTransientSmokeError(error: unknown) {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  return (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    message.includes("fetch failed") ||
    message.includes("network socket disconnected") ||
    message.includes("network request failed")
  );
}

export async function retrySmokeOperation<T>(
  run: () => Promise<T>,
  options?: {
    retries?: number;
    delayMs?: number;
    label?: string;
  }
) {
  const retries = options?.retries ?? 2;
  const delayMs = options?.delayMs ?? 800;
  const label = options?.label ?? "smoke operation";
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;

      if (attempt === retries || !isTransientSmokeError(error)) {
        break;
      }

      console.warn(
        `[smoke] Retrying ${label} after transient failure (${attempt + 1}/${retries + 1})`,
        error
      );
      await sleep(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}
