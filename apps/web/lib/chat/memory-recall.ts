import {
  isMemoryActive,
  isMemoryHidden,
  isMemoryIncorrect,
  isMemoryScopeValid
} from "@/lib/chat/memory-v2";
import {
  MEMORY_CONFIDENCE_THRESHOLD,
  MEMORY_RECALL_LIMIT,
  MEMORY_RELEVANCE_THRESHOLD,
  type RecallOutcome,
  type StoredMemory,
  type MemoryUsageType,
  scoreMemoryRelevance
} from "@/lib/chat/memory-shared";
import { loadRecentOwnedRelationshipMemories } from "@/lib/chat/memory-item-read";
import { createClient } from "@/lib/supabase/server";

function isMemoryApplicableToRecall({
  memory,
  agentId,
  threadId
}: {
  memory: StoredMemory;
  agentId?: string | null;
  threadId?: string | null;
}) {
  if (!isMemoryScopeValid(memory)) {
    return false;
  }

  if (memory.scope === "user_agent") {
    return typeof agentId === "string" && memory.target_agent_id === agentId;
  }

  if (memory.scope === "thread_local") {
    return typeof threadId === "string" && memory.target_thread_id === threadId;
  }

  return true;
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
    normalized.includes("你接下来会怎么叫我") ||
    normalized.includes("你会怎么叫我") ||
    normalized.includes("你接下来会怎么称呼我") ||
    normalized.includes("你会怎么称呼我") ||
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
  latestUserMessage,
  supabase: providedSupabase
}: {
  workspaceId: string;
  userId: string;
  agentId: string;
  latestUserMessage: string;
  supabase?: any;
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

  const supabase = providedSupabase ?? (await createClient());
  const { data, error } = await loadRecentOwnedRelationshipMemories({
    supabase,
    workspaceId,
    userId,
    targetAgentId: agentId,
    key: "agent_nickname",
    select:
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at",
    limit: 10
  });

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
      memory_type: "relationship",
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
  latestUserMessage,
  supabase: providedSupabase
}: {
  workspaceId: string;
  userId: string;
  agentId: string;
  latestUserMessage: string;
  supabase?: any;
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

  const supabase = providedSupabase ?? (await createClient());
  const { data, error } = await loadRecentOwnedRelationshipMemories({
    supabase,
    workspaceId,
    userId,
    targetAgentId: agentId,
    key: "user_preferred_name",
    select:
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at",
    limit: 10
  });

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
      memory_type: "relationship",
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
  agentId,
  supabase: providedSupabase
}: {
  workspaceId: string;
  userId: string;
  agentId: string;
  supabase?: any;
}): Promise<{
  addressStyleMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
}> {
  const supabase = providedSupabase ?? (await createClient());
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
      memory_type: "relationship",
      content:
        typeof styleRow.value === "string" ? styleRow.value : styleRow.content,
      confidence: styleRow.confidence
    }
  };
}

export async function recallRelevantMemories({
  workspaceId,
  userId,
  agentId,
  threadId,
  latestUserMessage,
  allowDistantFallback = true,
  supabase: providedSupabase
}: {
  workspaceId: string;
  userId: string;
  agentId?: string | null;
  threadId?: string | null;
  latestUserMessage: string;
  allowDistantFallback?: boolean;
  supabase?: any;
}): Promise<RecallOutcome> {
  const supabase = providedSupabase ?? (await createClient());
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

  const validMemories = ((data ?? []) as StoredMemory[]).filter((memory) =>
    isMemoryApplicableToRecall({
      memory,
      agentId,
      threadId
    })
  );
  const activeMemories = validMemories.filter((memory) => isMemoryActive(memory));
  const hiddenCandidates = validMemories.filter((memory) => isMemoryHidden(memory));
  const incorrectCandidates = validMemories.filter((memory) =>
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

  const recalledMemories =
    scored.length > 0
      ? scored.slice(0, MEMORY_RECALL_LIMIT).map((memory) => ({
          memory_type:
            memory.memory_type === "preference"
              ? ("preference" as const)
              : ("profile" as const),
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
              new Date(right.created_at).getTime() -
              new Date(left.created_at).getTime()
            );
          })
          .slice(0, 2)
          .map((memory) => ({
            memory_type:
              memory.memory_type === "preference"
                ? ("preference" as const)
                : ("profile" as const),
            content: memory.content,
            confidence: memory.confidence
          }))
        : [];

  const countRelevantExclusions = (memories: StoredMemory[]) =>
    memories.filter(
      (memory) =>
        scoreMemoryRelevance(latestUserMessage, memory) >=
        MEMORY_RELEVANCE_THRESHOLD
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

export type RuntimeRelationshipRecall = {
  directNamingQuestion: boolean;
  directPreferredNameQuestion: boolean;
  relationshipStylePrompt: boolean;
  sameThreadContinuity: boolean;
  addressStyleMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
  nicknameMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
  preferredNameMemory: {
    memory_type: "relationship";
    content: string;
    confidence: number;
  } | null;
};

export type RuntimeMemoryContext = {
  memoryRecall: RecallOutcome;
  relationshipRecall: RuntimeRelationshipRecall;
};

export async function loadRuntimeMemoryContext({
  workspaceId,
  userId,
  agentId,
  threadId,
  latestUserMessage,
  preferSameThreadContinuation,
  sameThreadContinuity,
  relationshipStylePrompt,
  supabase: providedSupabase
}: {
  workspaceId: string;
  userId: string;
  agentId: string;
  threadId: string;
  latestUserMessage: string | null;
  preferSameThreadContinuation: boolean;
  sameThreadContinuity: boolean;
  relationshipStylePrompt: boolean;
  supabase?: any;
}): Promise<RuntimeMemoryContext> {
  const emptyMemoryRecall: RecallOutcome = {
    memories: [],
    usedMemoryTypes: [],
    hiddenExclusionCount: 0,
    incorrectExclusionCount: 0
  };

  const emptyRelationshipRecall: RuntimeRelationshipRecall = {
    directNamingQuestion: false,
    directPreferredNameQuestion: false,
    relationshipStylePrompt: false,
    sameThreadContinuity: false,
    addressStyleMemory: null,
    nicknameMemory: null,
    preferredNameMemory: null
  };

  if (!latestUserMessage) {
    return {
      memoryRecall: emptyMemoryRecall,
      relationshipRecall: emptyRelationshipRecall
    };
  }

  const memoryRecall = await recallRelevantMemories({
    workspaceId,
    userId,
    agentId,
    threadId,
    latestUserMessage,
    allowDistantFallback: !preferSameThreadContinuation,
    supabase: providedSupabase
  });

  const directNamingQuestion = isDirectAgentNamingQuestion(latestUserMessage);
  const directPreferredNameQuestion =
    isDirectUserPreferredNameQuestion(latestUserMessage);

  const nicknameRecall =
    directNamingQuestion || relationshipStylePrompt || sameThreadContinuity
      ? await recallAgentNickname({
          workspaceId,
          userId,
          agentId,
          latestUserMessage,
          supabase: providedSupabase
        })
      : {
          directNamingQuestion: false,
          nicknameMemory: null
        };

  const preferredNameRecall =
    directPreferredNameQuestion || relationshipStylePrompt || sameThreadContinuity
      ? await recallUserPreferredName({
          workspaceId,
          userId,
          agentId,
          latestUserMessage,
          supabase: providedSupabase
        })
      : {
          directPreferredNameQuestion: false,
          preferredNameMemory: null
        };

  const addressStyleRecall = await recallUserAddressStyle({
    workspaceId,
    userId,
    agentId,
    supabase: providedSupabase
  });

  return {
    memoryRecall,
    relationshipRecall: {
      ...emptyRelationshipRecall,
      relationshipStylePrompt,
      sameThreadContinuity,
      ...addressStyleRecall,
      ...nicknameRecall,
      ...preferredNameRecall
    }
  };
}
