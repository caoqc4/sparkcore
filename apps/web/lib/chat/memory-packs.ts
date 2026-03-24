import {
  type ScenarioOrchestrationCoordinationSummary,
  resolveBuiltInScenarioMemoryPack,
  type ScenarioOrchestrationDigestId,
  type ScenarioOrchestrationMode,
  type ScenarioMemoryLayer,
  type ScenarioMemoryPack,
  type ScenarioStrategyConsistencyMode,
  type ScenarioStrategyRationaleSummary,
  type ScenarioStrategyPolicyId,
} from "../../../../packages/core/memory";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import {
  resolveKnowledgeGovernanceClass,
  type RuntimeKnowledgeSnippet
} from "@/lib/chat/memory-knowledge";
import type { RecalledMemory } from "@/lib/chat/memory-shared";

export type ScenarioMemoryPackStrategy = {
  strategy_bundle_id: "companion_continuity" | "project_execution";
  layer_budget_bundle: {
    relationship_limit: number;
    static_profile_limit: number;
    memory_record_limit: number;
  };
  assembly_layer_order: Array<
    "dynamic_profile" | "static_profile" | "memory_record" | "relationship"
  >;
  dynamic_profile_strategy:
    | "coexist_with_memory_record"
    | "suppress_when_memory_record_present";
  memory_record_priority_order: RecalledMemory["memory_type"][];
};

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
  governance_route_bias: "authoritative" | "contextual" | "reference" | null;
  strategy_policy_id: ScenarioStrategyPolicyId;
  orchestration_mode: ScenarioOrchestrationMode;
  orchestration_digest_id: ScenarioOrchestrationDigestId;
  strategy_rationale_summary: ScenarioStrategyRationaleSummary;
  orchestration_coordination_summary: ScenarioOrchestrationCoordinationSummary;
  strategy_consistency_mode: ScenarioStrategyConsistencyMode;
};

function resolveKnowledgeGovernanceRouteWeights(args: {
  relevantKnowledge?: RuntimeKnowledgeSnippet[];
  defaultRouteWeight: number;
  defaultBudgetWeight: number;
}) {
  const governanceCounts = {
    authoritative:
      args.relevantKnowledge?.filter(
        (item) => resolveKnowledgeGovernanceClass(item) === "authoritative"
      ).length ?? 0,
    contextual:
      args.relevantKnowledge?.filter(
        (item) => resolveKnowledgeGovernanceClass(item) === "contextual"
      ).length ?? 0,
    reference:
      args.relevantKnowledge?.filter(
        (item) => resolveKnowledgeGovernanceClass(item) === "reference"
      ).length ?? 0
  };

  if (
    governanceCounts.authoritative >= governanceCounts.contextual &&
    governanceCounts.authoritative >= governanceCounts.reference &&
    governanceCounts.authoritative > 0
  ) {
    return {
      governance_route_bias: "authoritative" as const,
      knowledge_route_weight: Math.max(args.defaultRouteWeight, 1),
      knowledge_budget_weight: Math.max(args.defaultBudgetWeight, 0.95)
    };
  }

  if (
    governanceCounts.contextual >= governanceCounts.reference &&
    governanceCounts.contextual > 0
  ) {
    return {
      governance_route_bias: "contextual" as const,
      knowledge_route_weight: Math.max(args.defaultRouteWeight, 0.85),
      knowledge_budget_weight: Math.max(args.defaultBudgetWeight, 0.75)
    };
  }

  if (governanceCounts.reference > 0) {
    return {
      governance_route_bias: "reference" as const,
      knowledge_route_weight: Math.max(args.defaultRouteWeight, 0.4),
      knowledge_budget_weight: Math.max(args.defaultBudgetWeight, 0.3)
    };
  }

  return {
    governance_route_bias: null,
    knowledge_route_weight: args.defaultRouteWeight,
    knowledge_budget_weight: args.defaultBudgetWeight
  };
}

export function resolveScenarioMemoryPackStrategy(
  pack: Pick<ActiveScenarioMemoryPack, "pack_id">
): ScenarioMemoryPackStrategy {
  if (pack.pack_id === "project_ops") {
    return {
      strategy_bundle_id: "project_execution",
      layer_budget_bundle: {
        relationship_limit: 1,
        static_profile_limit: 1,
        memory_record_limit: 2
      },
      assembly_layer_order: [
        "memory_record",
        "static_profile",
        "relationship",
        "dynamic_profile"
      ],
      dynamic_profile_strategy: "suppress_when_memory_record_present",
      memory_record_priority_order: ["timeline", "episode", "relationship", "profile"]
    };
  }

  return {
    strategy_bundle_id: "companion_continuity",
    layer_budget_bundle: {
      relationship_limit: 2,
      static_profile_limit: 2,
      memory_record_limit: 1
    },
    assembly_layer_order: [
      "dynamic_profile",
      "relationship",
      "static_profile",
      "memory_record"
    ],
    dynamic_profile_strategy: "coexist_with_memory_record",
    memory_record_priority_order: ["episode", "timeline", "relationship", "profile"]
  };
}

export function resolveScenarioMemoryPackPolicy(
  pack: Pick<
    ActiveScenarioMemoryPack,
    "pack_id" | "selection_reason" | "governance_route_bias"
  >
) {
  if (pack.pack_id === "project_ops") {
    return {
      strategy_policy_id: "project_delivery_policy" as const,
      orchestration_mode: "execution_centered" as const,
      orchestration_digest_id: "project_delivery_orchestration" as const,
      strategy_rationale_summary: "execution_priority_alignment" as const,
      orchestration_coordination_summary:
        "project_delivery_coordination" as const,
      strategy_consistency_mode: "execution_governance_aligned" as const
    };
  }

  if (
    pack.selection_reason === "world_knowledge_influence" ||
    pack.governance_route_bias === "authoritative"
  ) {
    return {
      strategy_policy_id: "knowledge_guided_companion_policy" as const,
      orchestration_mode: "knowledge_guided" as const,
      orchestration_digest_id:
        "knowledge_guided_companion_orchestration" as const,
      strategy_rationale_summary: "knowledge_guided_alignment" as const,
      orchestration_coordination_summary:
        "knowledge_guided_companion_coordination" as const,
      strategy_consistency_mode: "knowledge_guidance_aligned" as const
    };
  }

  return {
    strategy_policy_id: "continuity_companion_policy" as const,
    orchestration_mode: "continuity_centered" as const,
    orchestration_digest_id: "continuity_companion_orchestration" as const,
    strategy_rationale_summary: "continuity_alignment" as const,
    orchestration_coordination_summary:
      "continuity_companion_coordination" as const,
    strategy_consistency_mode: "continuity_governance_aligned" as const
  };
}

function withWorldKnowledgeInfluence(
  pack: ScenarioMemoryPack,
  relevantKnowledge?: RuntimeKnowledgeSnippet[]
): ActiveScenarioMemoryPack {
  const governanceWeights = resolveKnowledgeGovernanceRouteWeights({
    relevantKnowledge,
    defaultRouteWeight: 0.75,
    defaultBudgetWeight: 0.65
  });
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
    ...resolveScenarioMemoryPackPolicy({
      pack_id: pack.pack_id,
      selection_reason: "world_knowledge_influence",
      governance_route_bias: governanceWeights.governance_route_bias
    }),
    ...pack,
    preferred_routes: preferredRoutes,
    assembly_order: assemblyOrder,
    selection_reason: "world_knowledge_influence",
    knowledge_priority_layer: "world",
    assembly_emphasis: "knowledge_first",
    knowledge_route_weight: governanceWeights.knowledge_route_weight,
    knowledge_budget_weight: governanceWeights.knowledge_budget_weight,
    route_influence_reason: "world_knowledge_bias",
    governance_route_bias: governanceWeights.governance_route_bias
  };
}

export function resolveActiveScenarioMemoryPack(args?: {
  activeNamespace?: ActiveRuntimeMemoryNamespace | null;
  relevantKnowledge?: RuntimeKnowledgeSnippet[];
}): ActiveScenarioMemoryPack {
  if (args?.activeNamespace?.primary_layer === "project") {
    const governanceWeights = resolveKnowledgeGovernanceRouteWeights({
      relevantKnowledge: args?.relevantKnowledge,
      defaultRouteWeight: 1,
      defaultBudgetWeight: 0.9
    });
    return {
      ...resolveScenarioMemoryPackPolicy({
        pack_id: "project_ops",
        selection_reason: "project_namespace_priority",
        governance_route_bias: governanceWeights.governance_route_bias
      }),
      ...resolveBuiltInScenarioMemoryPack("project_ops"),
      selection_reason: "project_namespace_priority",
      knowledge_priority_layer: "project",
      assembly_emphasis: "knowledge_first",
      knowledge_route_weight: governanceWeights.knowledge_route_weight,
      knowledge_budget_weight: governanceWeights.knowledge_budget_weight,
      route_influence_reason: "project_namespace_bias",
      governance_route_bias: governanceWeights.governance_route_bias
    };
  }

  const projectKnowledgeCount =
    args?.relevantKnowledge?.filter((item) => Boolean(item.scope.project_id))
      .length ?? 0;
  const worldKnowledgeCount =
    args?.relevantKnowledge?.filter((item) => Boolean(item.scope.world_id))
      .length ?? 0;

  if (projectKnowledgeCount > 0 && projectKnowledgeCount >= worldKnowledgeCount) {
    const governanceWeights = resolveKnowledgeGovernanceRouteWeights({
      relevantKnowledge: args?.relevantKnowledge,
      defaultRouteWeight: 0.9,
      defaultBudgetWeight: 0.85
    });
    return {
      ...resolveScenarioMemoryPackPolicy({
        pack_id: "project_ops",
        selection_reason: "project_knowledge_priority",
        governance_route_bias: governanceWeights.governance_route_bias
      }),
      ...resolveBuiltInScenarioMemoryPack("project_ops"),
      selection_reason: "project_knowledge_priority",
      knowledge_priority_layer: "project",
      assembly_emphasis: "knowledge_first",
      knowledge_route_weight: governanceWeights.knowledge_route_weight,
      knowledge_budget_weight: governanceWeights.knowledge_budget_weight,
      route_influence_reason: "project_knowledge_bias",
      governance_route_bias: governanceWeights.governance_route_bias
    };
  }

  if (worldKnowledgeCount > 0 && worldKnowledgeCount > projectKnowledgeCount) {
    return withWorldKnowledgeInfluence(
      resolveBuiltInScenarioMemoryPack("companion"),
      args?.relevantKnowledge
    );
  }

  const governanceWeights = resolveKnowledgeGovernanceRouteWeights({
    relevantKnowledge: args?.relevantKnowledge,
    defaultRouteWeight: 0.3,
    defaultBudgetWeight: 0.25
  });
  return {
    ...resolveScenarioMemoryPackPolicy({
      pack_id: "companion",
      selection_reason: "default_companion_phase",
      governance_route_bias: governanceWeights.governance_route_bias
    }),
    ...resolveBuiltInScenarioMemoryPack("companion"),
    knowledge_priority_layer: null,
    assembly_emphasis: "default",
    knowledge_route_weight: governanceWeights.knowledge_route_weight,
    knowledge_budget_weight: governanceWeights.knowledge_budget_weight,
    route_influence_reason: "default_continuity_bias",
    governance_route_bias: governanceWeights.governance_route_bias,
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
  const strategy = resolveScenarioMemoryPackStrategy(args.pack);

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
      ? `当前 governance route bias = ${args.pack.governance_route_bias ?? "none"}。`
      : `Current governance route bias = ${args.pack.governance_route_bias ?? "none"}.`,
    isZh
      ? `当前 strategy policy = ${args.pack.strategy_policy_id}；orchestration mode = ${args.pack.orchestration_mode}。`
      : `Current strategy policy = ${args.pack.strategy_policy_id}; orchestration mode = ${args.pack.orchestration_mode}.`,
    isZh
      ? `当前 orchestration digest = ${args.pack.orchestration_digest_id}；strategy rationale = ${args.pack.strategy_rationale_summary}。`
      : `Current orchestration digest = ${args.pack.orchestration_digest_id}; strategy rationale = ${args.pack.strategy_rationale_summary}.`,
    isZh
      ? `当前 orchestration coordination = ${args.pack.orchestration_coordination_summary}；consistency = ${args.pack.strategy_consistency_mode}。`
      : `Current orchestration coordination = ${args.pack.orchestration_coordination_summary}; consistency = ${args.pack.strategy_consistency_mode}.`,
    isZh
      ? `当前 knowledge route weight = ${args.pack.knowledge_route_weight}，knowledge budget weight = ${args.pack.knowledge_budget_weight}。`
      : `Current knowledge route weight = ${args.pack.knowledge_route_weight}; knowledge budget weight = ${args.pack.knowledge_budget_weight}.`,
    isZh
      ? `当前 strategy bundle = ${strategy.strategy_bundle_id}；relationship/static_profile/memory_record budget = ${strategy.layer_budget_bundle.relationship_limit}/${strategy.layer_budget_bundle.static_profile_limit}/${strategy.layer_budget_bundle.memory_record_limit}。`
      : `Current strategy bundle = ${strategy.strategy_bundle_id}; relationship/static_profile/memory_record budget = ${strategy.layer_budget_bundle.relationship_limit}/${strategy.layer_budget_bundle.static_profile_limit}/${strategy.layer_budget_bundle.memory_record_limit}.`,
    isZh
      ? `当前 strategy assembly order = ${strategy.assembly_layer_order.join(" -> ")}。`
      : `Current strategy assembly order = ${strategy.assembly_layer_order.join(" -> ")}.`,
    isZh
      ? args.pack.pack_id === "project_ops"
        ? "如果当前回复缺少直接任务事实，优先保持项目知识 grounding、线程连续性与执行上下文一致。"
        : "如果当前回复缺少直接任务事实，优先保持陪伴连续性、关系 grounding 与稳定偏好一致性。"
      : args.pack.pack_id === "project_ops"
        ? "When the current reply lacks direct task facts, prioritize project knowledge grounding, thread continuity, and execution-context alignment."
        : "When the current reply lacks direct task facts, prioritize continuity, relationship grounding, and stable preference alignment.",
  ].join("\n");
}
