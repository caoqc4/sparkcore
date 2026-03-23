import { analyzeSmokeTurnContext } from "@/lib/testing/smoke-turn-analysis";
import { executeSmokeTurnSteps } from "@/lib/testing/smoke-turn-execution-steps";
import { getSmokeTurnStepContext } from "@/lib/testing/smoke-turn-step-context";
import type { SmokeTurnExecutionInput } from "@/lib/testing/smoke-turn-execution-types";
import type { SmokeTurnExecutionResult } from "@/lib/testing/smoke-turn-execution-result";

export async function executeSmokeTurn(
  args: SmokeTurnExecutionInput
): Promise<SmokeTurnExecutionResult> {
  const { thread, agent, existingMemories, existingMessages } = args.context;
  const stepContext = getSmokeTurnStepContext(args);
  const analysis = analyzeSmokeTurnContext({
    trimmedContent: args.trimmedContent,
    existingMemories,
    existingMessages,
    agentId: agent.id,
    threadId: thread.id
  });

  const { ensuredUserMessage, insertedAssistantMessage } =
    await executeSmokeTurnSteps({
      context: stepContext,
      trimmedContent: args.trimmedContent,
      analysis
    });

  return {
    userMessageId: ensuredUserMessage.id,
    assistantMessageId: insertedAssistantMessage.id
  };
}
