export function isTransientSupabaseFetchError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("connect timeout") ||
    message.includes("und_err_connect_timeout") ||
    message.includes("client network socket disconnected") ||
    message.includes("tls")
  );
}

export async function retryOnceOnTransientSupabaseFetch<T>(args: {
  task: () => Promise<T>;
  delayMs?: number;
}) {
  const delayMs = args.delayMs ?? 250;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await args.task();
    } catch (error) {
      if (attempt === 0 && isTransientSupabaseFetchError(error)) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }

  throw new Error("retryOnceOnTransientSupabaseFetch exhausted unexpectedly.");
}
