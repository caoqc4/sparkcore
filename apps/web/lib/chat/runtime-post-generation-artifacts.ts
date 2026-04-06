import { getAnswerStrategyPriorityLabel } from "@/lib/chat/answer-decision";
import { buildRecalledStaticProfileSnapshot } from "@/lib/chat/memory-records";
import { buildRuntimeObservabilityArtifacts } from "@/lib/chat/runtime-observability-builders";
import type {
  BuildRuntimePostGenerationArtifactsBundleArgs,
  RuntimePostGenerationArtifacts
} from "@/lib/chat/runtime-post-generation-contracts";
import { buildRuntimeTurnPlanningArtifacts } from "@/lib/chat/runtime-turn-planning";
import { buildRuntimeTurnResultArtifacts } from "@/lib/chat/runtime-turn-result-builders";

export async function buildRuntimePostGenerationArtifactsBundle(
  args: BuildRuntimePostGenerationArtifactsBundleArgs
): Promise<RuntimePostGenerationArtifacts> {
  const currentSourceMessageId =
    args.preparedRuntimeTurn.session.current_message_id ?? null;
  const {
    memoryWriteRequests,
    memoryPlannerCandidates,
    runtimePlannedCandidates,
    memoryPlannerSummary,
    followUpRequests
  } = await buildRuntimeTurnPlanningArtifacts({
    latestUserMessageContent: args.latestUserMessageContent,
    currentSourceMessageId,
    recentRawTurns: args.preparedRuntimeTurn.session.recent_raw_turns,
    activeMemoryNamespace:
      args.generationHandoff.governanceHandoff.activeMemoryNamespace,
    threadId: args.threadId,
    agentId: args.agent.id,
    userId: args.userId,
    continuationReasonCode: args.continuationReasonCode,
    replyLanguage: args.replyLanguage
  });

  const memoryRecall =
    args.preparedRuntimeTurn.memory.runtime_memory_context.memoryRecall;
  const recalledProfileSnapshot =
    buildRecalledStaticProfileSnapshot(memoryRecall.memories);

  const runtimeObservabilityArtifacts = buildRuntimeObservabilityArtifacts({
    agent: args.agent,
    modelProfile: args.modelProfile,
    resultModel: args.result.model ?? null,
    preparedRuntimeTurn: args.preparedRuntimeTurn,
    finalAssistantContent: args.finalAssistantContent,
    replyLanguage: args.replyLanguage,
    replyLanguageSource: args.replyLanguageSource,
    answerQuestionType: args.answerQuestionType,
    answerStrategy: args.answerStrategy,
    answerStrategyReasonCode: args.answerStrategyReasonCode,
    answerStrategyPriority: args.answerStrategyPriority,
    answerStrategyPriorityLabel: getAnswerStrategyPriorityLabel(
      args.answerStrategyPriority,
      args.replyLanguage === "zh-Hans"
    ),
    answerCarryoverPolicy: args.answerCarryoverPolicy,
    answerForbiddenMoves: args.answerForbiddenMoves,
    answerSceneGoal: args.answerSceneGoal,
    relationshipRecall:
      args.preparedRuntimeTurn.memory.runtime_memory_context.relationshipRecall,
    relationshipMemories:
      args.generationHandoff.relationshipRecallHandoff.relationshipMemories,
    relationshipRecallKeys:
      args.generationHandoff.relationshipRecallHandoff.relationshipRecallKeys,
    relationshipRecallMemoryIds:
      args.generationHandoff.relationshipRecallHandoff
        .relationshipRecallMemoryIds,
    continuationReasonCode: args.continuationReasonCode,
    sameThreadContinuationApplicable: args.sameThreadContinuationApplicable,
    longChainPressureCandidate: args.longChainPressureCandidate,
    preferSameThreadContinuation: args.preferSameThreadContinuation,
    allRecalledMemories: args.allRecalledMemories,
    memoryRecall,
    recalledProfileSnapshot,
    activeScenarioMemoryPack:
      args.generationHandoff.governanceHandoff.activeScenarioMemoryPack,
    applicableKnowledge:
      args.generationHandoff.governanceHandoff.applicableKnowledge,
    knowledgeGatingWithOutcome:
      args.generationHandoff.governanceHandoff.knowledgeGatingWithOutcome,
    activeMemoryNamespace:
      args.generationHandoff.governanceHandoff.activeMemoryNamespace,
    compactedThreadSummary:
      args.generationHandoff.governanceHandoff.compactedThreadSummary,
    followUpRequestCount: followUpRequests.length,
    memoryWriteRequestCount: memoryWriteRequests.length,
    memoryPlannerSummary,
    recentRawTurnCount: args.recentRawTurnCount,
    approxContextPressure: args.approxContextPressure,
    roleCoreCloseNoteHandoffPacket:
      args.generationHandoff.closeNoteHandoff.roleCoreCloseNoteHandoffPacket,
    roleCoreCloseNoteArtifact:
      args.generationHandoff.closeNoteHandoff.roleCoreCloseNoteArtifact,
    roleCoreCloseNoteRecord:
      args.generationHandoff.closeNoteHandoff.roleCoreCloseNoteRecord,
    roleCoreCloseNoteArchive:
      args.generationHandoff.closeNoteHandoff.roleCoreCloseNoteArchive,
    roleCoreCloseNotePersistenceEnvelope:
      args.generationHandoff.closeNoteHandoff
        .roleCoreCloseNotePersistenceEnvelope,
    roleCoreCloseNotePersistenceManifest:
      args.generationHandoff.closeNoteHandoff
        .roleCoreCloseNotePersistenceManifest,
    roleCoreCloseNotePersistencePayload:
      args.generationHandoff.closeNoteHandoff
        .roleCoreCloseNotePersistencePayload,
    roleCoreCloseNoteOutput:
      args.generationHandoff.closeNoteHandoff.roleCoreCloseNoteOutput
  });

  const runtimeTurnResultArtifacts = buildRuntimeTurnResultArtifacts({
    finalAssistantContent: args.finalAssistantContent,
    assistantMetadata: runtimeObservabilityArtifacts.assistantMetadata,
    replyLanguage: args.replyLanguage,
    memoryWriteRequests,
    memoryPlannerCandidates,
    followUpRequests,
    relationshipMemories:
      args.generationHandoff.relationshipRecallHandoff.relationshipMemories,
    allRecalledMemories: args.allRecalledMemories,
    memoryRecall,
    applicableKnowledge:
      args.generationHandoff.governanceHandoff.applicableKnowledge,
    knowledgeGatingWithOutcome:
      args.generationHandoff.governanceHandoff.knowledgeGatingWithOutcome,
    activeMemoryNamespace:
      args.generationHandoff.governanceHandoff.activeMemoryNamespace,
    memoryPlannerSummary,
    answerQuestionType: args.answerQuestionType,
    answerStrategy: args.answerStrategy,
    answerStrategyReasonCode: args.answerStrategyReasonCode,
    answerStrategyPriority: args.answerStrategyPriority,
    answerCarryoverPolicy: args.answerCarryoverPolicy,
    answerForbiddenMoves: args.answerForbiddenMoves,
    answerSceneGoal: args.answerSceneGoal,
    continuationReasonCode: args.continuationReasonCode,
    threadId: args.threadId,
    agentId: args.agent.id,
    debugMetadata: runtimeObservabilityArtifacts.debugMetadata
  });

  return {
    finalAssistantContent: args.finalAssistantContent,
    memoryWriteRequests,
    memoryPlannerCandidates,
    runtimePlannedCandidates,
    memoryPlannerSummary,
    followUpRequests,
    runtimeObservabilityArtifacts,
    ...runtimeTurnResultArtifacts
  };
}
