import type {
  RecalledMemory,
  StoredMemory
} from "@/lib/chat/memory-shared";
import {
  buildMemoryRecordFromLegacy,
  buildMemoryScopeRefFromLegacy,
  type DynamicProfileRecord,
  type MemoryRecord,
  type MemoryScopeRef,
  type StaticProfileRecord
} from "../../../../packages/core/memory/records";

export type ChatMemoryRecord = MemoryRecord;
export type ChatStaticProfileRecord = StaticProfileRecord;
export type ChatDynamicProfileRecord = DynamicProfileRecord;
export type ChatMemoryScopeRef = MemoryScopeRef;

function buildProfileIdentity(memory: StoredMemory) {
  const userId = memory.subject_user_id ?? "unknown_user";
  const agentId =
    memory.scope === "user_agent" ? (memory.target_agent_id ?? null) : null;
  const scope = buildMemoryScopeRefFromLegacy(memory);

  return {
    subjectId: agentId ? `user:${userId}:agent:${agentId}` : `user:${userId}`,
    scope
  };
}

export function buildChatMemoryRecord(memory: StoredMemory): ChatMemoryRecord {
  return buildMemoryRecordFromLegacy(memory);
}

export function buildStaticProfileRecordFromStoredMemory(
  memory: StoredMemory
): ChatStaticProfileRecord | null {
  if (
    (memory.category !== "profile" && memory.category !== "preference") ||
    memory.scope === "thread_local"
  ) {
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
  // P0 keeps legacy goal-like rows out of DynamicProfile.
  // Existing goal semantics are closer to thread/run execution state and will
  // be migrated toward ThreadState before DynamicProfile is allowed to absorb
  // any long-lived phase-level state.
  void memory;
  return null;
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
    confidence: staticProfile.confidence ?? 0
  };
}

export function buildRecalledRelationshipMemoryFromStoredMemory(
  memory: StoredMemory
): {
  memory_type: "relationship";
  content: string;
  confidence: number;
} | null {
  if (memory.category !== "relationship") {
    return null;
  }

  const relationshipRecord = buildChatMemoryRecord(memory);

  return {
    memory_type: "relationship",
    content: relationshipRecord.canonical_text,
    confidence: relationshipRecord.confidence ?? 0
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
