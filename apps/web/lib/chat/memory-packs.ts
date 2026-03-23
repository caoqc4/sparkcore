import {
  resolveBuiltInScenarioMemoryPack,
  type ScenarioMemoryLayer,
  type ScenarioMemoryPack,
} from "../../../../packages/core/memory";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import type { RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";

export type ActiveScenarioMemoryPack = ScenarioMemoryPack & {
  selection_reason:
    | "default_companion_phase"
    | "project_namespace_priority"
    | "project_knowledge_priority"
    | "world_knowledge_influence";
  knowledge_priority_layer: "project" | "world" | null;
  assembly_emphasis: "default" | "knowledge_first";
  knowledge_route_weight: number;
  knowledge_budget_weight: number;
  route_influence_reason:
    | "default_continuity_bias"
    | "project_namespace_bias"
    | "project_knowledge_bias"
    | "world_knowledge_bias";
};

function withWorldKnowledgeInfluence(
  pack: ScenarioMemoryPack
): ActiveScenarioMemoryPack {
  const preferredRoutes = [
    "thread_state",
    "knowledge",
    ...pack.preferred_routes.filter((route) => route !== "thread_state" && route !== "knowledge")
  ] as ScenarioMemoryPack["preferred_routes"];

  const assemblyOrder = [
    "thread_state",
    "knowledge",
    ...pack.assembly_order.filter(
      (layer) => layer !== "thread_state" && layer !== "knowledge"
    )
  ] as ScenarioMemoryPack["assembly_order"];

  return {
    ...pack,
    preferred_routes: preferredRoutes,
    assembly_order: assemblyOrder,
    selection_reason: "world_knowledge_influence",
    knowledge_priority_layer: "world",
    assembly_emphasis: "knowledge_first",
    knowledge_route_weight: 0.75,
    knowledge_budget_weight: 0.65,
    route_influence_reason: "world_knowledge_bias"
  };
}

export function resolveActiveScenarioMemoryPack(args?: {
  activeNamespace?: ActiveRuntimeMemoryNamespace | null;
  relevantKnowledge?: RuntimeKnowledgeSnippet[];
}): ActiveScenarioMemoryPack {
  if (args?.activeNamespace?.primary_layer === "project") {
    return {
      ...resolveBuiltInScenarioMemoryPack("project_ops"),
      selection_reason: "project_namespace_priority",
      knowledge_priority_layer: "project",
      assembly_emphasis: "knowledge_first",
      knowledge_route_weight: 1,
      knowledge_budget_weight: 0.9,
      route_influence_reason: "project_namespace_bias"
    };
  }

  const projectKnowledgeCount =
    args?.relevantKnowledge?.filter((item) => Boolean(item.scope.project_id))
      .length ?? 0;
  const worldKnowledgeCount =
    args?.relevantKnowledge?.filter((item) => Boolean(item.scope.world_id))
      .length ?? 0;

  if (projectKnowledgeCount > 0 && projectKnowledgeCount >= worldKnowledgeCount) {
    return {
      ...resolveBuiltInScenarioMemoryPack("project_ops"),
      selection_reason: "project_knowledge_priority",
      knowledge_priority_layer: "project",
      assembly_emphasis: "knowledge_first",
      knowledge_route_weight: 0.9,
      knowledge_budget_weight: 0.85,
      route_influence_reason: "project_knowledge_bias"
    };
  }

  if (worldKnowledgeCount > 0 && worldKnowledgeCount > projectKnowledgeCount) {
    return withWorldKnowledgeInfluence(
      resolveBuiltInScenarioMemoryPack("companion")
    );
  }

  return {
    ...resolveBuiltInScenarioMemoryPack("companion"),
    knowledge_priority_layer: null,
    assembly_emphasis: "default",
    knowledge_route_weight: 0.3,
    knowledge_budget_weight: 0.25,
    route_influence_reason: "default_continuity_bias",
    selection_reason: "default_companion_phase",
  };
}

function formatAssemblyLayerLabel(
  layer: ScenarioMemoryLayer,
  isZh: boolean
) {
  switch (layer) {
    case "thread_state":
      return isZh ? "线程进行态" : "thread_state";
    case "dynamic_profile":
      return isZh ? "动态画像" : "dynamic_profile";
    case "static_profile":
      return isZh ? "静态画像" : "static_profile";
    case "memory_record":
      return isZh ? "长期记忆记录" : "memory_record";
    case "knowledge":
      return isZh ? "知识层" : "knowledge";
    default:
      return layer;
  }
}

export function buildScenarioMemoryPackPromptSection(args: {
  pack: ActiveScenarioMemoryPack;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const isZh = args.replyLanguage === "zh-Hans";

  return [
    isZh
      ? `当前生效的 Scenario Memory Pack：${args.pack.pack_id}（${args.pack.label}）。`
      : `Active Scenario Memory Pack: ${args.pack.pack_id} (${args.pack.label}).`,
    isZh
      ? `优先检索顺序：${args.pack.preferred_routes.join(" -> ")}。`
      : `Preferred retrieval order: ${args.pack.preferred_routes.join(" -> ")}.`,
    isZh
      ? `默认组装顺序：${args.pack.assembly_order
          .map((layer) => formatAssemblyLayerLabel(layer, true))
          .join(" -> ")}。`
      : `Default assembly order: ${args.pack.assembly_order.join(" -> ")}.`,
    isZh
      ? args.pack.assembly_emphasis === "knowledge_first"
        ? `当前组装强调：${args.pack.knowledge_priority_layer ?? "project"} knowledge 优先进入 context assembly。`
        : "当前组装强调：保持默认连续性优先。"
      : args.pack.assembly_emphasis === "knowledge_first"
        ? `Current assembly emphasis: ${args.pack.knowledge_priority_layer ?? "project"} knowledge enters context assembly first.`
        : "Current assembly emphasis: keep the default continuity-first ordering.",
    isZh
      ? `当前 route 影响原因：${args.pack.route_influence_reason}。`
      : `Current route influence reason: ${args.pack.route_influence_reason}.`,
    isZh
      ? `当前 knowledge route weight = ${args.pack.knowledge_route_weight}，knowledge budget weight = ${args.pack.knowledge_budget_weight}。`
      : `Current knowledge route weight = ${args.pack.knowledge_route_weight}; knowledge budget weight = ${args.pack.knowledge_budget_weight}.`,
    isZh
      ? args.pack.pack_id === "project_ops"
        ? "如果当前回复缺少直接任务事实，优先保持项目知识 grounding、线程连续性与执行上下文一致。"
        : "如果当前回复缺少直接任务事实，优先保持陪伴连续性、关系 grounding 与稳定偏好一致性。"
      : args.pack.pack_id === "project_ops"
        ? "When the current reply lacks direct task facts, prioritize project knowledge grounding, thread continuity, and execution-context alignment."
        : "When the current reply lacks direct task facts, prioritize continuity, relationship grounding, and stable preference alignment.",
  ].join("\n");
}
