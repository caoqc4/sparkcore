import type { RecalledMemory } from "@/lib/chat/memory-shared";
import {
  buildCompactedThreadSummary,
  selectRetainedThreadCompactionSummary
} from "@/lib/chat/thread-compaction";
import type {
  AnswerCarryoverPolicy,
  AnswerForbiddenMove,
  AnswerQuestionType,
  AnswerSceneGoal,
  AnswerStrategy
} from "@/lib/chat/answer-decision";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import { buildRuntimeCompositionArtifacts } from "@/lib/chat/runtime-composition-resolution";
import type {
  PreparedRuntimeGenerationCloseNoteHandoff,
  PreparedRuntimeGenerationExecutionContext,
  PreparedRuntimeGenerationGovernanceHandoff,
  PreparedRuntimeGenerationPostGenerationHandoff,
  PreparedRuntimeGenerationRelationshipRecallHandoff,
  PreparedRuntimeGenerationRunnerArtifacts
} from "@/lib/chat/runtime-generation-contracts";
import { buildRuntimeMemoryGovernanceContext } from "@/lib/chat/runtime-memory-governance-context";
import type { RuntimeKnowledgeLoadResult } from "@/lib/chat/runtime-knowledge-sources";
import { buildRuntimePromptPreparation } from "@/lib/chat/runtime-prompt-preparation";
import { buildRuntimeRoleCoreCloseNoteArtifacts } from "@/lib/chat/runtime-role-core-close-note";
import { resolveKnowledgeLoadLimit } from "@/lib/chat/runtime-orchestration-helpers";
import type { PreparedRuntimeTurn } from "@/lib/chat/runtime-prepared-turn";
import type { RuntimeRelationshipMemorySummary } from "@/lib/chat/runtime-contract";
import type { ReplyLanguageSource, RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { ApproxContextPressure } from "@/lib/chat/session-context";

export async function buildRuntimeGenerationContext(args: {
  preparedRuntimeTurn: PreparedRuntimeTurn;
  userId: string;
  latestUserMessageContent: string | null;
  recentRawTurnCount: number;
  allRecalledMemories: RecalledMemory[];
  relationshipMemories: RuntimeRelationshipMemorySummary[];
  replyLanguage: RuntimeReplyLanguage;
  replyLanguageDecision: {
    replyLanguage: RuntimeReplyLanguage;
    source: ReplyLanguageSource;
  };
  answerQuestionType: AnswerQuestionType;
  answerStrategy: AnswerStrategy;
  answerCarryoverPolicy: AnswerCarryoverPolicy;
  answerForbiddenMoves: AnswerForbiddenMove[];
  answerSceneGoal: AnswerSceneGoal;
  threadContinuityPrompt: string;
  loadRelevantKnowledgeForRuntime: typeof import("@/lib/chat/runtime-knowledge-sources").loadRelevantKnowledgeForRuntime;
  detectNegativeProductFeedbackSignal: typeof import("@/lib/chat/product-feedback-incidents").detectNegativeProductFeedbackSignal;
  hashString: typeof import("@/lib/chat/runtime-core-helpers").hashString;
  elapsedMs: typeof import("@/lib/chat/runtime-core-helpers").elapsedMs;
  nowMs: typeof import("@/lib/chat/runtime-core-helpers").nowMs;
}): Promise<PreparedRuntimeGenerationRunnerArtifacts> {
  const { preparedRuntimeTurn } = args;
  const agent = preparedRuntimeTurn.role.agent;
  const relationshipRecall =
    preparedRuntimeTurn.memory.runtime_memory_context.relationshipRecall;
  const memoryRecall = preparedRuntimeTurn.memory.runtime_memory_context.memoryRecall;
  const relationshipRecallKeys = [
    relationshipRecall.addressStyleMemory ? "user_address_style" : null,
    relationshipRecall.nicknameMemory ? "agent_nickname" : null,
    relationshipRecall.preferredNameMemory ? "user_preferred_name" : null
  ].filter((value): value is string => value !== null);
  const relationshipRecallMemoryIds = args.relationshipMemories.map(
    (memory) => memory.memory_id
  );
  const compactedThreadSummary = selectRetainedThreadCompactionSummary({
    compactedThreadSummary: buildCompactedThreadSummary({
      threadState: preparedRuntimeTurn.session.thread_state,
      recentTurnCount: args.recentRawTurnCount,
      latestUserMessage: args.latestUserMessageContent
    })
  });
  const knowledgeRoute =
    preparedRuntimeTurn.governance?.knowledge_route?.route ?? null;
  const knowledgeLoadLimit = resolveKnowledgeLoadLimit(knowledgeRoute);
  const knowledgeLoadStartedAt = args.nowMs();
  const knowledgeLoad: RuntimeKnowledgeLoadResult =
    knowledgeLoadLimit > 0
      ? await args.loadRelevantKnowledgeForRuntime({
          userId: args.userId,
          workspaceId: preparedRuntimeTurn.resources.workspace.id,
          agentId: agent.id,
          latestUserMessage: args.latestUserMessageContent,
          knowledgeRoute,
          limit: knowledgeLoadLimit
        })
      : {
          snippets: [],
          gating: {
            knowledge_route: knowledgeRoute,
            query_token_count: 0,
            available: false,
            available_count: 0,
            should_inject: false,
            injection_gap_reason: null,
            retained_count: 0,
            suppressed: knowledgeLoadLimit === 0,
            suppression_reason:
              knowledgeLoadLimit === 0 ? "knowledge_route_no_knowledge" : null,
            zero_match_filtered_count: 0,
            weak_match_filtered_count: 0
          }
        };
  const knowledgeLoadDurationMs = args.elapsedMs(knowledgeLoadStartedAt);
  const relevantKnowledge = knowledgeLoad.snippets as RuntimeKnowledgeSnippet[];
  const knowledgeGating = knowledgeLoad.gating;
  const memoryGovernanceContext = buildRuntimeMemoryGovernanceContext({
    userId: args.userId,
    agentId: agent.id,
    threadId: preparedRuntimeTurn.session.thread_id,
    relevantKnowledge,
    knowledgeGating,
    compactedThreadSummary
  });
  const roleCoreCloseNoteArtifacts = buildRuntimeRoleCoreCloseNoteArtifacts({
    roleCorePacket: preparedRuntimeTurn.role.role_core,
    namespaceGovernanceFabricPlanePhaseSnapshot:
      memoryGovernanceContext.namespaceGovernanceFabricPlanePhaseSnapshot,
    retentionGovernanceFabricPlanePhaseSnapshot:
      memoryGovernanceContext.retentionGovernanceFabricPlanePhaseSnapshot,
    retentionDecisionGroup:
      compactedThreadSummary?.retention_decision_group ?? null,
    retentionRetainedFields: compactedThreadSummary?.retained_fields ?? [],
    knowledgeGovernanceFabricPlanePhaseSnapshot:
      memoryGovernanceContext.knowledgeGovernanceFabricPlanePhaseSnapshot,
    knowledgeScopeLayers: memoryGovernanceContext.knowledgeSummary.scope_layers,
    knowledgeGovernanceClasses:
      memoryGovernanceContext.knowledgeSummary.governance_classes,
    scenarioGovernanceFabricPlanePhaseSnapshot:
      memoryGovernanceContext.scenarioGovernanceFabricPlanePhaseSnapshot,
    scenarioStrategyBundleId:
      memoryGovernanceContext.activeScenarioMemoryPackStrategy.strategy_bundle_id,
    activeScenarioOrchestrationMode:
      memoryGovernanceContext.activeScenarioMemoryPack.orchestration_mode
  });
  const { messages } = preparedRuntimeTurn.resources;
  const {
    runtimeTemporalContext,
    humanizedDeliveryPacket,
    systemPromptSections
  } = buildRuntimeCompositionArtifacts({
    preparedRuntimeTurn,
    latestUserMessageContent: args.latestUserMessageContent,
    allRecalledMemories: args.allRecalledMemories,
    replyLanguage: args.replyLanguage,
    answerQuestionType: args.answerQuestionType,
    answerStrategy: args.answerStrategy,
    answerCarryoverPolicy: args.answerCarryoverPolicy,
    answerForbiddenMoves: args.answerForbiddenMoves,
    answerSceneGoal: args.answerSceneGoal,
    threadContinuityPrompt: args.threadContinuityPrompt,
    compactedThreadSummary,
    memoryGovernanceContext,
    roleCoreCloseNoteArtifacts,
    detectNegativeProductFeedbackSignal:
      args.detectNegativeProductFeedbackSignal,
    hashString: args.hashString
  });
  const promptPreparation = buildRuntimePromptPreparation({
    systemPromptSections,
    assistantGenerationHint:
      typeof preparedRuntimeTurn.input.message.metadata?.assistant_generation_hint ===
        "string" &&
      preparedRuntimeTurn.input.message.metadata.assistant_generation_hint.trim()
        .length > 0
        ? preparedRuntimeTurn.input.message.metadata.assistant_generation_hint.trim()
        : null,
    messages
  });
  const executionContext: PreparedRuntimeGenerationExecutionContext = {
    ...promptPreparation,
    knowledgeRoute,
    knowledgeLoadLimit,
    knowledgeLoadDurationMs,
    runtimeTemporalContext,
    humanizedDeliveryPacket
  };
  const governanceHandoff: PreparedRuntimeGenerationGovernanceHandoff = {
    compactedThreadSummary,
    applicableKnowledge: memoryGovernanceContext.applicableKnowledge,
    knowledgeGatingWithOutcome:
      memoryGovernanceContext.knowledgeGatingWithOutcome,
    activeMemoryNamespace: memoryGovernanceContext.activeMemoryNamespace,
    activeScenarioMemoryPack: memoryGovernanceContext.activeScenarioMemoryPack
  };
  const closeNoteHandoff: PreparedRuntimeGenerationCloseNoteHandoff = {
    ...roleCoreCloseNoteArtifacts
  };
  const relationshipRecallHandoff: PreparedRuntimeGenerationRelationshipRecallHandoff =
    {
      relationshipRecallKeys,
      relationshipRecallMemoryIds,
      relationshipMemories: args.relationshipMemories
    };
  const postGenerationHandoff: PreparedRuntimeGenerationPostGenerationHandoff = {
    relationshipRecallHandoff,
    governanceHandoff,
    closeNoteHandoff
  };

  return {
    executionContext,
    postGenerationHandoff
  };
}
