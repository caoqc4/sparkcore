import { runSmokeAssistantTurnStep } from "@/lib/testing/smoke-turn-assistant-run";
import type { SmokeTurnAnalysis } from "@/lib/testing/smoke-turn-assistant-run";
import type { SmokeTurnStepContext } from "@/lib/testing/smoke-turn-execution";
import { persistSmokeMemoryTurnStep } from "@/lib/testing/smoke-turn-memory-step";
import { persistSmokeUserTurnStep } from "@/lib/testing/smoke-turn-user-step";

export async function executeSmokeTurnSteps(args: {
  context: SmokeTurnStepContext;
  trimmedContent: string;
  analysis: SmokeTurnAnalysis;
}) {
  const ensuredUserMessage = await persistSmokeUserTurnStep(
    {
      supabase: args.context.admin,
      threadId: args.context.threadId,
      workspaceId: args.context.workspaceId,
      userId: args.context.userId,
      threadTitle: args.context.threadTitle,
      trimmedContent: args.trimmedContent
    }
  );

  const { createdTypes } = await persistSmokeMemoryTurnStep(
    {
      supabase: args.context.admin,
      workspaceId: args.context.workspaceId,
      userId: args.context.userId,
      agentId: args.context.agentId,
      sourceMessageId: ensuredUserMessage.id,
      trimmedContent: args.trimmedContent
    }
  );

  const insertedAssistantMessage = await runSmokeAssistantTurnStep(
    {
      supabase: args.context.admin,
      threadId: args.context.threadId,
      workspaceId: args.context.workspaceId,
      userId: args.context.userId,
      agentId: args.context.agentId,
      agentName: args.context.agentName,
      personaSummary: args.context.personaSummary,
      styleGuidance: args.context.styleGuidance,
      modelProfileId: args.context.modelProfileId,
      modelProfileName: args.context.modelProfileName,
      model: args.context.model,
      trimmedContent: args.trimmedContent,
      analysis: args.analysis,
      createdTypes
    }
  );

  return {
    ensuredUserMessage,
    insertedAssistantMessage
  };
}
