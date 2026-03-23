import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";
import type { MemoryScope } from "@/lib/chat/memory-v2";

export type PlannedMemoryRecordTarget =
  | "static_profile"
  | "memory_record"
  | "thread_state_candidate";

export type PlannedMemoryWriteTarget = {
  recordTarget: PlannedMemoryRecordTarget;
  canonicalMemoryType:
    | RuntimeMemoryWriteRequest["memory_type"]
    | "goal"
    | null;
  legacyScope: MemoryScope;
};

type PlannedGenericMemoryWriteTarget = {
  recordTarget: PlannedMemoryRecordTarget;
  canonicalMemoryType: Extract<RuntimeMemoryWriteRequest, { kind: "generic_memory" }>["memory_type"];
  legacyScope: "user_global";
};

type PlannedRelationshipMemoryWriteTarget = {
  recordTarget: "memory_record";
  canonicalMemoryType: "relationship";
  legacyScope: "user_agent";
};

export function resolvePlannedMemoryWriteTarget(
  request: Extract<RuntimeMemoryWriteRequest, { kind: "generic_memory" }>
): PlannedGenericMemoryWriteTarget;
export function resolvePlannedMemoryWriteTarget(
  request: Extract<RuntimeMemoryWriteRequest, { kind: "relationship_memory" }>
): PlannedRelationshipMemoryWriteTarget;
export function resolvePlannedMemoryWriteTarget(
  request: RuntimeMemoryWriteRequest
): PlannedMemoryWriteTarget;
export function resolvePlannedMemoryWriteTarget(
  request: RuntimeMemoryWriteRequest
): PlannedMemoryWriteTarget {
  if (request.kind === "relationship_memory") {
    return {
      recordTarget: "memory_record",
      canonicalMemoryType: "relationship",
      legacyScope: request.relationship_scope
    };
  }

  if (request.memory_type === "profile" || request.memory_type === "preference") {
    return {
      recordTarget: "static_profile",
      canonicalMemoryType: request.memory_type,
      legacyScope: "user_global"
    };
  }

  return {
    recordTarget: "memory_record",
    canonicalMemoryType: request.memory_type,
    legacyScope: "user_global"
  };
}
