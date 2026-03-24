export type MemoryNamespaceLayer =
  | "user"
  | "agent"
  | "thread"
  | "project"
  | "world";

export type MemoryNamespaceRef = {
  layer: MemoryNamespaceLayer;
  entity_id: string;
};

export type ActiveMemoryNamespace = {
  namespace_id: string;
  primary_layer: MemoryNamespaceLayer;
  active_layers: MemoryNamespaceLayer[];
  refs: MemoryNamespaceRef[];
};

export type MemoryNamespacePolicyBundleId =
  | "thread_strict_focus"
  | "project_balanced_coordination"
  | "world_reference_exploration"
  | "default_balanced_memory";

export type MemoryNamespacePolicyDigestId =
  | "thread_focus_orchestration"
  | "project_coordination_orchestration"
  | "world_reference_orchestration"
  | "default_memory_orchestration";

function getPrimaryNamespaceLayer(
  layers: MemoryNamespaceLayer[]
): MemoryNamespaceLayer {
  if (layers.includes("project")) {
    return "project";
  }

  if (layers.includes("thread")) {
    return "thread";
  }

  if (layers.includes("agent")) {
    return "agent";
  }

  if (layers.includes("user")) {
    return "user";
  }

  return "world";
}

export function buildActiveMemoryNamespace(args: {
  user_id: string;
  agent_id?: string | null;
  thread_id?: string | null;
  project_id?: string | null;
  world_id?: string | null;
}): ActiveMemoryNamespace {
  const refs: MemoryNamespaceRef[] = [
    {
      layer: "user",
      entity_id: args.user_id
    }
  ];

  if (args.agent_id) {
    refs.push({
      layer: "agent",
      entity_id: args.agent_id
    });
  }

  if (args.thread_id) {
    refs.push({
      layer: "thread",
      entity_id: args.thread_id
    });
  }

  if (args.project_id) {
    refs.push({
      layer: "project",
      entity_id: args.project_id
    });
  }

  if (args.world_id) {
    refs.push({
      layer: "world",
      entity_id: args.world_id
    });
  }

  const activeLayers = refs.map((ref) => ref.layer);

  return {
    namespace_id: refs.map((ref) => `${ref.layer}:${ref.entity_id}`).join("|"),
    primary_layer: getPrimaryNamespaceLayer(activeLayers),
    active_layers: activeLayers,
    refs
  };
}
