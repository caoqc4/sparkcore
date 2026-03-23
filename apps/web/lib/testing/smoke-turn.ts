import { loadSmokeTurnContext } from "@/lib/testing/smoke-turn-context";
import { executeSmokeTurn } from "@/lib/testing/smoke-turn-execution";

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

  const context = await loadSmokeTurnContext({
    threadId
  });
  return executeSmokeTurn({
    context,
    trimmedContent
  });
}
