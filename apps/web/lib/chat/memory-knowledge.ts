import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type {
  KnowledgeSnapshot,
  KnowledgeSourceKind,
} from "../../../../packages/core/memory";
import type { MemoryScopeRef } from "../../../../packages/core/memory/records";

export type RuntimeKnowledgeSnippet = {
  knowledge_id: string;
  title: string;
  summary: string;
  source_kind: KnowledgeSourceKind;
};

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
  };
}

export function buildKnowledgePromptSection(args: {
  knowledge: RuntimeKnowledgeSnippet[];
  replyLanguage: RuntimeReplyLanguage;
}) {
  if (args.knowledge.length === 0) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const lines = [
    isZh ? "相关 Knowledge Layer：" : "Relevant Knowledge Layer:",
    ...args.knowledge.slice(0, 2).map((item, index) =>
      isZh
        ? `${index + 1}. [${item.source_kind}] ${item.title}：${item.summary}`
        : `${index + 1}. [${item.source_kind}] ${item.title}: ${item.summary}`
    ),
    isZh
      ? "把这些内容当作外部/项目资料事实来源，不要把它们误写成用户长期偏好或线程即时状态。"
      : "Treat these items as external or project knowledge facts, not as user preference memory or live thread-state.",
  ];

  return lines.join("\n");
}

export function buildKnowledgeSummary(args: {
  knowledge: RuntimeKnowledgeSnippet[];
}) {
  return {
    count: args.knowledge.length,
    titles: args.knowledge.map((item) => item.title),
    source_kinds: Array.from(new Set(args.knowledge.map((item) => item.source_kind))),
  };
}
