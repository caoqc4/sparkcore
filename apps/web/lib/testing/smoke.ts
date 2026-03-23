import { resetSmokeState } from "@/lib/testing/smoke-reset";
import {
  getSmokeConfig,
  isAuthorizedSmokeRequest
} from "@/lib/testing/smoke-config";
import { createSmokeLoginResponse } from "@/lib/testing/smoke-login";
import { loadSmokeTurnContext } from "@/lib/testing/smoke-turn-context";
import { executeSmokeTurn } from "@/lib/testing/smoke-turn-execution";
import { createSmokeThread } from "@/lib/testing/smoke-threads";

export { getSmokeConfig, isAuthorizedSmokeRequest };

export { resetSmokeState };

export async function createSmokeTurn({
  threadId,
  content
}: {
  threadId: string;
  content: string;
}) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Smoke turn content is required.");
  }

  const context = await loadSmokeTurnContext({ threadId });

  return executeSmokeTurn({
    context,
    trimmedContent
  });
}

export { createSmokeThread };

export { createSmokeLoginResponse };
