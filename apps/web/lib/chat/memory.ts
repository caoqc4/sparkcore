import { generateText } from "@/lib/litellm/client";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_MODEL = "replicate-llama-3-8b";
const MEMORY_CONFIDENCE_THRESHOLD = 0.8;
const MEMORY_RECALL_LIMIT = 3;
const MEMORY_RELEVANCE_THRESHOLD = 0.35;

type MemoryType = "profile" | "preference";

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
  memory_type: MemoryType;
  content: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  created_at: string;
};

function isMemoryHidden(metadata: Record<string, unknown> | null | undefined) {
  return metadata?.is_hidden === true;
}

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
}) {
  if (!shouldAttemptExtraction(latestUserMessage)) {
    return;
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
    return;
  }

  const supabase = await createClient();
  const normalizedCandidates = candidates.map((candidate) => ({
    ...candidate,
    normalized_content: normalizeMemoryContent(candidate.content)
  }));

  const { data: existingMemories } = await supabase
    .from("memory_items")
    .select("memory_type, content")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .in(
      "memory_type",
      Array.from(new Set(normalizedCandidates.map((item) => item.memory_type)))
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const existingSet = new Set(
    (existingMemories ?? []).map(
      (item) =>
        `${item.memory_type}:${normalizeMemoryContent(String(item.content ?? ""))}`
    )
  );

  const rowsToInsert = normalizedCandidates
    .filter(
      (candidate) =>
        !existingSet.has(`${candidate.memory_type}:${candidate.normalized_content}`)
    )
    .map((candidate) => ({
      workspace_id: workspaceId,
      user_id: userId,
      agent_id: agentId,
      source_message_id: sourceMessageId,
      memory_type: candidate.memory_type,
      content: candidate.content,
      confidence: Number(candidate.confidence.toFixed(2)),
      importance: 0.5,
      metadata: {
        extraction_reason: candidate.reason,
        source: "llm_extraction",
        threshold: MEMORY_CONFIDENCE_THRESHOLD
      }
    }));

  if (rowsToInsert.length === 0) {
    return;
  }

  const { error } = await supabase.from("memory_items").insert(rowsToInsert);

  if (error) {
    throw new Error(`Failed to store memory items: ${error.message}`);
  }
}

export async function recallRelevantMemories({
  workspaceId,
  userId,
  latestUserMessage
}: {
  workspaceId: string;
  userId: string;
  latestUserMessage: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memory_items")
    .select("id, memory_type, content, confidence, metadata, created_at")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .in("memory_type", ["profile", "preference"])
    .gte("confidence", MEMORY_CONFIDENCE_THRESHOLD)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    throw new Error(`Failed to load memory items: ${error.message}`);
  }

  const memories = ((data ?? []) as StoredMemory[]).filter(
    (memory) => !isMemoryHidden(memory.metadata)
  );

  if (memories.length === 0) {
    return [];
  }

  const scored = memories
    .map((memory) => ({
      memory,
      score: scoreMemoryRelevance(latestUserMessage, memory)
    }))
    .filter((entry) => entry.score >= MEMORY_RELEVANCE_THRESHOLD)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((entry) => entry.memory);

  if (scored.length > 0) {
    return scored.slice(0, MEMORY_RECALL_LIMIT);
  }

  return memories
    .slice()
    .sort((left, right) => {
      if (right.confidence !== left.confidence) {
        return right.confidence - left.confidence;
      }

      return (
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
    })
    .slice(0, 2);
}
