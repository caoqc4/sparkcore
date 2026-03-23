import { runSmokeAssistantTurnStep } from "@/lib/testing/smoke-turn-assistant-run";
import {
  buildSmokeAssistantTurnStepInput,
  buildSmokeMemoryTurnStepInput,
  buildSmokeUserTurnStepInput
} from "@/lib/testing/smoke-turn-step-builders";
import type { SmokeTurnAnalysis } from "@/lib/testing/smoke-turn-assistant-run-types";
import { persistSmokeMemoryTurnStep } from "@/lib/testing/smoke-turn-memory-step";
import type { SmokeTurnStepContext } from "@/lib/testing/smoke-turn-step-context";
import { persistSmokeUserTurnStep } from "@/lib/testing/smoke-turn-user-step";

export async function executeSmokeTurnSteps(args: {
  context: SmokeTurnStepContext;
  trimmedContent: string;
  analysis: SmokeTurnAnalysis;
}) {
  const ensuredUserMessage = await persistSmokeUserTurnStep(
    buildSmokeUserTurnStepInput({
      context: args.context,
      trimmedContent: args.trimmedContent
    })
  );

  const { createdTypes } = await persistSmokeMemoryTurnStep(
    buildSmokeMemoryTurnStepInput({
      context: args.context,
      sourceMessageId: ensuredUserMessage.id,
      trimmedContent: args.trimmedContent
    })
  );

  const insertedAssistantMessage = await runSmokeAssistantTurnStep(
    buildSmokeAssistantTurnStepInput({
      context: args.context,
      trimmedContent: args.trimmedContent,
      analysis: args.analysis,
      createdTypes
    })
  );

  return {
    ensuredUserMessage,
    insertedAssistantMessage
  };
}
