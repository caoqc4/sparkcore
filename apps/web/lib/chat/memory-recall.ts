import {
  getMemoryScope,
  isMemoryActive,
  isMemoryHidden,
  isMemoryIncorrect,
  isMemoryScopeValid
} from "@/lib/chat/memory-v2";
import {
  MEMORY_CONFIDENCE_THRESHOLD,
  MEMORY_RECALL_LIMIT,
  MEMORY_RELEVANCE_THRESHOLD,
  type MemoryRecallRoute,
  type RecalledMemoryType,
  type RecallOutcome,
  type StoredMemory,
  scoreMemoryRelevance
} from "@/lib/chat/memory-shared";
import type { ThreadStateRecord } from "@/lib/chat/thread-state";
import {
  loadRecentOwnedMemories,
  loadRecentOwnedMemoriesByTypes,
  loadRecentOwnedRelationshipMemories
} from "@/lib/chat/memory-item-read";
import {
  buildRecalledEpisodeMemoryFromStoredMemory,
  buildRecalledDynamicProfileMemoryFromStoredMemory,
  buildRecalledProfileMemoryFromStoredMemory,
  buildRecalledRelationshipMemoryFromStoredMemory,
  buildRecalledTimelineMemoryFromStoredMemory,
  isStoredMemoryDynamicProfile,
  isStoredMemoryGenericMemoryRecord,
  isStoredMemoryRelationshipMemoryRecord,
  isStoredMemorySemanticTarget
} from "@/lib/chat/memory-records";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import {
  isMemoryWithinNamespace,
  resolveNamespaceGovernanceConsolidationContract,
  resolveRuntimeMemoryBoundary
} from "@/lib/chat/memory-namespace";
import { createClient } from "@/lib/supabase/server";

export function selectMemoryRecallRoutes(args: {
  latestUserMessage: string;
  allowDistantFallback: boolean;
  hasThreadState: boolean;
  activeNamespace?: ActiveRuntimeMemoryNamespace | null;
}): MemoryRecallRoute[] {
  void args.latestUserMessage;

  const namespaceBoundary = resolveRuntimeMemoryBoundary(
    args.activeNamespace ?? null
  );
  const consolidationContract =
    resolveNamespaceGovernanceConsolidationContract(
      args.activeNamespace ?? null
    );
  return consolidationContract.consolidation_retrieval_routes.filter((route) => {
    if (route === "thread_state") {
      return args.hasThreadState;
    }

    if (route === "timeline") {
      return args.allowDistantFallback && namespaceBoundary.allow_timeline_fallback;
    }

    return true;
  });
}

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

  const scope = getMemoryScope(memory);

  if (scope === "user_agent") {
    return typeof agentId === "string" && memory.target_agent_id === agentId;
  }

  if (scope === "thread_local") {
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

  const nicknameRow = ((data ?? []) as StoredMemory[]).find(
    (memory) =>
      isMemoryActive(memory) &&
      isStoredMemoryRelationshipMemoryRecord(memory)
  );

  if (!nicknameRow) {
    return {
      directNamingQuestion: true,
      nicknameMemory: null
    };
  }

  return {
    directNamingQuestion: true,
    nicknameMemory:
      buildRecalledRelationshipMemoryFromStoredMemory(nicknameRow)
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

  const preferredNameRow = ((data ?? []) as StoredMemory[]).find(
    (memory) =>
      isMemoryActive(memory) &&
      isStoredMemoryRelationshipMemoryRecord(memory)
  );

  if (!preferredNameRow) {
    return {
      directPreferredNameQuestion: true,
      preferredNameMemory: null
    };
  }

  return {
    directPreferredNameQuestion: true,
    preferredNameMemory:
      buildRecalledRelationshipMemoryFromStoredMemory(preferredNameRow)
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
  const { data, error } = await loadRecentOwnedRelationshipMemories({
    supabase,
    workspaceId,
    userId,
    targetAgentId: agentId,
    key: "user_address_style",
    select:
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at",
    limit: 10
  });

  if (error) {
    throw new Error(
      `Failed to load user-address-style relationship memory: ${error.message}`
    );
  }

  const styleRow = ((data ?? []) as StoredMemory[]).find(
    (memory) =>
      isMemoryActive(memory) &&
      isStoredMemoryRelationshipMemoryRecord(memory)
  );

  if (!styleRow) {
    return {
      addressStyleMemory: null
    };
  }

  return {
    addressStyleMemory:
      buildRecalledRelationshipMemoryFromStoredMemory(styleRow)
  };
}

export async function recallRelevantMemories({
  workspaceId,
  userId,
  agentId,
  threadId,
  latestUserMessage,
  hasThreadState = false,
  allowDistantFallback = true,
  activeNamespace = null,
  supabase: providedSupabase
}: {
  workspaceId: string;
  userId: string;
  agentId?: string | null;
  threadId?: string | null;
  latestUserMessage: string;
  hasThreadState?: boolean;
  allowDistantFallback?: boolean;
  activeNamespace?: ActiveRuntimeMemoryNamespace | null;
  supabase?: any;
}): Promise<RecallOutcome> {
  const appliedRoutes = selectMemoryRecallRoutes({
    latestUserMessage,
    allowDistantFallback,
    hasThreadState,
    activeNamespace
  });
  const namespaceBoundary = resolveRuntimeMemoryBoundary(activeNamespace);
  const supabase = providedSupabase ?? (await createClient());
  const selectColumns =
    "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at, updated_at";
  const { data, error } = await loadRecentOwnedMemoriesByTypes({
    supabase,
    workspaceId,
    userId,
    memoryTypes: ["profile", "preference"],
    select: selectColumns,
    limit: 60
  }).gte("confidence", MEMORY_CONFIDENCE_THRESHOLD);

  if (error) {
    throw new Error(`Failed to load memory items: ${error.message}`);
  }

  const validMemories = ((data ?? []) as StoredMemory[])
    .filter((memory) =>
      isMemoryApplicableToRecall({
        memory,
        agentId,
        threadId
      })
    )
    .filter((memory) =>
      isMemoryWithinNamespace({
        memory,
        namespace: activeNamespace
      })
    )
    .filter(
      (memory) =>
        isStoredMemorySemanticTarget(memory, "static_profile") ||
        isStoredMemorySemanticTarget(memory, "dynamic_profile")
    );
  const activeMemories = validMemories.filter((memory) => isMemoryActive(memory));
  const hiddenCandidates = validMemories.filter((memory) => isMemoryHidden(memory));
  const incorrectCandidates = validMemories.filter((memory) =>
    isMemoryIncorrect(memory)
  );
  const activeDynamicProfileMemories = activeMemories.filter((memory) =>
    isStoredMemoryDynamicProfile(memory)
  );
  const activeStaticProfileMemories = activeMemories.filter((memory) =>
    isStoredMemorySemanticTarget(memory, "static_profile")
  );

  const shouldLoadMemoryRecords =
    appliedRoutes.includes("episode") || appliedRoutes.includes("timeline");
  const { data: memoryRecordRows, error: memoryRecordError } =
    shouldLoadMemoryRecords
      ? await loadRecentOwnedMemories({
          supabase,
          workspaceId,
          userId,
          select: selectColumns,
          limit: 80
        })
      : { data: [], error: null };

  if (memoryRecordError) {
    throw new Error(`Failed to load memory record rows: ${memoryRecordError.message}`);
  }

  const validMemoryRecordRows = ((memoryRecordRows ?? []) as StoredMemory[])
    .filter((memory) =>
      isMemoryApplicableToRecall({
        memory,
        agentId,
        threadId
      })
    )
    .filter((memory) =>
      isMemoryWithinNamespace({
        memory,
        namespace: activeNamespace
      })
    )
    .filter((memory) => isStoredMemoryGenericMemoryRecord(memory));
  const activeMemoryRecordRows = validMemoryRecordRows.filter((memory) =>
    isMemoryActive(memory)
  );
  const hiddenMemoryRecordRows = validMemoryRecordRows.filter((memory) =>
    isMemoryHidden(memory)
  );
  const incorrectMemoryRecordRows = validMemoryRecordRows.filter((memory) =>
    isMemoryIncorrect(memory)
  );

  if (activeMemories.length === 0 && activeMemoryRecordRows.length === 0) {
    return {
      memories: [],
      usedMemoryTypes: [],
      hiddenExclusionCount:
        hiddenCandidates.length > 0 || hiddenMemoryRecordRows.length > 0 ? 1 : 0,
      incorrectExclusionCount:
        incorrectCandidates.length > 0 || incorrectMemoryRecordRows.length > 0 ? 1 : 0,
      appliedRoutes
    };
  }

  const scoredDynamicProfiles = activeDynamicProfileMemories
    .map((memory) => ({
      memory,
      score: scoreMemoryRelevance(latestUserMessage, memory)
    }))
    .filter((entry) => entry.score >= MEMORY_RELEVANCE_THRESHOLD)
    .sort((left, right) => right.score - left.score)
    .slice(0, 1)
    .map((entry) => entry.memory);

  const scored = activeStaticProfileMemories
    .map((memory) => ({
      memory,
      score: scoreMemoryRelevance(latestUserMessage, memory)
    }))
    .filter((entry) => entry.score >= MEMORY_RELEVANCE_THRESHOLD)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((entry) => entry.memory);

  const recalledDynamicProfileMemories =
    scoredDynamicProfiles.length > 0
      ? scoredDynamicProfiles
          .map((memory) => buildRecalledDynamicProfileMemoryFromStoredMemory(memory))
          .filter((memory): memory is NonNullable<typeof memory> => memory != null)
      : [];

  const recalledProfileMemories =
    scored.length > 0
      ? scored
          .slice(0, MEMORY_RECALL_LIMIT)
          .map((memory) => buildRecalledProfileMemoryFromStoredMemory(memory))
          .filter((memory): memory is NonNullable<typeof memory> => memory != null)
      : allowDistantFallback
        ? activeStaticProfileMemories
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
            .slice(0, namespaceBoundary.profile_budget)
            .map((memory) => buildRecalledProfileMemoryFromStoredMemory(memory))
            .filter((memory): memory is NonNullable<typeof memory> => memory != null)
        : [];

  const scoredEpisodeRows = activeMemoryRecordRows
    .map((memory) => ({
      memory,
      score: scoreMemoryRelevance(latestUserMessage, memory)
    }))
    .filter((entry) => entry.score >= MEMORY_RELEVANCE_THRESHOLD)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (
        new Date(right.memory.updated_at ?? right.memory.created_at).getTime() -
        new Date(left.memory.updated_at ?? left.memory.created_at).getTime()
      );
    });
  const recalledEpisodeMemories = appliedRoutes.includes("episode")
    ? scoredEpisodeRows
        .slice(0, namespaceBoundary.episode_budget)
        .map((entry) => buildRecalledEpisodeMemoryFromStoredMemory(entry.memory))
        .filter((memory): memory is NonNullable<typeof memory> => memory != null)
    : [];

  const recalledTimelineMemories =
    appliedRoutes.includes("timeline") &&
    (recalledEpisodeMemories.length === 0 ||
      namespaceBoundary.parallel_timeline_budget > 0)
      ? activeMemoryRecordRows
          .slice()
          .sort((left, right) => {
            const leftTime = new Date(
              left.updated_at ?? left.created_at
            ).getTime();
            const rightTime = new Date(
              right.updated_at ?? right.created_at
            ).getTime();

            if (rightTime !== leftTime) {
              return rightTime - leftTime;
            }

            return right.confidence - left.confidence;
          })
          .slice(
            0,
            recalledEpisodeMemories.length > 0
              ? Math.min(
                  namespaceBoundary.timeline_budget,
                  namespaceBoundary.parallel_timeline_budget
                )
              : namespaceBoundary.timeline_budget
          )
          .map((memory) => buildRecalledTimelineMemoryFromStoredMemory(memory))
          .filter((memory): memory is NonNullable<typeof memory> => memory != null)
      : [];

  const recalledMemories = [
    ...recalledDynamicProfileMemories,
    ...recalledProfileMemories,
    ...recalledEpisodeMemories,
    ...recalledTimelineMemories
  ].slice(0, MEMORY_RECALL_LIMIT);

  const countRelevantExclusions = (memories: StoredMemory[]) =>
    memories.filter(
      (memory) =>
        scoreMemoryRelevance(latestUserMessage, memory) >=
        MEMORY_RELEVANCE_THRESHOLD
    ).length;

  return {
    memories: recalledMemories,
    usedMemoryTypes: Array.from(
      new Set<RecalledMemoryType>(recalledMemories.map((memory) => memory.memory_type))
    ),
    hiddenExclusionCount:
      countRelevantExclusions(hiddenCandidates) +
      countRelevantExclusions(hiddenMemoryRecordRows),
    incorrectExclusionCount:
      countRelevantExclusions(incorrectCandidates) +
      countRelevantExclusions(incorrectMemoryRecordRows),
    appliedRoutes
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

export type RuntimeThreadStateRecall = {
  applied: boolean;
  snapshot: {
    lifecycle_status: ThreadStateRecord["lifecycle_status"];
    focus_mode: ThreadStateRecord["focus_mode"];
    continuity_status: ThreadStateRecord["continuity_status"];
    current_language_hint: ThreadStateRecord["current_language_hint"];
  } | null;
};

export type RuntimeMemoryContext = {
  memoryRecall: RecallOutcome;
  relationshipRecall: RuntimeRelationshipRecall;
  threadStateRecall: RuntimeThreadStateRecall;
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
  threadState,
  activeNamespace = null,
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
  threadState?: ThreadStateRecord | null;
  activeNamespace?: ActiveRuntimeMemoryNamespace | null;
  supabase?: any;
}): Promise<RuntimeMemoryContext> {
  const emptyMemoryRecall: RecallOutcome = {
    memories: [],
    usedMemoryTypes: [],
    hiddenExclusionCount: 0,
    incorrectExclusionCount: 0,
    appliedRoutes: []
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
  const threadStateRecall: RuntimeThreadStateRecall = {
    applied: threadState != null,
    snapshot: threadState
      ? {
          lifecycle_status: threadState.lifecycle_status,
          focus_mode: threadState.focus_mode ?? null,
          continuity_status: threadState.continuity_status ?? null,
          current_language_hint: threadState.current_language_hint ?? null
        }
      : null
  };

  if (!latestUserMessage) {
    return {
      memoryRecall: emptyMemoryRecall,
      relationshipRecall: emptyRelationshipRecall,
      threadStateRecall
    };
  }

  const memoryRecall = await recallRelevantMemories({
    workspaceId,
    userId,
    agentId,
    threadId,
    latestUserMessage,
    hasThreadState: threadStateRecall.applied,
    allowDistantFallback: !preferSameThreadContinuation,
    activeNamespace,
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
    },
    threadStateRecall
  };
}
