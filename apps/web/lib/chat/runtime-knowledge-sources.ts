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

export type RuntimeKnowledgeGatingSummary = {
  knowledge_route: string | null;
  query_token_count: number;
  available: boolean;
  available_count: number;
  should_inject: boolean;
  injection_gap_reason: string | null;
  retained_count: number;
  suppressed: boolean;
  suppression_reason: string | null;
  zero_match_filtered_count: number;
  weak_match_filtered_count: number;
};

export type RuntimeKnowledgeLoadResult = {
  snippets: RuntimeKnowledgeSnippet[];
  gating: RuntimeKnowledgeGatingSummary;
};

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

export function tokenizeKnowledgeQuery(value: string | null | undefined) {
  if (!value) {
    return [] as string[];
  }

  const normalized = value.toLowerCase();
  const latinAndNumberTokens = normalized
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
  const hanSequenceMatches = normalized.match(/[\p{Script=Han}]{2,}/gu) ?? [];
  const hanNgrams = hanSequenceMatches.flatMap((sequence) => {
    const grams: string[] = [];

    for (let index = 0; index < sequence.length - 1; index += 1) {
      grams.push(sequence.slice(index, index + 2));
    }

    if (sequence.length <= 8) {
      grams.push(sequence);
    }

    return grams;
  });

  return Array.from(new Set([...latinAndNumberTokens, ...hanNgrams]));
}

type KnowledgeRowRelevance = {
  score: number;
  tokenMatchCount: number;
  titleMatchCount: number;
  summaryMatchCount: number;
  bodyMatchCount: number;
};

function scoreKnowledgeRow(args: {
  row: KnowledgeSnapshotRow;
  queryTokens: string[];
  agentId: string;
}): KnowledgeRowRelevance {
  let score = 0;
  let tokenMatchCount = 0;
  let titleMatchCount = 0;
  let summaryMatchCount = 0;
  let bodyMatchCount = 0;
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
    let matched = false;

    if (title.includes(token)) {
      score += 8;
      titleMatchCount += 1;
      matched = true;
    }
    if (summary.includes(token)) {
      score += 5;
      summaryMatchCount += 1;
      matched = true;
    }
    if (body.includes(token)) {
      score += 2;
      bodyMatchCount += 1;
      matched = true;
    }

    if (matched) {
      tokenMatchCount += 1;
    }
  }

  const capturedAt = Date.parse(args.row.captured_at);
  if (!Number.isNaN(capturedAt)) {
    score += Math.max(0, Math.floor((capturedAt - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  return {
    score,
    tokenMatchCount,
    titleMatchCount,
    summaryMatchCount,
    bodyMatchCount
  };
}

export function shouldSuppressKnowledgeInjection(args: {
  latestUserMessage: string | null | undefined;
  knowledgeRoute: string | null | undefined;
}) {
  return resolveKnowledgeSuppressionReason(args) !== null;
}

export function resolveKnowledgeSuppressionReason(args: {
  latestUserMessage: string | null | undefined;
  knowledgeRoute: string | null | undefined;
}) {
  if (args.knowledgeRoute === "no_knowledge") {
    return "knowledge_route_no_knowledge";
  }

  const normalized = args.latestUserMessage?.normalize("NFKC").trim().toLowerCase() ?? "";

  if (!normalized) {
    return "empty_user_message";
  }

  const includesAny = (patterns: string[]) =>
    patterns.some((pattern) => normalized.includes(pattern));

  if (
    includesAny([
      "我怎么称呼你",
      "我该怎么称呼你",
      "怎么称呼你",
      "该怎么叫你",
      "你希望我怎么叫你",
      "你喜欢我怎么叫你",
      "你叫什么",
      "你还在吗",
      "别走开",
      "陪陪我",
      "陪着我",
      "鼓励我一句",
      "安慰我一句",
      "安慰我一下",
      "支持我一下",
      "接住我一下",
      "轻轻接我一下",
      "how should i call you",
      "what should i call you",
      "what do you want me to call you",
      "are you still here",
      "don't go away",
      "stay with me",
      "comfort me a little",
      "encourage me a bit"
    ])
  ) {
    return "relational_turn";
  }

  if (
    (args.knowledgeRoute === null ||
      args.knowledgeRoute === undefined ||
      args.knowledgeRoute === "light_knowledge") &&
    normalized.length <= 24
  ) {
    return "short_light_turn";
  }

  return null;
}

export function shouldKeepKnowledgeCandidate(args: {
  relevance: KnowledgeRowRelevance;
  knowledgeRoute: string | null | undefined;
}) {
  return resolveKnowledgeCandidateRejectReason(args) === null;
}

export function resolveKnowledgeCandidateRejectReason(args: {
  relevance: KnowledgeRowRelevance;
  knowledgeRoute: string | null | undefined;
}): "zero_match" | "weak_match" | null {
  if (args.relevance.tokenMatchCount <= 0) {
    return "zero_match";
  }

  const strongSurfaceMatchCount =
    args.relevance.titleMatchCount + args.relevance.summaryMatchCount;
  const repeatedBodySupport = args.relevance.bodyMatchCount >= 2;
  const multiTokenSupport = args.relevance.tokenMatchCount >= 2;

  switch (args.knowledgeRoute) {
    case "domain_knowledge":
      return strongSurfaceMatchCount > 0 || multiTokenSupport || repeatedBodySupport
        ? null
        : "weak_match";
    case "artifact_knowledge":
      return strongSurfaceMatchCount > 0 || repeatedBodySupport
        ? null
        : "weak_match";
    case "light_knowledge":
    case "no_knowledge":
    case null:
    case undefined:
    default:
      return strongSurfaceMatchCount > 0 ? null : "weak_match";
  }
}

export async function loadRelevantKnowledgeForRuntime(args: {
  userId: string;
  workspaceId: string;
  agentId: string;
  latestUserMessage: string | null;
  knowledgeRoute?: string | null;
  limit?: number;
}): Promise<RuntimeKnowledgeLoadResult> {
  const suppressionReason = resolveKnowledgeSuppressionReason({
    latestUserMessage: args.latestUserMessage,
    knowledgeRoute: args.knowledgeRoute
  });

  if (suppressionReason) {
    return {
      snippets: [] as RuntimeKnowledgeSnippet[],
      gating: {
        knowledge_route: args.knowledgeRoute ?? null,
        query_token_count: 0,
        available: false,
        available_count: 0,
        should_inject: false,
        injection_gap_reason: null,
        retained_count: 0,
        suppressed: true,
        suppression_reason: suppressionReason,
        zero_match_filtered_count: 0,
        weak_match_filtered_count: 0
      }
    };
  }

  const rows = (await loadKnowledgeSnapshotRows(args)).filter((row) => {
    const source = normalizeKnowledgeSourceRelation(row.knowledge_source);
    return source?.status === "active";
  });
  const queryTokens = tokenizeKnowledgeQuery(args.latestUserMessage);
  const limit = args.limit ?? 8;

  if (queryTokens.length === 0) {
    return {
      snippets: [] as RuntimeKnowledgeSnippet[],
      gating: {
        knowledge_route: args.knowledgeRoute ?? null,
        query_token_count: 0,
        available: false,
        available_count: 0,
        should_inject: false,
        injection_gap_reason: null,
        retained_count: 0,
        suppressed: true,
        suppression_reason: "empty_query_tokens",
        zero_match_filtered_count: 0,
        weak_match_filtered_count: 0
      }
    };
  }

  const scoredRows = [...rows]
    .map((row) => {
      const relevance = scoreKnowledgeRow({
        row,
        queryTokens,
        agentId: args.agentId
      });

      return {
        row,
        relevance,
        score: relevance.score
      };
    });
  const scoredRowsWithRejectReason = scoredRows.map((item) => ({
    ...item,
    rejectReason: resolveKnowledgeCandidateRejectReason({
      relevance: item.relevance,
      knowledgeRoute: args.knowledgeRoute
    })
  }));
  const keptRows = scoredRowsWithRejectReason.filter(
    ({ rejectReason }) => rejectReason === null
  );
  const zeroMatchFilteredCount = scoredRowsWithRejectReason.filter(
    ({ rejectReason }) => rejectReason === "zero_match"
  ).length;
  const weakMatchFilteredCount = scoredRowsWithRejectReason.filter(
    ({ rejectReason }) => rejectReason === "weak_match"
  ).length;
  const snippets = keptRows
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
  const availableCount = keptRows.length;
  const available = availableCount > 0;
  const shouldInject = snippets.length > 0;

  return {
    snippets,
    gating: {
      knowledge_route: args.knowledgeRoute ?? null,
      query_token_count: queryTokens.length,
      available,
      available_count: availableCount,
      should_inject: shouldInject,
      injection_gap_reason: null,
      retained_count: snippets.length,
      suppressed: false,
      suppression_reason: null,
      zero_match_filtered_count: zeroMatchFilteredCount,
      weak_match_filtered_count: weakMatchFilteredCount
    }
  };
}
