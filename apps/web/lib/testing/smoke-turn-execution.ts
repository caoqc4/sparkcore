import { getSmokeTurnExecutionContext } from "@/lib/testing/smoke-turn-execution-context";
import { prepareSmokeExecutionAnalysis } from "@/lib/testing/smoke-turn-execution-analysis";
import { buildSmokeTurnExecutionResult } from "@/lib/testing/smoke-turn-execution-result-builder";
import { persistSmokeMemoryTurnStep } from "@/lib/testing/smoke-turn-memory-step";
import { persistSmokeUserTurnStep } from "@/lib/testing/smoke-turn-user-step";
import { runSmokeAssistantTurnStep } from "@/lib/testing/smoke-turn-assistant-run";
import {
  buildSmokeAssistantTurnStepInput,
  buildSmokeMemoryTurnStepInput,
  buildSmokeUserTurnStepInput
} from "@/lib/testing/smoke-turn-step-builders";
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
  const analysis = prepareSmokeExecutionAnalysis({
    trimmedContent: args.trimmedContent,
    existingMemories,
    existingMessages,
    agentId: ensuredAgent.id,
    threadId: thread.id
  });

  const ensuredUserMessage = await persistSmokeUserTurnStep(
    buildSmokeUserTurnStepInput({
      admin,
      threadId: thread.id,
      workspaceId: smokeUser.workspaceId,
      userId: smokeUser.id,
      threadTitle: thread.title,
      trimmedContent: args.trimmedContent
    })
  );

  const { createdTypes } = await persistSmokeMemoryTurnStep(
    buildSmokeMemoryTurnStepInput({
      admin,
      workspaceId: smokeUser.workspaceId,
      userId: smokeUser.id,
      agentId: ensuredAgent.id,
      sourceMessageId: ensuredUserMessage.id,
      trimmedContent: args.trimmedContent
    })
  );
  const insertedAssistantMessage = await runSmokeAssistantTurnStep(
    buildSmokeAssistantTurnStepInput({
      admin,
      threadId: thread.id,
      workspaceId: smokeUser.workspaceId,
      userId: smokeUser.id,
      agentId: ensuredAgent.id,
      agentName: ensuredAgent.name,
      personaSummary: ensuredAgent.persona_summary ?? null,
      styleGuidance: ensuredAgent.style_prompt ?? null,
      modelProfileId: modelProfile.id,
      modelProfileName: modelProfile.name,
      model: modelProfile.model,
      trimmedContent: args.trimmedContent,
      analysis,
      createdTypes
    })
  );

  return buildSmokeTurnExecutionResult({
    userMessageId: ensuredUserMessage.id,
    assistantMessageId: insertedAssistantMessage.id
  });
}
