import type { MemoryScopeRef } from "./records";

export type KnowledgeSourceKind =
  | "external_reference"
  | "project_document"
  | "workspace_note";

export type KnowledgeScopeLayer = "project" | "world" | "general";

export type KnowledgeGovernanceClass =
  | "authoritative"
  | "contextual"
  | "reference";

export type KnowledgeGovernanceCoordinationSummary =
  | "authoritative_priority_coordination"
  | "contextual_balance_coordination"
  | "reference_support_coordination"
  | "mixed_governance_coordination";

export type KnowledgeBudgetCoordinationMode =
  | "authoritative_budget_priority"
  | "contextual_budget_balance"
  | "reference_budget_support"
  | "mixed_budget_balance";

export type KnowledgeSourceGovernanceSummary =
  | "authoritative_source_priority"
  | "contextual_source_balance"
  | "reference_source_support"
  | "mixed_source_orchestration";

export type KnowledgeGovernanceConsistencyMode =
  | "authoritative_governance_aligned"
  | "contextual_governance_aligned"
  | "reference_governance_aligned"
  | "mixed_governance_aligned";

export type KnowledgeGovernanceConvergenceDigestId =
  | "authoritative_governance_convergence"
  | "contextual_governance_convergence"
  | "reference_governance_convergence"
  | "mixed_governance_convergence";

export type KnowledgeSourceBudgetAlignmentSummary =
  | "authoritative_budget_source_aligned"
  | "contextual_budget_source_aligned"
  | "reference_budget_source_aligned"
  | "mixed_budget_source_aligned";

export type KnowledgeGovernanceAlignmentMode =
  | "authoritative_convergence_aligned"
  | "contextual_convergence_aligned"
  | "reference_convergence_aligned"
  | "mixed_convergence_aligned";

export type KnowledgeGovernanceUnificationDigestId =
  | "authoritative_governance_unification"
  | "contextual_governance_unification"
  | "reference_governance_unification"
  | "mixed_governance_unification";

export type KnowledgeSourceBudgetUnificationSummary =
  | "authoritative_budget_source_unified"
  | "contextual_budget_source_unified"
  | "reference_budget_source_unified"
  | "mixed_budget_source_unified";

export type KnowledgeGovernanceUnificationMode =
  | "authoritative_runtime_unified"
  | "contextual_runtime_unified"
  | "reference_runtime_unified"
  | "mixed_runtime_unified";

export type KnowledgeGovernanceConsolidationDigestId =
  | "authoritative_governance_consolidation"
  | "contextual_governance_consolidation"
  | "reference_governance_consolidation"
  | "mixed_governance_consolidation";

export type KnowledgeSourceBudgetConsolidationSummary =
  | "authoritative_budget_source_consolidated"
  | "contextual_budget_source_consolidated"
  | "reference_budget_source_consolidated"
  | "mixed_budget_source_consolidated";

export type KnowledgeGovernanceConsolidationMode =
  | "authoritative_runtime_consolidated"
  | "contextual_runtime_consolidated"
  | "reference_runtime_consolidated"
  | "mixed_runtime_consolidated";

export type KnowledgeGovernanceCoordinationDigestId =
  | "authoritative_governance_coordination"
  | "contextual_governance_coordination"
  | "reference_governance_coordination"
  | "mixed_governance_coordination";

export type KnowledgeSourceBudgetCoordinationSummary =
  | "authoritative_budget_source_coordination"
  | "contextual_budget_source_coordination"
  | "reference_budget_source_coordination"
  | "mixed_budget_source_coordination";

export type KnowledgeGovernanceCoordinationMode =
  | "authoritative_runtime_coordination"
  | "contextual_runtime_coordination"
  | "reference_runtime_coordination"
  | "mixed_runtime_coordination";

export type KnowledgeSelectionRuntimeCoordinationSummary =
  | "authoritative_selection_runtime_coordination"
  | "contextual_selection_runtime_coordination"
  | "reference_selection_runtime_coordination"
  | "mixed_selection_runtime_coordination";

export type KnowledgeGovernanceCoordinationReuseMode =
  | "authoritative_runtime_coordination_reuse"
  | "contextual_runtime_coordination_reuse"
  | "reference_runtime_coordination_reuse"
  | "mixed_runtime_coordination_reuse";

export type KnowledgeGovernancePlaneDigestId =
  | "authoritative_governance_plane"
  | "contextual_governance_plane"
  | "reference_governance_plane"
  | "mixed_governance_plane";

export type KnowledgeSourceBudgetGovernancePlaneSummary =
  | "authoritative_budget_source_governance_plane"
  | "contextual_budget_source_governance_plane"
  | "reference_budget_source_governance_plane"
  | "mixed_budget_source_governance_plane";

export type KnowledgeGovernancePlaneMode =
  | "authoritative_runtime_governance_plane"
  | "contextual_runtime_governance_plane"
  | "reference_runtime_governance_plane"
  | "mixed_runtime_governance_plane";

export type KnowledgeGovernancePlaneReuseMode =
  | "authoritative_runtime_governance_plane_reuse"
  | "contextual_runtime_governance_plane_reuse"
  | "reference_runtime_governance_plane_reuse"
  | "mixed_runtime_governance_plane_reuse";

export type KnowledgeGovernanceFabricDigestId =
  | "authoritative_governance_fabric"
  | "contextual_governance_fabric"
  | "reference_governance_fabric"
  | "mixed_governance_fabric";

export type KnowledgeSourceBudgetGovernanceFabricSummary =
  | "authoritative_budget_source_governance_fabric"
  | "contextual_budget_source_governance_fabric"
  | "reference_budget_source_governance_fabric"
  | "mixed_budget_source_governance_fabric";

export type KnowledgeGovernanceFabricMode =
  | "authoritative_runtime_governance_fabric"
  | "contextual_runtime_governance_fabric"
  | "reference_runtime_governance_fabric"
  | "mixed_runtime_governance_fabric";

export type KnowledgeGovernanceFabricReuseMode =
  | "authoritative_runtime_governance_fabric_reuse"
  | "contextual_runtime_governance_fabric_reuse"
  | "reference_runtime_governance_fabric_reuse"
  | "mixed_runtime_governance_fabric_reuse";

export type KnowledgeResource = {
  resource_id: string;
  scope: MemoryScopeRef;
  title: string;
  source_kind: KnowledgeSourceKind;
  uri?: string | null;
  updated_at: string;
};

export type KnowledgeSnapshot = {
  snapshot_id: string;
  resource_id: string;
  scope: MemoryScopeRef;
  title: string;
  summary: string;
  source_kind: KnowledgeSourceKind;
  captured_at: string;
};

export type KnowledgeLink = {
  link_id: string;
  from_subject_type: "agent" | "thread" | "project" | "workspace";
  from_subject_id: string;
  snapshot_id: string;
  relation_type: "references" | "grounds" | "supports";
  created_at: string;
};
