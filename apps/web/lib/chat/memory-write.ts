import { generateText } from "@/lib/litellm/client";
import {
  buildMemoryV2Fields,
  canTransitionMemoryStatus,
  getMemoryStatus,
  inferLegacyMemoryStability,
  isMemoryActive,
  isSupportedSingleSlotPath,
  normalizeSingleSlotValue,
  LEGACY_MEMORY_KEY,
  type MemoryCategory,
  type MemoryScope,
  type MemoryStability
} from "@/lib/chat/memory-v2";
import {
  MEMORY_CONFIDENCE_THRESHOLD,
  type ContextMessage,
  coalesceCandidates,
  type MemoryExtractionResponse,
  type MemoryType,
  type MemoryUpsertRow,
  type MemoryUsageType,
  type MemoryWriteOutcome,
  normalizeMemoryContent,
  isNearDuplicateMemory,
  type SingleSlotMemoryKey,
  type StoredMemory,
  stripCodeFence,
  shouldPreferIncomingMemory
} from "@/lib/chat/memory-shared";
import {
  buildGenericPlannerMemoryInsertMetadata,
  buildGenericPlannerMemoryUpdateMetadata,
  buildRelationshipPlannerMemoryMetadata,
  buildSingleSlotMemoryInsertMetadata,
  buildSingleSlotMemoryRefreshMetadata,
  buildSingleSlotMemorySupersededMetadata
} from "@/lib/chat/memory-write-metadata";
import {
  buildPlannedGenericMemoryInsertRow,
  buildPlannedGenericMemoryUpdateRow
} from "@/lib/chat/memory-write-rows";
import {
  buildPlannedRelationshipMemoryRecord,
  buildPlannedThreadStateCandidate
} from "@/lib/chat/memory-write-record-candidates";
import {
  buildMemoryNamespaceScopedMetadata,
  isMemoryWithinNamespace,
  resolveRuntimeMemoryBoundary,
  type ActiveRuntimeMemoryNamespace
} from "@/lib/chat/memory-namespace";
import {
  resolvePlannedMemoryWriteTarget,
  type PlannedMemoryWriteBoundary
} from "@/lib/chat/memory-write-targets";
import {
  insertMemoryItem,
  insertMemoryItems,
  updateMemoryItem
} from "@/lib/chat/memory-item-persistence";
import {
  loadActiveSingleSlotMemoryRows,
  loadRecentOwnedMemoriesByTypes
} from "@/lib/chat/memory-item-read";
import type { RuntimeMemoryWriteRequest } from "@/lib/chat/runtime-contract";
import { buildDefaultThreadState } from "@/lib/chat/thread-state";
import type { ThreadStateRepository } from "@/lib/chat/thread-state-repository";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_MODEL = "replicate-llama-3-8b";

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
    "Supported memory_type values are only: profile, preference, goal.",
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
          candidate.memory_type === "preference" ||
          candidate.memory_type === "goal") &&
        candidate.content.length > 0
    );
}

export async function planMemoryWriteRequests({
  latestUserMessage,
  recentContext,
  sourceTurnId
}: {
  latestUserMessage: string;
  recentContext: ContextMessage[];
  sourceTurnId: string;
}): Promise<RuntimeMemoryWriteRequest[]> {
  if (!shouldAttemptExtraction(latestUserMessage)) {
    return [];
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

  let parsedCandidates: ReturnType<typeof parseMemoryExtraction>;

  try {
    parsedCandidates = parseMemoryExtraction(extraction.content);
  } catch {
    return [];
  }

  const candidates = parsedCandidates
    .filter(
      (candidate) =>
        candidate.should_store &&
        candidate.confidence >= MEMORY_CONFIDENCE_THRESHOLD
    )
    .slice(0, 2);

  return candidates.map((candidate) => ({
    kind: "generic_memory" as const,
    memory_type: candidate.memory_type,
    candidate_content: candidate.content,
    reason: candidate.reason,
    confidence: Number(candidate.confidence.toFixed(2)),
    source_turn_id: sourceTurnId,
    dedupe_key: `${candidate.memory_type}:${normalizeMemoryContent(candidate.content)}`,
    write_mode: "upsert"
  }));
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
    const candidate = normalized.match(pattern)?.[1]?.trim();
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
    const candidate = normalized.match(pattern)?.[1]?.trim();
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
  const formalPatterns = ["正式一点", "更正式一点", "请正式一点", "more formal", "be more formal"];
  const friendlyPatterns = ["像朋友一点", "像朋友那样", "更像朋友", "like a friend", "friendlier"];
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

export function planRelationshipMemoryWriteRequests({
  latestUserMessage,
  sourceTurnId,
  agentId
}: {
  latestUserMessage: string;
  sourceTurnId: string;
  agentId: string | null;
}): RuntimeMemoryWriteRequest[] {
  if (!agentId) {
    return [];
  }

  const requests: RuntimeMemoryWriteRequest[] = [];
  const relationshipNickname =
    detectRelationshipAgentNicknameCandidate(latestUserMessage);
  const userPreferredName =
    detectRelationshipUserPreferredNameCandidate(latestUserMessage);
  const userAddressStyle =
    detectRelationshipUserAddressStyleCandidate(latestUserMessage);

  if (relationshipNickname) {
    requests.push({
      kind: "relationship_memory",
      memory_type: "relationship",
      relationship_key: "agent_nickname",
      relationship_scope: "user_agent",
      candidate_content: relationshipNickname,
      reason: "The user explicitly proposed a stable nickname for this agent.",
      confidence: 0.96,
      source_turn_id: sourceTurnId,
      target_agent_id: agentId,
      target_thread_id: null,
      dedupe_key: `relationship.agent_nickname:${normalizeMemoryContent(relationshipNickname)}`,
      write_mode: "upsert"
    });
  }

  if (userPreferredName) {
    requests.push({
      kind: "relationship_memory",
      memory_type: "relationship",
      relationship_key: "user_preferred_name",
      relationship_scope: "user_agent",
      candidate_content: userPreferredName,
      reason: "The user explicitly stated how this agent should address them.",
      confidence: 0.94,
      source_turn_id: sourceTurnId,
      target_agent_id: agentId,
      target_thread_id: null,
      dedupe_key: `relationship.user_preferred_name:${normalizeMemoryContent(userPreferredName)}`,
      write_mode: "upsert"
    });
  }

  if (userAddressStyle) {
    requests.push({
      kind: "relationship_memory",
      memory_type: "relationship",
      relationship_key: "user_address_style",
      relationship_scope: "user_agent",
      candidate_content: userAddressStyle,
      reason: "The user explicitly stated a preferred relationship or address style.",
      confidence: 0.9,
      source_turn_id: sourceTurnId,
      target_agent_id: agentId,
      target_thread_id: null,
      dedupe_key: `relationship.user_address_style:${normalizeMemoryContent(userAddressStyle)}`,
      write_mode: "upsert"
    });
  }

  return requests;
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
  metadata = {},
  activeNamespace = null
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
  activeNamespace?: ActiveRuntimeMemoryNamespace | null;
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
  const { data: existingRows, error: loadError } = await loadActiveSingleSlotMemoryRows({
    supabase,
    workspaceId,
    userId,
    category,
    key,
    scope,
    targetAgentId,
    targetThreadId,
    select:
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at"
  }).order("created_at", { ascending: false });
  if (loadError) {
    throw new Error(`Failed to load single-slot memories: ${loadError.message}`);
  }

  const activeRows = ((existingRows ?? []) as StoredMemory[]).filter((row) =>
    isMemoryActive(row)
  ).filter((row) =>
    isMemoryWithinNamespace({
      memory: row,
      namespace: activeNamespace ?? null
    })
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

  const nextSourceRefs = [{ kind: "message", source_message_id: sourceMessageId }];

  if (sameValueRow) {
    const nextMetadata = buildSingleSlotMemoryRefreshMetadata({
      existingMetadata: sameValueRow.metadata ?? {},
      incomingMetadata: metadata,
      normalizedValue
    });

    const { error: updateError } = await updateMemoryItem({
      supabase,
      memoryItemId: sameValueRow.id,
      patch: {
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
      }
    });

    if (updateError) {
      throw new Error(`Failed to refresh single-slot memory: ${updateError.message}`);
    }

    return { created: false, updated: true, supersededIds: [] as string[] };
  }

  const supersededIds: string[] = [];
  for (const row of activeRows) {
    if (!canTransitionMemoryStatus(getMemoryStatus(row), "superseded")) {
      continue;
    }

    const nextMetadata = buildSingleSlotMemorySupersededMetadata({
      existingMetadata: row.metadata ?? {},
      supersededAt: new Date().toISOString(),
      sourceMessageId
    });

    const { error: supersedeError } = await updateMemoryItem({
      supabase,
      memoryItemId: row.id,
      patch: {
        status: "superseded",
        metadata: nextMetadata,
        updated_at: new Date().toISOString()
      }
    });

    if (supersedeError) {
      throw new Error(`Failed to supersede single-slot memory: ${supersedeError.message}`);
    }

    supersededIds.push(row.id);
  }

  const { error: insertError } = await insertMemoryItem({
    supabase,
    payload: {
    workspace_id: workspaceId,
    user_id: userId,
    agent_id: agentId ?? targetAgentId,
    source_message_id: sourceMessageId,
    memory_type: category === "profile" || category === "preference" ? category : null,
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
    metadata: buildSingleSlotMemoryInsertMetadata({
      incomingMetadata: metadata,
      normalizedValue
    })
    }
  });

  if (insertError) {
    throw new Error(`Failed to insert single-slot memory: ${insertError.message}`);
  }

  return { created: true, updated: false, supersededIds };
}

export async function executeMemoryWriteRequests({
  workspaceId,
  userId,
  agentId,
  threadId,
  threadStateRepository,
  activeNamespace = null,
  requests
}: {
  workspaceId: string;
  userId: string;
  agentId: string | null;
  threadId?: string | null;
  threadStateRepository?: ThreadStateRepository | null;
  activeNamespace?: ActiveRuntimeMemoryNamespace | null;
  requests: RuntimeMemoryWriteRequest[];
}): Promise<MemoryWriteOutcome> {
  if (requests.length === 0) {
    return {
      createdCount: 0,
      createdTypes: [],
      updatedCount: 0,
      updatedTypes: []
    };
  }

  const relationshipRequests = requests.filter(
    (request): request is Extract<RuntimeMemoryWriteRequest, { kind: "relationship_memory" }> =>
      request.kind === "relationship_memory"
  );
  const genericRequests = requests.filter(
    (request): request is Extract<RuntimeMemoryWriteRequest, { kind: "generic_memory" }> =>
      request.kind === "generic_memory"
  );
  const threadStateRequests = genericRequests.filter(
    (request) =>
      resolvePlannedMemoryWriteTarget(request, activeNamespace).recordTarget ===
      "thread_state_candidate"
  );
  const persistedGenericRequests = genericRequests.filter(
    (request) =>
      resolvePlannedMemoryWriteTarget(request, activeNamespace).recordTarget !==
      "thread_state_candidate"
  );

  const relationshipCreatedTypes: MemoryUsageType[] = [];
  const relationshipUpdatedTypes: MemoryUsageType[] = [];
  const namespaceMetadata = buildMemoryNamespaceScopedMetadata({
    namespace: activeNamespace
  });

  for (const request of relationshipRequests) {
    const target = resolvePlannedMemoryWriteTarget(request, activeNamespace);
    const relationshipRecord = buildPlannedRelationshipMemoryRecord({
      workspaceId,
      userId,
      request
    });
    const relationshipWrite = await upsertSingleSlotMemory({
      workspaceId,
      userId,
      agentId,
      sourceMessageId: request.source_turn_id,
      category: "relationship",
      key: request.relationship_key,
      value: relationshipRecord.canonical_text,
      scope: request.relationship_scope,
      targetAgentId: request.target_agent_id,
      targetThreadId: request.target_thread_id ?? null,
      confidence: request.confidence,
      stability:
        request.relationship_key === "user_address_style" ? "medium" : "high",
      activeNamespace,
      metadata: {
        ...buildRelationshipPlannerMemoryMetadata(request, namespaceMetadata, {
          writeBoundary: target.writeBoundary,
          writePriorityLayer: target.writePriorityLayer,
          fallbackWriteBoundary: target.fallbackWriteBoundary,
          writeEscalationMode: target.writeEscalationMode,
          routedProjectId: target.routedProjectId,
          routedWorldId: target.routedWorldId,
          namespacePrimaryLayer: target.namespacePrimaryLayer,
          targetNamespaceId: target.targetNamespaceId,
          namespacePolicyBundleId: target.namespacePolicyBundleId,
          namespaceGovernanceConvergenceDigestId:
            target.namespaceGovernanceConvergenceDigestId,
          namespaceGovernanceConvergenceSummary:
            target.namespaceGovernanceConvergenceSummary,
          retrievalWriteDigestAlignment:
            target.retrievalWriteDigestAlignment
        }),
        record_target: target.recordTarget,
        semantic_subject_id: relationshipRecord.subject.entity_id
      }
    });

    if (relationshipWrite.created) {
      relationshipCreatedTypes.push("relationship");
    }

    if (relationshipWrite.updated) {
      relationshipUpdatedTypes.push("relationship");
    }
  }

  let threadStateCreatedCount = 0;
  let threadStateUpdatedCount = 0;

  if (
    threadStateRequests.length > 0 &&
    threadId &&
    agentId &&
    threadStateRepository
  ) {
    const normalizedGoalCandidates = coalesceCandidates(
      threadStateRequests.map((request) => ({
        memory_type: request.memory_type,
        content: request.candidate_content,
        should_store: true,
        confidence: request.confidence,
        reason: request.reason,
        normalized_content: normalizeMemoryContent(request.candidate_content)
      }))
    );
    const selectedGoalCandidate = normalizedGoalCandidates.sort(
      (left, right) => right.confidence - left.confidence
    )[0];
    const matchingGoalRequest = selectedGoalCandidate
      ? threadStateRequests.find(
          (request) =>
            request.memory_type === selectedGoalCandidate.memory_type &&
            normalizeMemoryContent(request.candidate_content) ===
              selectedGoalCandidate.normalized_content
        ) ?? null
      : null;

    if (selectedGoalCandidate && matchingGoalRequest) {
      const threadStateCandidate = buildPlannedThreadStateCandidate({
        threadId,
        agentId,
        goalText: selectedGoalCandidate.content,
        sourceTurnId: matchingGoalRequest.source_turn_id
      });
      const existingThreadState = await threadStateRepository.loadThreadState({
        threadId,
        agentId
      });
      const nextUpdatedAt = new Date().toISOString();

      if (existingThreadState.status === "found") {
        await threadStateRepository.saveThreadState({
          ...existingThreadState.thread_state,
          state_version: existingThreadState.thread_state.state_version + 1,
          focus_mode: threadStateCandidate.focus_mode,
          continuity_status:
            threadStateCandidate.continuity_status ??
            existingThreadState.thread_state.continuity_status,
          last_user_message_id:
            threadStateCandidate.source_turn_id ??
            existingThreadState.thread_state.last_user_message_id,
          updated_at: nextUpdatedAt
        });
        threadStateUpdatedCount = 1;
      } else {
        await threadStateRepository.saveThreadState(
          buildDefaultThreadState({
            threadId,
            agentId,
            focusMode: threadStateCandidate.focus_mode,
            continuityStatus: threadStateCandidate.continuity_status,
            lastUserMessageId: threadStateCandidate.source_turn_id,
            updatedAt: nextUpdatedAt
          })
        );
        threadStateCreatedCount = 1;
      }
    }
  }

  if (persistedGenericRequests.length === 0) {
    return {
      createdCount: relationshipCreatedTypes.length + threadStateCreatedCount,
      createdTypes: Array.from(
        new Set<MemoryUsageType>(
          relationshipCreatedTypes.concat(
            threadStateCreatedCount > 0 ? ["goal"] : []
          )
        )
      ),
      updatedCount: relationshipUpdatedTypes.length + threadStateUpdatedCount,
      updatedTypes: Array.from(
        new Set<MemoryUsageType>(
          relationshipUpdatedTypes.concat(
            threadStateUpdatedCount > 0 ? ["goal"] : []
          )
        )
      )
    };
  }

  const normalizedCandidates = coalesceCandidates(
    persistedGenericRequests.map((request) => ({
      memory_type: request.memory_type,
      content: request.candidate_content,
      should_store: true,
      confidence: request.confidence,
      reason: request.reason,
      normalized_content: normalizeMemoryContent(request.candidate_content)
    }))
  );

  const supabase = await createClient();
  const { data: existingMemories } = await loadRecentOwnedMemoriesByTypes({
    supabase,
    workspaceId,
    userId,
    memoryTypes: Array.from(new Set(normalizedCandidates.map((item) => item.memory_type))),
    select:
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, source_message_id, last_used_at, last_confirmed_at, metadata, created_at",
    limit: 50
  });

  const activeExistingMemories = ((existingMemories ?? []) as StoredMemory[])
    .filter((memory) => isMemoryActive(memory))
    .filter((memory) =>
      isMemoryWithinNamespace({
        memory,
        namespace: activeNamespace
      })
    )
    .map((memory) => ({
      ...memory,
      normalized_content: normalizeMemoryContent(memory.content)
    }));

  const rowsToInsert: Array<Record<string, unknown>> = [];
  const rowsToUpdate: MemoryUpsertRow[] = [];

  for (const candidate of normalizedCandidates) {
    const matchingRequest = genericRequests.find(
      (request) =>
        request.memory_type === candidate.memory_type &&
        normalizeMemoryContent(request.candidate_content) ===
          candidate.normalized_content
    );

    const sourceTurnId = matchingRequest?.source_turn_id;
    const fallbackWriteBoundary: PlannedMemoryWriteBoundary =
      activeNamespace?.primary_layer === "world"
        ? "world"
        : activeNamespace?.primary_layer === "project"
          ? "project"
          : activeNamespace?.primary_layer === "thread"
            ? "thread"
            : "default";
    const namespaceBoundary = resolveRuntimeMemoryBoundary(activeNamespace);
    const target = matchingRequest
      ? resolvePlannedMemoryWriteTarget(matchingRequest, activeNamespace)
      : {
          recordTarget: "static_profile" as const,
          canonicalMemoryType: candidate.memory_type,
          legacyScope: "user_global" as const,
          routedScope:
            fallbackWriteBoundary === "thread"
              ? ("thread_local" as const)
              : ("user_global" as const),
          routedTargetAgentId: null,
          routedTargetThreadId:
            fallbackWriteBoundary === "thread"
              ? activeNamespace?.refs.find((ref) => ref.layer === "thread")
                  ?.entity_id ?? null
              : null,
          routedProjectId:
            activeNamespace?.refs.find((ref) => ref.layer === "project")
              ?.entity_id ?? null,
          routedWorldId:
            activeNamespace?.refs.find((ref) => ref.layer === "world")
              ?.entity_id ?? null,
          writeBoundary: fallbackWriteBoundary,
          writePriorityLayer: fallbackWriteBoundary,
          fallbackWriteBoundary: null,
          writeEscalationMode: namespaceBoundary.write_escalation_mode,
          namespacePrimaryLayer: activeNamespace?.primary_layer ?? null,
          targetNamespaceId: activeNamespace?.namespace_id ?? null,
          namespacePolicyBundleId: namespaceBoundary.policy_bundle_id,
          namespaceGovernanceConvergenceDigestId:
            namespaceBoundary.governance_convergence_digest_id,
          namespaceGovernanceConvergenceSummary:
            namespaceBoundary.governance_convergence_summary,
          namespaceUnifiedGovernanceRuntimeDigestId:
            namespaceBoundary.unified_governance_runtime_digest_id,
          namespaceUnifiedGovernanceRuntimeSummary:
            namespaceBoundary.unified_governance_runtime_summary,
          namespaceUnifiedRuntimeAlignmentMode:
            namespaceBoundary.unified_runtime_alignment_mode,
          namespaceUnifiedRuntimeReuseMode:
            namespaceBoundary.unified_runtime_reuse_mode,
          namespaceGovernanceConsolidationDigestId:
            namespaceBoundary.governance_consolidation_digest_id,
          namespaceGovernanceConsolidationSummary:
            namespaceBoundary.governance_consolidation_summary,
          namespaceRuntimeConsolidationMode:
            namespaceBoundary.runtime_consolidation_mode,
          namespaceUnifiedGovernanceConsolidationDigestId:
            namespaceBoundary.unified_governance_consolidation_digest_id,
          namespaceUnifiedGovernanceConsolidationSummary:
            namespaceBoundary.unified_governance_consolidation_summary,
          namespaceUnifiedConsolidationAlignmentMode:
            namespaceBoundary.unified_consolidation_alignment_mode,
          namespaceUnifiedConsolidationReuseMode:
            namespaceBoundary.unified_consolidation_reuse_mode,
          namespaceUnifiedConsolidationCoordinationSummary:
            namespaceBoundary.unified_consolidation_coordination_summary,
          namespaceUnifiedConsolidationConsistencyMode:
            namespaceBoundary.unified_consolidation_consistency_mode,
          namespaceGovernancePlaneRuntimeDigestId:
            namespaceBoundary.governance_plane_runtime_digest_id,
          namespaceGovernancePlaneRuntimeSummary:
            namespaceBoundary.governance_plane_runtime_summary,
          namespaceGovernancePlaneAlignmentMode:
            namespaceBoundary.governance_plane_alignment_mode,
          namespaceGovernancePlaneReuseMode:
            namespaceBoundary.governance_plane_reuse_mode,
          namespaceGovernanceFabricRuntimeDigestId:
            namespaceBoundary.governance_fabric_runtime_digest_id,
          namespaceGovernanceFabricRuntimeSummary:
            namespaceBoundary.governance_fabric_runtime_summary,
          namespaceGovernanceFabricAlignmentMode:
            namespaceBoundary.governance_fabric_alignment_mode,
          namespaceGovernanceFabricReuseMode:
            namespaceBoundary.governance_fabric_reuse_mode,
          retrievalWriteDigestAlignment:
            namespaceBoundary.retrieval_write_digest_alignment
        };
    const matchingExisting = activeExistingMemories.find(
      (memory) =>
        memory.memory_type === candidate.memory_type &&
        isNearDuplicateMemory(memory, candidate)
    );

    if (!matchingExisting) {
      rowsToInsert.push(
        buildPlannedGenericMemoryInsertRow({
          workspaceId,
          userId,
          agentId,
          candidate,
          matchingRequest,
          sourceTurnId,
          threshold: MEMORY_CONFIDENCE_THRESHOLD,
          target,
          namespaceMetadata
        })
      );
      continue;
    }

    if (!shouldPreferIncomingMemory({ candidate, existing: matchingExisting })) {
      continue;
    }

    rowsToUpdate.push(
      buildPlannedGenericMemoryUpdateRow({
        workspaceId,
        candidate,
        matchingExisting,
        matchingRequest,
        sourceTurnId,
        userId,
        threshold: MEMORY_CONFIDENCE_THRESHOLD,
        target,
        convergenceUpdatedAt: new Date().toISOString(),
        namespaceMetadata
      })
    );
  }

  for (const row of rowsToUpdate) {
    const { error: updateError } = await updateMemoryItem({
      supabase,
      memoryItemId: row.id,
      patch: {
        content: row.content,
        confidence: row.confidence,
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
      }
    });

    if (updateError) {
      throw new Error(`Failed to execute memory write requests: ${updateError.message}`);
    }
  }

  if (rowsToInsert.length > 0) {
    const { error } = await insertMemoryItems({
      supabase,
      rows: rowsToInsert as Array<Record<string, unknown>>
    });
    if (error) {
      throw new Error(`Failed to insert planned memory writes: ${error.message}`);
    }
  }

  return {
    createdCount:
      relationshipCreatedTypes.length + rowsToInsert.length + threadStateCreatedCount,
    createdTypes: Array.from(
      new Set<MemoryUsageType>(
        relationshipCreatedTypes
          .concat(
            rowsToInsert
              .map((row) => row.memory_type)
              .filter(
                (type): type is MemoryType =>
                  type === "profile" ||
                  type === "preference" ||
                  type === "goal"
              )
          )
          .concat(threadStateCreatedCount > 0 ? ["goal"] : [])
      )
    ),
    updatedCount:
      relationshipUpdatedTypes.length + rowsToUpdate.length + threadStateUpdatedCount,
    updatedTypes: Array.from(
      new Set<MemoryUsageType>(
        relationshipUpdatedTypes
          .concat(rowsToUpdate.map((row) => row.memory_type))
          .concat(threadStateUpdatedCount > 0 ? ["goal"] : [])
      )
    )
  };
}

export async function storeRelationshipMemories({
  workspaceId,
  userId,
  agentId,
  sourceMessageId,
  latestUserMessage,
}: {
  workspaceId: string;
  userId: string;
  agentId: string | null;
  sourceMessageId: string;
  latestUserMessage: string;
}): Promise<MemoryWriteOutcome> {
  const requests = planRelationshipMemoryWriteRequests({
    latestUserMessage,
    sourceTurnId: sourceMessageId,
    agentId
  });

  return executeMemoryWriteRequests({
    workspaceId,
    userId,
    agentId,
    requests
  });
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
  const plannedRequests = await planMemoryWriteRequests({
    latestUserMessage,
    recentContext,
    sourceTurnId: sourceMessageId
  });
  const relationshipRequests = planRelationshipMemoryWriteRequests({
    latestUserMessage,
    sourceTurnId: sourceMessageId,
    agentId
  });
  const combinedRequests = [...plannedRequests, ...relationshipRequests];
  const plannedOutcome = await executeMemoryWriteRequests({
    workspaceId,
    userId,
    agentId,
    requests: combinedRequests
  });

  return {
    createdCount: plannedOutcome.createdCount,
    createdTypes: plannedOutcome.createdTypes,
    updatedCount: plannedOutcome.updatedCount,
    updatedTypes: plannedOutcome.updatedTypes
  };
}
