import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import {
  buildActiveMemoryNamespace,
  type ActiveMemoryNamespace,
  type MemoryNamespaceLayer
} from "../../../../packages/core/memory";

export type ActiveRuntimeMemoryNamespace = ActiveMemoryNamespace & {
  selection_reason: "session_and_knowledge_scope";
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
