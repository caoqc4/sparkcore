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

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
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

export function isTransientSmokeConstraintVisibilityError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("violates foreign key constraint") &&
    (message.includes("messages_thread_id_fkey") ||
      message.includes("memory_items_agent_id_fkey") ||
      message.includes("memory_items_source_message_id_fkey") ||
      message.includes("messages_user_id_fkey") ||
      message.includes("messages_workspace_id_fkey"))
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

export async function retrySmokeVisibilityOperation<T>(
  run: () => Promise<T>,
  options?: {
    retries?: number;
    delayMs?: number;
    label?: string;
  }
) {
  const retries = options?.retries ?? 3;
  const delayMs = options?.delayMs ?? 250;
  const label = options?.label ?? "smoke visibility operation";
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;

      if (attempt === retries || !isTransientSmokeConstraintVisibilityError(error)) {
        break;
      }

      console.warn(
        `[smoke] Retrying ${label} after referential visibility delay (${attempt + 1}/${retries + 1})`,
        error
      );
      await sleep(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}
