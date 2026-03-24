export type ScenarioMemoryLayer =
  | "thread_state"
  | "dynamic_profile"
  | "static_profile"
  | "memory_record"
  | "knowledge";

export type ScenarioMemoryRoute =
  | "profile"
  | "episode"
  | "timeline"
  | "thread_state"
  | "knowledge";

export type ScenarioMemoryPackId = "companion" | "project_ops";

export type ScenarioStrategyPolicyId =
  | "continuity_companion_policy"
  | "project_delivery_policy"
  | "knowledge_guided_companion_policy";

export type ScenarioOrchestrationMode =
  | "continuity_centered"
  | "execution_centered"
  | "knowledge_guided";

export type ScenarioOrchestrationDigestId =
  | "continuity_companion_orchestration"
  | "project_delivery_orchestration"
  | "knowledge_guided_companion_orchestration";

export type ScenarioStrategyRationaleSummary =
  | "continuity_alignment"
  | "execution_priority_alignment"
  | "knowledge_guided_alignment";

export type ScenarioOrchestrationCoordinationSummary =
  | "continuity_companion_coordination"
  | "project_delivery_coordination"
  | "knowledge_guided_companion_coordination";

export type ScenarioStrategyConsistencyMode =
  | "continuity_governance_aligned"
  | "execution_governance_aligned"
  | "knowledge_guidance_aligned";

export type ScenarioGovernanceConvergenceDigestId =
  | "continuity_governance_convergence"
  | "project_delivery_governance_convergence"
  | "knowledge_guided_governance_convergence";

export type ScenarioStrategyConvergenceSummary =
  | "continuity_strategy_alignment"
  | "project_delivery_strategy_alignment"
  | "knowledge_guided_strategy_alignment";

export type ScenarioOrchestrationAlignmentMode =
  | "continuity_convergence_aligned"
  | "execution_convergence_aligned"
  | "knowledge_guided_convergence_aligned";

export type ScenarioGovernanceUnificationDigestId =
  | "continuity_governance_unification"
  | "project_delivery_governance_unification"
  | "knowledge_guided_governance_unification";

export type ScenarioStrategyUnificationSummary =
  | "continuity_strategy_unified"
  | "project_delivery_strategy_unified"
  | "knowledge_guided_strategy_unified";

export type ScenarioOrchestrationUnificationMode =
  | "continuity_runtime_unified"
  | "execution_runtime_unified"
  | "knowledge_guided_runtime_unified";

export type ScenarioGovernanceConsolidationDigestId =
  | "continuity_governance_consolidation"
  | "project_delivery_governance_consolidation"
  | "knowledge_guided_governance_consolidation";

export type ScenarioStrategyConsolidationSummary =
  | "continuity_strategy_consolidated"
  | "project_delivery_strategy_consolidated"
  | "knowledge_guided_strategy_consolidated";

export type ScenarioOrchestrationConsolidationMode =
  | "continuity_runtime_consolidated"
  | "execution_runtime_consolidated"
  | "knowledge_guided_runtime_consolidated";

export type ScenarioGovernanceCoordinationDigestId =
  | "continuity_governance_coordination"
  | "project_delivery_governance_coordination"
  | "knowledge_guided_governance_coordination";

export type ScenarioStrategyRuntimeCoordinationSummary =
  | "continuity_strategy_runtime_coordination"
  | "project_delivery_strategy_runtime_coordination"
  | "knowledge_guided_strategy_runtime_coordination";

export type ScenarioOrchestrationCoordinationModeV9 =
  | "continuity_runtime_coordination"
  | "execution_runtime_coordination"
  | "knowledge_guided_runtime_coordination";

export type ScenarioStrategyRuntimeReuseSummary =
  | "continuity_strategy_runtime_reuse"
  | "project_delivery_strategy_runtime_reuse"
  | "knowledge_guided_strategy_runtime_reuse";

export type ScenarioGovernanceCoordinationReuseMode =
  | "continuity_runtime_coordination_reuse"
  | "execution_runtime_coordination_reuse"
  | "knowledge_guided_runtime_coordination_reuse";

export type ScenarioGovernancePlaneDigestId =
  | "continuity_governance_plane"
  | "project_delivery_governance_plane"
  | "knowledge_guided_governance_plane";

export type ScenarioStrategyGovernancePlaneSummary =
  | "continuity_strategy_governance_plane"
  | "project_delivery_strategy_governance_plane"
  | "knowledge_guided_strategy_governance_plane";

export type ScenarioOrchestrationGovernancePlaneMode =
  | "continuity_runtime_governance_plane"
  | "execution_runtime_governance_plane"
  | "knowledge_guided_runtime_governance_plane";

export type ScenarioGovernancePlaneReuseMode =
  | "continuity_runtime_governance_plane_reuse"
  | "execution_runtime_governance_plane_reuse"
  | "knowledge_guided_runtime_governance_plane_reuse";

export type ScenarioGovernanceFabricDigestId =
  | "continuity_governance_fabric"
  | "project_delivery_governance_fabric"
  | "knowledge_guided_governance_fabric";

export type ScenarioStrategyGovernanceFabricSummary =
  | "continuity_strategy_governance_fabric"
  | "project_delivery_strategy_governance_fabric"
  | "knowledge_guided_strategy_governance_fabric";

export type ScenarioOrchestrationGovernanceFabricMode =
  | "continuity_runtime_governance_fabric"
  | "execution_runtime_governance_fabric"
  | "knowledge_guided_runtime_governance_fabric";

export type ScenarioGovernanceFabricReuseMode =
  | "continuity_runtime_governance_fabric_reuse"
  | "execution_runtime_governance_fabric_reuse"
  | "knowledge_guided_runtime_governance_fabric_reuse";

export type ScenarioGovernanceFabricPlaneDigestId =
  | "continuity_governance_fabric_plane"
  | "project_delivery_governance_fabric_plane"
  | "knowledge_guided_governance_fabric_plane";

export type ScenarioStrategyGovernanceFabricPlaneSummary =
  | "continuity_strategy_governance_fabric_plane"
  | "project_delivery_strategy_governance_fabric_plane"
  | "knowledge_guided_strategy_governance_fabric_plane";

export type ScenarioOrchestrationGovernanceFabricPlaneMode =
  | "continuity_runtime_governance_fabric_plane"
  | "execution_runtime_governance_fabric_plane"
  | "knowledge_guided_runtime_governance_fabric_plane";

export type ScenarioGovernanceFabricPlaneReuseMode =
  | "continuity_runtime_governance_fabric_plane_reuse"
  | "execution_runtime_governance_fabric_plane_reuse"
  | "knowledge_guided_runtime_governance_fabric_plane_reuse";

export type ScenarioMemoryPack = {
  pack_id: ScenarioMemoryPackId;
  label: string;
  description: string;
  schema_extensions: string[];
  extraction_hints: string[];
  preferred_routes: ScenarioMemoryRoute[];
  assembly_order: ScenarioMemoryLayer[];
  eval_hooks: string[];
};

export const COMPANION_SCENARIO_MEMORY_PACK: ScenarioMemoryPack = {
  pack_id: "companion",
  label: "Companion",
  description:
    "Optimize memory behavior for long-running companion interaction with stronger continuity, preference carryover, and relationship-aware grounding.",
  schema_extensions: [
    "relationship stance",
    "reply preference drift",
    "phase-level working mode"
  ],
  extraction_hints: [
    "Prefer stable relationship cues before broad factual notes.",
    "Promote short-to-medium horizon preference shifts into dynamic profile.",
    "Keep immediate task focus inside thread_state."
  ],
  preferred_routes: ["thread_state", "profile", "episode", "timeline"],
  assembly_order: [
    "thread_state",
    "dynamic_profile",
    "static_profile",
    "memory_record"
  ],
  eval_hooks: [
    "continuity_preservation",
    "relationship_grounding",
    "preference_carryover"
  ]
};

export const PROJECT_OPS_SCENARIO_MEMORY_PACK: ScenarioMemoryPack = {
  pack_id: "project_ops",
  label: "Project Ops",
  description:
    "Optimize memory behavior for project execution with stronger project knowledge grounding, clearer task continuity, and tighter thread-to-project handoff.",
  schema_extensions: [
    "project objective anchor",
    "delivery risk note",
    "execution preference drift"
  ],
  extraction_hints: [
    "Prefer project-scoped facts before broad relationship carryover.",
    "Keep execution-mode preferences in dynamic profile when they persist across turns.",
    "Promote project knowledge into context before generic guidance."
  ],
  preferred_routes: ["thread_state", "knowledge", "episode", "profile"],
  assembly_order: [
    "thread_state",
    "knowledge",
    "dynamic_profile",
    "memory_record"
  ],
  eval_hooks: [
    "project_grounding",
    "task_continuity",
    "knowledge_budget_priority"
  ]
};

export function resolveBuiltInScenarioMemoryPack(
  packId: ScenarioMemoryPackId = "companion"
): ScenarioMemoryPack {
  switch (packId) {
    case "project_ops":
      return PROJECT_OPS_SCENARIO_MEMORY_PACK;
    case "companion":
    default:
      return COMPANION_SCENARIO_MEMORY_PACK;
  }
}
