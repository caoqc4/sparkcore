import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import { getMemoryScope } from "@/lib/chat/memory-v2";
import {
  buildActiveMemoryNamespace,
  type ActiveMemoryNamespace,
  type MemoryNamespaceLayer
} from "../../../../packages/core/memory";

export type ActiveRuntimeMemoryNamespace = ActiveMemoryNamespace & {
  selection_reason: "session_and_knowledge_scope";
};

export type RuntimeMemoryBoundary = {
  retrieval_boundary: "default" | "thread" | "project" | "world";
  write_boundary: "default" | "thread" | "project" | "world";
  allow_timeline_fallback: boolean;
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

  return {
    namespace_id: args.namespace.namespace_id,
    primary_layer: args.namespace.primary_layer,
    active_layers: args.namespace.active_layers,
    selection_reason: args.namespace.selection_reason
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
        allow_timeline_fallback: false
      };
    case "project":
      return {
        retrieval_boundary: "project",
        write_boundary: "project",
        allow_timeline_fallback: true
      };
    case "world":
      return {
        retrieval_boundary: "world",
        write_boundary: "world",
        allow_timeline_fallback: true
      };
    default:
      return {
        retrieval_boundary: "default",
        write_boundary: "default",
        allow_timeline_fallback: true
      };
  }
}

export function buildMemoryNamespaceScopedMetadata(args: {
  namespace: ActiveRuntimeMemoryNamespace | null | undefined;
}) {
  if (!args.namespace) {
    return {};
  }

  return {
    active_memory_namespace_id: args.namespace.namespace_id,
    active_memory_namespace_primary_layer: args.namespace.primary_layer,
    active_memory_namespace_layers: args.namespace.active_layers,
    active_memory_namespace_selection_reason: args.namespace.selection_reason,
    active_memory_retrieval_boundary:
      resolveRuntimeMemoryBoundary(args.namespace).retrieval_boundary,
    active_memory_write_boundary:
      resolveRuntimeMemoryBoundary(args.namespace).write_boundary,
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
