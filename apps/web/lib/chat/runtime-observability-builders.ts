import { getModelProfileTierLabel, getModelProfileUsageNote, getUnderlyingModelLabel } from "@/lib/chat/model-profile-metadata";
import type { MemorySemanticLayer, RecalledMemory } from "@/lib/chat/memory-shared";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import type { PlannerCandidateSummary } from "@/lib/chat/memory-planner-candidates";
import {
  buildRuntimeAssistantMetadataInput,
  type BuildRuntimeAssistantMetadataInput
} from "@/lib/chat/runtime-assistant-metadata";
import {
  buildRuntimeDebugMetadata,
  type BuildRuntimeDebugMetadataInput
} from "@/lib/chat/runtime-debug-metadata";
import type { RuntimeKnowledgeGatingSummary } from "@/lib/chat/runtime-knowledge-sources";
import type { RuntimeModelProfileRecord } from "@/lib/chat/runtime-model-profile-resolution";
import type { ReplyLanguageSource, RuntimeReplyLanguage } from "@/lib/chat/role-core";
import { detectReplyLanguageFromText } from "@/lib/chat/runtime-composition-context";
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
import type { CompactedThreadSummary } from "@sparkcore/core-memory";
import type { ActiveScenarioMemoryPack } from "@/lib/chat/memory-packs";
import type {
  BuildObservedMemoryTypesArgs,
  BuildRuntimeRelationshipRecallMetadataArgs,
  BuildRuntimeObservabilityInputsArgs,
  RuntimeObservabilityArtifacts,
  RuntimeObservabilityRelationshipRecallMetadata
} from "@/lib/chat/runtime-observability-contracts";
export type {
  BuildObservedMemoryTypesArgs,
  BuildRuntimeRelationshipRecallMetadataArgs,
  BuildRuntimeObservabilityInputsArgs,
  RuntimeObservabilityArtifacts,
  RuntimeObservabilityRelationshipRecallMetadata
} from "@/lib/chat/runtime-observability-contracts";

function buildRelationshipRecallMetadata(
  args: BuildRuntimeRelationshipRecallMetadataArgs
): RuntimeObservabilityRelationshipRecallMetadata {
  return {
    used: args.relationshipMemories.length > 0,
    direct_naming_question: args.relationshipRecall.directNamingQuestion,
    direct_preferred_name_question:
      args.relationshipRecall.directPreferredNameQuestion,
    relationship_style_prompt: args.relationshipRecall.relationshipStylePrompt,
    same_thread_continuity: args.relationshipRecall.sameThreadContinuity,
    recalled_keys: args.relationshipRecallKeys,
    recalled_memory_ids: args.relationshipMemories.map((memory) => memory.memory_id),
    adopted_agent_nickname_target:
      args.relationshipRecall.nicknameMemory?.content ?? null,
    adopted_user_preferred_name_target:
      args.relationshipRecall.preferredNameMemory?.content ?? null
  };
}

function buildObservedMemoryTypes(args: BuildObservedMemoryTypesArgs): string[] {
  return args.relationshipMemories.length > 0
    ? Array.from(
        new Set([...args.memoryRecall.usedMemoryTypes, "relationship" as const])
      )
    : args.memoryRecall.usedMemoryTypes;
}

function buildObservedMemorySemanticLayers(
  allRecalledMemories: RecalledMemory[]
): MemorySemanticLayer[] {
  return Array.from(
    new Set(
      allRecalledMemories
        .map((memory) => memory.semantic_layer)
        .filter((layer): layer is MemorySemanticLayer => Boolean(layer))
    )
  );
}

function buildAssistantMetadataInput(
  args: BuildRuntimeObservabilityInputsArgs
): BuildRuntimeAssistantMetadataInput {
  const relationshipRecallMetadata = buildRelationshipRecallMetadata({
    relationshipRecall: args.relationshipRecall,
    relationshipMemories: args.relationshipMemories,
    relationshipRecallKeys: args.relationshipRecallKeys
  });
  const observedMemoryTypes = buildObservedMemoryTypes({
    relationshipMemories: args.relationshipMemories,
    memoryRecall: args.memoryRecall
  });
  const observedSemanticLayers = buildObservedMemorySemanticLayers(
    args.allRecalledMemories
  );

  return {
    agent: {
      id: args.agent.id,
      name: args.agent.name
    },
    model: {
      result_model: args.resultModel,
      provider: args.modelProfile.provider,
      requested: args.modelProfile.model,
      profile_id: args.modelProfile.id,
      profile_name: args.modelProfile.name,
      profile_tier_label: getModelProfileTierLabel(args.modelProfile.metadata),
      profile_usage_note: getModelProfileUsageNote(args.modelProfile.metadata),
      underlying_label:
        getUnderlyingModelLabel(args.modelProfile.metadata) ??
        `${args.modelProfile.provider}/${args.resultModel ?? args.modelProfile.model}`
    },
    runtime: {
      role_core_packet: args.preparedRuntimeTurn.role.role_core,
      role_core_close_note_handoff_packet:
        args.roleCoreCloseNoteHandoffPacket ?? null,
      role_core_close_note_artifact: args.roleCoreCloseNoteArtifact ?? null,
      role_core_close_note_archive: args.roleCoreCloseNoteArchive ?? null,
      role_core_close_note_persistence_envelope:
        args.roleCoreCloseNotePersistenceEnvelope ?? null,
      role_core_close_note_persistence_manifest:
        args.roleCoreCloseNotePersistenceManifest ?? null,
      role_core_close_note_persistence_payload:
        args.roleCoreCloseNotePersistencePayload ?? null,
      role_core_close_note_record: args.roleCoreCloseNoteRecord ?? null,
      role_core_close_note_output: args.roleCoreCloseNoteOutput ?? null,
      runtime_input: args.preparedRuntimeTurn.input,
      session_thread_id: args.preparedRuntimeTurn.session.thread_id,
      session_agent_id: args.preparedRuntimeTurn.session.agent_id,
      current_message_id: args.preparedRuntimeTurn.session.current_message_id,
      recent_raw_turn_count: args.preparedRuntimeTurn.session.recent_raw_turn_count,
      approx_context_pressure:
        args.preparedRuntimeTurn.session.approx_context_pressure,
      output_governance: args.preparedRuntimeTurn.governance?.output_governance ?? null
    },
    reply_language: {
      target: args.replyLanguage,
      detected: detectReplyLanguageFromText(args.finalAssistantContent),
      source: args.replyLanguageSource
    },
    answer: {
      question_type: args.answerQuestionType,
      strategy: args.answerStrategy,
      strategy_reason_code: args.answerStrategyReasonCode,
      strategy_priority: args.answerStrategyPriority,
      strategy_priority_label: args.answerStrategyPriorityLabel,
      carryover_policy: args.answerCarryoverPolicy,
      forbidden_moves: args.answerForbiddenMoves,
      scene_goal: args.answerSceneGoal,
      relationship_recall: relationshipRecallMetadata
    },
    session: {
      continuation_reason_code: args.continuationReasonCode,
      thread_state:
        args.preparedRuntimeTurn.memory.runtime_memory_context.threadStateRecall
          .snapshot
          ? {
              lifecycle_status:
                args.preparedRuntimeTurn.memory.runtime_memory_context
                  .threadStateRecall.snapshot.lifecycle_status,
              focus_mode:
                args.preparedRuntimeTurn.memory.runtime_memory_context
                  .threadStateRecall.snapshot.focus_mode ?? null,
              continuity_status:
                args.preparedRuntimeTurn.memory.runtime_memory_context
                  .threadStateRecall.snapshot.continuity_status ?? null,
              current_language_hint:
                args.preparedRuntimeTurn.memory.runtime_memory_context
                  .threadStateRecall.snapshot.current_language_hint ?? null
            }
          : null,
      same_thread_continuation_applicable:
        args.sameThreadContinuationApplicable,
      long_chain_pressure_candidate: args.longChainPressureCandidate,
      same_thread_continuation_preferred: args.preferSameThreadContinuation,
      distant_memory_fallback_allowed: !args.preferSameThreadContinuation
    },
    memory: {
      recalled_memories: args.allRecalledMemories.map((memory) => ({
        memory_type: memory.memory_type,
        content: memory.content,
        confidence: memory.confidence,
        semantic_layer: memory.semantic_layer ?? null
      })),
      hit_count: args.allRecalledMemories.length,
      used: args.allRecalledMemories.length > 0,
      types_used: observedMemoryTypes,
      semantic_layers: observedSemanticLayers,
      memory_record_recall_preferred:
        args.memoryRecall.memoryRecordRecallPreferred === true,
      profile_fallback_suppressed:
        args.memoryRecall.profileFallbackSuppressed === true,
      profile_snapshot: args.recalledProfileSnapshot,
      scenario_pack: args.activeScenarioMemoryPack,
      hidden_exclusion_count: args.memoryRecall.hiddenExclusionCount,
      incorrect_exclusion_count: args.memoryRecall.incorrectExclusionCount
    },
    knowledge: {
      snippets: args.applicableKnowledge,
      gating: args.knowledgeGatingWithOutcome
    },
    namespace: {
      active_namespace: args.activeMemoryNamespace
    },
    compaction: {
      summary: args.compactedThreadSummary
    },
    follow_up: {
      request_count: args.followUpRequestCount
    }
  };
}

function buildDebugMetadataInput(
  args: BuildRuntimeObservabilityInputsArgs
): BuildRuntimeDebugMetadataInput {
  const relationshipRecallMetadata = buildRelationshipRecallMetadata({
    relationshipRecall: args.relationshipRecall,
    relationshipMemories: args.relationshipMemories,
    relationshipRecallKeys: args.relationshipRecallKeys
  });
  const observedMemoryTypes = buildObservedMemoryTypes({
    relationshipMemories: args.relationshipMemories,
    memoryRecall: args.memoryRecall
  });
  const observedSemanticLayers = buildObservedMemorySemanticLayers(
    args.allRecalledMemories
  );

  return {
    model_profile_id: args.modelProfile.id,
    answer_strategy: args.answerStrategy,
    answer_strategy_reason_code: args.answerStrategyReasonCode,
    answer_carryover_policy: args.answerCarryoverPolicy,
    answer_forbidden_moves: args.answerForbiddenMoves,
    answer_scene_goal: args.answerSceneGoal,
    relationship_recall: relationshipRecallMetadata,
    recalled_memory_count: args.allRecalledMemories.length,
    memory_types_used: observedMemoryTypes,
    memory_semantic_layers: observedSemanticLayers,
    memory_recall_routes: args.memoryRecall.appliedRoutes,
    memory_record_recall_preferred:
      args.memoryRecall.memoryRecordRecallPreferred === true,
    profile_fallback_suppressed:
      args.memoryRecall.profileFallbackSuppressed === true,
    profile_snapshot: args.recalledProfileSnapshot,
    memory_write_request_count: args.memoryWriteRequestCount,
    memory_planner_summary: args.memoryPlannerSummary,
    follow_up_request_count: args.followUpRequestCount,
    continuation_reason_code: args.continuationReasonCode,
    recent_turn_count: args.recentRawTurnCount,
    context_pressure: args.approxContextPressure,
    thread_state_recall:
      args.preparedRuntimeTurn.memory.runtime_memory_context.threadStateRecall,
    reply_language: args.replyLanguage,
    output_governance: args.preparedRuntimeTurn.governance ?? null,
    scenario_memory_pack: args.activeScenarioMemoryPack,
    relevant_knowledge: args.applicableKnowledge,
    knowledge_gating: args.knowledgeGatingWithOutcome,
    active_memory_namespace: args.activeMemoryNamespace,
    compacted_thread_summary: args.compactedThreadSummary,
    role_core_close_note_handoff_packet:
      args.roleCoreCloseNoteHandoffPacket ?? null,
    role_core_close_note_artifact: args.roleCoreCloseNoteArtifact ?? null,
    role_core_close_note_record: args.roleCoreCloseNoteRecord ?? null,
    role_core_close_note_archive: args.roleCoreCloseNoteArchive ?? null,
    role_core_close_note_persistence_envelope:
      args.roleCoreCloseNotePersistenceEnvelope ?? null,
    role_core_close_note_persistence_manifest:
      args.roleCoreCloseNotePersistenceManifest ?? null,
    role_core_close_note_persistence_payload:
      args.roleCoreCloseNotePersistencePayload ?? null,
    role_core_close_note_output: args.roleCoreCloseNoteOutput ?? null
  };
}

export function buildRuntimeObservabilityArtifacts(
  args: BuildRuntimeObservabilityInputsArgs
): RuntimeObservabilityArtifacts {
  const assistantMetadataInput = buildAssistantMetadataInput(args);
  const debugMetadataInput = buildDebugMetadataInput(args);

  return {
    assistantMetadataInput,
    assistantMetadata: buildRuntimeAssistantMetadataInput(assistantMetadataInput),
    debugMetadataInput,
    debugMetadata: buildRuntimeDebugMetadata(debugMetadataInput)
  };
}
