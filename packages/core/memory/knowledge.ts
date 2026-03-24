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
