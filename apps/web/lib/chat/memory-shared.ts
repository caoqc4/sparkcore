import type { MemoryStability } from "@/lib/chat/memory-v2";

export const MEMORY_CONFIDENCE_THRESHOLD = 0.8;
export const MEMORY_RECALL_LIMIT = 3;
export const MEMORY_RELEVANCE_THRESHOLD = 0.35;

export type MemoryType = "profile" | "preference";
export type MemoryUsageType = MemoryType | "relationship";

export type ContextMessage = {
  role: "user" | "assistant";
  content: string;
};

export type MemoryCandidate = {
  memory_type: MemoryType;
  content: string;
  should_store: boolean;
  confidence: number;
  reason: string;
};

export type StoredMemory = {
  id: string;
  memory_type: string | null;
  content: string;
  confidence: number;
  category?: string | null;
  key?: string | null;
  value?: unknown;
  scope?: string | null;
  subject_user_id?: string | null;
  target_agent_id?: string | null;
  target_thread_id?: string | null;
  stability?: string | null;
  status?: string | null;
  source_refs?: unknown;
  source_message_id?: string | null;
  last_used_at?: string | null;
  last_confirmed_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
};

export type RecalledMemory = {
  memory_type: MemoryUsageType;
  content: string;
  confidence: number;
};

export type RecallOutcome = {
  memories: RecalledMemory[];
  usedMemoryTypes: MemoryUsageType[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
};

export type MemoryWriteOutcome = {
  createdCount: number;
  createdTypes: MemoryUsageType[];
  updatedCount: number;
  updatedTypes: MemoryUsageType[];
};

export type SingleSlotMemoryKey =
  | "profession"
  | "reply_language"
  | "agent_nickname"
  | "user_preferred_name"
  | "user_address_style";

export type NormalizedMemoryCandidate = MemoryCandidate & {
  normalized_content: string;
};

export type MemoryExtractionResponse = {
  memories: MemoryCandidate[];
};

export function stripCodeFence(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export function normalizeMemoryContent(content: string) {
  return content.replace(/\s+/g, " ").trim().toLowerCase();
}

export function tokenize(content: string) {
  return normalizeMemoryContent(content)
    .split(/[^a-z0-9\u4e00-\u9fff]+/i)
    .filter((token) => token.length >= 2);
}

function getTokenSet(content: string) {
  return new Set(tokenize(content));
}

function getJaccardSimilarity(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let intersection = 0;

  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...left, ...right]).size;

  if (union === 0) {
    return 0;
  }

  return intersection / union;
}

export function isNearDuplicateMemory(
  left: { normalized_content: string },
  right: { normalized_content: string }
) {
  if (left.normalized_content === right.normalized_content) {
    return true;
  }

  if (
    left.normalized_content.includes(right.normalized_content) ||
    right.normalized_content.includes(left.normalized_content)
  ) {
    return true;
  }

  const similarity = getJaccardSimilarity(
    getTokenSet(left.normalized_content),
    getTokenSet(right.normalized_content)
  );

  return similarity >= 0.72;
}

export function shouldPreferIncomingMemory({
  candidate,
  existing
}: {
  candidate: {
    confidence: number;
    normalized_content: string;
  };
  existing: {
    confidence: number;
    normalized_content: string;
  };
}) {
  if (candidate.confidence >= existing.confidence + 0.05) {
    return true;
  }

  if (
    candidate.confidence >= existing.confidence - 0.02 &&
    candidate.normalized_content.length >= existing.normalized_content.length + 12
  ) {
    return true;
  }

  return false;
}

export function coalesceCandidates(candidates: NormalizedMemoryCandidate[]) {
  const deduped: NormalizedMemoryCandidate[] = [];

  for (const candidate of candidates) {
    const existingIndex = deduped.findIndex(
      (existing) =>
        existing.memory_type === candidate.memory_type &&
        isNearDuplicateMemory(existing, candidate)
    );

    if (existingIndex === -1) {
      deduped.push(candidate);
      continue;
    }

    const existing = deduped[existingIndex];

    if (shouldPreferIncomingMemory({ candidate, existing })) {
      deduped[existingIndex] = candidate;
    }
  }

  return deduped;
}

export function scoreMemoryRelevance(message: string, memory: StoredMemory) {
  const messageTokens = new Set(tokenize(message));
  const memoryTokens = tokenize(memory.content);

  if (messageTokens.size === 0 || memoryTokens.length === 0) {
    return 0;
  }

  let overlap = 0;

  for (const token of memoryTokens) {
    if (messageTokens.has(token)) {
      overlap += 1;
    }
  }

  if (overlap === 0) {
    return 0;
  }

  const normalizedOverlap = overlap / new Set(memoryTokens).size;
  const typeWeight = memory.memory_type === "preference" ? 0.08 : 0.04;

  return Number(
    (normalizedOverlap + memory.confidence * 0.25 + typeWeight).toFixed(4)
  );
}

export type MemoryUpsertRow = {
  id: string;
  memory_type: MemoryType;
  content: string;
  confidence: number;
  category: MemoryType;
  key: string;
  value: string;
  scope: "user_global";
  subject_user_id: string;
  target_agent_id: null;
  target_thread_id: null;
  stability: MemoryStability;
  status: string;
  source_refs: Array<Record<string, string>>;
  metadata: Record<string, unknown>;
};
