import {
  buildKnowledgePromptSection,
  type RuntimeKnowledgeSnippet
} from "@/lib/chat/memory-knowledge";
import {
  buildMemoryNamespacePromptSection,
  type ActiveRuntimeMemoryNamespace
} from "@/lib/chat/memory-namespace";
import {
  buildScenarioMemoryPackPromptSection,
  resolveActiveScenarioMemoryPack,
  resolveScenarioMemoryPackStrategy,
  type ActiveScenarioMemoryPack
} from "@/lib/chat/memory-packs";
import type { RecalledMemory } from "@/lib/chat/memory-shared";
import {
  buildThreadCompactionPromptSection,
  type buildCompactedThreadSummary
} from "@/lib/chat/thread-compaction";
import type { OutputGovernancePacketV1 } from "@/lib/chat/output-governance";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { ThreadStateRecord } from "@/lib/chat/thread-state";

function truncateForCompactPrompt(
  value: string | null | undefined,
  maxChars: number
) {
  if (!value) {
    return "";
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  return normalized.length <= maxChars
    ? normalized
    : `${normalized.slice(0, maxChars - 3).trimEnd()}...`;
}

export function buildMemoryLayerAssemblyPrompt(args: {
  recalledMemories: RecalledMemory[];
  threadState: ThreadStateRecord | null | undefined;
  scenarioPack: ActiveScenarioMemoryPack | null | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const isZh = args.replyLanguage === "zh-Hans";
  const strategy = resolveScenarioMemoryPackStrategy(
    args.scenarioPack ?? { pack_id: "companion" }
  );
  const relationshipMemories = args.recalledMemories
    .filter((memory) => memory.memory_type === "relationship")
    .slice(0, strategy.layer_budget_bundle.relationship_limit);
  const relationshipFilteredMemories = args.recalledMemories.filter(
    (memory) => memory.memory_type !== "relationship"
  );
  const dynamicProfileMemories = relationshipFilteredMemories
    .filter((memory) => memory.semantic_layer === "dynamic_profile")
    .slice(
      0,
      strategy.dynamic_profile_strategy ===
        "suppress_when_memory_record_present" &&
        relationshipFilteredMemories.some(
          (memory) => memory.semantic_layer === "memory_record"
        )
        ? 0
        : 1
    );
  const staticProfileMemories = relationshipFilteredMemories
    .filter((memory) => memory.semantic_layer === "static_profile")
    .slice(0, strategy.layer_budget_bundle.static_profile_limit);
  const memoryRecordBudget = strategy.layer_budget_bundle.memory_record_limit;
  const memoryRecordMemories = relationshipFilteredMemories
    .filter((memory) => memory.semantic_layer === "memory_record")
    .sort((left, right) => {
      const getMemoryRecordPriority = (
        memoryType: RecalledMemory["memory_type"]
      ) => {
        const priority = strategy.memory_record_priority_order.indexOf(memoryType);
        return priority >= 0
          ? priority
          : strategy.memory_record_priority_order.length;
      };
      return getMemoryRecordPriority(left.memory_type) -
        getMemoryRecordPriority(right.memory_type);
    })
    .slice(0, memoryRecordBudget);

  const sections: string[] = [
    isZh ? "本轮 context assembly 顺序：" : "Context assembly order for this turn:"
  ];

  if (args.threadState) {
    sections.push(
      isZh
        ? "1. thread_state：优先承接当前线程的即时 focus、continuity 和语言提示。"
        : "1. thread_state: anchor immediate thread focus, continuity, and language carryover first."
    );
  }

  const layerPromptSections: Array<{
    layer: "dynamic_profile" | "static_profile" | "memory_record" | "relationship";
    content: string[];
  }> = [];

  if (dynamicProfileMemories.length > 0) {
    layerPromptSections.push({
      layer: "dynamic_profile",
      content: [
        isZh
          ? "2. dynamic_profile：承接当前阶段仍持续有效的工作方式或偏好。"
          : "2. dynamic_profile: carry the still-active phase-level working mode or preference.",
        ...dynamicProfileMemories.map((memory, index) => `   - DP${index + 1}: ${memory.content}`)
      ]
    });
  }

  if (staticProfileMemories.length > 0) {
    layerPromptSections.push({
      layer: "static_profile",
      content: [
        isZh
          ? args.scenarioPack?.pack_id === "companion"
            ? "3. static_profile：作为稳定长期偏好的回答基线。"
            : "3. static_profile：仅保留最小稳定偏好基线，避免压过执行上下文。"
          : args.scenarioPack?.pack_id === "companion"
            ? "3. static_profile: use as the stable long-term preference baseline."
            : "3. static_profile: keep only a minimal stable-preference baseline so it does not outweigh execution context.",
        ...staticProfileMemories.map((memory, index) => `   - SP${index + 1}: ${memory.content}`)
      ]
    });
  }

  if (memoryRecordMemories.length > 0) {
    layerPromptSections.push({
      layer: "memory_record",
      content: [
        isZh
          ? args.scenarioPack?.pack_id === "project_ops"
            ? "4. memory_record：优先承接进展轨迹、事件事实与执行上下文。"
            : "4. memory_record：仅保留最小事件事实支撑，并优先当前最直接的 episode 线索。"
          : args.scenarioPack?.pack_id === "project_ops"
            ? "4. memory_record: prioritize progress traces, event facts, and execution context."
            : "4. memory_record: keep only a minimal event-facts support layer and favor the most direct episode cue first.",
        ...memoryRecordMemories.map(
          (memory, index) => `   - MR${index + 1} [${memory.memory_type}]: ${memory.content}`
        )
      ]
    });
  }

  if (relationshipMemories.length > 0) {
    layerPromptSections.push({
      layer: "relationship",
      content: [
        isZh
          ? args.scenarioPack?.pack_id === "companion"
            ? "5. relationship memory：作为陪伴连续性与关系 grounding 的补充锚点。"
            : "5. relationship memory：仅保留最小关系 grounding，避免压过项目执行上下文。"
          : args.scenarioPack?.pack_id === "companion"
            ? "5. relationship memory: use as a continuity and relationship-grounding support layer."
            : "5. relationship memory: keep only a minimal relationship-grounding layer so it does not outweigh project execution context.",
        ...relationshipMemories.map((memory, index) => `   - RM${index + 1}: ${memory.content}`)
      ]
    });
  }

  const ordered = layerPromptSections.sort(
    (left, right) =>
      strategy.assembly_layer_order.indexOf(left.layer) -
      strategy.assembly_layer_order.indexOf(right.layer)
  );
  sections.push(...ordered.flatMap((section) => section.content));
  return sections.length > 1 ? sections.join("\n") : "";
}

export function buildScenarioMemoryPackAssemblyPrompt(args: {
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null | undefined;
  relevantKnowledge: RuntimeKnowledgeSnippet[];
  replyLanguage: RuntimeReplyLanguage;
}) {
  return buildScenarioMemoryPackPromptSection({
    pack: resolveActiveScenarioMemoryPack({
      activeNamespace: args.activeMemoryNamespace ?? null,
      relevantKnowledge: args.relevantKnowledge
    }),
    replyLanguage: args.replyLanguage
  });
}

export function buildKnowledgeLayerPrompt(args: {
  relevantKnowledge: RuntimeKnowledgeSnippet[];
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const activePack = resolveActiveScenarioMemoryPack({
    activeNamespace: args.activeMemoryNamespace ?? null,
    relevantKnowledge: args.relevantKnowledge
  });

  return buildKnowledgePromptSection({
    knowledge: args.relevantKnowledge,
    activeNamespace: args.activeMemoryNamespace ?? null,
    activePackId: activePack.pack_id,
    replyLanguage: args.replyLanguage
  });
}

export function buildKnowledgeLayerPromptCompact(args: {
  relevantKnowledge: RuntimeKnowledgeSnippet[];
  replyLanguage: RuntimeReplyLanguage;
}) {
  if (args.relevantKnowledge.length === 0) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const items = args.relevantKnowledge
    .slice(0, 2)
    .map((item) => {
      const title = item.title.trim();
      const summary = item.summary.trim();
      return isZh
        ? [title, summary].filter(Boolean).join("：")
        : [title, summary].filter(Boolean).join(": ");
    })
    .filter(Boolean);

  if (items.length === 0) {
    return "";
  }

  return isZh
    ? `知识摘要：${items.join("；")}。只把这些当作轻量背景提示，不要展开成长篇说明。`
    : `Knowledge summary: ${items.join("; ")}. Use these only as light background support, not as a long explanation.`;
}

export function buildThreadCompactionLayerPrompt(args: {
  compactedThreadSummary:
    | ReturnType<typeof buildCompactedThreadSummary>
    | null
    | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  return buildThreadCompactionPromptSection({
    compactedThreadSummary: args.compactedThreadSummary ?? null,
    replyLanguage: args.replyLanguage
  });
}

export function buildThreadCompactionLayerPromptCompact(args: {
  compactedThreadSummary:
    | ReturnType<typeof buildCompactedThreadSummary>
    | null
    | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const summary = args.compactedThreadSummary;
  if (!summary) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const compactSummary = truncateForCompactPrompt(
    summary.summary_text,
    isZh ? 220 : 260
  );
  return isZh
    ? `线程近程摘要：${compactSummary} 聚焦=${summary.focus_mode}；保留=${summary.retention_mode}。只把它当作最近对话的压缩提示，不要扩写成长期画像。`
    : `Recent thread summary: ${compactSummary} Focus=${summary.focus_mode}; retention=${summary.retention_mode}. Treat this only as compact recent context, not a new long-term profile.`;
}

export function buildOutputGovernancePromptSectionCompact(
  governance: OutputGovernancePacketV1 | null | undefined,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!governance) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";
  const expressionBrief = truncateForCompactPrompt(governance.expression_brief, isZh ? 220 : 260);
  const relationalBrief = truncateForCompactPrompt(governance.relational_brief, isZh ? 120 : 160);
  const sceneBrief = truncateForCompactPrompt(governance.scene_brief, isZh ? 140 : 180);
  const knowledgeBrief = truncateForCompactPrompt(governance.knowledge_brief, isZh ? 100 : 140);
  const avoid = truncateForCompactPrompt(governance.avoidances.slice(0, 2).join(" "), isZh ? 120 : 160);
  const modality = truncateForCompactPrompt(governance.modality_rules.slice(0, 2).join(" "), isZh ? 120 : 160);

  return [
    isZh ? "输出治理（紧凑版）" : "Output governance (compact)",
    expressionBrief ? (isZh ? `表达：${expressionBrief}` : `Expression: ${expressionBrief}`) : "",
    relationalBrief ? (isZh ? `关系：${relationalBrief}` : `Relationship: ${relationalBrief}`) : "",
    sceneBrief ? (isZh ? `场景：${sceneBrief}` : `Scene: ${sceneBrief}`) : "",
    knowledgeBrief ? (isZh ? `知识：${knowledgeBrief}` : `Knowledge: ${knowledgeBrief}`) : "",
    avoid ? (isZh ? `避免：${avoid}` : `Avoid: ${avoid}`) : "",
    modality ? (isZh ? `规则：${modality}` : `Rules: ${modality}`) : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildMemoryNamespaceLayerPrompt(args: {
  activeMemoryNamespace: ActiveRuntimeMemoryNamespace | null | undefined;
  replyLanguage: RuntimeReplyLanguage;
}) {
  return buildMemoryNamespacePromptSection({
    namespace: args.activeMemoryNamespace ?? null,
    replyLanguage: args.replyLanguage
  });
}
