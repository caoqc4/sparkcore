import type { MemorySourceRef, MemoryStability } from "./contract";

export type MemorySubjectType =
  | "user"
  | "assistant"
  | "role"
  | "agent"
  | "project"
  | "workspace"
  | "relationship"
  | "custom";

export type MemoryScopeRef = {
  user_id?: string | null;
  role_id?: string | null;
  thread_id?: string | null;
  project_id?: string | null;
  workspace_id?: string | null;
  agent_id?: string | null;
  world_id?: string | null;
};

export type MemorySubjectRef = {
  entity_type: MemorySubjectType;
  entity_id: string;
};

export type CanonicalMemoryType =
  | "episodic_fact"
  | "preference"
  | "relationship"
  | "feedback"
  | "goal"
  | "custom";

export type CanonicalMemoryStatus =
  | "active"
  | "superseded"
  | "invalidated"
  | "archived";

export type MemoryRecord = {
  memory_id: string;
  memory_type: CanonicalMemoryType;
  scope: MemoryScopeRef;
  subject: MemorySubjectRef;
  canonical_text: string;
  normalized_payload?: Record<string, unknown> | null;
  stability: MemoryStability;
  status: CanonicalMemoryStatus;
  confidence?: number | null;
  effective_at: string;
  invalid_at?: string | null;
  updated_at: string;
  source_refs: MemorySourceRef[];
};

export type StaticProfileRecord = {
  profile_id: string;
  subject_type: MemorySubjectType;
  subject_id: string;
  scope: MemoryScopeRef;
  key: string;
  value: unknown;
  confidence?: number | null;
  source_refs: MemorySourceRef[];
  updated_at: string;
};

export type DynamicProfileRecord = {
  profile_id: string;
  subject_type: MemorySubjectType;
  subject_id: string;
  scope: MemoryScopeRef;
  key: string;
  value: unknown;
  confidence?: number | null;
  effective_at: string;
  expires_at?: string | null;
  source_refs: MemorySourceRef[];
  updated_at: string;
};

export type MemoryRelationType =
  | "updates"
  | "extends"
  | "derives"
  | "supersedes"
  | "invalidates";

export type MemoryRelationRecord = {
  relation_id: string;
  relation_type: MemoryRelationType;
  from_memory_id: string;
  to_memory_id: string;
  scope: MemoryScopeRef;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

export type LegacyMemoryItemLike = {
  id?: string | null;
  workspace_id?: string | null;
  user_id?: string | null;
  category?: string | null;
  key?: string | null;
  value?: unknown;
  content?: string | null;
  scope?: string | null;
  target_agent_id?: string | null;
  target_thread_id?: string | null;
  subject_user_id?: string | null;
  confidence?: number | null;
  stability?: string | null;
  source_refs?: unknown;
  source_message_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function asMemorySourceRefs(
  sourceRefs: unknown,
  sourceMessageId?: string | null
): MemorySourceRef[] {
  if (Array.isArray(sourceRefs)) {
    return sourceRefs as MemorySourceRef[];
  }

  if (sourceRefs && typeof sourceRefs === "object") {
    return [sourceRefs as MemorySourceRef];
  }

  if (sourceMessageId) {
    return [
      {
        kind: "message",
        source_message_id: sourceMessageId
      }
    ];
  }

  return [];
}

function asMemoryStability(value: string | null | undefined): MemoryStability {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "medium";
}

function asCanonicalMemoryType(category: string | null | undefined): CanonicalMemoryType {
  if (category === "relationship") {
    return "relationship";
  }

  if (category === "goal") {
    return "goal";
  }

  if (category === "preference") {
    return "preference";
  }

  if (category === "profile") {
    return "episodic_fact";
  }

  return "custom";
}

export function buildMemoryScopeRefFromLegacy(
  memory: LegacyMemoryItemLike
): MemoryScopeRef {
  return {
    user_id: memory.user_id ?? memory.subject_user_id ?? null,
    workspace_id: memory.workspace_id ?? null,
    agent_id:
      memory.scope === "user_agent" ? (memory.target_agent_id ?? null) : null,
    thread_id:
      memory.scope === "thread_local" ? (memory.target_thread_id ?? null) : null
  };
}

export function buildMemorySubjectRefFromLegacy(
  memory: LegacyMemoryItemLike
): MemorySubjectRef {
  const userId = memory.subject_user_id ?? memory.user_id ?? "unknown_user";

  if (memory.category === "relationship") {
    return {
      entity_type: "relationship",
      entity_id: `user:${userId}`
    };
  }

  return {
    entity_type: "user",
    entity_id: `user:${userId}`
  };
}

export function buildMemoryRecordFromLegacy(
  memory: LegacyMemoryItemLike
): MemoryRecord {
  const effectiveAt =
    memory.created_at ?? memory.updated_at ?? new Date().toISOString();

  return {
    memory_id: memory.id ?? "legacy_memory",
    memory_type: asCanonicalMemoryType(memory.category),
    scope: buildMemoryScopeRefFromLegacy(memory),
    subject: buildMemorySubjectRefFromLegacy(memory),
    canonical_text:
      typeof memory.value === "string"
        ? memory.value
        : typeof memory.content === "string"
          ? memory.content
          : "",
    normalized_payload:
      typeof memory.key === "string"
        ? {
            key: memory.key,
            value: memory.value ?? memory.content ?? null,
            legacy_category: memory.category ?? null
          }
        : null,
    stability: asMemoryStability(memory.stability),
    status: "active",
    confidence: memory.confidence ?? null,
    effective_at: effectiveAt,
    invalid_at: null,
    updated_at: memory.updated_at ?? effectiveAt,
    source_refs: asMemorySourceRefs(memory.source_refs, memory.source_message_id)
  };
}
