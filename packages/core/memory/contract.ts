export type LegacyMemoryType = "profile" | "preference";

export type MemoryCategory =
  | "profile"
  | "preference"
  | "relationship"
  | "goal";

export type MemoryScope = "user_global" | "user_agent" | "thread_local";

export type MemoryStability = "low" | "medium" | "high";

export type MemoryStatus =
  | "active"
  | "hidden"
  | "incorrect"
  | "superseded";

export type SupportedSingleSlotKey =
  | "profile.profession"
  | "preference.reply_language"
  | "relationship.agent_nickname"
  | "relationship.user_preferred_name"
  | "relationship.user_address_style";

export type MemorySourceRef =
  | {
      kind: "message";
      source_message_id: string;
    }
  | Record<string, unknown>;

export type MemoryRecord = {
  id?: string;
  workspace_id?: string;
  user_id?: string;
  agent_id?: string | null;
  source_message_id?: string | null;
  memory_type?: string | null;
  content?: string | null;
  confidence?: number;
  importance?: number;
  metadata?: Record<string, unknown> | null;
  category?: string | null;
  key?: string | null;
  value?: unknown;
  scope?: string | null;
  subject_user_id?: string | null;
  target_agent_id?: string | null;
  target_thread_id?: string | null;
  stability?: string | null;
  status?: string | null;
  source_refs?: unknown;
  created_at?: string;
  updated_at?: string;
  last_used_at?: string | null;
  last_confirmed_at?: string | null;
};

export type MemoryWriteRequest = {
  category: MemoryCategory;
  key: string;
  value: unknown;
  scope: MemoryScope;
  subject_user_id: string;
  target_agent_id?: string | null;
  target_thread_id?: string | null;
  confidence?: number;
  stability: MemoryStability;
  status: MemoryStatus;
  source_refs: MemorySourceRef[];
  reason?: string;
  idempotency_key?: string;
  last_confirmed_at?: string | null;
};

export type MemoryRecallQuery = {
  subject_user_id: string;
  agent_id?: string | null;
  thread_id?: string | null;
  current_message: string;
  message_type?: string;
  current_language?: string;
  intent_hint?: string;
  direct_question_hint?: string;
  session_context?: Record<string, unknown>;
};

export type MemoryRecallHit = {
  category: MemoryCategory;
  key: string;
  value: unknown;
  scope: MemoryScope;
  status: MemoryStatus;
  confidence?: number;
};

export type MemoryRecallResult = {
  structured_hits: MemoryRecallHit[];
  semantic_hits: MemoryRecallHit[];
  excluded_hidden: number;
  excluded_incorrect: number;
  applied_scope_summary?: string[];
  debug_notes?: string[];
};

export const LEGACY_MEMORY_KEY = "legacy_content";

export const SUPPORTED_SINGLE_SLOT_KEYS = new Set<SupportedSingleSlotKey>([
  "profile.profession",
  "preference.reply_language",
  "relationship.agent_nickname",
  "relationship.user_preferred_name",
  "relationship.user_address_style"
]);

function isCategory(value: unknown): value is MemoryCategory {
  return (
    value === "profile" ||
    value === "preference" ||
    value === "relationship" ||
    value === "goal"
  );
}

function isScope(value: unknown): value is MemoryScope {
  return (
    value === "user_global" ||
    value === "user_agent" ||
    value === "thread_local"
  );
}

function isStability(value: unknown): value is MemoryStability {
  return value === "low" || value === "medium" || value === "high";
}

function isStatus(value: unknown): value is MemoryStatus {
  return (
    value === "active" ||
    value === "hidden" ||
    value === "incorrect" ||
    value === "superseded"
  );
}

export function inferLegacyMemoryCategory(
  memoryType: string | null | undefined
): MemoryCategory {
  return memoryType === "preference" ? "preference" : "profile";
}

export function inferLegacyMemoryStability(
  memoryType: string | null | undefined
): MemoryStability {
  return memoryType === "profile" ? "high" : "medium";
}

export function getMemoryStatus(memory: MemoryRecord): MemoryStatus {
  if (isStatus(memory.status)) {
    return memory.status;
  }

  if (memory.metadata?.is_incorrect === true) {
    return "incorrect";
  }

  if (memory.metadata?.is_hidden === true) {
    return "hidden";
  }

  return "active";
}

export function isMemoryHidden(memory: MemoryRecord) {
  return getMemoryStatus(memory) === "hidden";
}

export function isMemoryIncorrect(memory: MemoryRecord) {
  return getMemoryStatus(memory) === "incorrect";
}

export function isMemoryActive(memory: MemoryRecord) {
  return getMemoryStatus(memory) === "active";
}

export function getMemoryCategory(memory: MemoryRecord): MemoryCategory {
  if (isCategory(memory.category)) {
    return memory.category;
  }

  return inferLegacyMemoryCategory(memory.memory_type);
}

export function getMemoryKey(memory: MemoryRecord) {
  return typeof memory.key === "string" && memory.key.trim().length > 0
    ? memory.key
    : LEGACY_MEMORY_KEY;
}

export function getMemoryValue(memory: MemoryRecord) {
  if (memory.value !== null && memory.value !== undefined) {
    return memory.value;
  }

  return memory.content ?? "";
}

export function getMemoryScope(memory: MemoryRecord): MemoryScope {
  if (isScope(memory.scope)) {
    return memory.scope;
  }

  return "user_global";
}

export function getMemoryStability(memory: MemoryRecord): MemoryStability {
  if (isStability(memory.stability)) {
    return memory.stability;
  }

  return inferLegacyMemoryStability(memory.memory_type);
}

export function getMemorySourceRefs(memory: MemoryRecord): MemorySourceRef[] {
  if (Array.isArray(memory.source_refs)) {
    return memory.source_refs as MemorySourceRef[];
  }

  if (typeof memory.source_refs === "object" && memory.source_refs !== null) {
    return [memory.source_refs as MemorySourceRef];
  }

  if (typeof memory.source_message_id === "string" && memory.source_message_id) {
    return [
      {
        kind: "message",
        source_message_id: memory.source_message_id
      }
    ];
  }

  return [];
}

export function isMemoryScopeValid(memory: MemoryRecord) {
  const scope = getMemoryScope(memory);

  if (scope === "user_agent") {
    return (
      typeof memory.target_agent_id === "string" &&
      memory.target_agent_id.length > 0
    );
  }

  if (scope === "thread_local") {
    return (
      typeof memory.target_thread_id === "string" &&
      memory.target_thread_id.length > 0
    );
  }

  return true;
}

export function getMemoryPath(memory: MemoryRecord) {
  return `${getMemoryCategory(memory)}.${getMemoryKey(memory)}`;
}

export function isSupportedSingleSlotPath(
  path: string
): path is SupportedSingleSlotKey {
  return SUPPORTED_SINGLE_SLOT_KEYS.has(path as SupportedSingleSlotKey);
}

export function normalizeSingleSlotValue(value: string) {
  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/^[\s"'“”‘’.,!?;:()（）【】\[\]{}<>《》]+/g, "")
    .replace(/[\s"'“”‘’.,!?;:()（）【】\[\]{}<>《》]+$/g, "")
    .replace(/\s+/g, " ");

  if (/^[\x00-\x7F]+$/.test(normalized)) {
    return normalized.toLowerCase();
  }

  return normalized;
}

export function canTransitionMemoryStatus(
  currentStatus: MemoryStatus,
  nextStatus: MemoryStatus
) {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (currentStatus === "active") {
    return (
      nextStatus === "hidden" ||
      nextStatus === "incorrect" ||
      nextStatus === "superseded"
    );
  }

  if (currentStatus === "hidden" || currentStatus === "incorrect") {
    return nextStatus === "active";
  }

  return false;
}

export function buildMemoryV2Fields({
  category,
  key,
  value,
  scope,
  subjectUserId,
  targetAgentId = null,
  targetThreadId = null,
  stability,
  status,
  sourceRefs,
  lastConfirmedAt = null
}: {
  category: MemoryCategory;
  key: string;
  value: unknown;
  scope: MemoryScope;
  subjectUserId: string;
  targetAgentId?: string | null;
  targetThreadId?: string | null;
  stability: MemoryStability;
  status: MemoryStatus;
  sourceRefs: MemorySourceRef[];
  lastConfirmedAt?: string | null;
}) {
  return {
    category,
    key,
    value,
    scope,
    subject_user_id: subjectUserId,
    target_agent_id: targetAgentId,
    target_thread_id: targetThreadId,
    stability,
    status,
    source_refs: sourceRefs,
    last_confirmed_at: lastConfirmedAt
  };
}
