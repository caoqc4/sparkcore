import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import type { MemoryScope } from "@/lib/chat/memory-v2";

export type PlannedMemoryRecordTarget =
  | "static_profile"
  | "memory_record"
  | "thread_state_candidate";

export type PlannedMemoryWriteBoundary =
  | "default"
  | "thread"
  | "project"
  | "world";

export type PlannedMemoryWriteTarget = {
  recordTarget: PlannedMemoryRecordTarget;
  canonicalMemoryType: RuntimeMemoryWriteRequest["memory_type"] | null;
  legacyScope: MemoryScope;
  writeBoundary: PlannedMemoryWriteBoundary;
  namespacePrimaryLayer:
    | ActiveRuntimeMemoryNamespace["primary_layer"]
    | null;
  targetNamespaceId: string | null;
};

export type PlannedGenericMemoryWriteTarget = {
  recordTarget: PlannedMemoryRecordTarget;
  canonicalMemoryType: Extract<RuntimeMemoryWriteRequest, { kind: "generic_memory" }>["memory_type"];
  legacyScope: "user_global";
  writeBoundary: PlannedMemoryWriteBoundary;
  namespacePrimaryLayer:
    | ActiveRuntimeMemoryNamespace["primary_layer"]
    | null;
  targetNamespaceId: string | null;
};

export type PlannedRelationshipMemoryWriteTarget = {
  recordTarget: "memory_record";
  canonicalMemoryType: "relationship";
  legacyScope: "user_agent";
  writeBoundary: PlannedMemoryWriteBoundary;
  namespacePrimaryLayer:
    | ActiveRuntimeMemoryNamespace["primary_layer"]
    | null;
  targetNamespaceId: string | null;
};

function resolveWriteBoundary(
  namespace: ActiveRuntimeMemoryNamespace | null | undefined
): PlannedMemoryWriteBoundary {
  if (!namespace) {
    return "default";
  }

  if (namespace.primary_layer === "world") {
    return "world";
  }

  if (namespace.primary_layer === "project") {
    return "project";
  }

  if (namespace.primary_layer === "thread") {
    return "thread";
  }

  return "default";
}

export function resolvePlannedMemoryWriteTarget(
  request: Extract<RuntimeMemoryWriteRequest, { kind: "generic_memory" }>,
  namespace?: ActiveRuntimeMemoryNamespace | null
): PlannedGenericMemoryWriteTarget;
export function resolvePlannedMemoryWriteTarget(
  request: Extract<RuntimeMemoryWriteRequest, { kind: "relationship_memory" }>,
  namespace?: ActiveRuntimeMemoryNamespace | null
): PlannedRelationshipMemoryWriteTarget;
export function resolvePlannedMemoryWriteTarget(
  request: RuntimeMemoryWriteRequest,
  namespace?: ActiveRuntimeMemoryNamespace | null
): PlannedMemoryWriteTarget;
export function resolvePlannedMemoryWriteTarget(
  request: RuntimeMemoryWriteRequest,
  namespace?: ActiveRuntimeMemoryNamespace | null
): PlannedMemoryWriteTarget {
  const writeBoundary = resolveWriteBoundary(namespace);
  const namespacePrimaryLayer = namespace?.primary_layer ?? null;
  const targetNamespaceId = namespace?.namespace_id ?? null;

  if (request.kind === "relationship_memory") {
    return {
      recordTarget: "memory_record",
      canonicalMemoryType: "relationship",
      legacyScope: request.relationship_scope,
      writeBoundary,
      namespacePrimaryLayer,
      targetNamespaceId
    };
  }

  if (request.memory_type === "profile" || request.memory_type === "preference") {
    return {
      recordTarget: "static_profile",
      canonicalMemoryType: request.memory_type,
      legacyScope: "user_global",
      writeBoundary,
      namespacePrimaryLayer,
      targetNamespaceId
    };
  }

  if (request.memory_type === "goal") {
    return {
      recordTarget: "thread_state_candidate",
      canonicalMemoryType: request.memory_type,
      legacyScope: "thread_local",
      writeBoundary,
      namespacePrimaryLayer,
      targetNamespaceId
    };
  }

  return {
    recordTarget: "memory_record",
    canonicalMemoryType: request.memory_type,
    legacyScope: "user_global",
    writeBoundary,
    namespacePrimaryLayer,
    targetNamespaceId
  };
}
