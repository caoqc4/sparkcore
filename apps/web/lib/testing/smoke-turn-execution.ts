import { analyzeSmokeTurnContext } from "@/lib/testing/smoke-turn-analysis";
import { executeSmokeTurnSteps } from "@/lib/testing/smoke-turn-execution-steps";
import type { SmokeTurnContext } from "@/lib/testing/smoke-turn-context";

export type SmokeTurnExecutionInput = {
  context: SmokeTurnContext;
  trimmedContent: string;
};

export type SmokeTurnStepContext = {
  admin: SmokeTurnContext["admin"];
  threadId: string;
  threadTitle: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  agentName: string;
  personaSummary: string | null;
  styleGuidance: string | null;
  modelProfileId: string;
  modelProfileName: string;
  model: string;
};

export type SmokeTurnExecutionResult = {
  userMessageId: string;
  assistantMessageId: string;
};

export async function executeSmokeTurn(
  args: SmokeTurnExecutionInput
): Promise<SmokeTurnExecutionResult> {
  const { thread, agent, existingMemories, existingMessages } = args.context;
  const {
    admin,
    smokeUser,
    modelProfile
  } = args.context;
  const stepContext: SmokeTurnStepContext = {
    admin,
    threadId: thread.id,
    threadTitle: thread.title,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    agentId: agent.id,
    agentName: agent.name,
    personaSummary: agent.persona_summary ?? null,
    styleGuidance: agent.style_prompt ?? null,
    modelProfileId: modelProfile.id,
    modelProfileName: modelProfile.name,
    model: modelProfile.model
  };
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
