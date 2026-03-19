import { generateText } from "@/lib/litellm/client";
import {
  buildMemoryV2Fields,
  canTransitionMemoryStatus,
  getMemoryStatus,
  isSupportedSingleSlotPath,
  inferLegacyMemoryStability,
  isMemoryActive,
  isMemoryHidden,
  isMemoryIncorrect,
  LEGACY_MEMORY_KEY,
  normalizeSingleSlotValue,
  type MemoryCategory,
  type MemoryScope,
  type MemoryStability
} from "@/lib/chat/memory-v2";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_MODEL = "replicate-llama-3-8b";
const MEMORY_CONFIDENCE_THRESHOLD = 0.8;
const MEMORY_RECALL_LIMIT = 3;
const MEMORY_RELEVANCE_THRESHOLD = 0.35;

type MemoryType = "profile" | "preference";
type MemoryUsageType = MemoryType | "relationship";

type ContextMessage = {
  role: "user" | "assistant";
  content: string;
};

type MemoryCandidate = {
  memory_type: MemoryType;
  content: string;
  should_store: boolean;
  confidence: number;
  reason: string;
};

type StoredMemory = {
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

type RecalledMemory = {
  memory_type: MemoryUsageType;
  content: string;
  confidence: number;
};

type RecallOutcome = {
  memories: RecalledMemory[];
  usedMemoryTypes: MemoryUsageType[];
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
};

type MemoryWriteOutcome = {
  createdCount: number;
  createdTypes: MemoryUsageType[];
  updatedCount: number;
  updatedTypes: MemoryUsageType[];
};

type SingleSlotMemoryKey =
  | "profession"
  | "reply_language"
  | "agent_nickname"
  | "user_preferred_name"
  | "user_address_style";

type NormalizedMemoryCandidate = MemoryCandidate & {
  normalized_content: string;
};

type MemoryExtractionResponse = {
  memories: MemoryCandidate[];
};

function stripCodeFence(text: string) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function normalizeMemoryContent(content: string) {
  return content.replace(/\s+/g, " ").trim().toLowerCase();
}

function tokenize(content: string) {
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

function isNearDuplicateMemory(
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

function shouldPreferIncomingMemory({
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

function coalesceCandidates(candidates: NormalizedMemoryCandidate[]) {
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

function scoreMemoryRelevance(message: string, memory: StoredMemory) {
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

function buildExtractionPrompt({
  latestUserMessage,
  recentContext
}: {
  latestUserMessage: string;
  recentContext: ContextMessage[];
}) {
  const contextBlock =
    recentContext.length === 0
      ? "No additional context."
      : recentContext
          .map(
            (message, index) =>
              `${index + 1}. ${message.role.toUpperCase()}: ${message.content}`
          )
          .join("\n");

  return [
    "Extract long-term memory candidates from the latest user message.",
    "Only return memories that are explicit, self-stated, and relatively stable.",
    "Do not store temporary states, one-off plans, vague guesses, or emotional snapshots.",
    "Supported memory_type values are only: profile, preference.",
    `Store only when should_store is true and confidence reflects the quality of the evidence.`,
    "Return strict JSON with this exact shape:",
    '{"memories":[{"memory_type":"profile","content":"...","should_store":true,"confidence":0.95,"reason":"..."}]}',
    "Do not include markdown. Do not include any text outside JSON.",
    "",
    "Recent context:",
    contextBlock,
    "",
    "Latest user message:",
    latestUserMessage
  ].join("\n");
}

function parseMemoryExtraction(payload: string) {
  const parsed = JSON.parse(stripCodeFence(payload)) as MemoryExtractionResponse;

  if (!parsed || !Array.isArray(parsed.memories)) {
    throw new Error("Memory extraction payload is missing a memories array.");
  }

  return parsed.memories
    .filter((candidate) => candidate && typeof candidate === "object")
    .map((candidate) => ({
      memory_type: candidate.memory_type,
      content:
        typeof candidate.content === "string" ? candidate.content.trim() : "",
      should_store: candidate.should_store === true,
      confidence:
        typeof candidate.confidence === "number" ? candidate.confidence : 0,
      reason: typeof candidate.reason === "string" ? candidate.reason : ""
    }))
    .filter(
      (candidate) =>
        (candidate.memory_type === "profile" ||
          candidate.memory_type === "preference") &&
        candidate.content.length > 0
    );
}

function shouldAttemptExtraction(message: string) {
  const normalized = message.replace(/\s+/g, " ").trim();

  return normalized.length >= 12;
}

function detectRelationshipAgentNicknameCandidate(message: string) {
  const normalized = message.normalize("NFKC").trim();
  const patterns = [
    /以后(?:我)?叫你([^\s，。！？,.!?：:;；"'“”‘’()（）]{1,16})可以吗/u,
    /以后你就叫([^\s，。！？,.!?：:;；"'“”‘’()（）]{1,16})/u,
    /我以后叫你([^\s，。！？,.!?：:;；"'“”‘’()（）]{1,16})/u,
    /can i call you ([a-z0-9][a-z0-9 _-]{0,30})/i,
    /i(?:'ll| will) call you ([a-z0-9][a-z0-9 _-]{0,30})/i,
    /from now on i(?:'ll| will) call you ([a-z0-9][a-z0-9 _-]{0,30})/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const candidate = match?.[1]?.trim();

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function detectRelationshipUserPreferredNameCandidate(message: string) {
  const normalized = message.normalize("NFKC").trim();
  const patterns = [
    /以后你(?:可以)?叫我([^\s，。！？,.!?：:;；"'“”‘’()（）]{1,16})可以吗/u,
    /你以后(?:可以)?叫我([^\s，。！？,.!?：:;；"'“”‘’()（）]{1,16})/u,
    /你可以叫我([^\s，。！？,.!?：:;；"'“”‘’()（）]{1,16})/u,
    /你就叫我([^\s，。！？,.!?：:;；"'“”‘’()（）]{1,16})/u,
    /please call me ([a-z0-9][a-z0-9 _-]{0,30})/i,
    /you can call me ([a-z0-9][a-z0-9 _-]{0,30})/i,
    /address me as ([a-z0-9][a-z0-9 _-]{0,30})/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const candidate = match?.[1]?.trim();

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function detectRelationshipUserAddressStyleCandidate(message: string) {
  const normalized = message.normalize("NFKC").trim().toLowerCase();

  const casualPatterns = [
    "跟我说话轻松一点",
    "和我说话轻松一点",
    "别太正式",
    "不用太正式",
    "轻松一点",
    "casual with me",
    "be more casual",
    "less formal"
  ];
  const formalPatterns = [
    "正式一点",
    "更正式一点",
    "请正式一点",
    "more formal",
    "be more formal"
  ];
  const friendlyPatterns = [
    "像朋友一点",
    "像朋友那样",
    "更像朋友",
    "like a friend",
    "friendlier"
  ];
  const noFullNamePatterns = [
    "别叫我全名",
    "不要叫我全名",
    "do not call me by my full name",
    "don't call me by my full name"
  ];

  if (noFullNamePatterns.some((pattern) => normalized.includes(pattern))) {
    return "no_full_name";
  }

  if (friendlyPatterns.some((pattern) => normalized.includes(pattern))) {
    return "friendly";
  }

  if (formalPatterns.some((pattern) => normalized.includes(pattern))) {
    return "formal";
  }

  if (casualPatterns.some((pattern) => normalized.includes(pattern))) {
    return "casual";
  }

  return null;
}

export function isDirectAgentNamingQuestion(message: string) {
  const normalized = message.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("你叫什么") ||
    normalized.includes("我以后怎么叫你") ||
    normalized.includes("你不是叫") ||
    normalized.includes("你叫啥") ||
    normalized.includes("what should i call you") ||
    normalized.includes("what do i call you") ||
    normalized.includes("what is your name") ||
    normalized.includes("aren't you called")
  );
}

export function isDirectUserPreferredNameQuestion(message: string) {
  const normalized = message.normalize("NFKC").trim().toLowerCase();

  return (
    normalized.includes("你该怎么叫我") ||
    normalized.includes("你以后怎么叫我") ||
    normalized.includes("你应该叫我什么") ||
    normalized.includes("你叫我什么") ||
    normalized.includes("what should you call me") ||
    normalized.includes("what do you call me") ||
    normalized.includes("how should you address me")
  );
}

export async function recallAgentNickname({
  workspaceId,
  userId,
  agentId,
  latestUserMessage
}: {
  workspaceId: string;
  userId: string;
  agentId: string;
  latestUserMessage: string;
}): Promise<{
  directNamingQuestion: boolean;
  nicknameMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
}> {
  const directNamingQuestion = isDirectAgentNamingQuestion(latestUserMessage);

  if (!directNamingQuestion) {
    return {
      directNamingQuestion: false,
      nicknameMemory: null
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memory_items")
    .select(
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at"
    )
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("category", "relationship")
    .eq("key", "agent_nickname")
    .eq("scope", "user_agent")
    .eq("target_agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Failed to load relationship memory: ${error.message}`);
  }

  const nicknameRow = ((data ?? []) as StoredMemory[]).find((memory) =>
    isMemoryActive(memory)
  );

  if (!nicknameRow) {
    return {
      directNamingQuestion: true,
      nicknameMemory: null
    };
  }

  return {
    directNamingQuestion: true,
    nicknameMemory: {
      memory_type: "relationship" as const,
      content:
        typeof nicknameRow.value === "string"
          ? nicknameRow.value
          : nicknameRow.content,
      confidence: nicknameRow.confidence
    }
  };
}

export async function recallUserPreferredName({
  workspaceId,
  userId,
  agentId,
  latestUserMessage
}: {
  workspaceId: string;
  userId: string;
  agentId: string;
  latestUserMessage: string;
}): Promise<{
  directPreferredNameQuestion: boolean;
  preferredNameMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
}> {
  const directPreferredNameQuestion = isDirectUserPreferredNameQuestion(
    latestUserMessage
  );

  if (!directPreferredNameQuestion) {
    return {
      directPreferredNameQuestion: false,
      preferredNameMemory: null
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memory_items")
    .select(
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at"
    )
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("category", "relationship")
    .eq("key", "user_preferred_name")
    .eq("scope", "user_agent")
    .eq("target_agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(
      `Failed to load preferred-name relationship memory: ${error.message}`
    );
  }

  const preferredNameRow = ((data ?? []) as StoredMemory[]).find((memory) =>
    isMemoryActive(memory)
  );

  if (!preferredNameRow) {
    return {
      directPreferredNameQuestion: true,
      preferredNameMemory: null
    };
  }

  return {
    directPreferredNameQuestion: true,
    preferredNameMemory: {
      memory_type: "relationship" as const,
      content:
        typeof preferredNameRow.value === "string"
          ? preferredNameRow.value
          : preferredNameRow.content,
      confidence: preferredNameRow.confidence
    }
  };
}

export async function recallUserAddressStyle({
  workspaceId,
  userId,
  agentId
}: {
  workspaceId: string;
  userId: string;
  agentId: string;
}): Promise<{
  addressStyleMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memory_items")
    .select(
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at"
    )
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("category", "relationship")
    .eq("key", "user_address_style")
    .eq("scope", "user_agent")
    .eq("target_agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(
      `Failed to load user-address-style relationship memory: ${error.message}`
    );
  }

  const styleRow = ((data ?? []) as StoredMemory[]).find((memory) =>
    isMemoryActive(memory)
  );

  if (!styleRow) {
    return {
      addressStyleMemory: null
    };
  }

  return {
    addressStyleMemory: {
      memory_type: "relationship" as const,
      content:
        typeof styleRow.value === "string" ? styleRow.value : styleRow.content,
      confidence: styleRow.confidence
    }
  };
}

export async function upsertSingleSlotMemory({
  workspaceId,
  userId,
  agentId,
  sourceMessageId,
  category,
  key,
  value,
  scope,
  confidence,
  stability,
  targetAgentId = null,
  targetThreadId = null,
  metadata = {}
}: {
  workspaceId: string;
  userId: string;
  agentId: string | null;
  sourceMessageId: string;
  category: MemoryCategory;
  key: SingleSlotMemoryKey;
  value: string;
  scope: MemoryScope;
  confidence: number;
  stability: MemoryStability;
  targetAgentId?: string | null;
  targetThreadId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const path = `${category}.${key}`;

  if (!isSupportedSingleSlotPath(path)) {
    throw new Error(`Unsupported single-slot memory path: ${path}`);
  }

  if (scope === "user_agent" && !targetAgentId) {
    throw new Error("user_agent single-slot memories require targetAgentId.");
  }

  if (scope === "thread_local" && !targetThreadId) {
    throw new Error("thread_local single-slot memories require targetThreadId.");
  }

  const normalizedValue = normalizeSingleSlotValue(value);

  if (normalizedValue.length === 0) {
    throw new Error(`Single-slot memory value is empty for ${path}.`);
  }

  const supabase = await createClient();
  let query = supabase
    .from("memory_items")
    .select(
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at"
    )
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("category", category)
    .eq("key", key)
    .eq("scope", scope);

  if (scope === "user_agent") {
    query = query.eq("target_agent_id", targetAgentId);
  } else {
    query = query.is("target_agent_id", null);
  }

  if (scope === "thread_local") {
    query = query.eq("target_thread_id", targetThreadId);
  } else {
    query = query.is("target_thread_id", null);
  }

  const { data: existingRows, error: loadError } = await query.order("created_at", {
    ascending: false
  });

  if (loadError) {
    throw new Error(`Failed to load single-slot memories: ${loadError.message}`);
  }

  const activeRows = ((existingRows ?? []) as StoredMemory[]).filter((row) =>
    isMemoryActive(row)
  );

  const sameValueRow = activeRows.find((row) => {
    const rowValue =
      typeof row.value === "string"
        ? row.value
        : typeof row.content === "string"
          ? row.content
          : "";

    return normalizeSingleSlotValue(rowValue) === normalizedValue;
  });

  const nextSourceRefs = [
    {
      kind: "message",
      source_message_id: sourceMessageId
    }
  ];

  if (sameValueRow) {
    const nextMetadata = {
      ...(sameValueRow.metadata ?? {}),
      ...metadata,
      normalization: normalizedValue
    } as Record<string, unknown>;

    const { error: updateError } = await supabase
      .from("memory_items")
      .update({
        content: value,
        confidence: Number(confidence.toFixed(2)),
        source_message_id: sourceMessageId,
        agent_id: agentId ?? targetAgentId,
        value,
        stability,
        status: "active",
        source_refs: nextSourceRefs,
        last_confirmed_at: new Date().toISOString(),
        metadata: nextMetadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", sameValueRow.id);

    if (updateError) {
      throw new Error(
        `Failed to refresh single-slot memory: ${updateError.message}`
      );
    }

    return {
      created: false,
      updated: true,
      supersededIds: [] as string[]
    };
  }

  const supersededIds: string[] = [];

  for (const row of activeRows) {
    const currentStatus = getMemoryStatus(row);

    if (!canTransitionMemoryStatus(currentStatus, "superseded")) {
      continue;
    }

    const nextMetadata = {
      ...(row.metadata ?? {}),
      superseded_at: new Date().toISOString(),
      superseded_by_source_message_id: sourceMessageId
    } as Record<string, unknown>;

    const { error: supersedeError } = await supabase
      .from("memory_items")
      .update({
        status: "superseded",
        metadata: nextMetadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", row.id);

    if (supersedeError) {
      throw new Error(
        `Failed to supersede single-slot memory: ${supersedeError.message}`
      );
    }

    supersededIds.push(row.id);
  }

  const { error: insertError } = await supabase.from("memory_items").insert({
    workspace_id: workspaceId,
    user_id: userId,
    agent_id: agentId ?? targetAgentId,
    source_message_id: sourceMessageId,
    memory_type:
      category === "profile" || category === "preference" ? category : null,
    content: value,
    confidence: Number(confidence.toFixed(2)),
    importance: 0.5,
    ...buildMemoryV2Fields({
      category,
      key,
      value,
      scope,
      subjectUserId: userId,
      targetAgentId,
      targetThreadId,
      stability,
      status: "active",
      sourceRefs: nextSourceRefs,
      lastConfirmedAt: new Date().toISOString()
    }),
    metadata: {
      ...metadata,
      normalization: normalizedValue
    }
  });

  if (insertError) {
    throw new Error(`Failed to insert single-slot memory: ${insertError.message}`);
  }

  return {
    created: true,
    updated: false,
    supersededIds
  };
}

export async function extractAndStoreMemories({
  workspaceId,
  userId,
  agentId,
  sourceMessageId,
  latestUserMessage,
  recentContext
}: {
  workspaceId: string;
  userId: string;
  agentId: string | null;
  sourceMessageId: string;
  latestUserMessage: string;
  recentContext: ContextMessage[];
}): Promise<MemoryWriteOutcome> {
  const createdTypes: MemoryUsageType[] = [];
  const updatedTypes: MemoryUsageType[] = [];
  const relationshipNickname = detectRelationshipAgentNicknameCandidate(
    latestUserMessage
  );
  const userPreferredName = detectRelationshipUserPreferredNameCandidate(
    latestUserMessage
  );
  const userAddressStyle = detectRelationshipUserAddressStyleCandidate(
    latestUserMessage
  );

  if (relationshipNickname && agentId) {
    const relationshipWrite = await upsertSingleSlotMemory({
      workspaceId,
      userId,
      agentId,
      sourceMessageId,
      category: "relationship",
      key: "agent_nickname",
      value: relationshipNickname,
      scope: "user_agent",
      targetAgentId: agentId,
      confidence: 0.96,
      stability: "high",
      metadata: {
        source: "relationship_parser",
        relation_kind: "agent_nickname"
      }
    });

    if (relationshipWrite.created) {
      createdTypes.push("relationship");
    }

    if (relationshipWrite.updated) {
      updatedTypes.push("relationship");
    }
  }

  if (userPreferredName && agentId) {
    const preferredNameWrite = await upsertSingleSlotMemory({
      workspaceId,
      userId,
      agentId,
      sourceMessageId,
      category: "relationship",
      key: "user_preferred_name",
      value: userPreferredName,
      scope: "user_agent",
      targetAgentId: agentId,
      confidence: 0.94,
      stability: "high",
      metadata: {
        source: "relationship_parser",
        relation_kind: "user_preferred_name"
      }
    });

    if (preferredNameWrite.created) {
      createdTypes.push("relationship");
    }

    if (preferredNameWrite.updated) {
      updatedTypes.push("relationship");
    }
  }

  if (userAddressStyle && agentId) {
    const addressStyleWrite = await upsertSingleSlotMemory({
      workspaceId,
      userId,
      agentId,
      sourceMessageId,
      category: "relationship",
      key: "user_address_style",
      value: userAddressStyle,
      scope: "user_agent",
      targetAgentId: agentId,
      confidence: 0.9,
      stability: "medium",
      metadata: {
        source: "relationship_parser",
        relation_kind: "user_address_style"
      }
    });

    if (addressStyleWrite.created) {
      createdTypes.push("relationship");
    }

    if (addressStyleWrite.updated) {
      updatedTypes.push("relationship");
    }
  }

  if (!shouldAttemptExtraction(latestUserMessage)) {
    return {
      createdCount: createdTypes.length,
      createdTypes,
      updatedCount: updatedTypes.length,
      updatedTypes
    };
  }

  const extraction = await generateText({
    model: DEFAULT_MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a structured memory extraction engine for SparkCore. Follow the instructions exactly and output valid JSON only."
      },
      {
        role: "user",
        content: buildExtractionPrompt({
          latestUserMessage,
          recentContext
        })
      }
    ]
  });

  const candidates = parseMemoryExtraction(extraction.content).filter(
    (candidate) =>
      candidate.should_store &&
      candidate.confidence >= MEMORY_CONFIDENCE_THRESHOLD
  );

  if (candidates.length === 0) {
    return {
      createdCount: createdTypes.length,
      createdTypes,
      updatedCount: updatedTypes.length,
      updatedTypes
    };
  }

  const supabase = await createClient();
  const normalizedCandidates = coalesceCandidates(
    candidates.map((candidate) => ({
      ...candidate,
      normalized_content: normalizeMemoryContent(candidate.content)
    }))
  );

  const { data: existingMemories } = await supabase
    .from("memory_items")
    .select(
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at"
    )
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .in(
      "memory_type",
      Array.from(new Set(normalizedCandidates.map((item) => item.memory_type)))
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const activeExistingMemories = ((existingMemories ?? []) as StoredMemory[])
    .filter((memory) => isMemoryActive(memory))
    .map((memory) => ({
      ...memory,
      normalized_content: normalizeMemoryContent(memory.content)
    }));

  const rowsToInsert: Array<Record<string, unknown>> = [];
  const rowsToUpdate: Array<{
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
  }> = [];

  for (const candidate of normalizedCandidates) {
    const matchingExisting = activeExistingMemories.find(
      (memory) =>
        memory.memory_type === candidate.memory_type &&
        isNearDuplicateMemory(memory, candidate)
    );

    if (!matchingExisting) {
      rowsToInsert.push({
        workspace_id: workspaceId,
        user_id: userId,
        agent_id: agentId,
        source_message_id: sourceMessageId,
        memory_type: candidate.memory_type,
        content: candidate.content,
        confidence: Number(candidate.confidence.toFixed(2)),
        importance: 0.5,
        ...buildMemoryV2Fields({
          category: candidate.memory_type,
          key: LEGACY_MEMORY_KEY,
          value: candidate.content,
          scope: "user_global",
          subjectUserId: userId,
          stability: inferLegacyMemoryStability(candidate.memory_type),
          status: "active",
          sourceRefs: [
            {
              kind: "message",
              source_message_id: sourceMessageId
            }
          ]
        }),
        metadata: {
          extraction_reason: candidate.reason,
          source: "llm_extraction",
          threshold: MEMORY_CONFIDENCE_THRESHOLD
        }
      });
      continue;
    }

    if (!shouldPreferIncomingMemory({ candidate, existing: matchingExisting })) {
      continue;
    }

    const nextMetadata = {
      ...(matchingExisting.metadata ?? {}),
      extraction_reason: candidate.reason,
      source: "llm_extraction",
      threshold: MEMORY_CONFIDENCE_THRESHOLD,
      convergence_updated_at: new Date().toISOString()
    } as Record<string, unknown>;

    rowsToUpdate.push({
      id: matchingExisting.id,
      memory_type: candidate.memory_type,
      content: candidate.content,
      confidence: Number(candidate.confidence.toFixed(2)),
      metadata: nextMetadata,
      category: candidate.memory_type,
      key: LEGACY_MEMORY_KEY,
      value: candidate.content,
      scope: "user_global",
      subject_user_id: userId,
      target_agent_id: null,
      target_thread_id: null,
      stability: inferLegacyMemoryStability(candidate.memory_type),
      status: getMemoryStatus(matchingExisting),
      source_refs: [
        {
          kind: "message",
          source_message_id: sourceMessageId
        }
      ]
    });
  }

  for (const row of rowsToUpdate) {
    const { error: updateError } = await supabase
      .from("memory_items")
      .update({
        content: row.content,
        confidence: row.confidence,
        source_message_id: sourceMessageId,
        agent_id: agentId,
        category: row.category,
        key: row.key,
        value: row.value,
        scope: row.scope,
        subject_user_id: row.subject_user_id,
        target_agent_id: row.target_agent_id,
        target_thread_id: row.target_thread_id,
        stability: row.stability,
        status: row.status,
        source_refs: row.source_refs,
        metadata: row.metadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", row.id);

    if (updateError) {
      throw new Error(`Failed to converge memory items: ${updateError.message}`);
    }
  }

  if (rowsToInsert.length === 0) {
    return {
      createdCount: createdTypes.length,
      createdTypes,
      updatedCount: rowsToUpdate.length + updatedTypes.length,
      updatedTypes: Array.from(
        new Set<MemoryUsageType>([
          ...updatedTypes,
          ...rowsToUpdate.map((row) => row.memory_type)
        ])
      )
    };
  }

  const { error } = await supabase.from("memory_items").insert(rowsToInsert);

  if (error) {
    throw new Error(`Failed to store memory items: ${error.message}`);
  }

  return {
    createdCount: rowsToInsert.length + createdTypes.length,
    createdTypes: Array.from(
      new Set<MemoryUsageType>([
        ...createdTypes,
        ...rowsToInsert
          .map((row) => row.memory_type)
          .filter(
            (type): type is MemoryType =>
              type === "profile" || type === "preference"
          )
      ])
    ),
    updatedCount: rowsToUpdate.length + updatedTypes.length,
    updatedTypes: Array.from(
      new Set<MemoryUsageType>([
        ...updatedTypes,
        ...rowsToUpdate.map((row) => row.memory_type)
      ])
    )
  };
}

export async function recallRelevantMemories({
  workspaceId,
  userId,
  latestUserMessage,
  allowDistantFallback = true
}: {
  workspaceId: string;
  userId: string;
  latestUserMessage: string;
  allowDistantFallback?: boolean;
}): Promise<RecallOutcome> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memory_items")
    .select(
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at"
    )
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .in("memory_type", ["profile", "preference"])
    .gte("confidence", MEMORY_CONFIDENCE_THRESHOLD)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    throw new Error(`Failed to load memory items: ${error.message}`);
  }

  const allMemories = (data ?? []) as StoredMemory[];
  const activeMemories = allMemories.filter((memory) => isMemoryActive(memory));
  const hiddenCandidates = allMemories.filter((memory) => isMemoryHidden(memory));
  const incorrectCandidates = allMemories.filter((memory) =>
    isMemoryIncorrect(memory)
  );

  if (activeMemories.length === 0) {
    return {
      memories: [],
      usedMemoryTypes: [],
      hiddenExclusionCount: hiddenCandidates.length > 0 ? 1 : 0,
      incorrectExclusionCount: incorrectCandidates.length > 0 ? 1 : 0
    };
  }

  const scored = activeMemories
    .map((memory) => ({
      memory,
      score: scoreMemoryRelevance(latestUserMessage, memory)
    }))
    .filter((entry) => entry.score >= MEMORY_RELEVANCE_THRESHOLD)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((entry) => entry.memory);

  const recalledMemories: RecalledMemory[] =
    scored.length > 0
      ? scored.slice(0, MEMORY_RECALL_LIMIT).map((memory) => ({
          memory_type:
            memory.memory_type === "preference" ? "preference" : "profile",
          content: memory.content,
          confidence: memory.confidence
        }))
      : allowDistantFallback
        ? activeMemories
          .slice()
          .sort((left, right) => {
            if (right.confidence !== left.confidence) {
              return right.confidence - left.confidence;
            }

            return (
              new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
            );
          })
          .slice(0, 2)
          .map((memory) => ({
            memory_type:
              memory.memory_type === "preference" ? "preference" : "profile",
            content: memory.content,
            confidence: memory.confidence
          }))
        : [];

  const countRelevantExclusions = (memories: StoredMemory[]) =>
    memories.filter(
      (memory) => scoreMemoryRelevance(latestUserMessage, memory) >= MEMORY_RELEVANCE_THRESHOLD
    ).length;

  return {
    memories: recalledMemories,
    usedMemoryTypes: Array.from(
      new Set<MemoryUsageType>(recalledMemories.map((memory) => memory.memory_type))
    ),
    hiddenExclusionCount: countRelevantExclusions(hiddenCandidates),
    incorrectExclusionCount: countRelevantExclusions(incorrectCandidates)
  };
}
