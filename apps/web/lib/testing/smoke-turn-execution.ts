import { prepareSmokeTurnExecutionState } from "@/lib/testing/smoke-turn-execution-state";
import { persistSmokeMemoryTurnStep } from "@/lib/testing/smoke-turn-memory-step";
import { persistSmokeUserTurnStep } from "@/lib/testing/smoke-turn-user-step";
import { runSmokeAssistantTurnStep } from "@/lib/testing/smoke-turn-assistant-run";
import type { SmokeTurnExecutionInput } from "@/lib/testing/smoke-turn-execution-types";

export async function executeSmokeTurn(args: SmokeTurnExecutionInput) {
  const {
    admin,
    smokeUser,
    thread,
    agent: ensuredAgent,
    modelProfile,
    existingMemories,
    existingMessages
  } = args.context;
  const { analysis } = prepareSmokeTurnExecutionState({
    trimmedContent: args.trimmedContent,
    existingMemories,
    existingMessages,
    agentId: ensuredAgent.id,
    threadId: thread.id
  });
  const {
    addressStyleMemory,
    answerStrategyRule,
    approxContextPressure,
    hiddenExclusionCount,
    incorrectExclusionCount,
    longChainPressureCandidate,
    nicknameMemory,
    preferredNameMemory,
    preferSameThreadContinuation,
    recentAssistantReply,
    recentRawTurnCount,
    recalledMemories,
    sameThreadContinuationApplicable,
    usedMemoryTypes
  } = analysis;

  const ensuredUserMessage = await persistSmokeUserTurnStep({
    supabase: admin,
    threadId: thread.id,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    threadTitle: thread.title,
    trimmedContent: args.trimmedContent
  });

  const { createdTypes } = await persistSmokeMemoryTurnStep({
    supabase: admin,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    agentId: ensuredAgent.id,
    sourceMessageId: ensuredUserMessage.id,
    trimmedContent: args.trimmedContent
  });
  const insertedAssistantMessage = await runSmokeAssistantTurnStep({
    supabase: admin,
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
  });

  return {
    userMessageId: ensuredUserMessage.id,
    assistantMessageId: insertedAssistantMessage.id
  };
}
