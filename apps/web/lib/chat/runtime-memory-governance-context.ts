import {
  buildKnowledgeSummary,
  filterKnowledgeByActiveNamespace,
  resolveKnowledgeGovernanceFabricPlanePhaseSnapshot,
  type RuntimeKnowledgeSnippet
} from "@/lib/chat/memory-knowledge";
import {
  resolveActiveScenarioMemoryPack,
  resolveScenarioGovernanceFabricPlanePhaseSnapshot,
  resolveScenarioMemoryPackStrategy
} from "@/lib/chat/memory-packs";
import {
  resolveActiveMemoryNamespace,
  resolveNamespaceGovernanceFabricPlanePhaseSnapshot
} from "@/lib/chat/memory-namespace";
import type { RuntimeKnowledgeGatingSummary } from "@/lib/chat/runtime-knowledge-sources";
import {
  resolveThreadGovernanceFabricPlanePhaseSnapshot,
  selectRetainedThreadCompactionSummary
} from "@/lib/chat/thread-compaction";

export function buildRuntimeMemoryGovernanceContext(args: {
  userId: string;
  agentId: string;
  threadId: string;
  relevantKnowledge: RuntimeKnowledgeSnippet[];
  knowledgeGating: RuntimeKnowledgeGatingSummary;
  compactedThreadSummary: ReturnType<
    typeof selectRetainedThreadCompactionSummary
  > | null;
}) {
  const activeMemoryNamespace = resolveActiveMemoryNamespace({
    userId: args.userId,
    agentId: args.agentId,
    threadId: args.threadId,
    relevantKnowledge: args.relevantKnowledge
  });
  const applicableKnowledge = filterKnowledgeByActiveNamespace({
    knowledge: args.relevantKnowledge,
    namespace: activeMemoryNamespace
  });
  const knowledgeInjectionGapReason =
    args.knowledgeGating.should_inject && applicableKnowledge.length === 0
      ? "namespace_filtered_after_availability"
      : null;
  const knowledgeGatingWithOutcome = {
    ...args.knowledgeGating,
    injection_gap_reason: knowledgeInjectionGapReason
  };
  const activeScenarioMemoryPack = resolveActiveScenarioMemoryPack({
    activeNamespace: activeMemoryNamespace,
    relevantKnowledge: applicableKnowledge
  });
  const namespaceGovernanceFabricPlanePhaseSnapshot =
    resolveNamespaceGovernanceFabricPlanePhaseSnapshot(activeMemoryNamespace);
  const retentionGovernanceFabricPlanePhaseSnapshot = args.compactedThreadSummary
    ? resolveThreadGovernanceFabricPlanePhaseSnapshot({
        lifecycle_governance_fabric_plane_digest:
          args.compactedThreadSummary.lifecycle_governance_fabric_plane_digest,
        keep_drop_governance_fabric_plane_summary:
          args.compactedThreadSummary.keep_drop_governance_fabric_plane_summary,
        lifecycle_governance_fabric_plane_alignment_mode:
          args.compactedThreadSummary
            .lifecycle_governance_fabric_plane_alignment_mode,
        lifecycle_governance_fabric_plane_reuse_mode:
          args.compactedThreadSummary.lifecycle_governance_fabric_plane_reuse_mode,
        retention_section_order:
          args.compactedThreadSummary.retention_section_order,
        retained_fields: args.compactedThreadSummary.retained_fields
      })
    : null;
  const knowledgeSummary = buildKnowledgeSummary({
    knowledge: applicableKnowledge,
    activeNamespace: activeMemoryNamespace
  });
  const knowledgeGovernanceFabricPlanePhaseSnapshot =
    resolveKnowledgeGovernanceFabricPlanePhaseSnapshot({
      governanceFabricPlaneDigest:
        knowledgeSummary.governance_fabric_plane_digest,
      sourceBudgetGovernanceFabricPlaneSummary:
        knowledgeSummary.source_budget_governance_fabric_plane_summary,
      governanceFabricPlaneMode: knowledgeSummary.governance_fabric_plane_mode,
      governanceFabricPlaneReuseMode:
        knowledgeSummary.governance_fabric_plane_reuse_mode,
      applicableKnowledge
    });
  const scenarioGovernanceFabricPlanePhaseSnapshot =
    resolveScenarioGovernanceFabricPlanePhaseSnapshot(activeScenarioMemoryPack);
  const activeScenarioMemoryPackStrategy =
    resolveScenarioMemoryPackStrategy(activeScenarioMemoryPack);

  return {
    activeMemoryNamespace,
    applicableKnowledge,
    knowledgeGatingWithOutcome,
    activeScenarioMemoryPack,
    namespaceGovernanceFabricPlanePhaseSnapshot,
    retentionGovernanceFabricPlanePhaseSnapshot,
    knowledgeSummary,
    knowledgeGovernanceFabricPlanePhaseSnapshot,
    scenarioGovernanceFabricPlanePhaseSnapshot,
    activeScenarioMemoryPackStrategy
  };
}
