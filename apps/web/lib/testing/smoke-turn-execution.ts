import { getSmokeTurnExecutionContext } from "@/lib/testing/smoke-turn-execution-context";
import { prepareSmokeExecutionAnalysis } from "@/lib/testing/smoke-turn-execution-analysis";
import { buildSmokeTurnExecutionResult } from "@/lib/testing/smoke-turn-execution-result-builder";
import { executeSmokeTurnSteps } from "@/lib/testing/smoke-turn-execution-steps";
import { getSmokeTurnStepContext } from "@/lib/testing/smoke-turn-step-context";
import type { SmokeTurnExecutionInput } from "@/lib/testing/smoke-turn-execution-types";
import type { SmokeTurnExecutionResult } from "@/lib/testing/smoke-turn-execution-result";

export async function executeSmokeTurn(
  args: SmokeTurnExecutionInput
): Promise<SmokeTurnExecutionResult> {
  const {
    admin,
    smokeUser,
    thread,
    ensuredAgent,
    modelProfile,
    existingMemories,
    existingMessages
  } = getSmokeTurnExecutionContext(args);
  const stepContext = getSmokeTurnStepContext(args);
  const analysis = prepareSmokeExecutionAnalysis({
    trimmedContent: args.trimmedContent,
    existingMemories,
    existingMessages,
    agentId: ensuredAgent.id,
    threadId: thread.id
  });

  const { ensuredUserMessage, insertedAssistantMessage } =
    await executeSmokeTurnSteps({
      context: stepContext,
      trimmedContent: args.trimmedContent,
      analysis
    });

  return buildSmokeTurnExecutionResult({
    userMessageId: ensuredUserMessage.id,
    assistantMessageId: insertedAssistantMessage.id
  });
}
