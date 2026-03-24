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
