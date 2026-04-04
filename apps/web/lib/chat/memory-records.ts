import type {
  MemoryType,
  MemorySemanticLayer,
  RecalledMemory,
  StoredMemory
} from "@/lib/chat/memory-shared";
import { getMemoryCategory, getMemoryScope } from "@/lib/chat/memory-v2";
import {
  buildMemoryRecordFromLegacy,
  buildMemoryScopeRefFromLegacy,
  type DynamicProfileRecord,
  type MemoryRecord,
  type MemoryScopeRef,
  type StaticProfileRecord
} from "@sparkcore/core-memory/records";

export type ChatMemoryRecord = MemoryRecord;
export type ChatStaticProfileRecord = StaticProfileRecord;
export type ChatDynamicProfileRecord = DynamicProfileRecord;
export type ChatMemoryScopeRef = MemoryScopeRef;
export type LegacyMemorySemanticTarget =
  | "static_profile"
  | "dynamic_profile"
  | "memory_record"
  | "thread_state_candidate"
  | "legacy_unsupported";

export type RuntimeMemorySemanticLayer = MemorySemanticLayer;

function buildProfileIdentity(memory: StoredMemory) {
  const userId = memory.subject_user_id ?? "unknown_user";
  const agentId =
    getMemoryScope(memory) === "user_agent"
      ? (memory.target_agent_id ?? null)
      : null;
  const scope = buildMemoryScopeRefFromLegacy(memory);

  return {
    subjectId: agentId ? `user:${userId}:agent:${agentId}` : `user:${userId}`,
    scope
  };
}

export function classifyStoredMemorySemanticTarget(
  memory: StoredMemory
): LegacyMemorySemanticTarget {
  if (memory.memory_type === "goal") {
    return "thread_state_candidate";
  }

  const rawCategory =
    typeof memory.category === "string" && memory.category.length > 0
      ? memory.category
      : null;
  const rawScope =
    typeof memory.scope === "string" && memory.scope.length > 0
      ? memory.scope
      : null;
  const inferredCategory = getMemoryCategory(memory);
  const inferredScope = getMemoryScope(memory);
  const category = rawCategory ?? inferredCategory;
  const scope = rawScope ?? inferredScope;

  if ((category === "profile" || category === "preference") && scope !== "thread_local") {
    return "static_profile";
  }

  if (category === "relationship") {
    return "memory_record";
  }

  if (scope === "thread_local" && (category === "profile" || category === "preference")) {
    return "dynamic_profile";
  }

  if (memory.memory_type || memory.category) {
    return "memory_record";
  }

  return "legacy_unsupported";
}

export function isStoredMemorySemanticTarget(
  memory: StoredMemory,
  target: LegacyMemorySemanticTarget
) {
  return classifyStoredMemorySemanticTarget(memory) === target;
}

export function isStoredMemoryStaticProfile(memory: StoredMemory) {
  return isStoredMemorySemanticTarget(memory, "static_profile");
}

export function isStoredMemoryDynamicProfile(memory: StoredMemory) {
  return isStoredMemorySemanticTarget(memory, "dynamic_profile");
}

export function isStoredMemoryRelationshipMemoryRecord(memory: StoredMemory) {
  return (
    isStoredMemorySemanticTarget(memory, "memory_record") &&
    getMemoryCategory(memory) === "relationship"
  );
}

export function isStoredMemoryGenericMemoryRecord(memory: StoredMemory) {
  return (
    isStoredMemorySemanticTarget(memory, "memory_record") &&
    getMemoryCategory(memory) !== "relationship"
  );
}

export function buildChatMemoryRecord(memory: StoredMemory): ChatMemoryRecord {
  return buildMemoryRecordFromLegacy(memory);
}

export function buildStaticProfileRecordFromStoredMemory(
  memory: StoredMemory
): ChatStaticProfileRecord | null {
  if (!isStoredMemoryStaticProfile(memory)) {
    return null;
  }

  const { subjectId, scope } = buildProfileIdentity(memory);
  const key =
    typeof memory.key === "string" && memory.key.length > 0
      ? memory.key
      : memory.memory_type ?? "legacy_profile";

  return {
    profile_id: `prof_static:${memory.id}`,
    subject_type: "user",
    subject_id: subjectId,
    scope,
    key,
    value: memory.value ?? memory.content,
    confidence: memory.confidence,
    source_refs: buildMemoryRecordFromLegacy(memory).source_refs,
    updated_at: memory.updated_at ?? memory.created_at
  };
}

export function buildDynamicProfileRecordFromStoredMemory(
  memory: StoredMemory
): ChatDynamicProfileRecord | null {
  if (!isStoredMemoryDynamicProfile(memory)) {
    return null;
  }

  const { subjectId, scope } = buildProfileIdentity(memory);
  const key =
    typeof memory.key === "string" && memory.key.length > 0
      ? memory.key
      : memory.memory_type ?? "legacy_dynamic_profile";
  const effectiveAt = memory.created_at ?? new Date().toISOString();

  return {
    profile_id: `prof_dynamic:${memory.id}`,
    subject_type: "user",
    subject_id: subjectId,
    scope,
    key,
    value: memory.value ?? memory.content,
    confidence: memory.confidence,
    effective_at: effectiveAt,
    expires_at: null,
    source_refs: buildMemoryRecordFromLegacy(memory).source_refs,
    updated_at: memory.updated_at ?? effectiveAt
  };
}

export function buildProfileRecordsFromStoredMemory(memory: StoredMemory): {
  static_profile: ChatStaticProfileRecord | null;
  dynamic_profile: ChatDynamicProfileRecord | null;
} {
  return {
    static_profile: buildStaticProfileRecordFromStoredMemory(memory),
    dynamic_profile: buildDynamicProfileRecordFromStoredMemory(memory)
  };
}

export function buildRecalledProfileMemoryFromStoredMemory(
  memory: StoredMemory
): RecalledMemory | null {
  const staticProfile = buildStaticProfileRecordFromStoredMemory(memory);

  if (!staticProfile) {
    return null;
  }

  return {
    memory_type: memory.memory_type === "preference" ? "preference" : "profile",
    content:
      typeof staticProfile.value === "string"
        ? staticProfile.value
        : String(staticProfile.value ?? ""),
    confidence: staticProfile.confidence ?? 0,
    semantic_layer: "static_profile"
  };
}

export function buildRecalledDynamicProfileMemoryFromStoredMemory(
  memory: StoredMemory
): RecalledMemory | null {
  const dynamicProfile = buildDynamicProfileRecordFromStoredMemory(memory);

  if (!dynamicProfile) {
    return null;
  }

  return {
    memory_type: memory.memory_type === "preference" ? "preference" : "profile",
    content:
      typeof dynamicProfile.value === "string"
        ? dynamicProfile.value
        : String(dynamicProfile.value ?? ""),
    confidence: dynamicProfile.confidence ?? 0,
    semantic_layer: "dynamic_profile"
  };
}

export function buildRecalledRelationshipMemoryFromStoredMemory(
  memory: StoredMemory
): {
  memory_id: string;
  memory_type: "relationship";
  content: string;
  confidence: number;
  semantic_layer: "memory_record";
} | null {
  if (!isStoredMemoryRelationshipMemoryRecord(memory)) {
    return null;
  }

  const relationshipRecord = buildChatMemoryRecord(memory);

  return {
    memory_id: memory.id,
    memory_type: "relationship",
    content: relationshipRecord.canonical_text,
    confidence: relationshipRecord.confidence ?? 0,
    semantic_layer: "memory_record"
  };
}

function isMemoryRecordRecallCandidate(memory: StoredMemory) {
  return isStoredMemoryGenericMemoryRecord(memory);
}

function resolveGenericMemoryRecordRecallType(memory: StoredMemory): MemoryType {
  const category = getMemoryCategory(memory);

  if (
    category === "episode" ||
    category === "mood" ||
    category === "key_date" ||
    category === "social"
  ) {
    return category;
  }

  if (
    memory.memory_type === "episode" ||
    memory.memory_type === "mood" ||
    memory.memory_type === "key_date" ||
    memory.memory_type === "social"
  ) {
    return memory.memory_type;
  }

  return "episode";
}

export function buildRecalledEpisodeMemoryFromStoredMemory(
  memory: StoredMemory
): RecalledMemory | null {
  if (!isMemoryRecordRecallCandidate(memory)) {
    return null;
  }

  const record = buildChatMemoryRecord(memory);

  return {
    memory_type: resolveGenericMemoryRecordRecallType(memory),
    content: record.canonical_text,
    confidence: record.confidence ?? 0,
    semantic_layer: "memory_record"
  };
}

export function buildRecalledTimelineMemoryFromStoredMemory(
  memory: StoredMemory
): RecalledMemory | null {
  if (!isMemoryRecordRecallCandidate(memory)) {
    return null;
  }

  const record = buildChatMemoryRecord(memory);

  return {
    memory_type: "timeline",
    content: record.canonical_text,
    confidence: record.confidence ?? 0,
    semantic_layer: "memory_record"
  };
}

export function buildRecalledStaticProfileSnapshot(
  memories: RecalledMemory[]
) {
  return Array.from(
    new Set(
      memories
        .filter(
          (memory) =>
            memory.memory_type === "profile" || memory.memory_type === "preference"
        )
        .map((memory) => memory.content.trim())
        .filter((content) => content.length > 0)
    )
  ).slice(0, 5);
}

export function buildRuntimeMemorySemanticSummary(args: {
  memoryTypesUsed: string[];
  profileSnapshot: string[];
  hasThreadState: boolean;
  threadStateFocusMode?: string | null;
  semanticLayersUsed?: Array<RuntimeMemorySemanticLayer | null | undefined>;
}) {
  const observedLayers: RuntimeMemorySemanticLayer[] = [];
  const semanticLayersUsed = Array.from(
    new Set(
      (args.semanticLayersUsed ?? []).filter(
        (layer): layer is RuntimeMemorySemanticLayer => Boolean(layer)
      )
    )
  );
  const usesStaticProfile =
    semanticLayersUsed.includes("static_profile") ||
    (semanticLayersUsed.length === 0 &&
      (args.profileSnapshot.length > 0 ||
        args.memoryTypesUsed.some(
          (type) => type === "profile" || type === "preference"
        )));
  const usesDynamicProfile = semanticLayersUsed.includes("dynamic_profile");
  const usesMemoryRecord =
    semanticLayersUsed.includes("memory_record") ||
    (semanticLayersUsed.length === 0 &&
      args.memoryTypesUsed.some(
        (type) =>
          type === "relationship" ||
          type === "episode" ||
          type === "mood" ||
          type === "key_date" ||
          type === "social" ||
          type === "timeline"
      ));
  const usesThreadState = args.hasThreadState;

  if (usesStaticProfile) {
    observedLayers.push("static_profile");
  }

  if (usesDynamicProfile) {
    observedLayers.push("dynamic_profile");
  }

  if (usesMemoryRecord) {
    observedLayers.push("memory_record");
  }

  if (usesThreadState) {
    observedLayers.push("thread_state");
  }

  let primaryLayer: RuntimeMemorySemanticLayer | null = null;

  if (args.threadStateFocusMode && args.threadStateFocusMode.trim().length > 0) {
    primaryLayer = "thread_state";
  } else if (usesDynamicProfile && !usesStaticProfile && !usesMemoryRecord) {
    primaryLayer = "dynamic_profile";
  } else if (usesStaticProfile && !usesDynamicProfile && !usesMemoryRecord) {
    primaryLayer = "static_profile";
  } else if (usesDynamicProfile) {
    primaryLayer = "dynamic_profile";
  } else if (
    usesMemoryRecord &&
    !usesStaticProfile &&
    !usesDynamicProfile
  ) {
    primaryLayer = "memory_record";
  } else if (usesStaticProfile) {
    primaryLayer = "static_profile";
  } else if (usesMemoryRecord) {
    primaryLayer = "memory_record";
  } else if (usesThreadState) {
    primaryLayer = "thread_state";
  }

  return {
    primary_layer: primaryLayer,
    observed_layers: observedLayers
  };
}
