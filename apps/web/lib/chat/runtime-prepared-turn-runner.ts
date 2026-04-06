import { generateText } from "@/lib/ai/client";
import type { RecalledMemory } from "@/lib/chat/memory-shared";
import type {
  AnswerCarryoverPolicy,
  AnswerForbiddenMove,
  AnswerQuestionType,
  AnswerSceneGoal,
  AnswerStrategy,
  AnswerStrategyPriority,
  AnswerStrategyReasonCode,
  ContinuationReasonCode
} from "@/lib/chat/answer-decision";
import { detectNegativeProductFeedbackSignal } from "@/lib/chat/product-feedback-incidents";
import { buildRuntimePostGenerationContext } from "@/lib/chat/runtime-post-generation-context";
import { elapsedMs, hashString, nowMs } from "@/lib/chat/runtime-core-helpers";
import type {
  RuntimeModelProfileRecord,
  RuntimeModelProfileResolutionTimingMs
} from "@/lib/chat/runtime-model-profile-resolution";
import { buildRuntimeGenerationContext } from "@/lib/chat/runtime-generation-context";
import { applyRuntimeTurnSideEffects } from "@/lib/chat/runtime-turn-side-effects";
import { buildPreparedRuntimeTurnLogFields } from "@/lib/chat/runtime-turn-observability";
import { loadRelevantKnowledgeForRuntime } from "@/lib/chat/runtime-knowledge-sources";
import type { RuntimeTurnResult } from "@/lib/chat/runtime-contract";
import type { PreparedRuntimeTurnRunnerArgs } from "@/lib/chat/runtime-entry-contracts";
import type { PreparedRuntimeTurnExecutionContext } from "@/lib/chat/runtime-turn-observability-contracts";

const IM_PROVIDER_TIMEOUT_MS = 30_000;

export async function runPreparedRuntimeTurn(
  args: PreparedRuntimeTurnRunnerArgs
): Promise<RuntimeTurnResult> {
  const runPreparedStartedAt = nowMs();
  const agent = args.preparedRuntimeTurn.role.agent;
  const relationshipRecall =
    args.preparedRuntimeTurn.memory.runtime_memory_context.relationshipRecall;
  const memoryRecall =
    args.preparedRuntimeTurn.memory.runtime_memory_context.memoryRecall;
  const relationshipRecallKeys = [
    relationshipRecall.addressStyleMemory ? "user_address_style" : null,
    relationshipRecall.nicknameMemory ? "agent_nickname" : null,
    relationshipRecall.preferredNameMemory ? "user_preferred_name" : null
  ].filter((value): value is string => value !== null);
  const relationshipRecallMemoryIds = args.relationshipMemories.map(
    (memory) => memory.memory_id
  );
  const {
    executionContext,
    postGenerationHandoff
  } = await buildRuntimeGenerationContext({
    preparedRuntimeTurn: args.preparedRuntimeTurn,
    userId: args.userId,
    latestUserMessageContent: args.latestUserMessageContent,
    recentRawTurnCount: args.recentRawTurnCount,
    allRecalledMemories: args.allRecalledMemories,
    relationshipMemories: args.relationshipMemories,
    replyLanguage: args.replyLanguage,
    replyLanguageDecision: args.replyLanguageDecision,
    answerQuestionType: args.answerQuestionType,
    answerStrategy: args.answerStrategy,
    answerCarryoverPolicy: args.answerCarryoverPolicy,
    answerForbiddenMoves: args.answerForbiddenMoves,
    answerSceneGoal: args.answerSceneGoal,
    threadContinuityPrompt: args.threadContinuityPrompt,
    loadRelevantKnowledgeForRuntime,
    detectNegativeProductFeedbackSignal,
    hashString,
    elapsedMs,
    nowMs
  });

  const { thread } = args.preparedRuntimeTurn.resources;
  const generateTextStartedAt = nowMs();
  const result = await generateText({
    model: args.modelProfile.model,
    messages: executionContext.promptMessages,
    temperature: args.modelProfile.temperature,
    maxOutputTokens: args.modelProfile.max_output_tokens,
    timeoutMs:
      args.preparedRuntimeTurn.input.message.source === "im"
        ? IM_PROVIDER_TIMEOUT_MS
        : undefined
  });
  const generateTextDurationMs = elapsedMs(generateTextStartedAt);

  const {
    finalAssistantContent,
    memoryWriteRequests,
    memoryPlannerCandidates,
    memoryPlannerSummary,
    followUpRequests,
    runtimeObservabilityArtifacts,
    assistantPayload,
    assistantPayloadContentBytes,
    assistantPayloadMetadataBytes,
    assistantPayloadTotalBytes,
    runtimeTurnResult
  } = await buildRuntimePostGenerationContext({
    preparedRuntimeTurn: args.preparedRuntimeTurn,
    result,
    latestUserMessageContent: args.latestUserMessageContent,
    humanizedDeliveryPacket: executionContext.humanizedDeliveryPacket,
    runtimeTemporalContext: executionContext.runtimeTemporalContext,
    userId: args.userId,
    threadId: thread.id,
    agent: {
      id: agent.id,
      name: agent.name
    },
    replyLanguage: args.replyLanguage,
    replyLanguageSource: args.replyLanguageDecision.source,
    answerQuestionType: args.answerQuestionType,
    answerStrategy: args.answerStrategy,
    answerStrategyReasonCode: args.answerStrategyReasonCode,
    answerStrategyPriority: args.answerStrategyPriority,
    answerCarryoverPolicy: args.answerCarryoverPolicy,
    answerForbiddenMoves: args.answerForbiddenMoves,
    answerSceneGoal: args.answerSceneGoal,
    continuationReasonCode: args.continuationReasonCode,
    sameThreadContinuationApplicable: args.sameThreadContinuationApplicable,
    longChainPressureCandidate: args.longChainPressureCandidate,
    preferSameThreadContinuation: args.preferSameThreadContinuation,
    allRecalledMemories: args.allRecalledMemories,
    generationHandoff: postGenerationHandoff,
    recentRawTurnCount: args.recentRawTurnCount,
    approxContextPressure: args.approxContextPressure,
    modelProfile: args.modelProfile
  });

  const preparedTurnExecutionContext: PreparedRuntimeTurnExecutionContext = {
    threadId: thread.id,
    agentId: agent.id,
    knowledgeRoute: executionContext.knowledgeRoute ?? "none",
    knowledgeLoadLimit: executionContext.knowledgeLoadLimit,
    humanizedDeliveryPacket: executionContext.humanizedDeliveryPacket,
    knowledgeLoadDurationMs: executionContext.knowledgeLoadDurationMs,
    generateTextDurationMs,
    modelProfileTimingMs: args.modelProfileTimingMs,
    assistantPayloadContentBytes,
    assistantPayloadMetadataBytes,
    assistantPayloadTotalBytes,
    promptMessageCount: executionContext.promptMessageCount,
    promptSystemChars: executionContext.promptSystemChars,
    promptSystemSectionLengths: executionContext.promptSystemSectionLengths,
    promptUserChars: executionContext.promptUserChars,
    promptAssistantChars: executionContext.promptAssistantChars,
    promptTotalChars: executionContext.promptTotalChars,
    promptTotalBytes: executionContext.promptTotalBytes,
    promptApproxTokenCount: executionContext.promptApproxTokenCount,
    runPreparedStartedAt,
    nowMs,
    elapsedMs
  };

  const {
    runtimeTurnResult: runtimeTurnResultWithSideEffects,
    persistAssistantDurationMs,
    updateThreadDurationMs
  } = await applyRuntimeTurnSideEffects({
    preparedRuntimeTurn: args.preparedRuntimeTurn,
    userId: args.userId,
    persistenceArtifacts: {
      assistantPayload,
      assistantPayloadContentBytes,
      assistantPayloadMetadataBytes,
      assistantPayloadTotalBytes
    },
    writebackArtifacts: {
      runtimeTurnResult
    },
    executionContext: preparedTurnExecutionContext
  });

  console.info(
    "[runtime-turn:prepared]",
    buildPreparedRuntimeTurnLogFields({
      ...preparedTurnExecutionContext,
      persistAssistantDurationMs,
      updateThreadDurationMs
    })
  );

  return runtimeTurnResultWithSideEffects;
}
