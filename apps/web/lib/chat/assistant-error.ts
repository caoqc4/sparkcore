import {
  AiProviderError,
  type AiProviderFailureCategory,
  classifyAiProviderFailure,
  AiProviderFetchError,
  AiProviderTimeoutError
} from "@/lib/ai/client";

export type AssistantErrorType =
  | "timeout"
  | "auth"
  | "quota_or_plan"
  | "provider_error"
  | "provider_fetch_failed"
  | "generation_failed";

export function classifyAssistantError(error: unknown): {
  errorType: AssistantErrorType;
  message: string;
  providerFailureCategory: AiProviderFailureCategory | null;
} {
  if (error instanceof AiProviderTimeoutError) {
    return {
      errorType: "timeout",
      message:
        "Assistant reply timed out. You can retry this turn without resending your message.",
      providerFailureCategory: "timeout"
    };
  }

  if (error instanceof AiProviderError) {
    const failureCategory = classifyAiProviderFailure(error);

    if (failureCategory === "auth") {
      return {
        errorType: "auth",
        message: `Provider authentication failed: ${error.message}`,
        providerFailureCategory: failureCategory
      };
    }

    if (failureCategory === "quota_or_plan") {
      return {
        errorType: "quota_or_plan",
        message: `Provider quota or plan restriction: ${error.message}`,
        providerFailureCategory: failureCategory
      };
    }

    return {
      errorType: "provider_error",
      message: `Provider error: ${error.message}`,
      providerFailureCategory: failureCategory
    };
  }

  if (error instanceof AiProviderFetchError) {
    return {
      errorType: "provider_fetch_failed",
      message: `Provider fetch failed during ${error.operation}.`,
      providerFailureCategory: "network"
    };
  }

  if (error instanceof Error) {
    return {
      errorType: "generation_failed",
      message: error.message,
      providerFailureCategory: null
    };
  }

  return {
    errorType: "generation_failed",
    message: "Failed to generate an assistant reply.",
    providerFailureCategory: null
  };
}
