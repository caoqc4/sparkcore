import {
  buildRecalledEpisodeMemoryFromStoredMemory,
  buildRecalledDynamicProfileMemoryFromStoredMemory,
  buildRuntimeMemorySemanticSummary,
  buildDynamicProfileRecordFromStoredMemory,
  buildRecalledProfileMemoryFromStoredMemory,
  buildRecalledRelationshipMemoryFromStoredMemory,
  buildRecalledTimelineMemoryFromStoredMemory,
  buildStaticProfileRecordFromStoredMemory,
  classifyStoredMemorySemanticTarget,
  isStoredMemoryDynamicProfile,
  isStoredMemoryGenericMemoryRecord,
  isStoredMemoryRelationshipMemoryRecord,
  isStoredMemoryStaticProfile
} from "@/lib/chat/memory-records";
import { buildAgentSystemPrompt, buildVisibleMemoryRecord } from "@/lib/chat/runtime";
import { buildAssistantMessageMetadata } from "@/lib/chat/assistant-message-metadata";
import { buildRuntimeDebugMetadata } from "@/lib/chat/runtime-debug-metadata";
import {
  getAssistantMemoryObservedSemanticLayers,
  getAssistantCompactedThreadSummaryText,
  getAssistantKnowledgeCount,
  getAssistantMemoryNamespacePrimaryLayer,
  getAssistantMemoryScenarioPackId,
  getAssistantMemoryPrimarySemanticLayer
} from "@/lib/chat/assistant-message-metadata-read";
import {
  buildScenarioMemoryPackPromptSection,
  resolveActiveScenarioMemoryPack
} from "@/lib/chat/memory-packs";
import {
  buildKnowledgeSnapshot,
  buildRuntimeKnowledgeSnippet
} from "@/lib/chat/memory-knowledge";
import { resolveActiveMemoryNamespace } from "@/lib/chat/memory-namespace";
import { buildCompactedThreadSummary } from "@/lib/chat/thread-compaction";
import {
  buildPlannedRelationshipMemoryRecord,
  buildPlannedStaticProfileRecord,
  buildPlannedThreadStateCandidate
} from "@/lib/chat/memory-write-record-candidates";
import type { StoredMemory } from "@/lib/chat/memory-shared";
import { resolveSupportedSingleSlotTarget } from "@/lib/chat/memory-v2";
import { buildRuntimeAssistantMetadataInput } from "@/lib/chat/runtime-assistant-metadata";
import { buildRuntimeTurnInput } from "@/lib/chat/runtime-input";
import { selectMemoryRecallRoutes } from "@/lib/chat/memory-recall";

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createStoredMemory(
  overrides: Partial<StoredMemory> & Pick<StoredMemory, "id" | "content">
): StoredMemory {
  return {
    id: overrides.id,
    content: overrides.content,
    memory_type: overrides.memory_type ?? null,
    confidence: overrides.confidence ?? 0.92,
    category: overrides.category ?? overrides.memory_type ?? "profile",
    key: overrides.key ?? null,
    value: overrides.value,
    scope: overrides.scope ?? "user_global",
    subject_user_id: overrides.subject_user_id ?? "user-1",
    target_agent_id: overrides.target_agent_id ?? null,
    target_thread_id: overrides.target_thread_id ?? null,
    stability: overrides.stability ?? "high",
    status: overrides.status ?? "active",
    source_refs: overrides.source_refs ?? [],
    source_message_id: overrides.source_message_id ?? "msg-1",
    last_used_at: overrides.last_used_at ?? null,
    last_confirmed_at: overrides.last_confirmed_at ?? null,
    metadata: overrides.metadata ?? {},
    created_at: overrides.created_at ?? "2026-03-23T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-03-23T00:00:00.000Z"
  };
}

function main() {
  const profileMemory = createStoredMemory({
    id: "mem-profile",
    content: "User prefers concise technical explanations.",
    memory_type: "profile",
    category: "profile",
    scope: "user_global",
    key: "communication_style"
  });
  const preferenceMemory = createStoredMemory({
    id: "mem-preference",
    content: "en",
    memory_type: "preference",
    category: "preference",
    scope: "user_agent",
    target_agent_id: "agent-1",
    key: "reply_language",
    value: "en"
  });
  const relationshipMemory = createStoredMemory({
    id: "mem-relationship",
    content: "The user calls this agent 小助手.",
    memory_type: "relationship",
    category: "relationship",
    scope: "user_agent",
    target_agent_id: "agent-1"
  });
  const goalMemory = createStoredMemory({
    id: "mem-goal",
    content: "Finish the onboarding checklist this week.",
    memory_type: "goal",
    category: "goal",
    scope: "thread_local",
    target_thread_id: "thread-1"
  });
  const threadLocalProfileMemory = createStoredMemory({
    id: "mem-thread-profile",
    content: "In this thread, keep the tone extra formal.",
    memory_type: "profile",
    category: "profile",
    scope: "thread_local",
    target_thread_id: "thread-1"
  });
  const episodeMemory = createStoredMemory({
    id: "mem-episode",
    content: "The user switched from weekly planning to daily check-ins last month.",
    memory_type: "profile",
    category: "project_history",
    scope: "user_global"
  });
  const legacyDisplayMemory = createStoredMemory({
    id: "mem-legacy-display",
    content: "User prefers practical examples.",
    memory_type: "profile",
    category: null,
    scope: null,
    metadata: undefined,
    source_message_id: null
  });

  expect(
    classifyStoredMemorySemanticTarget(profileMemory) === "static_profile",
    "Expected user-global profile memory to map to static_profile."
  );
  expect(
    classifyStoredMemorySemanticTarget(preferenceMemory) === "static_profile",
    "Expected user-agent preference memory to map to static_profile."
  );
  expect(
    classifyStoredMemorySemanticTarget(relationshipMemory) === "memory_record",
    "Expected relationship memory to map to memory_record."
  );
  expect(
    classifyStoredMemorySemanticTarget(goalMemory) === "thread_state_candidate",
    "Expected goal memory to map to thread_state_candidate."
  );
  expect(
    classifyStoredMemorySemanticTarget(threadLocalProfileMemory) ===
      "dynamic_profile",
    "Expected thread-local profile memory to map to dynamic_profile."
  );
  expect(
    isStoredMemoryStaticProfile(profileMemory),
    "Expected static-profile predicate to recognize user-global profile memory."
  );
  expect(
    isStoredMemoryDynamicProfile(threadLocalProfileMemory),
    "Expected dynamic-profile predicate to recognize thread-local profile memory."
  );
  expect(
    isStoredMemoryRelationshipMemoryRecord(relationshipMemory),
    "Expected relationship memory-record predicate to recognize relationship memory."
  );
  expect(
    isStoredMemoryGenericMemoryRecord(episodeMemory),
    "Expected generic memory-record predicate to recognize episode/timeline seed memory."
  );

  const restoreTarget = resolveSupportedSingleSlotTarget(preferenceMemory);
  expect(
    restoreTarget?.path === "preference.reply_language",
    "Expected single-slot restore target resolver to preserve canonical path for preference rows."
  );
  expect(
    restoreTarget?.scope === "user_agent",
    "Expected single-slot restore target resolver to preserve canonical scope."
  );

  const staticProfileRecord = buildStaticProfileRecordFromStoredMemory(profileMemory);
  expect(staticProfileRecord, "Expected static profile adapter to produce a record.");
  expect(
    staticProfileRecord.key === "communication_style",
    "Expected static profile record to keep the legacy key."
  );

  const recalledProfile = buildRecalledProfileMemoryFromStoredMemory(preferenceMemory);
  expect(recalledProfile, "Expected preference recall adapter to produce a recalled memory.");
  expect(
    recalledProfile.memory_type === "preference",
    "Expected preference recall adapter to preserve preference memory_type."
  );
  const promptRecalledProfile = {
    memory_type: "preference" as const,
    content: recalledProfile.content,
    confidence: recalledProfile.confidence
  };

  const recalledRelationship =
    buildRecalledRelationshipMemoryFromStoredMemory(relationshipMemory);
  expect(
    recalledRelationship?.memory_type === "relationship",
    "Expected relationship recall adapter to produce relationship memory."
  );
  const recalledEpisode = buildRecalledEpisodeMemoryFromStoredMemory(episodeMemory);
  expect(
    recalledEpisode?.memory_type === "episode",
    "Expected episode recall adapter to produce episode memory."
  );
  const recalledTimeline =
    buildRecalledTimelineMemoryFromStoredMemory(episodeMemory);
  expect(
    recalledTimeline?.memory_type === "timeline",
    "Expected timeline recall adapter to produce timeline memory."
  );
  const dynamicProfileRecord =
    buildDynamicProfileRecordFromStoredMemory(threadLocalProfileMemory);
  expect(
    dynamicProfileRecord?.profile_id === "prof_dynamic:mem-thread-profile",
    "Expected dynamic profile adapter to produce a dynamic-profile record."
  );
  const recalledDynamicProfile =
    buildRecalledDynamicProfileMemoryFromStoredMemory(threadLocalProfileMemory);
  expect(
    recalledDynamicProfile?.semantic_layer === "dynamic_profile",
    "Expected dynamic profile recall adapter to tag the semantic layer."
  );

  const selectedRoutes = selectMemoryRecallRoutes({
    latestUserMessage: "Can you remind me how this changed over time?",
    allowDistantFallback: true,
    hasThreadState: true
  });
  expect(
    selectedRoutes.join(",") === "thread_state,profile,episode,timeline",
    "Expected recall route selection to activate episode and timeline in P1."
  );

  const visibleMemoryRecord = buildVisibleMemoryRecord({
    memory: legacyDisplayMemory,
    agentNameById: new Map([["agent-1", "Helper"]]),
    sourceMessageById: new Map(),
    sourceThreadTitleById: new Map()
  });
  expect(
    visibleMemoryRecord.category === "profile",
    "Expected runtime memory display normalizer to infer canonical category."
  );
  expect(
    visibleMemoryRecord.scope === "user_global",
    "Expected runtime memory display normalizer to infer canonical scope."
  );
  expect(
    visibleMemoryRecord.metadata &&
      Object.keys(visibleMemoryRecord.metadata).length === 0,
    "Expected runtime memory display normalizer to default metadata to an empty object."
  );

  const plannedProfile = buildPlannedStaticProfileRecord({
    workspaceId: "workspace-1",
    userId: "user-1",
    candidate: {
      memory_type: "profile",
      content: "User prefers concise technical explanations.",
      normalized_content: "user prefers concise technical explanations.",
      should_store: true,
      confidence: 0.91,
      reason: "Stable profile fact"
    },
    request: {
      kind: "generic_memory",
      memory_type: "profile",
      candidate_content: "User prefers concise technical explanations.",
      dedupe_key: "profile:communication_style",
      reason: "Harness profile candidate",
      confidence: 0.91,
      source_turn_id: "turn-1"
    }
  });
  expect(
    plannedProfile.profile_id === "prof_static:profile:communication_style",
    "Expected planned static profile record to use dedupe-based id."
  );

  const plannedRelationship = buildPlannedRelationshipMemoryRecord({
    workspaceId: "workspace-1",
    userId: "user-1",
    request: {
      kind: "relationship_memory",
      memory_type: "relationship",
      relationship_key: "agent_nickname",
      relationship_scope: "user_agent",
      candidate_content: "小助手",
      reason: "Harness relationship candidate",
      confidence: 0.95,
      target_agent_id: "agent-1",
      target_thread_id: "thread-1",
      source_turn_id: "turn-1",
      dedupe_key: "rel:agent_nickname:agent-1"
    }
  });
  expect(
    plannedRelationship.memory_type === "relationship",
    "Expected planned relationship candidate to produce relationship memory record."
  );
  expect(
    plannedRelationship.subject.entity_type === "relationship",
    "Expected planned relationship candidate to set relationship subject."
  );

  const plannedThreadState = buildPlannedThreadStateCandidate({
    threadId: "thread-1",
    agentId: "agent-1",
    goalText: "Finish the onboarding checklist this week.",
    sourceTurnId: "turn-1",
    continuityStatus: "warm"
  });
  expect(
    plannedThreadState.focus_mode === "Finish the onboarding checklist this week.",
    "Expected thread state candidate to promote goal text into focus_mode."
  );
  expect(
    plannedThreadState.semantic_source === "goal_memory_candidate",
    "Expected thread state candidate to preserve goal semantic source."
  );

  const semanticSummary = buildRuntimeMemorySemanticSummary({
    memoryTypesUsed: ["profile", "relationship"],
    profileSnapshot: ["User prefers concise technical explanations."],
    hasThreadState: true,
    threadStateFocusMode: plannedThreadState.focus_mode,
    semanticLayersUsed: ["static_profile", "memory_record"]
  });
  expect(
    semanticSummary.primary_layer === "thread_state",
    "Expected semantic summary to prioritize thread_state when focus_mode exists."
  );
  expect(
    semanticSummary.observed_layers.join(",") ===
      "static_profile,memory_record,thread_state",
    "Expected semantic summary to retain all observed layers."
  );
  const recordOnlySemanticSummary = buildRuntimeMemorySemanticSummary({
    memoryTypesUsed: ["episode", "timeline"],
    profileSnapshot: [],
    hasThreadState: false,
    threadStateFocusMode: null,
    semanticLayersUsed: ["memory_record"]
  });
  expect(
    recordOnlySemanticSummary.primary_layer === "memory_record",
    "Expected episode/timeline memory types to map to memory_record semantic layer."
  );
  const dynamicOnlySemanticSummary = buildRuntimeMemorySemanticSummary({
    memoryTypesUsed: ["profile"],
    profileSnapshot: [],
    hasThreadState: false,
    threadStateFocusMode: null,
    semanticLayersUsed: ["dynamic_profile"]
  });
  expect(
    dynamicOnlySemanticSummary.primary_layer === "dynamic_profile",
    "Expected dynamic-profile semantic layer to become the primary layer when it is the only active layer."
  );
  const scenarioMemoryPack = resolveActiveScenarioMemoryPack();
  expect(
    scenarioMemoryPack.pack_id === "companion",
    "Expected companion scenario memory pack to be the default active pack in P2-1."
  );
  expect(
    scenarioMemoryPack.preferred_routes.join(",") ===
      "thread_state,profile,episode,timeline",
    "Expected companion scenario memory pack to preserve the P1 retrieval preference order."
  );
  const scenarioMemoryPackPrompt = buildScenarioMemoryPackPromptSection({
    pack: scenarioMemoryPack,
    replyLanguage: "en"
  });
  expect(
    scenarioMemoryPackPrompt.includes("Active Scenario Memory Pack: companion"),
    "Expected scenario memory pack prompt section to expose the active companion pack."
  );
  const knowledgeSnapshot = buildKnowledgeSnapshot({
    snapshotId: "knowledge-snapshot-1",
    resourceId: "resource-1",
    scope: {
      workspace_id: "workspace-1",
      project_id: "project-1"
    },
    title: "Onboarding checklist guide",
    summary: "The onboarding checklist should be completed in order and signed off by the project owner.",
    sourceKind: "project_document",
    capturedAt: "2026-03-23T00:00:00.000Z"
  });
  const runtimeKnowledge = [buildRuntimeKnowledgeSnippet(knowledgeSnapshot)];
  const activeMemoryNamespace = resolveActiveMemoryNamespace({
    userId: "user-1",
    agentId: "agent-1",
    threadId: "thread-1",
    relevantKnowledge: runtimeKnowledge
  });
  const compactedThreadSummary = buildCompactedThreadSummary({
    threadState: {
      thread_id: "thread-1",
      agent_id: "agent-1",
      state_version: 2,
      lifecycle_status: "active",
      focus_mode: plannedThreadState.focus_mode,
      current_language_hint: "en",
      recent_turn_window_size: 6,
      continuity_status: "warm",
      last_user_message_id: "msg-1",
      last_assistant_message_id: "msg-2",
      updated_at: "2026-03-23T00:00:00.000Z"
    },
    recentTurnCount: 4,
    latestUserMessage: "Help me finish onboarding."
  });

  const assistantMetadata = buildAssistantMessageMetadata(
    buildRuntimeAssistantMetadataInput({
      agent: {
        id: "agent-1",
        name: "Helper"
      },
      model: {
        result_model: "gpt-test",
        provider: "openai",
        requested: "gpt-test",
        profile_id: "profile-1",
        profile_name: "Balanced",
        profile_tier_label: "stable",
        profile_usage_note: "Harness profile",
        underlying_label: "gpt-test"
      },
      runtime: {
        role_core_packet: {
          packet_version: "v1",
          identity: {
            agent_id: "agent-1",
            agent_name: "Helper"
          },
          persona_summary: "Helpful assistant",
          style_guidance: "Be concise",
          relationship_stance: {
            effective: "friendly",
            source: "relationship_memory"
          },
          language_behavior: {
            reply_language_target: "en",
            reply_language_source: "latest-user-message",
            same_thread_continuation_preferred: true
          }
        },
        runtime_input: buildRuntimeTurnInput({
          userId: "user-1",
          agentId: "agent-1",
          threadId: "thread-1",
          workspaceId: "workspace-1",
          content: "Help me finish onboarding.",
          source: "web"
        }),
        session_thread_id: "thread-1",
        session_agent_id: "agent-1",
        current_message_id: "msg-1",
        recent_raw_turn_count: 4,
        approx_context_pressure: "medium"
      },
      reply_language: {
        target: "en",
        detected: "en",
        source: "latest-user-message"
      },
      answer: {
        question_type: "grounded_help",
        strategy: "grounded_answer",
        strategy_reason_code: "memory_supported",
        strategy_priority: "high",
        strategy_priority_label: "High"
      },
      session: {
        continuation_reason_code: "same_thread",
        thread_state: {
          lifecycle_status: "active",
          focus_mode: plannedThreadState.focus_mode,
          continuity_status: "warm",
          current_language_hint: "en"
        },
        same_thread_continuation_applicable: true,
        long_chain_pressure_candidate: false,
        same_thread_continuation_preferred: true,
        distant_memory_fallback_allowed: false
      },
      memory: {
        recalled_memories: [
          {
            memory_type: "profile",
            content: "User prefers concise technical explanations.",
            confidence: 0.92
          },
          {
            memory_type: "relationship",
            content: "The user calls this agent 小助手.",
            confidence: 0.95
          }
        ],
        hit_count: 2,
        used: true,
        types_used: ["profile", "relationship"],
        semantic_layers: ["static_profile", "memory_record"],
        profile_snapshot: ["User prefers concise technical explanations."],
        scenario_pack: scenarioMemoryPack,
        hidden_exclusion_count: 0,
        incorrect_exclusion_count: 0
      },
      knowledge: {
        snippets: runtimeKnowledge
      },
      namespace: {
        active_namespace: activeMemoryNamespace
      },
      compaction: {
        summary: compactedThreadSummary
      },
      follow_up: {
        request_count: 1
      }
    })
  );
  const runtimeDebugMetadata = buildRuntimeDebugMetadata({
    model_profile_id: "profile-1",
    answer_strategy: "grounded_answer",
    answer_strategy_reason_code: "memory_supported",
    recalled_memory_count: 2,
    memory_types_used: ["profile", "relationship"],
    memory_semantic_layers: ["static_profile", "memory_record"],
    memory_recall_routes: ["thread_state", "profile", "episode", "timeline"],
    profile_snapshot: ["User prefers concise technical explanations."],
    memory_write_request_count: 1,
    follow_up_request_count: 1,
    continuation_reason_code: "same_thread",
    recent_turn_count: 4,
    context_pressure: "medium",
    thread_state_recall: {
      applied: true,
      snapshot: {
        lifecycle_status: "active",
        focus_mode: plannedThreadState.focus_mode,
        continuity_status: "warm",
        current_language_hint: "en"
      }
    },
    reply_language: "en",
    scenario_memory_pack: scenarioMemoryPack,
    relevant_knowledge: runtimeKnowledge,
    active_memory_namespace: activeMemoryNamespace,
    compacted_thread_summary: compactedThreadSummary
  });
  expect(
    getAssistantMemoryPrimarySemanticLayer(assistantMetadata) === "thread_state",
    "Expected assistant metadata reader to expose thread_state as primary semantic layer."
  );
  expect(
    getAssistantMemoryObservedSemanticLayers(assistantMetadata).join(",") ===
      "static_profile,memory_record,thread_state",
    "Expected assistant metadata reader to expose all observed semantic layers."
  );
  expect(
    getAssistantMemoryScenarioPackId(assistantMetadata) === "companion",
    "Expected assistant metadata reader to expose the active scenario memory pack."
  );
  expect(
    getAssistantKnowledgeCount(assistantMetadata) === 1,
    "Expected assistant metadata reader to expose the injected knowledge count."
  );
  expect(
    getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
      "Focus: Finish the onboarding checklist this week."
    ),
    "Expected assistant metadata reader to expose the compacted thread summary text in P2."
  );
  expect(
    getAssistantMemoryNamespacePrimaryLayer(assistantMetadata) === "project",
    "Expected assistant metadata reader to expose project as the primary namespace layer in P2."
  );
  expect(
    runtimeDebugMetadata.memory.pack?.pack_id === "companion",
    "Expected runtime debug metadata to expose the active scenario memory pack in P2."
  );
  expect(
    runtimeDebugMetadata.knowledge.count === 1,
    "Expected runtime debug metadata to expose the injected knowledge count in P2."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.summary_id ===
      compactedThreadSummary?.summary_id,
    "Expected runtime debug metadata to expose the compacted thread summary in P2."
  );
  expect(
    runtimeDebugMetadata.memory_namespace?.primary_layer === "project",
    "Expected runtime debug metadata to expose project as the primary namespace layer in P2."
  );

  const systemPrompt = buildAgentSystemPrompt(
    {
      packet_version: "v1",
      identity: {
        agent_id: "agent-1",
        agent_name: "Helper"
      },
      persona_summary: "Helpful assistant",
      style_guidance: "Be concise",
      relationship_stance: {
        effective: "friendly",
        source: "relationship_memory"
      },
      language_behavior: {
        reply_language_target: "en",
        reply_language_source: "latest-user-message",
        same_thread_continuation_preferred: true
      }
    },
    "Keep answers grounded.",
    "Help me finish onboarding.",
    [promptRecalledProfile],
    runtimeKnowledge,
    compactedThreadSummary,
    activeMemoryNamespace,
    "en",
    undefined,
    "",
    {
      thread_id: "thread-1",
      agent_id: "agent-1",
      state_version: 2,
      lifecycle_status: "active",
      focus_mode: plannedThreadState.focus_mode,
      current_language_hint: "en",
      recent_turn_window_size: 6,
      continuity_status: "warm",
      last_user_message_id: "msg-1",
      last_assistant_message_id: "msg-2",
      updated_at: "2026-03-23T00:00:00.000Z"
    }
  );
  expect(
    systemPrompt.includes("focus_mode = Finish the onboarding checklist this week."),
    "Expected system prompt assembly to include thread_state focus_mode."
  );
  expect(
    systemPrompt.includes("current_language_hint = en."),
    "Expected system prompt assembly to include thread_state language hint."
  );
  expect(
    systemPrompt.includes("primary_layer = thread_state"),
    "Expected system prompt assembly to include memory semantic summary."
  );
  expect(
    systemPrompt.includes("Active Scenario Memory Pack: companion"),
    "Expected system prompt assembly to include active scenario memory pack guidance."
  );
  expect(
    systemPrompt.includes("Relevant Knowledge Layer:"),
    "Expected system prompt assembly to include the knowledge-layer section."
  );
  expect(
    systemPrompt.includes("Onboarding checklist guide"),
    "Expected system prompt assembly to include the injected knowledge title."
  );
  expect(
    systemPrompt.includes("Compacted thread summary:"),
    "Expected system prompt assembly to include compacted thread summary guidance in P2."
  );
  expect(
    systemPrompt.includes("Focus: Finish the onboarding checklist this week."),
    "Expected system prompt assembly to include compacted thread focus context in P2."
  );
  expect(
    systemPrompt.includes("Active Memory Namespace: primary_layer = project."),
    "Expected system prompt assembly to include the active memory namespace in P2."
  );

  const routeAwarePrompt = buildAgentSystemPrompt(
    {
      packet_version: "v1",
      identity: {
        agent_id: "agent-1",
        agent_name: "Helper"
      },
      persona_summary: "Helpful assistant",
      style_guidance: "Be concise",
      relationship_stance: {
        effective: "friendly",
        source: "relationship_memory"
      },
      language_behavior: {
        reply_language_target: "en",
        reply_language_source: "latest-user-message",
        same_thread_continuation_preferred: true
      }
    },
    "Keep answers grounded.",
    "How did this change over time?",
    [
      {
        memory_type: "episode",
        content: "The user switched from weekly planning to daily check-ins last month.",
        confidence: 0.88
      },
      {
        memory_type: "timeline",
        content: "The planning cadence gradually shifted over several weeks.",
        confidence: 0.84
      }
    ],
    [],
    null,
    null,
    "en"
  );
  expect(
    routeAwarePrompt.includes("When episode memory is present"),
    "Expected system prompt assembly to include episode-memory guidance."
  );
  expect(
    routeAwarePrompt.includes("When timeline memory is present"),
    "Expected system prompt assembly to include timeline-memory guidance."
  );
  const dynamicProfilePrompt = buildAgentSystemPrompt(
    {
      packet_version: "v1",
      identity: {
        agent_id: "agent-1",
        agent_name: "Helper"
      },
      persona_summary: "Helpful assistant",
      style_guidance: "Be concise",
      relationship_stance: {
        effective: "friendly",
        source: "relationship_memory"
      },
      language_behavior: {
        reply_language_target: "en",
        reply_language_source: "latest-user-message",
        same_thread_continuation_preferred: true
      }
    },
    "Keep answers grounded.",
    "Keep going with the same working style.",
    [
      {
        memory_type: "profile",
        content: "In this thread, keep the tone extra formal.",
        confidence: 0.9,
        semantic_layer: "dynamic_profile"
      }
    ],
    [],
    null,
    null,
    "en"
  );
  expect(
    dynamicProfilePrompt.includes("dynamic profile"),
    "Expected system prompt assembly to include dynamic-profile guidance."
  );
  expect(
    dynamicProfilePrompt.includes("Context assembly order for this turn:"),
    "Expected system prompt assembly to include explicit context assembly order."
  );
  expect(
    dynamicProfilePrompt.includes("2. dynamic_profile:"),
    "Expected system prompt assembly to place dynamic_profile in the context assembly order."
  );

  console.log(
    JSON.stringify(
      {
        status: "ok",
        semantic_targets: {
          profile: classifyStoredMemorySemanticTarget(profileMemory),
          preference: classifyStoredMemorySemanticTarget(preferenceMemory),
          relationship: classifyStoredMemorySemanticTarget(relationshipMemory),
          goal: classifyStoredMemorySemanticTarget(goalMemory),
          thread_local_profile:
            classifyStoredMemorySemanticTarget(threadLocalProfileMemory)
        },
        adapters: {
          static_profile_record: staticProfileRecord.profile_id,
          recalled_profile_type: recalledProfile.memory_type,
          recalled_relationship_type: recalledRelationship?.memory_type ?? null,
          dynamic_profile_record: dynamicProfileRecord?.profile_id ?? null,
          recalled_dynamic_profile_layer:
            recalledDynamicProfile?.semantic_layer ?? null,
          recalled_episode_type: recalledEpisode?.memory_type ?? null,
          recalled_timeline_type: recalledTimeline?.memory_type ?? null,
          planned_profile_id: plannedProfile.profile_id,
          planned_relationship_id: plannedRelationship.memory_id,
          planned_thread_focus: plannedThreadState.focus_mode,
          selected_routes: selectedRoutes
        },
        runtime_semantic_summary: semanticSummary,
        record_only_semantic_summary: recordOnlySemanticSummary,
        dynamic_only_semantic_summary: dynamicOnlySemanticSummary,
        assistant_metadata_semantic_summary: {
          primary_layer: getAssistantMemoryPrimarySemanticLayer(assistantMetadata),
          observed_layers: getAssistantMemoryObservedSemanticLayers(
            assistantMetadata
          )
        },
        assistant_metadata_pack: {
          pack_id: getAssistantMemoryScenarioPackId(assistantMetadata)
        },
        assistant_metadata_knowledge: {
          count: getAssistantKnowledgeCount(assistantMetadata)
        },
        assistant_metadata_thread_compaction: {
          summary_text: getAssistantCompactedThreadSummaryText(assistantMetadata)
        },
        assistant_metadata_namespace: {
          primary_layer: getAssistantMemoryNamespacePrimaryLayer(assistantMetadata)
        },
        runtime_debug_metadata: {
          pack_id: runtimeDebugMetadata.memory.pack?.pack_id ?? null,
          knowledge_count: runtimeDebugMetadata.knowledge.count,
          thread_compaction_summary_id:
            runtimeDebugMetadata.thread_compaction?.summary_id ?? null,
          namespace_primary_layer:
            runtimeDebugMetadata.memory_namespace?.primary_layer ?? null
        },
        scenario_memory_pack: {
          pack_id: scenarioMemoryPack.pack_id,
          preferred_routes: scenarioMemoryPack.preferred_routes,
          assembly_order: scenarioMemoryPack.assembly_order
        },
        system_prompt_thread_state: {
          includes_focus_mode: systemPrompt.includes(
            "focus_mode = Finish the onboarding checklist this week."
          ),
          includes_language_hint: systemPrompt.includes(
            "current_language_hint = en."
          ),
          includes_primary_layer: systemPrompt.includes(
            "primary_layer = thread_state"
          ),
          includes_scenario_memory_pack: systemPrompt.includes(
            "Active Scenario Memory Pack: companion"
          ),
          includes_knowledge_layer: systemPrompt.includes(
            "Relevant Knowledge Layer:"
          ),
          includes_thread_compaction: systemPrompt.includes(
            "Compacted thread summary:"
          ),
          includes_thread_compaction_focus: systemPrompt.includes(
            "Focus: Finish the onboarding checklist this week."
          ),
          includes_memory_namespace: systemPrompt.includes(
            "Active Memory Namespace: primary_layer = project."
          )
        },
        p2_regression_gate: {
          pack_metadata_ok: runtimeDebugMetadata.memory.pack?.pack_id === "companion",
          knowledge_metadata_ok: runtimeDebugMetadata.knowledge.count === 1,
          compaction_metadata_ok:
            runtimeDebugMetadata.thread_compaction?.summary_id ===
            compactedThreadSummary?.summary_id,
          namespace_metadata_ok:
            runtimeDebugMetadata.memory_namespace?.primary_layer === "project",
          prompt_namespace_ok: systemPrompt.includes(
            "Active Memory Namespace: primary_layer = project."
          ),
          prompt_compaction_ok: systemPrompt.includes(
            "Compacted thread summary:"
          )
        },
        system_prompt_route_guidance: {
          includes_episode_guidance: routeAwarePrompt.includes(
            "When episode memory is present"
          ),
          includes_timeline_guidance: routeAwarePrompt.includes(
            "When timeline memory is present"
          )
        },
        system_prompt_dynamic_profile: {
          includes_dynamic_profile_guidance: dynamicProfilePrompt.includes(
            "dynamic profile"
          ),
          includes_context_assembly_order: dynamicProfilePrompt.includes(
            "Context assembly order for this turn:"
          ),
          includes_dynamic_profile_order_slot: dynamicProfilePrompt.includes(
            "2. dynamic_profile:"
          )
        }
      },
      null,
      2
    )
  );
}

try {
  main();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Unknown memory upgrade harness failure."
  );
  process.exitCode = 1;
}
