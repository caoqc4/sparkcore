import type {
  ActiveScenarioMemoryPack,
  resolveScenarioGovernanceFabricPlanePhaseSnapshot
} from "@/lib/chat/memory-packs";
import type { resolveNamespaceGovernanceFabricPlanePhaseSnapshot } from "@/lib/chat/memory-namespace";
import type { resolveKnowledgeGovernanceFabricPlanePhaseSnapshot } from "@/lib/chat/memory-knowledge";
import type { resolveThreadGovernanceFabricPlanePhaseSnapshot } from "@/lib/chat/thread-compaction";
import {
  buildRoleCoreMemoryCloseNoteArtifact,
  buildRoleCoreMemoryCloseNoteArchive,
  buildRoleCoreMemoryCloseNotePersistenceEnvelope,
  buildRoleCoreMemoryCloseNotePersistenceManifest,
  buildRoleCoreMemoryCloseNoteHandoffPacket,
  buildRoleCoreMemoryCloseNoteOutput,
  buildRoleCoreMemoryCloseNotePersistencePayload,
  buildRoleCoreMemoryCloseNoteRecord,
  type RoleCoreMemoryCloseNoteArchive,
  type RoleCoreMemoryCloseNoteArtifact,
  type RoleCoreMemoryCloseNoteHandoffPacket,
  type RoleCoreMemoryCloseNoteOutput,
  type RoleCoreMemoryCloseNotePersistenceEnvelope,
  type RoleCoreMemoryCloseNotePersistenceManifest,
  type RoleCoreMemoryCloseNotePersistencePayload,
  type RoleCoreMemoryCloseNoteRecord,
  type RoleCorePacket,
  withRoleCoreMemoryHandoff
} from "@/lib/chat/role-core";

type RuntimeRoleCoreCloseNoteArtifacts = {
  roleCorePacketWithMemoryHandoff: RoleCorePacket;
  roleCoreCloseNoteHandoffPacket: RoleCoreMemoryCloseNoteHandoffPacket | null;
  roleCoreCloseNoteArtifact: RoleCoreMemoryCloseNoteArtifact | null;
  roleCoreCloseNoteOutput: RoleCoreMemoryCloseNoteOutput | null;
  roleCoreCloseNoteRecord: RoleCoreMemoryCloseNoteRecord | null;
  roleCoreCloseNoteArchive: RoleCoreMemoryCloseNoteArchive | null;
  roleCoreCloseNotePersistencePayload: RoleCoreMemoryCloseNotePersistencePayload | null;
  roleCoreCloseNotePersistenceEnvelope: RoleCoreMemoryCloseNotePersistenceEnvelope | null;
  roleCoreCloseNotePersistenceManifest: RoleCoreMemoryCloseNotePersistenceManifest | null;
};

export function buildRuntimeRoleCoreCloseNoteArtifacts(args: {
  roleCorePacket: RoleCorePacket;
  namespaceGovernanceFabricPlanePhaseSnapshot: ReturnType<
    typeof resolveNamespaceGovernanceFabricPlanePhaseSnapshot
  >;
  retentionGovernanceFabricPlanePhaseSnapshot: ReturnType<
    typeof resolveThreadGovernanceFabricPlanePhaseSnapshot
  > | null;
  retentionDecisionGroup: string | null;
  retentionRetainedFields: string[];
  knowledgeGovernanceFabricPlanePhaseSnapshot: ReturnType<
    typeof resolveKnowledgeGovernanceFabricPlanePhaseSnapshot
  >;
  knowledgeScopeLayers: string[];
  knowledgeGovernanceClasses: string[];
  scenarioGovernanceFabricPlanePhaseSnapshot: ReturnType<
    typeof resolveScenarioGovernanceFabricPlanePhaseSnapshot
  >;
  scenarioStrategyBundleId: string | null;
  activeScenarioOrchestrationMode: ActiveScenarioMemoryPack["orchestration_mode"] | null;
}): RuntimeRoleCoreCloseNoteArtifacts {
  const roleCorePacketWithMemoryHandoff = withRoleCoreMemoryHandoff({
    packet: args.roleCorePacket,
    memoryHandoff: {
      handoff_version: "v1",
      namespace_phase_snapshot_id:
        args.namespaceGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id,
      namespace_phase_snapshot_summary:
        args.namespaceGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary,
      retention_phase_snapshot_id:
        args.retentionGovernanceFabricPlanePhaseSnapshot?.phase_snapshot_id ?? null,
      retention_phase_snapshot_summary:
        args.retentionGovernanceFabricPlanePhaseSnapshot?.phase_snapshot_summary ??
        null,
      retention_decision_group: args.retentionDecisionGroup,
      retention_retained_fields: args.retentionRetainedFields,
      knowledge_phase_snapshot_id:
        args.knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id,
      knowledge_phase_snapshot_summary:
        args.knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary,
      knowledge_scope_layers: args.knowledgeScopeLayers,
      knowledge_governance_classes: args.knowledgeGovernanceClasses,
      scenario_phase_snapshot_id:
        args.scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id,
      scenario_phase_snapshot_summary:
        args.scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary,
      scenario_strategy_bundle_id: args.scenarioStrategyBundleId,
      scenario_orchestration_mode: args.activeScenarioOrchestrationMode
    }
  });

  const roleCoreCloseNoteHandoffPacket = buildRoleCoreMemoryCloseNoteHandoffPacket(
    {
      roleCorePacket: roleCorePacketWithMemoryHandoff,
      readinessJudgment: "close_ready",
      progressRange: "60% - 65%",
      closeCandidate: true,
      closeNoteRecommended: true,
      blockingItems: [],
      nonBlockingItems: [
        "close_note_acceptance_structuring",
        "close_note_gate_snapshot_consumption",
        "close_readiness_handoff_alignment"
      ],
      tailCandidateItems: [
        "packet_output_symmetry_cleanup",
        "non_blocking_packet_negative_coverage",
        "close_note_tail_cleanup_alignment"
      ],
      acceptanceGapBuckets: {
        blocking: 0,
        non_blocking: 3,
        tail_candidate: 3
      },
      nextExpansionFocus: [
        "close_note_acceptance_structuring",
        "close_note_gate_snapshot_consumption",
        "close_readiness_handoff_alignment"
      ]
    }
  );
  const roleCoreCloseNoteArtifact = buildRoleCoreMemoryCloseNoteArtifact({
    roleCorePacket: roleCorePacketWithMemoryHandoff,
    closeNoteHandoffPacket: roleCoreCloseNoteHandoffPacket
  });
  const roleCoreCloseNoteOutput = buildRoleCoreMemoryCloseNoteOutput({
    roleCorePacket: roleCorePacketWithMemoryHandoff,
    closeNoteHandoffPacket: roleCoreCloseNoteHandoffPacket,
    closeNoteArtifact: roleCoreCloseNoteArtifact
  });
  const roleCoreCloseNoteRecord = buildRoleCoreMemoryCloseNoteRecord({
    roleCorePacket: roleCorePacketWithMemoryHandoff,
    closeNoteOutput: roleCoreCloseNoteOutput,
    closeNoteArtifact: roleCoreCloseNoteArtifact
  });
  const roleCoreCloseNoteArchive = buildRoleCoreMemoryCloseNoteArchive({
    roleCorePacket: roleCorePacketWithMemoryHandoff,
    closeNoteRecord: roleCoreCloseNoteRecord,
    closeNoteOutput: roleCoreCloseNoteOutput
  });
  const roleCoreCloseNotePersistencePayload =
    buildRoleCoreMemoryCloseNotePersistencePayload({
      roleCorePacket: roleCorePacketWithMemoryHandoff,
      closeNoteArchive: roleCoreCloseNoteArchive,
      closeNoteRecord: roleCoreCloseNoteRecord
    });
  const roleCoreCloseNotePersistenceEnvelope =
    buildRoleCoreMemoryCloseNotePersistenceEnvelope({
      roleCorePacket: roleCorePacketWithMemoryHandoff,
      closeNotePersistencePayload: roleCoreCloseNotePersistencePayload,
      closeNoteArchive: roleCoreCloseNoteArchive
    });
  const roleCoreCloseNotePersistenceManifest =
    buildRoleCoreMemoryCloseNotePersistenceManifest({
      roleCorePacket: roleCorePacketWithMemoryHandoff,
      closeNotePersistenceEnvelope: roleCoreCloseNotePersistenceEnvelope,
      closeNotePersistencePayload: roleCoreCloseNotePersistencePayload
    });

  return {
    roleCorePacketWithMemoryHandoff,
    roleCoreCloseNoteHandoffPacket,
    roleCoreCloseNoteArtifact,
    roleCoreCloseNoteOutput,
    roleCoreCloseNoteRecord,
    roleCoreCloseNoteArchive,
    roleCoreCloseNotePersistencePayload,
    roleCoreCloseNotePersistenceEnvelope,
    roleCoreCloseNotePersistenceManifest
  };
}
