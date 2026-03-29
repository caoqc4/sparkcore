import { buildKnowledgeSnapshot, buildRuntimeKnowledgeSnippet, type RuntimeKnowledgeSnippet } from "@/lib/chat/memory-knowledge";
import { getSupabaseAdminEnv } from "@/lib/env";

type KnowledgeSnapshotRow = {
  id: string;
  knowledge_source_id: string;
  workspace_id: string;
  owner_user_id: string;
  target_role_id: string | null;
  snapshot_index: number;
  title: string;
  summary: string;
  body_text: string;
  source_kind: "external_reference" | "project_document" | "workspace_note";
  captured_at: string;
  scope_user_id: string | null;
  scope_agent_id: string | null;
  scope_thread_id: string | null;
  scope_project_id: string | null;
  scope_world_id: string | null;
  metadata: Record<string, unknown> | null;
  knowledge_source:
    | {
        status: string;
        source_type: string;
      }
    | Array<{
        status: string;
        source_type: string;
      }>
    | null;
};

function normalizeKnowledgeSourceRelation(
  value: KnowledgeSnapshotRow["knowledge_source"]
) {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

async function loadKnowledgeSnapshotRows(args: {
  userId: string;
  workspaceId: string;
  agentId: string;
}) {
  const { url, serviceRoleKey } = getSupabaseAdminEnv();
  const params = new URLSearchParams({
    select:
      "id,knowledge_source_id,workspace_id,owner_user_id,target_role_id,snapshot_index,title,summary,body_text,source_kind,captured_at,scope_user_id,scope_agent_id,scope_thread_id,scope_project_id,scope_world_id,metadata,knowledge_source:knowledge_sources!inner(status,source_type)",
    workspace_id: `eq.${args.workspaceId}`,
    owner_user_id: `eq.${args.userId}`,
    "knowledge_source.status": "eq.active",
    or: `(target_role_id.eq.${args.agentId},target_role_id.is.null)`,
    order: "captured_at.desc",
    limit: "40"
  });
  const endpoint = `${url}/rest/v1/knowledge_snapshots?${params.toString()}`;
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        headers,
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Supabase REST returned ${response.status}`);
      }

      const data = (await response.json()) as KnowledgeSnapshotRow[];
      return data ?? [];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const shouldRetry =
        attempt === 0 &&
        (message.toLowerCase().includes("fetch failed") ||
          message.toLowerCase().includes("econnreset") ||
          message.toLowerCase().includes("tls"));

      if (!shouldRetry) {
        throw new Error(`Failed to load relevant knowledge snapshots: ${message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return [] as KnowledgeSnapshotRow[];
}

function tokenizeQuery(value: string | null | undefined) {
  if (!value) {
    return [] as string[];
  }

  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]+/gu, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2)
    )
  );
}

function scoreKnowledgeRow(args: {
  row: KnowledgeSnapshotRow;
  queryTokens: string[];
  agentId: string;
}) {
  let score = 0;
  const title = args.row.title.toLowerCase();
  const summary = args.row.summary.toLowerCase();
  const body = args.row.body_text.toLowerCase();

  if (args.row.target_role_id === args.agentId) {
    score += 20;
  } else if (args.row.target_role_id === null) {
    score += 8;
  }

  if (args.row.source_kind === "project_document") {
    score += 6;
  } else if (args.row.source_kind === "workspace_note") {
    score += 4;
  } else {
    score += 2;
  }

  for (const token of args.queryTokens) {
    if (title.includes(token)) {
      score += 8;
    }
    if (summary.includes(token)) {
      score += 5;
    }
    if (body.includes(token)) {
      score += 2;
    }
  }

  const capturedAt = Date.parse(args.row.captured_at);
  if (!Number.isNaN(capturedAt)) {
    score += Math.max(0, Math.floor((capturedAt - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  return score;
}

export async function loadRelevantKnowledgeForRuntime(args: {
  userId: string;
  workspaceId: string;
  agentId: string;
  latestUserMessage: string | null;
  limit?: number;
}) {
  const rows = (await loadKnowledgeSnapshotRows(args)).filter((row) => {
    const source = normalizeKnowledgeSourceRelation(row.knowledge_source);
    return source?.status === "active";
  });
  const queryTokens = tokenizeQuery(args.latestUserMessage);
  const limit = args.limit ?? 8;

  const ranked = [...rows]
    .map((row) => ({
      row,
      score: scoreKnowledgeRow({
        row,
        queryTokens,
        agentId: args.agentId
      })
    }))
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return left.row.snapshot_index - right.row.snapshot_index;
    })
    .slice(0, limit)
    .map(({ row }) =>
      buildRuntimeKnowledgeSnippet(
        buildKnowledgeSnapshot({
          snapshotId: row.id,
          resourceId: row.knowledge_source_id,
          scope: {
            user_id: row.scope_user_id,
            agent_id: row.scope_agent_id,
            thread_id: row.scope_thread_id,
            project_id: row.scope_project_id,
            world_id: row.scope_world_id,
            workspace_id: row.workspace_id,
            role_id: row.target_role_id
          },
          title: row.title,
          summary: row.summary,
          sourceKind: row.source_kind,
          capturedAt: row.captured_at
        })
      )
    );

  return ranked as RuntimeKnowledgeSnippet[];
}
