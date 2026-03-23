import { insertAnalyzedSmokeAssistantReply } from "@/lib/testing/smoke-turn-assistant";
import type { SmokeAnalyzedAssistantInsertArgs } from "@/lib/testing/smoke-assistant-persistence-types";

export async function persistSmokeAssistantTurnStep(
  args: SmokeAnalyzedAssistantInsertArgs
) {
  return insertAnalyzedSmokeAssistantReply(args);
}
