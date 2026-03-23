import type { StoredMemory } from "@/lib/chat/memory-shared";
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
  if (memory.category !== "goal" || memory.scope === "thread_local") {
    return null;
  }

  const { subjectId, scope } = buildProfileIdentity(memory);
  const key =
    typeof memory.key === "string" && memory.key.length > 0
      ? memory.key
      : "dynamic.goal";
  const effectiveAt = memory.created_at ?? memory.updated_at;

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
