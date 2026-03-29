import type { KnowledgeSourceKind } from "@sparkcore/core-memory";

type KnowledgeSnapshotScope = {
  userId: string;
  agentId: string | null;
  threadId?: string | null;
  projectId?: string | null;
  worldId?: string | null;
};

type KnowledgeSnapshotRecordInput = {
  knowledgeSourceId: string;
  workspaceId: string;
  ownerUserId: string;
  targetRoleId: string | null;
  snapshotIndex: number;
  title: string;
  summary: string;
  bodyText: string;
  sourceKind: KnowledgeSourceKind;
  capturedAt: string;
  scope: KnowledgeSnapshotScope;
  metadata?: Record<string, unknown>;
};

function normalizeBlock(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function clipSummary(text: string, maxLength = 280) {
  const normalized = normalizeBlock(text);
  return normalized.slice(0, maxLength) || "";
}

export function mapProductKnowledgeSourceKind(sourceType: "document" | "url" | "note" | "pack") {
  switch (sourceType) {
    case "note":
      return "workspace_note" as const;
    case "url":
      return "external_reference" as const;
    case "document":
    case "pack":
    default:
      return "project_document" as const;
  }
}

export function buildKnowledgeSnapshotScope(args: {
  ownerUserId: string;
  targetRoleId: string | null;
}) {
  return {
    userId: args.ownerUserId,
    agentId: args.targetRoleId
  };
}

export function buildKnowledgeSnapshotRecords(args: {
  knowledgeSourceId: string;
  workspaceId: string;
  ownerUserId: string;
  targetRoleId: string | null;
  title: string;
  sourceType: "document" | "url" | "note" | "pack";
  extractedText: string;
  capturedAt?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const normalized = args.extractedText.replace(/\u0000/g, " ").trim();
  if (!normalized) {
    return [] as KnowledgeSnapshotRecordInput[];
  }

  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .map((segment) => normalizeBlock(segment))
    .filter(Boolean);
  const blocks = paragraphs.length > 0 ? paragraphs : [normalizeBlock(normalized)];

  const chunks: string[] = [];
  let current = "";
  const maxChunkLength = 1400;

  for (const block of blocks) {
    const candidate = current ? `${current}\n\n${block}` : block;
    if (candidate.length <= maxChunkLength) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (block.length <= maxChunkLength) {
      current = block;
      continue;
    }

    for (let index = 0; index < block.length; index += maxChunkLength) {
      chunks.push(block.slice(index, index + maxChunkLength).trim());
    }

    current = "";
  }

  if (current) {
    chunks.push(current);
  }

  const capturedAt = args.capturedAt ?? new Date().toISOString();
  const sourceKind = mapProductKnowledgeSourceKind(args.sourceType);
  const scope = buildKnowledgeSnapshotScope({
    ownerUserId: args.ownerUserId,
    targetRoleId: args.targetRoleId
  });

  const records: KnowledgeSnapshotRecordInput[] = [];

  for (const [snapshotIndex, bodyText] of chunks.entries()) {
    const cleanBody = normalizeBlock(bodyText);
    if (!cleanBody) {
      continue;
    }

    const title =
      chunks.length > 1 ? `${args.title} (Part ${snapshotIndex + 1})` : args.title;

    records.push({
      knowledgeSourceId: args.knowledgeSourceId,
      workspaceId: args.workspaceId,
      ownerUserId: args.ownerUserId,
      targetRoleId: args.targetRoleId,
      snapshotIndex,
      title,
      summary: clipSummary(cleanBody),
      bodyText: cleanBody,
      sourceKind,
      capturedAt,
      scope,
      metadata: {
        ...(args.metadata ?? {}),
        chunk_count: chunks.length
      }
    });
  }

  return records;
}

export async function replaceKnowledgeSnapshotsForSource(args: {
  supabase: any;
  knowledgeSourceId: string;
  rows: KnowledgeSnapshotRecordInput[];
}) {
  const { error: deleteError } = await args.supabase
    .from("knowledge_snapshots")
    .delete()
    .eq("knowledge_source_id", args.knowledgeSourceId);

  if (deleteError) {
    throw new Error(`Failed to clear previous knowledge snapshots: ${deleteError.message}`);
  }

  if (args.rows.length === 0) {
    return;
  }

  const payload = args.rows.map((row) => ({
    knowledge_source_id: row.knowledgeSourceId,
    workspace_id: row.workspaceId,
    owner_user_id: row.ownerUserId,
    target_role_id: row.targetRoleId,
    snapshot_index: row.snapshotIndex,
    title: row.title,
    summary: row.summary,
    body_text: row.bodyText,
    source_kind: row.sourceKind,
    captured_at: row.capturedAt,
    scope_user_id: row.scope.userId,
    scope_agent_id: row.scope.agentId,
    scope_thread_id: row.scope.threadId ?? null,
    scope_project_id: row.scope.projectId ?? null,
    scope_world_id: row.scope.worldId ?? null,
    metadata: row.metadata ?? {}
  }));

  const { error: insertError } = await args.supabase
    .from("knowledge_snapshots")
    .insert(payload);

  if (insertError) {
    throw new Error(`Failed to write knowledge snapshots: ${insertError.message}`);
  }
}

export async function clearKnowledgeSnapshotsForSource(args: {
  supabase: any;
  knowledgeSourceId: string;
}) {
  const { error } = await args.supabase
    .from("knowledge_snapshots")
    .delete()
    .eq("knowledge_source_id", args.knowledgeSourceId);

  if (error) {
    throw new Error(`Failed to clear knowledge snapshots: ${error.message}`);
  }
}
