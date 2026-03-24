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
