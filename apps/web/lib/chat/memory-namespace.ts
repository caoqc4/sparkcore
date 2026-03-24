import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import { getMemoryScope } from "@/lib/chat/memory-v2";
import type { MemoryRecallRoute } from "@/lib/chat/memory-shared";
import {
  buildActiveMemoryNamespace,
  type ActiveMemoryNamespace,
  type MemoryNamespaceLayer,
  type MemoryNamespacePolicyDigestId,
  type MemoryNamespacePolicyBundleId
} from "../../../../packages/core/memory";

export type ActiveRuntimeMemoryNamespace = ActiveMemoryNamespace & {
  selection_reason: "session_and_knowledge_scope";
};

export type RuntimeMemoryBoundary = {
  retrieval_boundary: "default" | "thread" | "project" | "world";
  write_boundary: "default" | "thread" | "project" | "world";
  policy_bundle_id: MemoryNamespacePolicyBundleId;
  policy_digest_id: MemoryNamespacePolicyDigestId;
  policy_coordination_summary:
    | "thread_focus_no_timeline"
    | "project_parallel_coordination"
    | "world_timeline_reference"
    | "default_balanced_coordination";
  governance_consistency_mode:
    | "retrieval_strict_write_outward"
    | "retrieval_write_balanced"
    | "retrieval_timeline_write_pinned"
    | "retrieval_write_default";
  route_governance_mode:
    | "thread_strict"
    | "project_balanced"
    | "world_expansive"
    | "default_balanced";
  retrieval_fallback_mode:
    | "strict_no_timeline"
    | "parallel_timeline_allowed"
    | "timeline_preferred"
    | "balanced_timeline_optional";
  write_escalation_mode:
    | "thread_outward_escalation"
    | "project_world_escalation"
    | "world_pinned"
    | "default_pinned";
  retrieval_route_order: MemoryRecallRoute[];
  write_fallback_order: Array<"thread" | "project" | "world" | "default">;
  allow_timeline_fallback: boolean;
  profile_budget: number;
  episode_budget: number;
  timeline_budget: number;
  parallel_timeline_budget: number;
};

type NamespaceScopedMemoryLike = {
  metadata?: Record<string, unknown> | null;
  subject_user_id?: string | null;
  target_agent_id?: string | null;
  target_thread_id?: string | null;
  scope?: string | null;
};

function formatNamespaceLayer(layer: MemoryNamespaceLayer, isZh: boolean) {
  switch (layer) {
    case "user":
      return isZh ? "用户" : "user";
    case "agent":
      return isZh ? "Agent" : "agent";
    case "thread":
      return isZh ? "线程" : "thread";
    case "project":
      return isZh ? "项目" : "project";
    case "world":
      return isZh ? "世界" : "world";
    default:
      return layer;
  }
}

export function resolveActiveMemoryNamespace(args: {
  userId: string;
  agentId?: string | null;
  threadId?: string | null;
  relevantKnowledge?: RuntimeKnowledgeSnippet[];
}): ActiveRuntimeMemoryNamespace {
  const firstScopedKnowledge = (args.relevantKnowledge ?? []).find(
    (item) => item.scope.project_id || item.scope.world_id
  );

  return {
    ...buildActiveMemoryNamespace({
      user_id: args.userId,
      agent_id: args.agentId ?? null,
      thread_id: args.threadId ?? null,
      project_id: firstScopedKnowledge?.scope.project_id ?? null,
      world_id: firstScopedKnowledge?.scope.world_id ?? null
    }),
    selection_reason: "session_and_knowledge_scope"
  };
}

export function buildMemoryNamespacePromptSection(args: {
  namespace: ActiveRuntimeMemoryNamespace | null;
  replyLanguage: RuntimeReplyLanguage;
}) {
  if (!args.namespace) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const boundary = resolveRuntimeMemoryBoundary(args.namespace);

  return [
    isZh
      ? `当前生效的 Memory Namespace：primary_layer = ${formatNamespaceLayer(args.namespace.primary_layer, true)}。`
      : `Active Memory Namespace: primary_layer = ${args.namespace.primary_layer}.`,
    isZh
      ? `当前命名空间层级：${args.namespace.active_layers
          .map((layer) => formatNamespaceLayer(layer, true))
          .join(" -> ")}。`
      : `Active namespace layers: ${args.namespace.active_layers.join(" -> ")}.`,
    isZh
      ? `当前 namespace policy：${boundary.policy_bundle_id}；检索治理 = ${boundary.route_governance_mode}。`
      : `Current namespace policy: ${boundary.policy_bundle_id}; retrieval governance = ${boundary.route_governance_mode}.`,
    isZh
      ? `当前 namespace policy digest：${boundary.policy_digest_id}。`
      : `Current namespace policy digest: ${boundary.policy_digest_id}.`,
    isZh
      ? `当前 coordination 摘要：${boundary.policy_coordination_summary}；consistency = ${boundary.governance_consistency_mode}。`
      : `Current coordination summary: ${boundary.policy_coordination_summary}; consistency = ${boundary.governance_consistency_mode}.`,
    isZh
      ? `当前 fallback 策略：retrieval = ${boundary.retrieval_fallback_mode}；write = ${boundary.write_escalation_mode}。`
      : `Current fallback policy: retrieval = ${boundary.retrieval_fallback_mode}; write = ${boundary.write_escalation_mode}.`,
    isZh
      ? "把这些 namespace 当作当前检索和注入的作用域边界，不要把 thread/project/world 的信息误压回单一用户长期偏好。"
      : "Treat these namespaces as the active retrieval and injection boundary; do not collapse thread, project, or world context back into a single long-term user preference."
  ].join("\n");
}

export function buildMemoryNamespaceSummary(args: {
  namespace: ActiveRuntimeMemoryNamespace | null;
}) {
  if (!args.namespace) {
    return null;
  }

  const boundary = resolveRuntimeMemoryBoundary(args.namespace);

  return {
    namespace_id: args.namespace.namespace_id,
    primary_layer: args.namespace.primary_layer,
    active_layers: args.namespace.active_layers,
    selection_reason: args.namespace.selection_reason,
    policy_bundle_id: boundary.policy_bundle_id,
    policy_digest_id: boundary.policy_digest_id,
    policy_coordination_summary: boundary.policy_coordination_summary,
    governance_consistency_mode: boundary.governance_consistency_mode,
    route_governance_mode: boundary.route_governance_mode,
    retrieval_fallback_mode: boundary.retrieval_fallback_mode,
    write_escalation_mode: boundary.write_escalation_mode
  };
}

export function resolveRuntimeMemoryBoundary(
  namespace: ActiveRuntimeMemoryNamespace | null | undefined
): RuntimeMemoryBoundary {
  switch (namespace?.primary_layer) {
    case "thread":
      return {
        retrieval_boundary: "thread",
        write_boundary: "thread",
        policy_bundle_id: "thread_strict_focus",
        policy_digest_id: "thread_focus_orchestration",
        policy_coordination_summary: "thread_focus_no_timeline",
        governance_consistency_mode: "retrieval_strict_write_outward",
        route_governance_mode: "thread_strict",
        retrieval_fallback_mode: "strict_no_timeline",
        write_escalation_mode: "thread_outward_escalation",
        retrieval_route_order: ["thread_state", "profile", "episode"],
        write_fallback_order: ["thread", "project", "world", "default"],
        allow_timeline_fallback: false,
        profile_budget: 1,
        episode_budget: 1,
        timeline_budget: 0,
        parallel_timeline_budget: 0
      };
    case "project":
      return {
        retrieval_boundary: "project",
        write_boundary: "project",
        policy_bundle_id: "project_balanced_coordination",
        policy_digest_id: "project_coordination_orchestration",
        policy_coordination_summary: "project_parallel_coordination",
        governance_consistency_mode: "retrieval_write_balanced",
        route_governance_mode: "project_balanced",
        retrieval_fallback_mode: "parallel_timeline_allowed",
        write_escalation_mode: "project_world_escalation",
        retrieval_route_order: ["thread_state", "profile", "episode", "timeline"],
        write_fallback_order: ["project", "world", "default"],
        allow_timeline_fallback: true,
        profile_budget: 2,
        episode_budget: 2,
        timeline_budget: 1,
        parallel_timeline_budget: 1
      };
    case "world":
      return {
        retrieval_boundary: "world",
        write_boundary: "world",
        policy_bundle_id: "world_reference_exploration",
        policy_digest_id: "world_reference_orchestration",
        policy_coordination_summary: "world_timeline_reference",
        governance_consistency_mode: "retrieval_timeline_write_pinned",
        route_governance_mode: "world_expansive",
        retrieval_fallback_mode: "timeline_preferred",
        write_escalation_mode: "world_pinned",
        retrieval_route_order: ["thread_state", "profile", "timeline", "episode"],
        write_fallback_order: ["world", "default"],
        allow_timeline_fallback: true,
        profile_budget: 2,
        episode_budget: 1,
        timeline_budget: 1,
        parallel_timeline_budget: 1
      };
    default:
      return {
        retrieval_boundary: "default",
        write_boundary: "default",
        policy_bundle_id: "default_balanced_memory",
        policy_digest_id: "default_memory_orchestration",
        policy_coordination_summary: "default_balanced_coordination",
        governance_consistency_mode: "retrieval_write_default",
        route_governance_mode: "default_balanced",
        retrieval_fallback_mode: "balanced_timeline_optional",
        write_escalation_mode: "default_pinned",
        retrieval_route_order: ["thread_state", "profile", "episode", "timeline"],
        write_fallback_order: ["default"],
        allow_timeline_fallback: true,
        profile_budget: 2,
        episode_budget: 1,
        timeline_budget: 1,
        parallel_timeline_budget: 0
      };
  }
}

export function buildMemoryNamespaceScopedMetadata(args: {
  namespace: ActiveRuntimeMemoryNamespace | null | undefined;
}) {
  if (!args.namespace) {
    return {};
  }

  const boundary = resolveRuntimeMemoryBoundary(args.namespace);

  return {
    active_memory_namespace_id: args.namespace.namespace_id,
    active_memory_namespace_primary_layer: args.namespace.primary_layer,
    active_memory_namespace_layers: args.namespace.active_layers,
    active_memory_namespace_selection_reason: args.namespace.selection_reason,
    active_memory_namespace_policy_bundle_id: boundary.policy_bundle_id,
    active_memory_namespace_policy_digest_id: boundary.policy_digest_id,
    active_memory_namespace_policy_coordination_summary:
      boundary.policy_coordination_summary,
    active_memory_namespace_governance_consistency_mode:
      boundary.governance_consistency_mode,
    active_memory_namespace_route_governance_mode:
      boundary.route_governance_mode,
    active_memory_retrieval_fallback_mode: boundary.retrieval_fallback_mode,
    active_memory_write_escalation_mode: boundary.write_escalation_mode,
    active_memory_retrieval_boundary: boundary.retrieval_boundary,
    active_memory_write_boundary: boundary.write_boundary,
    active_memory_retrieval_route_order: boundary.retrieval_route_order,
    active_memory_write_fallback_order: boundary.write_fallback_order,
    active_memory_profile_budget: boundary.profile_budget,
    active_memory_episode_budget: boundary.episode_budget,
    active_memory_timeline_budget: boundary.timeline_budget,
    active_memory_parallel_timeline_budget: boundary.parallel_timeline_budget,
    project_id: getNamespaceRefId(args.namespace, "project"),
    world_id: getNamespaceRefId(args.namespace, "world")
  };
}

function getNamespaceRefId(
  namespace: ActiveMemoryNamespace | null | undefined,
  layer: MemoryNamespaceLayer
) {
  return namespace?.refs.find((ref) => ref.layer === layer)?.entity_id ?? null;
}

function getScopedMetadataId(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function isMemoryWithinNamespace(args: {
  memory: NamespaceScopedMemoryLike;
  namespace: ActiveMemoryNamespace | null | undefined;
}) {
  if (!args.namespace) {
    return true;
  }

  const userId = getNamespaceRefId(args.namespace, "user");
  const agentId = getNamespaceRefId(args.namespace, "agent");
  const threadId = getNamespaceRefId(args.namespace, "thread");
  const projectId = getNamespaceRefId(args.namespace, "project");
  const worldId = getNamespaceRefId(args.namespace, "world");
  const memoryProjectId = getScopedMetadataId(args.memory.metadata, "project_id");
  const memoryWorldId = getScopedMetadataId(args.memory.metadata, "world_id");

  if (memoryProjectId && projectId && memoryProjectId !== projectId) {
    return false;
  }

  if (memoryWorldId && worldId && memoryWorldId !== worldId) {
    return false;
  }

  if (
    typeof args.memory.subject_user_id === "string" &&
    args.memory.subject_user_id.length > 0 &&
    userId &&
    args.memory.subject_user_id !== userId
  ) {
    return false;
  }

  const scope = getMemoryScope(args.memory);

  if (
    scope === "user_agent" &&
    typeof args.memory.target_agent_id === "string" &&
    args.memory.target_agent_id.length > 0 &&
    agentId &&
    args.memory.target_agent_id !== agentId
  ) {
    return false;
  }

  if (
    scope === "thread_local" &&
    typeof args.memory.target_thread_id === "string" &&
    args.memory.target_thread_id.length > 0 &&
    threadId &&
    args.memory.target_thread_id !== threadId
  ) {
    return false;
  }

  return true;
}
