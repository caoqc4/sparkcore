import {
  loadActivePersonaPackById,
  loadOwnedAvailableAgents,
  loadPrimaryWorkspace,
} from "@/lib/chat/runtime-turn-context";

type AvailableAgentRow = {
  id: string;
  name: string;
  source_persona_pack_id: string | null;
  metadata: unknown;
};

type ProductKnowledgeSource = {
  id: string;
  title: string;
  kind: "persona_pack" | "product_seed" | "custom_placeholder";
  status: "active" | "placeholder";
  summary: string;
  detail: string | null;
  scopeLabel: string;
  updatedAt: string | null;
};

export type ProductKnowledgePageData = {
  workspaceId: string;
  roleName: string | null;
  sources: ProductKnowledgeSource[];
  sharedSourceCount: number;
};

function getMetadataRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getSourceTitleFromMetadata(metadata: Record<string, unknown> | null) {
  const slug = metadata?.source_slug;

  if (typeof slug === "string" && slug.length > 0) {
    return slug;
  }

  return null;
}

function buildFallbackKnowledgeSource(args: {
  roleName: string | null;
}): ProductKnowledgeSource {
  return {
    id: "product-role-fallback",
    title: "Role-defined guidance",
    kind: "product_seed",
    status: "placeholder",
    summary:
      args.roleName
        ? `${args.roleName} is currently driven by role settings rather than an attached knowledge source.`
        : "This role is currently driven by role settings rather than an attached knowledge source.",
    detail:
      "Knowledge sources will appear here once persona packs, reference files, or future uploaded material are attached.",
    scopeLabel: "Current role",
    updatedAt: null,
  };
}

export async function loadProductKnowledgePageData(args: {
  supabase: any;
  userId: string;
  roleId?: string | null;
}): Promise<ProductKnowledgePageData | null> {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.userId,
  });

  if (!workspace) {
    return null;
  }

  const { data: agents } = await loadOwnedAvailableAgents({
    supabase: args.supabase,
    workspaceId: workspace.id,
    userId: args.userId,
  });

  const requestedRoleId =
    typeof args.roleId === "string" && args.roleId.length > 0 ? args.roleId : null;
  const availableAgents = (agents ?? []) as AvailableAgentRow[];
  const selectedAgent =
    (requestedRoleId
      ? availableAgents.find((agent: AvailableAgentRow) => agent.id === requestedRoleId)
      : null) ?? availableAgents[0] ?? null;

  if (!selectedAgent) {
    return {
      workspaceId: workspace.id,
      roleName: null,
      sources: [buildFallbackKnowledgeSource({ roleName: null })],
      sharedSourceCount: 0,
    };
  }

  const metadata = getMetadataRecord(selectedAgent.metadata);
  const personaPackId =
    typeof selectedAgent.source_persona_pack_id === "string" &&
    selectedAgent.source_persona_pack_id.length > 0
      ? selectedAgent.source_persona_pack_id
      : null;

  const personaPack = personaPackId
    ? (await loadActivePersonaPackById({
        supabase: args.supabase,
        personaPackId,
      })).data
    : null;

  const sources: ProductKnowledgeSource[] = [];

  if (personaPack) {
    sources.push({
      id: personaPack.id,
      title: personaPack.name,
      kind: "persona_pack",
      status: "active",
      summary:
        personaPack.persona_summary ||
        "This source package provides the base guidance shaping the companion.",
      detail:
        typeof personaPack.slug === "string" && personaPack.slug.length > 0
          ? `Source pack · ${personaPack.slug}`
          : null,
      scopeLabel: "Current role",
      updatedAt:
        metadata && typeof metadata.updated_at === "string"
          ? metadata.updated_at
          : null,
    });
  }

  const sourceTitle = getSourceTitleFromMetadata(metadata);

  if (!personaPack && sourceTitle) {
    sources.push({
      id: `source-${sourceTitle}`,
      title: sourceTitle,
      kind: "product_seed",
      status: "active",
      summary:
        typeof metadata?.source_description === "string" &&
        metadata.source_description.length > 0
          ? metadata.source_description
          : "This role currently inherits its starting guidance from a seeded product source.",
      detail: "Current role source metadata",
      scopeLabel: "Current role",
      updatedAt: null,
    });
  }

  if (sources.length === 0) {
    sources.push(
      buildFallbackKnowledgeSource({
        roleName: selectedAgent.name,
      }),
    );
  }

  const sharedPersonaPackIds = new Set(
    availableAgents
      .map((agent: AvailableAgentRow) =>
        typeof agent.source_persona_pack_id === "string"
          ? agent.source_persona_pack_id
          : null,
      )
      .filter((value: string | null): value is string => Boolean(value)),
  );

  return {
    workspaceId: workspace.id,
    roleName: selectedAgent.name,
    sources,
    sharedSourceCount: sharedPersonaPackIds.size,
  };
}
