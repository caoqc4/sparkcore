import type { MemoryScopeRef } from "./records";

export type KnowledgeSourceKind =
  | "external_reference"
  | "project_document"
  | "workspace_note";

export type KnowledgeScopeLayer = "project" | "world" | "general";

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
