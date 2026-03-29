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

type KnowledgeSourceRow = {
  id: string;
  title: string;
  source_type: string;
  status: string;
  processing_status: string;
  target_role_id: string | null;
  content_excerpt: string | null;
  original_file_name: string | null;
  error_message: string | null;
  last_error_code: string | null;
  processing_attempt_count: number | null;
  last_processing_started_at: string | null;
  last_processed_at: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type ProductKnowledgeSourceRun = {
  id: string;
  stage: string;
  status: string;
  message: string | null;
  createdAt: string | null;
};

type ProductKnowledgeSource = {
  id: string;
  title: string;
  kind: "persona_pack" | "product_seed" | "document" | "url" | "note" | "custom_placeholder";
  status: "active" | "processing" | "failed" | "placeholder";
  summary: string;
  detail: string | null;
  scopeLabel: string;
  updatedAt: string | null;
  processingStatus: string | null;
  attemptCount: number;
  lastProcessingStartedAt: string | null;
  lastProcessedAt: string | null;
  lastErrorCode: string | null;
  errorMessage: string | null;
  latestRun: ProductKnowledgeSourceRun | null;
  canRetry: boolean;
  canArchive: boolean;
  canDelete: boolean;
};

export type ProductKnowledgePageData = {
  workspaceId: string;
  roleName: string | null;
  sources: ProductKnowledgeSource[];
  sharedSourceCount: number;
};

type KnowledgeSourceProcessingRunRow = {
  id: string;
  source_id: string;
  stage: string;
  status: string;
  message: string | null;
  created_at: string | null;
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

function mapKnowledgeRowKind(sourceType: string): ProductKnowledgeSource["kind"] {
  if (sourceType === "document" || sourceType === "url" || sourceType === "note") {
    return sourceType;
  }

  return "product_seed";
}

function mapKnowledgeRowStatus(args: {
  status: string;
  processingStatus: string;
}): ProductKnowledgeSource["status"] {
  if (args.status === "failed" || args.processingStatus === "failed") {
    return "failed";
  }

  if (args.status === "processing" || args.processingStatus === "queued" || args.processingStatus === "parsing") {
    return "processing";
  }

  return "active";
}

function isKnowledgeSourceStuck(args: {
  status: string;
  processingStatus: string;
  lastProcessingStartedAt: string | null;
  lastProcessedAt: string | null;
  latestRun: KnowledgeSourceProcessingRunRow | null;
}) {
  if (
    args.status !== "processing" &&
    args.processingStatus !== "queued" &&
    args.processingStatus !== "parsing"
  ) {
    return false;
  }

  if (args.lastProcessedAt) {
    return false;
  }

  if (args.latestRun?.status === "failed") {
    return true;
  }

  const startedAt = args.lastProcessingStartedAt ?? args.latestRun?.created_at ?? null;
  if (!startedAt) {
    return false;
  }

  const startedMs = Date.parse(startedAt);
  if (Number.isNaN(startedMs)) {
    return false;
  }

  const STALE_MS = 10 * 60 * 1000;
  return Date.now() - startedMs > STALE_MS;
}

async function loadOwnedKnowledgeSources(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
  roleId?: string | null;
}) {
  let query = args.supabase
    .from("knowledge_sources")
    .select(
      "id, title, source_type, status, processing_status, target_role_id, content_excerpt, original_file_name, error_message, last_error_code, processing_attempt_count, last_processing_started_at, last_processed_at, updated_at, created_at"
    )
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .order("updated_at", { ascending: false });

  if (args.roleId) {
    query = query.or(`target_role_id.is.null,target_role_id.eq.${args.roleId}`);
  }

  return query;
}

async function loadRecentKnowledgeSourceRuns(args: {
  supabase: any;
  userId: string;
  sourceIds: string[];
}) {
  if (args.sourceIds.length === 0) {
    return [] as KnowledgeSourceProcessingRunRow[];
  }

  const { data, error } = await args.supabase
    .from("knowledge_source_processing_runs")
    .select("id, source_id, stage, status, message, created_at")
    .eq("owner_user_id", args.userId)
    .in("source_id", args.sourceIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load knowledge processing runs: ${error.message}`);
  }

  return (data ?? []) as KnowledgeSourceProcessingRunRow[];
}

export async function loadOwnedKnowledgeSourcesForExport(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
}) {
  const { data, error } = await args.supabase
    .from("knowledge_sources")
    .select(
      "id, title, source_type, status, processing_status, target_role_id, content_excerpt, original_file_name, mime_type, storage_path, error_message, metadata, updated_at, created_at"
    )
    .eq("workspace_id", args.workspaceId)
    .eq("owner_user_id", args.userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load knowledge sources for export: ${error.message}`);
  }

  return data ?? [];
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
    processingStatus: null,
    attemptCount: 0,
    lastProcessingStartedAt: null,
    lastProcessedAt: null,
    lastErrorCode: null,
    errorMessage: null,
    latestRun: null,
    canRetry: false,
    canArchive: false,
    canDelete: false
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
  const knowledgeSourceResult = await loadOwnedKnowledgeSources({
    supabase: args.supabase,
    workspaceId: workspace.id,
    userId: args.userId,
    roleId: selectedAgent.id
  });
  const knowledgeRows = (knowledgeSourceResult.data ?? []) as KnowledgeSourceRow[];
  const processingRuns = await loadRecentKnowledgeSourceRuns({
    supabase: args.supabase,
    userId: args.userId,
    sourceIds: knowledgeRows.map((row) => row.id)
  });
  const latestRunBySourceId = new Map<string, KnowledgeSourceProcessingRunRow>();
  for (const run of processingRuns) {
    if (!latestRunBySourceId.has(run.source_id)) {
      latestRunBySourceId.set(run.source_id, run);
    }
  }

  for (const row of knowledgeRows) {
    const latestRun = latestRunBySourceId.get(row.id) ?? null;
    const baseStatus = mapKnowledgeRowStatus({
      status: row.status,
      processingStatus: row.processing_status
    });
    const stuck = isKnowledgeSourceStuck({
      status: row.status,
      processingStatus: row.processing_status,
      lastProcessingStartedAt: row.last_processing_started_at,
      lastProcessedAt: row.last_processed_at,
      latestRun
    });
    const mappedStatus: ProductKnowledgeSource["status"] = stuck ? "failed" : baseStatus;
    const effectiveProcessingStatus =
      stuck && row.processing_status !== "failed" ? "failed" : row.processing_status;
    const effectiveErrorMessage =
      stuck && !row.error_message
        ? "Processing appears to have stalled. Retry this source to try again."
        : row.error_message;

    sources.push({
      id: row.id,
      title: row.title,
      kind: mapKnowledgeRowKind(row.source_type),
      status: mappedStatus,
      summary:
        row.content_excerpt ||
        (mappedStatus === "failed"
          ? "This source could not be processed yet."
          : "This source is available to support the companion's reference knowledge."),
      detail:
        row.original_file_name ||
        (row.source_type === "url"
          ? "Web reference"
          : row.source_type === "note"
            ? "Saved note"
            : "Uploaded document"),
      scopeLabel: row.target_role_id ? "Current role" : "Shared workspace",
      updatedAt: row.updated_at ?? row.created_at,
      processingStatus: effectiveProcessingStatus,
      attemptCount: typeof row.processing_attempt_count === "number" ? row.processing_attempt_count : 0,
      lastProcessingStartedAt: row.last_processing_started_at,
      lastProcessedAt: row.last_processed_at,
      lastErrorCode: row.last_error_code,
      errorMessage: effectiveErrorMessage,
      latestRun: latestRun
        ? {
            id: latestRun.id,
            stage: latestRun.stage,
            status: latestRun.status,
            message: latestRun.message,
            createdAt: latestRun.created_at
          }
        : null,
      canRetry: row.status === "failed" || row.processing_status === "failed" || stuck,
      canArchive: row.status !== "archived",
      canDelete: true
    });
  }

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
      processingStatus: "indexed",
      attemptCount: 0,
      lastProcessingStartedAt: null,
      lastProcessedAt: null,
      lastErrorCode: null,
      errorMessage: null,
      latestRun: null,
      canRetry: false,
      canArchive: false,
      canDelete: false
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
      processingStatus: "indexed",
      attemptCount: 0,
      lastProcessingStartedAt: null,
      lastProcessedAt: null,
      lastErrorCode: null,
      errorMessage: null,
      latestRun: null,
      canRetry: false,
      canArchive: false,
      canDelete: false
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
    sharedSourceCount:
      knowledgeRows.filter((row) => !row.target_role_id).length || sharedPersonaPackIds.size,
  };
}
