import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type {
  ActiveMemoryNamespace,
  KnowledgeSnapshot,
  KnowledgeScopeLayer,
  KnowledgeSourceKind,
} from "../../../../packages/core/memory";
import type { MemoryScopeRef } from "../../../../packages/core/memory/records";

export type RuntimeKnowledgeSnippet = {
  knowledge_id: string;
  title: string;
  summary: string;
  source_kind: KnowledgeSourceKind;
  scope: MemoryScopeRef;
};

export function resolveKnowledgeScopeLayer(
  snippet: RuntimeKnowledgeSnippet
): KnowledgeScopeLayer {
  if (snippet.scope.project_id) {
    return "project";
  }

  if (snippet.scope.world_id) {
    return "world";
  }

  return "general";
}

export function buildKnowledgeSnapshot(args: {
  snapshotId: string;
  resourceId: string;
  scope: MemoryScopeRef;
  title: string;
  summary: string;
  sourceKind: KnowledgeSourceKind;
  capturedAt: string;
}): KnowledgeSnapshot {
  return {
    snapshot_id: args.snapshotId,
    resource_id: args.resourceId,
    scope: args.scope,
    title: args.title,
    summary: args.summary,
    source_kind: args.sourceKind,
    captured_at: args.capturedAt,
  };
}

export function buildRuntimeKnowledgeSnippet(
  snapshot: KnowledgeSnapshot
): RuntimeKnowledgeSnippet {
  return {
    knowledge_id: snapshot.snapshot_id,
    title: snapshot.title,
    summary: snapshot.summary,
    source_kind: snapshot.source_kind,
    scope: snapshot.scope
  };
}

export function isKnowledgeSnippetInNamespace(args: {
  snippet: RuntimeKnowledgeSnippet;
  namespace: ActiveMemoryNamespace | null | undefined;
}) {
  if (!args.namespace) {
    return true;
  }

  const namespaceRefByLayer = new Map(
    args.namespace.refs.map((ref) => [ref.layer, ref.entity_id])
  );

  if (
    args.snippet.scope.world_id &&
    namespaceRefByLayer.get("world") !== args.snippet.scope.world_id
  ) {
    return false;
  }

  if (
    args.snippet.scope.project_id &&
    namespaceRefByLayer.get("project") !== args.snippet.scope.project_id
  ) {
    return false;
  }

  if (
    args.snippet.scope.thread_id &&
    namespaceRefByLayer.get("thread") !== args.snippet.scope.thread_id
  ) {
    return false;
  }

  if (
    args.snippet.scope.agent_id &&
    namespaceRefByLayer.get("agent") !== args.snippet.scope.agent_id
  ) {
    return false;
  }

  if (
    args.snippet.scope.user_id &&
    namespaceRefByLayer.get("user") !== args.snippet.scope.user_id
  ) {
    return false;
  }

  return true;
}

export function filterKnowledgeByActiveNamespace(args: {
  knowledge: RuntimeKnowledgeSnippet[];
  namespace: ActiveMemoryNamespace | null | undefined;
}) {
  return args.knowledge.filter((snippet) =>
    isKnowledgeSnippetInNamespace({
      snippet,
      namespace: args.namespace
    })
  );
}

function getKnowledgeScopePriority(layer: KnowledgeScopeLayer) {
  switch (layer) {
    case "project":
      return 0;
    case "world":
      return 1;
    case "general":
    default:
      return 2;
  }
}

function buildKnowledgeScopeOrder(
  namespace: ActiveMemoryNamespace | null | undefined
): KnowledgeScopeLayer[] {
  if (namespace?.primary_layer === "world") {
    return ["world", "project", "general"];
  }

  if (namespace?.primary_layer === "project") {
    return ["project", "world", "general"];
  }

  return ["project", "world", "general"];
}

function getKnowledgeScopePriorityForNamespace(args: {
  layer: KnowledgeScopeLayer;
  namespace: ActiveMemoryNamespace | null | undefined;
}) {
  const scopeOrder = buildKnowledgeScopeOrder(args.namespace);
  const priority = scopeOrder.indexOf(args.layer);

  return priority >= 0 ? priority : getKnowledgeScopePriority(args.layer);
}

export function selectKnowledgeForPrompt(args: {
  knowledge: RuntimeKnowledgeSnippet[];
  activeNamespace?: ActiveMemoryNamespace | null;
  limit?: number;
}) {
  const applicableKnowledge = filterKnowledgeByActiveNamespace({
    knowledge: args.knowledge,
    namespace: args.activeNamespace
  });
  const limit = args.limit ?? 2;

  return [...applicableKnowledge]
    .sort((left, right) => {
      const leftPriority = getKnowledgeScopePriorityForNamespace({
        layer: resolveKnowledgeScopeLayer(left),
        namespace: args.activeNamespace
      });
      const rightPriority = getKnowledgeScopePriorityForNamespace({
        layer: resolveKnowledgeScopeLayer(right),
        namespace: args.activeNamespace
      });

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}

export function buildKnowledgePromptSection(args: {
  knowledge: RuntimeKnowledgeSnippet[];
  activeNamespace?: ActiveMemoryNamespace | null;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const selectedKnowledge = selectKnowledgeForPrompt({
    knowledge: args.knowledge,
    activeNamespace: args.activeNamespace,
    limit: 2
  });

  if (selectedKnowledge.length === 0) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const lines = [
    isZh ? "相关 Knowledge Layer：" : "Relevant Knowledge Layer:",
    ...selectedKnowledge.map((item, index) =>
      {
        const scopeLayer = resolveKnowledgeScopeLayer(item);
        const scopeLabel = isZh
          ? scopeLayer === "project"
            ? "项目"
            : scopeLayer === "world"
              ? "世界"
              : "通用"
          : scopeLayer;

        return isZh
          ? `${index + 1}. [${scopeLabel}/${item.source_kind}] ${item.title}：${item.summary}`
          : `${index + 1}. [${scopeLabel}/${item.source_kind}] ${item.title}: ${item.summary}`;
      }
    ),
    isZh
      ? "把这些内容当作按 project/world/general 分层的外部知识来源；当前 prompt budget 会优先保留 project/world，再考虑 general。不要把它们误写成用户长期偏好或线程即时状态。"
      : "Treat these items as project/world/general knowledge inputs; this prompt budget prefers project/world before general. Do not rewrite them as user preference memory or live thread-state.",
  ];

  return lines.join("\n");
}

export function buildKnowledgeSummary(args: {
  knowledge: RuntimeKnowledgeSnippet[];
  activeNamespace?: ActiveMemoryNamespace | null;
}) {
  const applicableKnowledge = filterKnowledgeByActiveNamespace({
    knowledge: args.knowledge,
    namespace: args.activeNamespace
  });

  return {
    count: applicableKnowledge.length,
    titles: applicableKnowledge.map((item) => item.title),
    source_kinds: Array.from(
      new Set(applicableKnowledge.map((item) => item.source_kind))
    ),
    scope_layers: Array.from(
      new Set(applicableKnowledge.map((item) => resolveKnowledgeScopeLayer(item)))
    ),
    scope_counts: {
      project: applicableKnowledge.filter(
        (item) => resolveKnowledgeScopeLayer(item) === "project"
      ).length,
      world: applicableKnowledge.filter(
        (item) => resolveKnowledgeScopeLayer(item) === "world"
      ).length,
      general: applicableKnowledge.filter(
        (item) => resolveKnowledgeScopeLayer(item) === "general"
      ).length
    }
  };
}
