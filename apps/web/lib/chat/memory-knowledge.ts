import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type {
  ActiveMemoryNamespace,
  KnowledgeBudgetCoordinationMode,
  KnowledgeGovernanceClass,
  KnowledgeGovernanceConvergenceDigestId,
  KnowledgeGovernanceCoordinationSummary,
  KnowledgeGovernanceConsolidationDigestId,
  KnowledgeGovernanceConsolidationMode,
  KnowledgeGovernanceConsistencyMode,
  KnowledgeGovernanceAlignmentMode,
  KnowledgeGovernanceUnificationDigestId,
  KnowledgeGovernanceUnificationMode,
  KnowledgeSnapshot,
  KnowledgeScopeLayer,
  KnowledgeSourceBudgetAlignmentSummary,
  KnowledgeSourceBudgetConsolidationSummary,
  KnowledgeSourceBudgetUnificationSummary,
  KnowledgeSourceGovernanceSummary,
  KnowledgeSourceKind,
  ScenarioMemoryPackId,
} from "../../../../packages/core/memory";
import type { MemoryScopeRef } from "../../../../packages/core/memory/records";

export type RuntimeKnowledgeSnippet = {
  knowledge_id: string;
  title: string;
  summary: string;
  source_kind: KnowledgeSourceKind;
  scope: MemoryScopeRef;
};

export type KnowledgeRouteWeighting = {
  governance_class: KnowledgeGovernanceClass;
  scope_weight: number;
  namespace_weight: number;
  pack_weight: number;
  governance_weight: number;
  total_weight: number;
};

type KnowledgeGovernanceSelectionPolicy = {
  prompt_limit: number;
  route_alignment_bonus_by_class: Record<KnowledgeGovernanceClass, number>;
  consolidation_bonus_by_class: Record<KnowledgeGovernanceClass, number>;
};

function resolveKnowledgeGovernanceCoordinationSummary(args: {
  knowledge: RuntimeKnowledgeSnippet[];
}): KnowledgeGovernanceCoordinationSummary {
  const counts = {
    authoritative: args.knowledge.filter(
      (item) => resolveKnowledgeGovernanceClass(item) === "authoritative"
    ).length,
    contextual: args.knowledge.filter(
      (item) => resolveKnowledgeGovernanceClass(item) === "contextual"
    ).length,
    reference: args.knowledge.filter(
      (item) => resolveKnowledgeGovernanceClass(item) === "reference"
    ).length
  };

  if (
    counts.authoritative > 0 &&
    counts.authoritative >= counts.contextual &&
    counts.authoritative >= counts.reference
  ) {
    return "authoritative_priority_coordination";
  }

  if (
    counts.contextual > 0 &&
    counts.contextual >= counts.reference
  ) {
    return "contextual_balance_coordination";
  }

  if (counts.reference > 0 && counts.authoritative === 0 && counts.contextual === 0) {
    return "reference_support_coordination";
  }

  return "mixed_governance_coordination";
}

function resolveKnowledgeBudgetCoordinationMode(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeBudgetCoordinationMode {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_budget_priority";
    case "contextual_balance_coordination":
      return "contextual_budget_balance";
    case "reference_support_coordination":
      return "reference_budget_support";
    case "mixed_governance_coordination":
    default:
      return "mixed_budget_balance";
  }
}

function resolveKnowledgeSourceGovernanceSummary(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeSourceGovernanceSummary {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_source_priority";
    case "contextual_balance_coordination":
      return "contextual_source_balance";
    case "reference_support_coordination":
      return "reference_source_support";
    case "mixed_governance_coordination":
    default:
      return "mixed_source_orchestration";
  }
}

function resolveKnowledgeGovernanceConsistencyMode(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeGovernanceConsistencyMode {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_governance_aligned";
    case "contextual_balance_coordination":
      return "contextual_governance_aligned";
    case "reference_support_coordination":
      return "reference_governance_aligned";
    case "mixed_governance_coordination":
    default:
      return "mixed_governance_aligned";
  }
}

function resolveKnowledgeGovernanceConvergenceDigest(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeGovernanceConvergenceDigestId {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_governance_convergence";
    case "contextual_balance_coordination":
      return "contextual_governance_convergence";
    case "reference_support_coordination":
      return "reference_governance_convergence";
    case "mixed_governance_coordination":
    default:
      return "mixed_governance_convergence";
  }
}

function resolveKnowledgeSourceBudgetAlignmentSummary(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeSourceBudgetAlignmentSummary {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_budget_source_aligned";
    case "contextual_balance_coordination":
      return "contextual_budget_source_aligned";
    case "reference_support_coordination":
      return "reference_budget_source_aligned";
    case "mixed_governance_coordination":
    default:
      return "mixed_budget_source_aligned";
  }
}

function resolveKnowledgeGovernanceAlignmentMode(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeGovernanceAlignmentMode {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_convergence_aligned";
    case "contextual_balance_coordination":
      return "contextual_convergence_aligned";
    case "reference_support_coordination":
      return "reference_convergence_aligned";
    case "mixed_governance_coordination":
    default:
      return "mixed_convergence_aligned";
  }
}

function resolveKnowledgeGovernanceUnificationDigest(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeGovernanceUnificationDigestId {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_governance_unification";
    case "contextual_balance_coordination":
      return "contextual_governance_unification";
    case "reference_support_coordination":
      return "reference_governance_unification";
    case "mixed_governance_coordination":
    default:
      return "mixed_governance_unification";
  }
}

function resolveKnowledgeSourceBudgetUnificationSummary(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeSourceBudgetUnificationSummary {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_budget_source_unified";
    case "contextual_balance_coordination":
      return "contextual_budget_source_unified";
    case "reference_support_coordination":
      return "reference_budget_source_unified";
    case "mixed_governance_coordination":
    default:
      return "mixed_budget_source_unified";
  }
}

function resolveKnowledgeGovernanceUnificationMode(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeGovernanceUnificationMode {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_runtime_unified";
    case "contextual_balance_coordination":
      return "contextual_runtime_unified";
    case "reference_support_coordination":
      return "reference_runtime_unified";
    case "mixed_governance_coordination":
    default:
      return "mixed_runtime_unified";
  }
}

function resolveKnowledgeGovernanceConsolidationDigest(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeGovernanceConsolidationDigestId {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_governance_consolidation";
    case "contextual_balance_coordination":
      return "contextual_governance_consolidation";
    case "reference_support_coordination":
      return "reference_governance_consolidation";
    case "mixed_governance_coordination":
    default:
      return "mixed_governance_consolidation";
  }
}

function resolveKnowledgeSourceBudgetConsolidationSummary(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeSourceBudgetConsolidationSummary {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_budget_source_consolidated";
    case "contextual_balance_coordination":
      return "contextual_budget_source_consolidated";
    case "reference_support_coordination":
      return "reference_budget_source_consolidated";
    case "mixed_governance_coordination":
    default:
      return "mixed_budget_source_consolidated";
  }
}

function resolveKnowledgeGovernanceConsolidationMode(args: {
  coordinationSummary: KnowledgeGovernanceCoordinationSummary;
}): KnowledgeGovernanceConsolidationMode {
  switch (args.coordinationSummary) {
    case "authoritative_priority_coordination":
      return "authoritative_runtime_consolidated";
    case "contextual_balance_coordination":
      return "contextual_runtime_consolidated";
    case "reference_support_coordination":
      return "reference_runtime_consolidated";
    case "mixed_governance_coordination":
    default:
      return "mixed_runtime_consolidated";
  }
}

function resolveKnowledgeGovernanceSelectionPolicy(args: {
  applicableKnowledge: RuntimeKnowledgeSnippet[];
  activePackId?: ScenarioMemoryPackId | null;
}): KnowledgeGovernanceSelectionPolicy {
  const coordinationSummary = resolveKnowledgeGovernanceCoordinationSummary({
    knowledge: args.applicableKnowledge
  });
  const baseLimit = args.activePackId === "project_ops" ? 3 : 2;

  switch (coordinationSummary) {
    case "authoritative_priority_coordination":
      return {
        prompt_limit: baseLimit,
        route_alignment_bonus_by_class: {
          authoritative: 18,
          contextual: 6,
          reference: 0
        },
        consolidation_bonus_by_class: {
          authoritative: 6,
          contextual: 2,
          reference: 0
        }
      };
    case "contextual_balance_coordination":
      return {
        prompt_limit: baseLimit,
        route_alignment_bonus_by_class: {
          authoritative: 6,
          contextual: 16,
          reference: 2
        },
        consolidation_bonus_by_class: {
          authoritative: 1,
          contextual: 5,
          reference: 0
        }
      };
    case "reference_support_coordination":
      return {
        prompt_limit: 1,
        route_alignment_bonus_by_class: {
          authoritative: 0,
          contextual: 4,
          reference: 14
        },
        consolidation_bonus_by_class: {
          authoritative: 0,
          contextual: 1,
          reference: 5
        }
      };
    case "mixed_governance_coordination":
    default:
      return {
        prompt_limit: baseLimit,
        route_alignment_bonus_by_class: {
          authoritative: 10,
          contextual: 8,
          reference: 4
        },
        consolidation_bonus_by_class: {
          authoritative: 3,
          contextual: 3,
          reference: 2
        }
      };
  }
}

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

export function resolveKnowledgeGovernanceClass(
  snippet: RuntimeKnowledgeSnippet
): KnowledgeGovernanceClass {
  switch (snippet.source_kind) {
    case "project_document":
      return "authoritative";
    case "workspace_note":
      return "contextual";
    case "external_reference":
    default:
      return "reference";
  }
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

export function buildKnowledgeRouteWeighting(args: {
  snippet: RuntimeKnowledgeSnippet;
  activeNamespace?: ActiveMemoryNamespace | null;
  activePackId?: ScenarioMemoryPackId | null;
}): KnowledgeRouteWeighting {
  const layer = resolveKnowledgeScopeLayer(args.snippet);
  const governanceClass = resolveKnowledgeGovernanceClass(args.snippet);
  const namespacePriority = getKnowledgeScopePriorityForNamespace({
    layer,
    namespace: args.activeNamespace
  });
  const scopeWeight = 100 - namespacePriority * 20;
  const namespaceWeight =
    args.activeNamespace?.primary_layer === layer
      ? 25
      : args.activeNamespace?.primary_layer === "project" && layer === "world"
        ? 10
        : args.activeNamespace?.primary_layer === "world" && layer === "project"
          ? 10
          : 0;
  const packWeight =
    args.activePackId === "project_ops"
      ? layer === "project"
        ? 20
        : layer === "world"
          ? 12
          : 4
      : layer === "world"
        ? 16
        : layer === "project"
          ? 12
          : 2;
  const governanceWeight =
    governanceClass === "authoritative"
      ? 24
      : governanceClass === "contextual"
        ? 14
        : 6;

  return {
    governance_class: governanceClass,
    scope_weight: scopeWeight,
    namespace_weight: namespaceWeight,
    pack_weight: packWeight,
    governance_weight: governanceWeight,
    total_weight: scopeWeight + namespaceWeight + packWeight + governanceWeight
  };
}

export function selectKnowledgeForPrompt(args: {
  knowledge: RuntimeKnowledgeSnippet[];
  activeNamespace?: ActiveMemoryNamespace | null;
  activePackId?: ScenarioMemoryPackId | null;
  limit?: number;
}) {
  const applicableKnowledge = filterKnowledgeByActiveNamespace({
    knowledge: args.knowledge,
    namespace: args.activeNamespace
  });
  const selectionPolicy = resolveKnowledgeGovernanceSelectionPolicy({
    applicableKnowledge,
    activePackId: args.activePackId
  });
  const limit =
    args.limit == null
      ? selectionPolicy.prompt_limit
      : Math.min(args.limit, selectionPolicy.prompt_limit);

  return [...applicableKnowledge]
    .sort((left, right) => {
      const leftWeighting = buildKnowledgeRouteWeighting({
        snippet: left,
        activeNamespace: args.activeNamespace,
        activePackId: args.activePackId
      });
      const rightWeighting = buildKnowledgeRouteWeighting({
        snippet: right,
        activeNamespace: args.activeNamespace,
        activePackId: args.activePackId
      });
      const leftTotal =
        leftWeighting.total_weight +
        selectionPolicy.consolidation_bonus_by_class[
          leftWeighting.governance_class
        ] +
        selectionPolicy.route_alignment_bonus_by_class[
          leftWeighting.governance_class
        ];
      const rightTotal =
        rightWeighting.total_weight +
        selectionPolicy.consolidation_bonus_by_class[
          rightWeighting.governance_class
        ] +
        selectionPolicy.route_alignment_bonus_by_class[
          rightWeighting.governance_class
        ];

      if (leftTotal !== rightTotal) {
        return rightTotal - leftTotal;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}

export function buildKnowledgePromptSection(args: {
  knowledge: RuntimeKnowledgeSnippet[];
  activeNamespace?: ActiveMemoryNamespace | null;
  activePackId?: ScenarioMemoryPackId | null;
  replyLanguage: RuntimeReplyLanguage;
}) {
  const selectedKnowledge = selectKnowledgeForPrompt({
    knowledge: args.knowledge,
    activeNamespace: args.activeNamespace,
    activePackId: args.activePackId,
    limit: args.activePackId === "project_ops" ? 3 : 2
  });

  if (selectedKnowledge.length === 0) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const applicableKnowledge = filterKnowledgeByActiveNamespace({
    knowledge: args.knowledge,
    namespace: args.activeNamespace
  });
  const governanceCoordinationSummary =
    resolveKnowledgeGovernanceCoordinationSummary({
      knowledge: applicableKnowledge
    });
  const budgetCoordinationMode = resolveKnowledgeBudgetCoordinationMode({
    coordinationSummary: governanceCoordinationSummary
  });
  const sourceGovernanceSummary = resolveKnowledgeSourceGovernanceSummary({
    coordinationSummary: governanceCoordinationSummary
  });
  const governanceConsistencyMode = resolveKnowledgeGovernanceConsistencyMode({
    coordinationSummary: governanceCoordinationSummary
  });
  const governanceConvergenceDigest =
    resolveKnowledgeGovernanceConvergenceDigest({
      coordinationSummary: governanceCoordinationSummary
    });
  const sourceBudgetAlignmentSummary =
    resolveKnowledgeSourceBudgetAlignmentSummary({
      coordinationSummary: governanceCoordinationSummary
    });
  const governanceAlignmentMode = resolveKnowledgeGovernanceAlignmentMode({
    coordinationSummary: governanceCoordinationSummary
  });
  const governanceUnificationDigest =
    resolveKnowledgeGovernanceUnificationDigest({
      coordinationSummary: governanceCoordinationSummary
    });
  const sourceBudgetUnificationSummary =
    resolveKnowledgeSourceBudgetUnificationSummary({
      coordinationSummary: governanceCoordinationSummary
    });
  const governanceUnificationMode = resolveKnowledgeGovernanceUnificationMode({
    coordinationSummary: governanceCoordinationSummary
  });
  const governanceConsolidationDigest =
    resolveKnowledgeGovernanceConsolidationDigest({
      coordinationSummary: governanceCoordinationSummary
    });
  const sourceBudgetConsolidationSummary =
    resolveKnowledgeSourceBudgetConsolidationSummary({
      coordinationSummary: governanceCoordinationSummary
    });
  const governanceConsolidationMode =
    resolveKnowledgeGovernanceConsolidationMode({
      coordinationSummary: governanceCoordinationSummary
    });
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
      ? `当前 knowledge governance coordination = ${governanceCoordinationSummary}；budget coordination = ${budgetCoordinationMode}。`
      : `Current knowledge governance coordination = ${governanceCoordinationSummary}; budget coordination = ${budgetCoordinationMode}.`,
    isZh
      ? `当前 source orchestration = ${sourceGovernanceSummary}；consistency = ${governanceConsistencyMode}。`
      : `Current source orchestration = ${sourceGovernanceSummary}; consistency = ${governanceConsistencyMode}.`,
    isZh
      ? `当前 governance convergence = ${governanceConvergenceDigest}；budget/source alignment = ${sourceBudgetAlignmentSummary}；alignment mode = ${governanceAlignmentMode}。`
      : `Current governance convergence = ${governanceConvergenceDigest}; budget/source alignment = ${sourceBudgetAlignmentSummary}; alignment mode = ${governanceAlignmentMode}.`,
    isZh
      ? `当前 governance unification = ${governanceUnificationDigest}；budget/source unification = ${sourceBudgetUnificationSummary}；unification mode = ${governanceUnificationMode}。`
      : `Current governance unification = ${governanceUnificationDigest}; budget/source unification = ${sourceBudgetUnificationSummary}; unification mode = ${governanceUnificationMode}.`,
    isZh
      ? `当前 governance consolidation = ${governanceConsolidationDigest}；budget/source consolidation = ${sourceBudgetConsolidationSummary}；consolidation mode = ${governanceConsolidationMode}。`
      : `Current governance consolidation = ${governanceConsolidationDigest}; budget/source consolidation = ${sourceBudgetConsolidationSummary}; consolidation mode = ${governanceConsolidationMode}.`,
    isZh
      ? args.activePackId === "project_ops"
        ? "把这些内容当作按 project/world/general 分层的外部知识来源；当前 project_ops prompt budget 会优先保留 project/world，并允许在预算内带入一条 general knowledge。不要把它们误写成用户长期偏好或线程即时状态。"
        : "把这些内容当作按 project/world/general 分层的外部知识来源；当前 prompt budget 会优先保留 project/world，再考虑 general。不要把它们误写成用户长期偏好或线程即时状态。"
      : args.activePackId === "project_ops"
        ? "Treat these items as project/world/general knowledge inputs; the project_ops prompt budget prioritizes project/world and may carry one general item when budget permits. Do not rewrite them as user preference memory or live thread-state."
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
  const governanceCoordinationSummary =
    resolveKnowledgeGovernanceCoordinationSummary({
      knowledge: applicableKnowledge
    });
  const budgetCoordinationMode = resolveKnowledgeBudgetCoordinationMode({
    coordinationSummary: governanceCoordinationSummary
  });
  const sourceGovernanceSummary = resolveKnowledgeSourceGovernanceSummary({
    coordinationSummary: governanceCoordinationSummary
  });
  const governanceConsistencyMode = resolveKnowledgeGovernanceConsistencyMode({
    coordinationSummary: governanceCoordinationSummary
  });
  const governanceConvergenceDigest =
    resolveKnowledgeGovernanceConvergenceDigest({
      coordinationSummary: governanceCoordinationSummary
    });
  const sourceBudgetAlignmentSummary =
    resolveKnowledgeSourceBudgetAlignmentSummary({
      coordinationSummary: governanceCoordinationSummary
    });
  const governanceAlignmentMode = resolveKnowledgeGovernanceAlignmentMode({
    coordinationSummary: governanceCoordinationSummary
  });
  const governanceUnificationDigest =
    resolveKnowledgeGovernanceUnificationDigest({
      coordinationSummary: governanceCoordinationSummary
    });
  const sourceBudgetUnificationSummary =
    resolveKnowledgeSourceBudgetUnificationSummary({
      coordinationSummary: governanceCoordinationSummary
    });
  const governanceUnificationMode = resolveKnowledgeGovernanceUnificationMode({
    coordinationSummary: governanceCoordinationSummary
  });
  const governanceConsolidationDigest =
    resolveKnowledgeGovernanceConsolidationDigest({
      coordinationSummary: governanceCoordinationSummary
    });
  const sourceBudgetConsolidationSummary =
    resolveKnowledgeSourceBudgetConsolidationSummary({
      coordinationSummary: governanceCoordinationSummary
    });
  const governanceConsolidationMode =
    resolveKnowledgeGovernanceConsolidationMode({
      coordinationSummary: governanceCoordinationSummary
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
    governance_classes: Array.from(
      new Set(
        applicableKnowledge.map((item) => resolveKnowledgeGovernanceClass(item))
      )
    ),
    governance_coordination_summary: governanceCoordinationSummary,
    budget_coordination_mode: budgetCoordinationMode,
    source_governance_summary: sourceGovernanceSummary,
    governance_consistency_mode: governanceConsistencyMode,
    governance_convergence_digest: governanceConvergenceDigest,
    source_budget_alignment_summary: sourceBudgetAlignmentSummary,
    governance_alignment_mode: governanceAlignmentMode,
    governance_unification_digest: governanceUnificationDigest,
    source_budget_unification_summary: sourceBudgetUnificationSummary,
    governance_unification_mode: governanceUnificationMode,
    governance_consolidation_digest: governanceConsolidationDigest,
    source_budget_consolidation_summary:
      sourceBudgetConsolidationSummary,
    governance_consolidation_mode: governanceConsolidationMode,
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
    },
    governance_counts: {
      authoritative: applicableKnowledge.filter(
        (item) => resolveKnowledgeGovernanceClass(item) === "authoritative"
      ).length,
      contextual: applicableKnowledge.filter(
        (item) => resolveKnowledgeGovernanceClass(item) === "contextual"
      ).length,
      reference: applicableKnowledge.filter(
        (item) => resolveKnowledgeGovernanceClass(item) === "reference"
      ).length
    }
  };
}
