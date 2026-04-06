import type { ApproxContextPressure } from "@/lib/chat/session-context";
import type { RuntimeThreadStateRecall } from "@/lib/chat/memory-recall";
import type { MemorySemanticLayer } from "@/lib/chat/memory-shared";
import type { PreparedOutputGovernanceV1 } from "@/lib/chat/output-governance";
import type {
  RoleCoreMemoryCloseNoteArchive,
  RoleCoreMemoryCloseNoteArtifact,
  RoleCoreMemoryCloseNoteHandoffPacket,
  RoleCoreMemoryCloseNotePersistenceEnvelope,
  RoleCoreMemoryCloseNotePersistenceManifest,
  RoleCoreMemoryCloseNotePersistencePayload,
  RoleCoreMemoryCloseNoteRecord,
  RoleCoreMemoryCloseNoteOutput
} from "@/lib/chat/role-core";
import { buildRuntimeMemorySemanticSummary } from "@/lib/chat/memory-records";
import {
  resolveScenarioGovernanceFabricPlanePhaseSnapshot,
  resolveScenarioMemoryPackPolicy,
  resolveScenarioMemoryPackStrategy,
  type ActiveScenarioMemoryPack
} from "@/lib/chat/memory-packs";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import type { RuntimeKnowledgeGatingSummary } from "@/lib/chat/runtime-knowledge-sources";
import type { PlannerCandidateSummary } from "@/lib/chat/memory-planner-candidates";
import type { RuntimeObservabilityRelationshipRecallMetadata } from "@/lib/chat/runtime-observability-contracts";
import {
  resolveNamespaceGovernanceFabricPlanePhaseSnapshot,
  resolveRuntimeMemoryBoundary,
  type ActiveRuntimeMemoryNamespace
} from "@/lib/chat/memory-namespace";
import { buildKnowledgeSummary } from "@/lib/chat/memory-knowledge";
import type { CompactedThreadSummary } from "@sparkcore/core-memory";
import { buildThreadCompactionSummary } from "@/lib/chat/thread-compaction";

export type BuildRuntimeDebugMetadataInput = {
  model_profile_id: string;
  answer_strategy: string;
  answer_strategy_reason_code: string | null;
  answer_carryover_policy?: string | null;
  answer_forbidden_moves?: string[];
  answer_scene_goal?: string | null;
  relationship_recall?: RuntimeObservabilityRelationshipRecallMetadata | null;
  recalled_memory_count: number;
  memory_types_used: string[];
  memory_semantic_layers?: Array<MemorySemanticLayer | null | undefined>;
  memory_recall_routes: Array<"profile" | "episode" | "timeline" | "thread_state">;
  memory_record_recall_preferred?: boolean;
  profile_fallback_suppressed?: boolean;
  profile_snapshot: string[];
  memory_write_request_count: number;
  memory_planner_summary?: PlannerCandidateSummary | null;
  follow_up_request_count: number;
  continuation_reason_code: string | null;
  recent_turn_count: number;
  context_pressure: ApproxContextPressure;
  thread_state_recall?: RuntimeThreadStateRecall | null;
  reply_language: string;
  scenario_memory_pack?: ActiveScenarioMemoryPack | null;
  relevant_knowledge?: RuntimeKnowledgeSnippet[];
  knowledge_gating?: RuntimeKnowledgeGatingSummary | null;
  active_memory_namespace?: ActiveRuntimeMemoryNamespace | null;
  compacted_thread_summary?: CompactedThreadSummary | null;
  output_governance?: PreparedOutputGovernanceV1 | null;
  role_core_close_note_handoff_packet?: RoleCoreMemoryCloseNoteHandoffPacket | null;
  role_core_close_note_artifact?: RoleCoreMemoryCloseNoteArtifact | null;
  role_core_close_note_archive?: RoleCoreMemoryCloseNoteArchive | null;
  role_core_close_note_persistence_envelope?: RoleCoreMemoryCloseNotePersistenceEnvelope | null;
  role_core_close_note_persistence_manifest?: RoleCoreMemoryCloseNotePersistenceManifest | null;
  role_core_close_note_persistence_payload?: RoleCoreMemoryCloseNotePersistencePayload | null;
  role_core_close_note_record?: RoleCoreMemoryCloseNoteRecord | null;
  role_core_close_note_output?: RoleCoreMemoryCloseNoteOutput | null;
};

export function buildRuntimeDebugMetadata(
  input: BuildRuntimeDebugMetadataInput
) {
  const scenarioPackStrategy = input.scenario_memory_pack
    ? resolveScenarioMemoryPackStrategy(input.scenario_memory_pack)
    : null;
  const scenarioPackPolicy = input.scenario_memory_pack
    ? resolveScenarioMemoryPackPolicy(input.scenario_memory_pack)
    : null;
  const scenarioPackPhaseSnapshot = input.scenario_memory_pack
    ? resolveScenarioGovernanceFabricPlanePhaseSnapshot(
        input.scenario_memory_pack
      )
    : null;
  const namespacePhaseSnapshot = input.active_memory_namespace
    ? resolveNamespaceGovernanceFabricPlanePhaseSnapshot(
        input.active_memory_namespace
      )
    : null;

  return {
    model_profile_id: input.model_profile_id,
    answer_strategy: {
      selected: input.answer_strategy,
      reason_code: input.answer_strategy_reason_code,
      carryover_policy: input.answer_carryover_policy ?? null,
      forbidden_moves: input.answer_forbidden_moves ?? [],
      scene_goal: input.answer_scene_goal ?? null
    },
    memory: {
      relationship_recall: input.relationship_recall ?? null,
      recalled_count: input.recalled_memory_count,
      types_used: input.memory_types_used,
      routes: input.memory_recall_routes,
      recall_policy: {
        memory_record_recall_preferred:
          input.memory_record_recall_preferred ?? false,
        profile_fallback_suppressed:
          input.profile_fallback_suppressed ?? false
      },
      profile_snapshot: input.profile_snapshot,
      semantic_summary: buildRuntimeMemorySemanticSummary({
        memoryTypesUsed: input.memory_types_used,
        profileSnapshot: input.profile_snapshot,
        hasThreadState: Boolean(input.thread_state_recall?.applied),
        threadStateFocusMode: input.thread_state_recall?.snapshot?.focus_mode ?? null,
        semanticLayersUsed: input.memory_semantic_layers
      }),
      close_note_handoff_packet:
        input.role_core_close_note_handoff_packet ?? null,
      close_note_artifact: input.role_core_close_note_artifact ?? null,
      close_note_archive: input.role_core_close_note_archive ?? null,
      close_note_persistence_envelope:
        input.role_core_close_note_persistence_envelope ?? null,
      close_note_persistence_manifest:
        input.role_core_close_note_persistence_manifest ?? null,
      close_note_persistence_payload:
        input.role_core_close_note_persistence_payload ?? null,
      close_note_record: input.role_core_close_note_record ?? null,
      close_note_output: input.role_core_close_note_output ?? null,
      pack: input.scenario_memory_pack
        ? {
            pack_id: input.scenario_memory_pack.pack_id,
            label: input.scenario_memory_pack.label,
            preferred_routes: input.scenario_memory_pack.preferred_routes,
            assembly_order: input.scenario_memory_pack.assembly_order,
            selection_reason: input.scenario_memory_pack.selection_reason,
            knowledge_priority_layer:
              input.scenario_memory_pack.knowledge_priority_layer,
            assembly_emphasis: input.scenario_memory_pack.assembly_emphasis,
            knowledge_route_weight:
              input.scenario_memory_pack.knowledge_route_weight,
            knowledge_budget_weight:
              input.scenario_memory_pack.knowledge_budget_weight,
            route_influence_reason:
              input.scenario_memory_pack.route_influence_reason,
            governance_route_bias:
              input.scenario_memory_pack.governance_route_bias,
            strategy_policy_id:
              scenarioPackPolicy?.strategy_policy_id ?? null,
            orchestration_mode:
              scenarioPackPolicy?.orchestration_mode ?? null,
            orchestration_digest_id:
              input.scenario_memory_pack.orchestration_digest_id,
            strategy_rationale_summary:
              input.scenario_memory_pack.strategy_rationale_summary,
            orchestration_coordination_summary:
              input.scenario_memory_pack.orchestration_coordination_summary,
            strategy_consistency_mode:
              input.scenario_memory_pack.strategy_consistency_mode,
            governance_convergence_digest_id:
              input.scenario_memory_pack.governance_convergence_digest_id,
            strategy_convergence_summary:
              input.scenario_memory_pack.strategy_convergence_summary,
            orchestration_alignment_mode:
              input.scenario_memory_pack.orchestration_alignment_mode,
            governance_unification_digest_id:
              input.scenario_memory_pack.governance_unification_digest_id,
            strategy_unification_summary:
              input.scenario_memory_pack.strategy_unification_summary,
            orchestration_unification_mode:
              input.scenario_memory_pack.orchestration_unification_mode,
            governance_consolidation_digest_id:
              input.scenario_memory_pack.governance_consolidation_digest_id,
            strategy_consolidation_summary:
              input.scenario_memory_pack.strategy_consolidation_summary,
            orchestration_consolidation_mode:
              input.scenario_memory_pack.orchestration_consolidation_mode,
            governance_coordination_digest_id:
              input.scenario_memory_pack.governance_coordination_digest_id,
            strategy_runtime_coordination_summary:
              input.scenario_memory_pack.strategy_runtime_coordination_summary,
            orchestration_coordination_mode_v9:
              input.scenario_memory_pack.orchestration_coordination_mode_v9,
            strategy_runtime_reuse_summary:
              input.scenario_memory_pack.strategy_runtime_reuse_summary,
            governance_coordination_reuse_mode:
              input.scenario_memory_pack.governance_coordination_reuse_mode,
            governance_plane_digest_id:
              input.scenario_memory_pack.governance_plane_digest_id,
            strategy_governance_plane_summary:
              input.scenario_memory_pack.strategy_governance_plane_summary,
            orchestration_governance_plane_mode:
              input.scenario_memory_pack.orchestration_governance_plane_mode,
            governance_plane_reuse_mode:
              input.scenario_memory_pack.governance_plane_reuse_mode,
            governance_fabric_digest_id:
              input.scenario_memory_pack.governance_fabric_digest_id,
            strategy_governance_fabric_summary:
              input.scenario_memory_pack.strategy_governance_fabric_summary,
            orchestration_governance_fabric_mode:
              input.scenario_memory_pack.orchestration_governance_fabric_mode,
            governance_fabric_reuse_mode:
              input.scenario_memory_pack.governance_fabric_reuse_mode,
            governance_fabric_plane_digest_id:
              input.scenario_memory_pack.governance_fabric_plane_digest_id,
            strategy_governance_fabric_plane_summary:
              input.scenario_memory_pack
                .strategy_governance_fabric_plane_summary,
            orchestration_governance_fabric_plane_mode:
              input.scenario_memory_pack
                .orchestration_governance_fabric_plane_mode,
            governance_fabric_plane_reuse_mode:
              input.scenario_memory_pack.governance_fabric_plane_reuse_mode,
            governance_fabric_plane_phase_snapshot: scenarioPackPhaseSnapshot,
            strategy_bundle_id:
              scenarioPackStrategy?.strategy_bundle_id ?? null,
            strategy_assembly_order:
              scenarioPackStrategy?.assembly_layer_order ?? []
          }
        : null,
      write_request_count: input.memory_write_request_count,
      planner_candidates_summary: input.memory_planner_summary ?? null
    },
    knowledge: {
      gating: input.knowledge_gating
        ? {
            knowledge_route: input.knowledge_gating.knowledge_route,
            available: input.knowledge_gating.available,
            available_count: input.knowledge_gating.available_count,
            should_inject: input.knowledge_gating.should_inject,
            injection_gap_reason: input.knowledge_gating.injection_gap_reason,
            suppressed: input.knowledge_gating.suppressed,
            suppression_reason: input.knowledge_gating.suppression_reason,
            query_token_count: input.knowledge_gating.query_token_count,
            retained_count: input.knowledge_gating.retained_count,
            zero_match_filtered_count:
              input.knowledge_gating.zero_match_filtered_count,
            weak_match_filtered_count:
              input.knowledge_gating.weak_match_filtered_count
          }
        : null,
      ...buildKnowledgeSummary({
        knowledge: input.relevant_knowledge ?? [],
        activeNamespace: input.active_memory_namespace ?? null
      })
    },
    governance: input.output_governance
      ? {
          role_expression: input.output_governance.role_expression,
          relationship_state: input.output_governance.relationship_state,
          scene_delivery: input.output_governance.scene_delivery,
          knowledge_route: input.output_governance.knowledge_route,
          output_governance: input.output_governance.output_governance
        }
      : null,
    memory_namespace: input.active_memory_namespace
      ? {
          namespace_id: input.active_memory_namespace.namespace_id,
          primary_layer: input.active_memory_namespace.primary_layer,
          active_layers: input.active_memory_namespace.active_layers,
          selection_reason: input.active_memory_namespace.selection_reason,
          policy_bundle_id: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).policy_bundle_id,
          policy_digest_id: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).policy_digest_id,
          governance_convergence_digest_id: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_convergence_digest_id,
          unified_governance_runtime_digest_id: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).unified_governance_runtime_digest_id,
          policy_coordination_summary: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).policy_coordination_summary,
          governance_consistency_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_consistency_mode,
          route_governance_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).route_governance_mode,
          retrieval_fallback_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).retrieval_fallback_mode,
          write_escalation_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).write_escalation_mode,
          governance_convergence_summary: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_convergence_summary,
          unified_governance_runtime_summary: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).unified_governance_runtime_summary,
          unified_runtime_alignment_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).unified_runtime_alignment_mode,
          unified_runtime_reuse_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).unified_runtime_reuse_mode,
          governance_consolidation_digest_id: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_consolidation_digest_id,
          governance_consolidation_summary: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_consolidation_summary,
          runtime_consolidation_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).runtime_consolidation_mode,
          unified_governance_consolidation_digest_id:
            resolveRuntimeMemoryBoundary(input.active_memory_namespace)
              .unified_governance_consolidation_digest_id,
          unified_governance_consolidation_summary:
            resolveRuntimeMemoryBoundary(input.active_memory_namespace)
              .unified_governance_consolidation_summary,
          unified_consolidation_alignment_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).unified_consolidation_alignment_mode,
          unified_consolidation_reuse_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).unified_consolidation_reuse_mode,
          unified_consolidation_coordination_summary:
            resolveRuntimeMemoryBoundary(input.active_memory_namespace)
              .unified_consolidation_coordination_summary,
          unified_consolidation_consistency_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).unified_consolidation_consistency_mode,
          governance_plane_runtime_digest_id: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_plane_runtime_digest_id,
          governance_plane_runtime_summary: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_plane_runtime_summary,
          governance_plane_alignment_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_plane_alignment_mode,
          governance_plane_reuse_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_plane_reuse_mode,
          governance_fabric_runtime_digest_id: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_fabric_runtime_digest_id,
          governance_fabric_runtime_summary: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_fabric_runtime_summary,
          governance_fabric_alignment_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_fabric_alignment_mode,
          governance_fabric_reuse_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_fabric_reuse_mode,
          governance_fabric_plane_digest_id: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_fabric_plane_digest_id,
          governance_fabric_plane_summary: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_fabric_plane_summary,
          governance_fabric_plane_alignment_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_fabric_plane_alignment_mode,
          governance_fabric_plane_reuse_mode: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).governance_fabric_plane_reuse_mode,
          governance_fabric_plane_phase_snapshot: namespacePhaseSnapshot,
          retrieval_write_digest_alignment: resolveRuntimeMemoryBoundary(
            input.active_memory_namespace
          ).retrieval_write_digest_alignment,
          refs: input.active_memory_namespace.refs
        }
      : null,
    thread_compaction: buildThreadCompactionSummary({
      compactedThreadSummary: input.compacted_thread_summary ?? null
    }),
    follow_up: {
      request_count: input.follow_up_request_count
    },
    session: {
      continuation_reason_code: input.continuation_reason_code,
      recent_turn_count: input.recent_turn_count,
      context_pressure: input.context_pressure,
      thread_state:
        input.thread_state_recall?.applied && input.thread_state_recall.snapshot
          ? {
              lifecycle_status:
                input.thread_state_recall.snapshot.lifecycle_status,
              focus_mode: input.thread_state_recall.snapshot.focus_mode,
              continuity_status:
                input.thread_state_recall.snapshot.continuity_status,
              current_language_hint:
                input.thread_state_recall.snapshot.current_language_hint
            }
          : null
    },
    reply_language: input.reply_language
  };
}
