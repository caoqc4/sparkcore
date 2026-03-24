import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";
import {
  resolveRuntimeMemoryBoundary,
  type ActiveRuntimeMemoryNamespace
} from "@/lib/chat/memory-namespace";
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
  routedScope: MemoryScope;
  routedTargetAgentId: string | null;
  routedTargetThreadId: string | null;
  routedProjectId: string | null;
  routedWorldId: string | null;
  writeBoundary: PlannedMemoryWriteBoundary;
  writePriorityLayer: PlannedMemoryWriteBoundary;
  fallbackWriteBoundary: PlannedMemoryWriteBoundary | null;
  writeEscalationMode:
    | "thread_outward_escalation"
    | "project_world_escalation"
    | "world_pinned"
    | "default_pinned";
  namespacePrimaryLayer:
    | ActiveRuntimeMemoryNamespace["primary_layer"]
    | null;
  targetNamespaceId: string | null;
  namespacePolicyBundleId: string | null;
};

export type PlannedGenericMemoryWriteTarget = {
  recordTarget: PlannedMemoryRecordTarget;
  canonicalMemoryType: Extract<RuntimeMemoryWriteRequest, { kind: "generic_memory" }>["memory_type"];
  legacyScope: "user_global";
  routedScope: MemoryScope;
  routedTargetAgentId: string | null;
  routedTargetThreadId: string | null;
  routedProjectId: string | null;
  routedWorldId: string | null;
  writeBoundary: PlannedMemoryWriteBoundary;
  writePriorityLayer: PlannedMemoryWriteBoundary;
  fallbackWriteBoundary: PlannedMemoryWriteBoundary | null;
  writeEscalationMode:
    | "thread_outward_escalation"
    | "project_world_escalation"
    | "world_pinned"
    | "default_pinned";
  namespacePrimaryLayer:
    | ActiveRuntimeMemoryNamespace["primary_layer"]
    | null;
  targetNamespaceId: string | null;
  namespacePolicyBundleId: string | null;
};

export type PlannedRelationshipMemoryWriteTarget = {
  recordTarget: "memory_record";
  canonicalMemoryType: "relationship";
  legacyScope: "user_agent";
  routedScope: MemoryScope;
  routedTargetAgentId: string | null;
  routedTargetThreadId: string | null;
  routedProjectId: string | null;
  routedWorldId: string | null;
  writeBoundary: PlannedMemoryWriteBoundary;
  writePriorityLayer: PlannedMemoryWriteBoundary;
  fallbackWriteBoundary: PlannedMemoryWriteBoundary | null;
  writeEscalationMode:
    | "thread_outward_escalation"
    | "project_world_escalation"
    | "world_pinned"
    | "default_pinned";
  namespacePrimaryLayer:
    | ActiveRuntimeMemoryNamespace["primary_layer"]
    | null;
  targetNamespaceId: string | null;
  namespacePolicyBundleId: string | null;
};

function resolveWriteBoundary(
  namespace: ActiveRuntimeMemoryNamespace | null | undefined
): PlannedMemoryWriteBoundary {
  return resolveRuntimeMemoryBoundary(namespace).write_boundary;
}

function getNamespaceRefId(
  namespace: ActiveRuntimeMemoryNamespace | null | undefined,
  layer: ActiveRuntimeMemoryNamespace["active_layers"][number]
) {
  return namespace?.refs.find((ref) => ref.layer === layer)?.entity_id ?? null;
}

function resolveNamespaceWriteRouting(
  namespace: ActiveRuntimeMemoryNamespace | null | undefined
) {
  const boundary = resolveRuntimeMemoryBoundary(namespace);
  const writeBoundary = boundary.write_boundary;
  const projectId = getNamespaceRefId(namespace, "project");
  const worldId = getNamespaceRefId(namespace, "world");
  const fallbackWriteBoundary =
    boundary.write_fallback_order.find((item) => item !== writeBoundary) ?? null;

  switch (writeBoundary) {
    case "project":
      return {
        routedProjectId: projectId,
        routedWorldId: null,
        writePriorityLayer: "project" as const,
        fallbackWriteBoundary,
        writeEscalationMode: boundary.write_escalation_mode,
        namespacePolicyBundleId: boundary.policy_bundle_id
      };
    case "world":
      return {
        routedProjectId: null,
        routedWorldId: worldId,
        writePriorityLayer: "world" as const,
        fallbackWriteBoundary,
        writeEscalationMode: boundary.write_escalation_mode,
        namespacePolicyBundleId: boundary.policy_bundle_id
      };
    case "thread":
      return {
        routedProjectId: null,
        routedWorldId: null,
        writePriorityLayer: "thread" as const,
        fallbackWriteBoundary,
        writeEscalationMode: boundary.write_escalation_mode,
        namespacePolicyBundleId: boundary.policy_bundle_id
      };
    default:
      return {
        routedProjectId: projectId,
        routedWorldId: worldId,
        writePriorityLayer: "default" as const,
        fallbackWriteBoundary,
        writeEscalationMode: boundary.write_escalation_mode,
        namespacePolicyBundleId: boundary.policy_bundle_id
      };
  }
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
  const {
    routedProjectId,
    routedWorldId,
    writePriorityLayer,
    fallbackWriteBoundary,
    writeEscalationMode,
    namespacePolicyBundleId
  } = resolveNamespaceWriteRouting(namespace);

  if (request.kind === "relationship_memory") {
    return {
      recordTarget: "memory_record",
      canonicalMemoryType: "relationship",
      legacyScope: request.relationship_scope,
      routedScope: request.relationship_scope,
      routedTargetAgentId: request.target_agent_id,
      routedTargetThreadId: request.target_thread_id ?? null,
      routedProjectId,
      routedWorldId,
      writeBoundary,
      writePriorityLayer,
      fallbackWriteBoundary,
      writeEscalationMode,
      namespacePrimaryLayer,
      targetNamespaceId,
      namespacePolicyBundleId
    };
  }

  if (request.memory_type === "profile" || request.memory_type === "preference") {
    const routedThreadId =
      writeBoundary === "thread" ? getNamespaceRefId(namespace, "thread") : null;

    return {
      recordTarget: "static_profile",
      canonicalMemoryType: request.memory_type,
      legacyScope: "user_global",
      routedScope: routedThreadId ? "thread_local" : "user_global",
      routedTargetAgentId: null,
      routedTargetThreadId: routedThreadId,
      routedProjectId,
      routedWorldId,
      writeBoundary,
      writePriorityLayer,
      fallbackWriteBoundary,
      writeEscalationMode,
      namespacePrimaryLayer,
      targetNamespaceId,
      namespacePolicyBundleId
    };
  }

  if (request.memory_type === "goal") {
    return {
      recordTarget: "thread_state_candidate",
      canonicalMemoryType: request.memory_type,
      legacyScope: "thread_local",
      routedScope: "thread_local",
      routedTargetAgentId: null,
      routedTargetThreadId: getNamespaceRefId(namespace, "thread"),
      routedProjectId,
      routedWorldId,
      writeBoundary,
      writePriorityLayer,
      fallbackWriteBoundary,
      writeEscalationMode,
      namespacePrimaryLayer,
      targetNamespaceId,
      namespacePolicyBundleId
    };
  }

  return {
    recordTarget: "memory_record",
    canonicalMemoryType: request.memory_type,
    legacyScope: "user_global",
    routedScope:
      writeBoundary === "thread" && getNamespaceRefId(namespace, "thread")
        ? "thread_local"
        : "user_global",
    routedTargetAgentId: null,
    routedTargetThreadId:
      writeBoundary === "thread" ? getNamespaceRefId(namespace, "thread") : null,
    routedProjectId,
    routedWorldId,
    writeBoundary,
    writePriorityLayer,
    fallbackWriteBoundary,
    writeEscalationMode,
    namespacePrimaryLayer,
    targetNamespaceId,
    namespacePolicyBundleId
  };
}
