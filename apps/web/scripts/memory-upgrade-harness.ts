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
  getAssistantKnowledgeScopeLayers,
  getAssistantThreadCrossLayerSurvivalMode,
  getAssistantThreadRetentionPolicyId,
  getAssistantMemoryNamespacePolicyBundleId,
  getAssistantMemoryNamespacePrimaryLayer,
  getAssistantMemoryNamespaceRetrievalFallbackMode,
  getAssistantMemoryNamespaceRouteGovernanceMode,
  getAssistantMemoryNamespaceWriteEscalationMode,
  getAssistantMemoryScenarioPackAssemblyEmphasis,
  getAssistantMemoryScenarioPackStrategyAssemblyOrder,
  getAssistantMemoryScenarioPackStrategyBundleId,
  getAssistantMemoryScenarioPackKnowledgeBudgetWeight,
  getAssistantMemoryScenarioPackKnowledgeRouteWeight,
  getAssistantMemoryScenarioPackId,
  getAssistantMemoryScenarioPackKnowledgePriorityLayer,
  getAssistantMemoryScenarioPackRouteInfluenceReason,
  getAssistantMemoryPrimarySemanticLayer
} from "@/lib/chat/assistant-message-metadata-read";
import {
  buildScenarioMemoryPackPromptSection,
  resolveActiveScenarioMemoryPack,
  resolveScenarioMemoryPackStrategy
} from "@/lib/chat/memory-packs";
import {
  buildKnowledgeSnapshot,
  buildKnowledgeRouteWeighting,
  buildKnowledgeSummary,
  filterKnowledgeByActiveNamespace,
  buildRuntimeKnowledgeSnippet,
  selectKnowledgeForPrompt
} from "@/lib/chat/memory-knowledge";
import {
  buildMemoryNamespaceScopedMetadata,
  isMemoryWithinNamespace,
  type ActiveRuntimeMemoryNamespace,
  resolveActiveMemoryNamespace,
  resolveRuntimeMemoryBoundary
} from "@/lib/chat/memory-namespace";
import {
  buildGenericPlannerMemoryInsertMetadata,
  buildRelationshipPlannerMemoryMetadata
} from "@/lib/chat/memory-write-metadata";
import { resolvePlannedMemoryWriteTarget } from "@/lib/chat/memory-write-targets";
import { buildRuntimeMemoryWriteRequestMetadata } from "@/lib/chat/runtime-preview-metadata";
import {
  buildCompactedThreadSummary,
  selectRetainedThreadCompactionSummary
} from "@/lib/chat/thread-compaction";
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
    scope: "user_global",
    metadata: {
      project_id: "project-1"
    }
  });
  const outOfNamespaceEpisodeMemory = createStoredMemory({
    id: "mem-episode-other",
    content: "This belongs to another project history track.",
    memory_type: "profile",
    category: "project_history",
    scope: "user_global",
    metadata: {
      project_id: "project-other"
    }
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
    confidence: recalledProfile.confidence,
    semantic_layer: "static_profile" as const
  };
  const promptRecalledEpisode = {
    memory_type: "episode" as const,
    content: "The onboarding checklist already started with the workspace setup step.",
    confidence: 0.93,
    semantic_layer: "memory_record" as const
  };
  const promptRecalledTimeline = {
    memory_type: "timeline" as const,
    content: "The next execution milestone is to finish the checklist review tomorrow.",
    confidence: 0.9,
    semantic_layer: "memory_record" as const
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
  const threadPrimaryNamespace: ActiveRuntimeMemoryNamespace = {
    namespace_id: "user:user-1|thread:thread-1",
    primary_layer: "thread",
    active_layers: ["user", "thread"],
    refs: [
      {
        layer: "user",
        entity_id: "user-1"
      },
      {
        layer: "thread",
        entity_id: "thread-1"
      }
    ],
    selection_reason: "session_and_knowledge_scope"
  };
  const threadBoundary = resolveRuntimeMemoryBoundary(threadPrimaryNamespace);
  expect(
    threadBoundary.retrieval_boundary === "thread" &&
      threadBoundary.write_boundary === "thread",
    "Expected thread-primary namespace to resolve a thread retrieval/write boundary in P4."
  );
  expect(
    threadBoundary.retrieval_route_order.join(",") ===
      "thread_state,profile,episode" &&
      threadBoundary.policy_bundle_id === "thread_strict_focus" &&
      threadBoundary.route_governance_mode === "thread_strict" &&
      threadBoundary.retrieval_fallback_mode === "strict_no_timeline" &&
      threadBoundary.write_escalation_mode === "thread_outward_escalation" &&
      threadBoundary.write_fallback_order.join(",") ===
        "thread,project,world,default",
    "Expected thread-primary namespace to expose explicit namespace policy facts in P6."
  );
  expect(
    threadBoundary.allow_timeline_fallback === false,
    "Expected thread-primary namespace to disable timeline fallback in P4."
  );
  expect(
    threadBoundary.profile_budget === 1 &&
      threadBoundary.episode_budget === 1 &&
      threadBoundary.timeline_budget === 0 &&
      threadBoundary.parallel_timeline_budget === 0,
    "Expected thread-primary namespace to expose a tighter recall budget in P4."
  );
  const threadScopedRoutes = selectMemoryRecallRoutes({
    latestUserMessage: "Can you remind me how this changed over time?",
    allowDistantFallback: true,
    hasThreadState: true,
    activeNamespace: threadPrimaryNamespace
  });
  expect(
    threadScopedRoutes.join(",") === "thread_state,profile,episode",
    "Expected thread-primary namespace to trim timeline fallback from recall routes in P4."
  );
  const projectPrimaryNamespace: ActiveRuntimeMemoryNamespace = {
    namespace_id: "user:user-1|project:project-1|world:world-1",
    primary_layer: "project",
    active_layers: ["user", "project", "world"],
    refs: [
      {
        layer: "user",
        entity_id: "user-1"
      },
      {
        layer: "project",
        entity_id: "project-1"
      },
      {
        layer: "world",
        entity_id: "world-1"
      }
    ],
    selection_reason: "session_and_knowledge_scope"
  };
  const projectBoundary = resolveRuntimeMemoryBoundary(projectPrimaryNamespace);
  expect(
    projectBoundary.profile_budget === 2 &&
      projectBoundary.episode_budget === 2 &&
      projectBoundary.timeline_budget === 1 &&
      projectBoundary.parallel_timeline_budget === 1,
    "Expected project-primary namespace to expose a multi-budget route profile in P5."
  );
  expect(
    projectBoundary.retrieval_route_order.join(",") ===
      "thread_state,profile,episode,timeline" &&
      projectBoundary.policy_bundle_id === "project_balanced_coordination" &&
      projectBoundary.route_governance_mode === "project_balanced" &&
      projectBoundary.retrieval_fallback_mode ===
        "parallel_timeline_allowed" &&
      projectBoundary.write_escalation_mode ===
        "project_world_escalation" &&
      projectBoundary.write_fallback_order.join(",") === "project,world,default",
    "Expected project-primary namespace to expose explicit namespace policy facts in P6."
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
  const defaultScenarioMemoryPack = resolveActiveScenarioMemoryPack();
  expect(
    defaultScenarioMemoryPack.pack_id === "companion",
    "Expected companion scenario memory pack to be the default active pack in P2-1."
  );
  expect(
    defaultScenarioMemoryPack.preferred_routes.join(",") ===
      "thread_state,profile,episode,timeline",
    "Expected companion scenario memory pack to preserve the P1 retrieval preference order."
  );
  const defaultScenarioMemoryPackPrompt = buildScenarioMemoryPackPromptSection({
    pack: defaultScenarioMemoryPack,
    replyLanguage: "en"
  });
  expect(
    defaultScenarioMemoryPackPrompt.includes(
      "Active Scenario Memory Pack: companion"
    ),
    "Expected scenario memory pack prompt section to expose the active companion pack."
  );
  const knowledgeSnapshot = buildKnowledgeSnapshot({
    snapshotId: "knowledge-snapshot-1",
    resourceId: "resource-1",
    scope: {
      workspace_id: "workspace-1",
      project_id: "project-1",
      world_id: "world-1"
    },
    title: "Onboarding checklist guide",
    summary: "The onboarding checklist should be completed in order and signed off by the project owner.",
    sourceKind: "project_document",
    capturedAt: "2026-03-23T00:00:00.000Z"
  });
  const worldKnowledgeSnapshot = buildKnowledgeSnapshot({
    snapshotId: "knowledge-snapshot-world",
    resourceId: "resource-world",
    scope: {
      workspace_id: "workspace-1",
      world_id: "world-1"
    },
    title: "Workspace operating norms",
    summary: "Across this workspace, important threads should keep a compact continuity anchor.",
    sourceKind: "workspace_note",
    capturedAt: "2026-03-23T00:00:00.000Z"
  });
  const worldMismatchedKnowledgeSnapshot = buildKnowledgeSnapshot({
    snapshotId: "knowledge-snapshot-2",
    resourceId: "resource-2",
    scope: {
      workspace_id: "workspace-1",
      project_id: "project-other"
    },
    title: "Other project brief",
    summary: "This belongs to a different project namespace and should be filtered out.",
    sourceKind: "project_document",
    capturedAt: "2026-03-23T00:00:00.000Z"
  });
  const generalKnowledgeSnapshot = buildKnowledgeSnapshot({
    snapshotId: "knowledge-snapshot-general",
    resourceId: "resource-general",
    scope: {
      workspace_id: "workspace-1"
    },
    title: "General reply policy",
    summary: "Prefer concise answers unless the user explicitly asks for depth.",
    sourceKind: "external_reference",
    capturedAt: "2026-03-23T00:00:00.000Z"
  });
  const runtimeKnowledge = [
    buildRuntimeKnowledgeSnippet(knowledgeSnapshot),
    buildRuntimeKnowledgeSnippet(worldKnowledgeSnapshot),
    buildRuntimeKnowledgeSnippet(generalKnowledgeSnapshot),
    buildRuntimeKnowledgeSnippet(worldMismatchedKnowledgeSnapshot)
  ];
  const activeMemoryNamespace = resolveActiveMemoryNamespace({
    userId: "user-1",
    agentId: "agent-1",
    threadId: "thread-1",
    relevantKnowledge: runtimeKnowledge
  });
  const scenarioMemoryPack = resolveActiveScenarioMemoryPack({
    activeNamespace: activeMemoryNamespace,
    relevantKnowledge: runtimeKnowledge
  });
  const scenarioMemoryPackStrategy =
    resolveScenarioMemoryPackStrategy(scenarioMemoryPack);
  expect(
    scenarioMemoryPack.pack_id === "project_ops",
    "Expected project-primary namespace to switch the active scenario memory pack to project_ops in P3."
  );
  expect(
    scenarioMemoryPackStrategy.strategy_bundle_id === "project_execution" &&
      scenarioMemoryPackStrategy.layer_budget_bundle.relationship_limit === 1 &&
      scenarioMemoryPackStrategy.layer_budget_bundle.static_profile_limit === 1 &&
      scenarioMemoryPackStrategy.layer_budget_bundle.memory_record_limit === 2 &&
      scenarioMemoryPackStrategy.assembly_layer_order.join(",") ===
        "memory_record,static_profile,relationship,dynamic_profile",
    "Expected project_ops scenario memory pack to resolve a reusable project_execution strategy bundle in P5."
  );
  expect(
    scenarioMemoryPack.preferred_routes.join(",") ===
      "thread_state,knowledge,episode,profile",
    "Expected project_ops scenario memory pack to prioritize knowledge retrieval in P3."
  );
  const scenarioMemoryPackPrompt = buildScenarioMemoryPackPromptSection({
    pack: scenarioMemoryPack,
    replyLanguage: "en"
  });
  expect(
    scenarioMemoryPackPrompt.includes("Active Scenario Memory Pack: project_ops"),
    "Expected project namespace scenario memory pack prompt section to expose project_ops in P3."
  );
  const knowledgeDrivenScenarioMemoryPack = resolveActiveScenarioMemoryPack({
    activeNamespace: {
      namespace_id: "user:user-1|world:world-1",
      primary_layer: "world",
      active_layers: ["user", "world"],
      refs: [
        {
          layer: "user",
          entity_id: "user-1"
        },
        {
          layer: "world",
          entity_id: "world-1"
        }
      ],
      selection_reason: "session_and_knowledge_scope"
    },
    relevantKnowledge: runtimeKnowledge
  });
  expect(
    knowledgeDrivenScenarioMemoryPack.pack_id === "project_ops",
    "Expected project-scoped knowledge to switch the active scenario memory pack to project_ops even under a world-primary namespace in P3."
  );
  expect(
    knowledgeDrivenScenarioMemoryPack.selection_reason ===
      "project_knowledge_priority",
    "Expected project-scoped knowledge to surface a project_knowledge_priority pack selection reason in P3."
  );
  const worldKnowledgeDrivenScenarioMemoryPack = resolveActiveScenarioMemoryPack({
    activeNamespace: {
      namespace_id: "user:user-1|world:world-1",
      primary_layer: "world",
      active_layers: ["user", "world"],
      refs: [
        {
          layer: "user",
          entity_id: "user-1"
        },
        {
          layer: "world",
          entity_id: "world-1"
        }
      ],
      selection_reason: "session_and_knowledge_scope"
    },
    relevantKnowledge: [
      buildRuntimeKnowledgeSnippet(worldKnowledgeSnapshot),
      buildRuntimeKnowledgeSnippet(generalKnowledgeSnapshot)
    ]
  });
  expect(
    worldKnowledgeDrivenScenarioMemoryPack.pack_id === "companion",
    "Expected world-only knowledge context to keep the companion pack active in P4."
  );
  expect(
    worldKnowledgeDrivenScenarioMemoryPack.selection_reason ===
      "world_knowledge_influence",
    "Expected world-scoped knowledge to surface a world_knowledge_influence pack selection reason in P4."
  );
  expect(
    worldKnowledgeDrivenScenarioMemoryPack.preferred_routes.join(",") ===
      "thread_state,knowledge,profile,episode,timeline",
    "Expected world-scoped knowledge to promote knowledge into the effective preferred routes in P4."
  );
  expect(
    worldKnowledgeDrivenScenarioMemoryPack.assembly_order.join(",") ===
      "thread_state,knowledge,dynamic_profile,static_profile,memory_record",
    "Expected world-scoped knowledge to promote knowledge into the effective assembly order in P4."
  );
  expect(
    scenarioMemoryPack.knowledge_route_weight === 1 &&
      scenarioMemoryPack.knowledge_budget_weight === 0.9 &&
      worldKnowledgeDrivenScenarioMemoryPack.knowledge_route_weight === 0.75 &&
      defaultScenarioMemoryPack.knowledge_route_weight === 0.3,
    "Expected knowledge-aware scenario packs to expose explicit route/budget weights in P5."
  );
  expect(
    isMemoryWithinNamespace({
      memory: episodeMemory,
      namespace: activeMemoryNamespace
    }),
    "Expected namespace helper to allow in-namespace project-scoped memory."
  );
  expect(
    !isMemoryWithinNamespace({
      memory: outOfNamespaceEpisodeMemory,
      namespace: activeMemoryNamespace
    }),
    "Expected namespace helper to reject out-of-namespace project-scoped memory."
  );
  const namespaceWriteMetadata = buildMemoryNamespaceScopedMetadata({
    namespace: activeMemoryNamespace
  });
  expect(
    namespaceWriteMetadata.project_id === "project-1",
    "Expected namespace-scoped write metadata to preserve project scope."
  );
  const genericPlannerMetadata = buildGenericPlannerMemoryInsertMetadata({
    reason: "Thread-local preference shift.",
    threshold: 0.8,
    recordTarget: "memory_record",
    canonicalMemoryType: "profile",
    namespaceMetadata: namespaceWriteMetadata
  });
  expect(
    genericPlannerMetadata.project_id === "project-1",
    "Expected generic planner metadata to carry namespace project scope."
  );
  const relationshipPlannerMetadata = buildRelationshipPlannerMemoryMetadata(
    {
      kind: "relationship_memory",
      memory_type: "relationship",
      relationship_key: "agent_nickname",
      relationship_scope: "user_agent",
      candidate_content: "小助手",
      reason: "The user explicitly proposed a stable nickname for this agent.",
      confidence: 0.96,
      source_turn_id: "msg-1",
      target_agent_id: "agent-1",
      target_thread_id: null,
      dedupe_key: "relationship.agent_nickname:小助手",
      write_mode: "upsert"
    },
    namespaceWriteMetadata
  );
  expect(
    relationshipPlannerMetadata.project_id === "project-1",
    "Expected relationship planner metadata to carry namespace project scope."
  );
  const namespaceAwareWriteTarget = resolvePlannedMemoryWriteTarget(
    {
      kind: "relationship_memory",
      memory_type: "relationship",
      relationship_key: "agent_nickname",
      relationship_scope: "user_agent",
      candidate_content: "小助手",
      reason: "The user explicitly proposed a stable nickname for this agent.",
      confidence: 0.96,
      source_turn_id: "msg-1",
      target_agent_id: "agent-1",
      target_thread_id: null,
      dedupe_key: "relationship.agent_nickname:小助手",
      write_mode: "upsert"
    },
    activeMemoryNamespace
  );
  expect(
    namespaceAwareWriteTarget.writeBoundary === "project",
    "Expected namespace-aware write target resolution to produce a project boundary."
  );
  expect(
    namespaceAwareWriteTarget.namespacePrimaryLayer === "project",
    "Expected namespace-aware write target resolution to expose the project primary layer."
  );
  expect(
    namespaceAwareWriteTarget.routedProjectId === "project-1" &&
      namespaceAwareWriteTarget.routedWorldId === null &&
      namespaceAwareWriteTarget.writePriorityLayer === "project" &&
      namespaceAwareWriteTarget.fallbackWriteBoundary === "world",
    "Expected namespace-aware write target resolution to prefer project writes first and keep world as fallback in P5."
  );
  const runtimeWritePreview = buildRuntimeMemoryWriteRequestMetadata(
    [
      {
        kind: "relationship_memory",
        memory_type: "relationship",
        relationship_key: "agent_nickname",
        relationship_scope: "user_agent",
        candidate_content: "小助手",
        reason: "The user explicitly proposed a stable nickname for this agent.",
        confidence: 0.96,
        source_turn_id: "msg-1",
        target_agent_id: "agent-1",
        target_thread_id: null,
        dedupe_key: "relationship.agent_nickname:小助手",
        write_mode: "upsert"
      }
    ],
    activeMemoryNamespace
  );
  expect(
    Array.isArray(runtimeWritePreview.runtime_memory_write_boundaries) &&
      runtimeWritePreview.runtime_memory_write_boundaries.includes("project"),
    "Expected runtime memory write preview metadata to expose project write boundary."
  );
  expect(
    runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
      ?.routed_project_id === "project-1" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.routed_world_id === null &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.write_priority_layer === "project" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.fallback_write_boundary === "world",
    "Expected runtime memory write preview metadata to expose project-first write routing in P5."
  );
  const applicableKnowledge = filterKnowledgeByActiveNamespace({
    knowledge: runtimeKnowledge,
    namespace: activeMemoryNamespace
  });
  const knowledgeSummary = buildKnowledgeSummary({
    knowledge: runtimeKnowledge,
    activeNamespace: activeMemoryNamespace
  });
  const selectedKnowledgeForPrompt = selectKnowledgeForPrompt({
    knowledge: runtimeKnowledge,
    activeNamespace: activeMemoryNamespace,
    activePackId: scenarioMemoryPack.pack_id,
    limit: 3
  });
  const companionSelection = selectKnowledgeForPrompt({
    knowledge: runtimeKnowledge,
    activeNamespace: activeMemoryNamespace,
    activePackId: defaultScenarioMemoryPack.pack_id,
    limit: 2
  });
  const worldPrimarySelection = selectKnowledgeForPrompt({
    knowledge: runtimeKnowledge,
    activeNamespace: {
      namespace_id: "user:user-1|world:world-1|project:project-1",
      primary_layer: "world",
      active_layers: ["user", "world", "project"],
      refs: [
        {
          layer: "user",
          entity_id: "user-1"
        },
        {
          layer: "world",
          entity_id: "world-1"
        },
        {
          layer: "project",
          entity_id: "project-1"
        }
      ]
    },
    limit: 2
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
  const droppedCompactedThreadSummary = selectRetainedThreadCompactionSummary({
    compactedThreadSummary: buildCompactedThreadSummary({
      threadState: {
        thread_id: "thread-closed",
        agent_id: "agent-1",
        state_version: 1,
        lifecycle_status: "closed",
        continuity_status: null,
        focus_mode: null,
        current_language_hint: null,
        recent_turn_window_size: null,
        last_user_message_id: null,
        updated_at: "2026-03-23T00:00:00.000Z"
      },
      recentTurnCount: 1,
      latestUserMessage: null
    })
  });
  expect(
    droppedCompactedThreadSummary === null,
    "Expected closed minimal thread compaction summary to be dropped by retention selection."
  );
  const pausedMinimalCompactedThreadSummary =
    selectRetainedThreadCompactionSummary({
      compactedThreadSummary: buildCompactedThreadSummary({
        threadState: {
          thread_id: "thread-paused",
          agent_id: "agent-1",
          state_version: 1,
          lifecycle_status: "paused",
          continuity_status: null,
          focus_mode: null,
          current_language_hint: "en",
          recent_turn_window_size: null,
          last_user_message_id: null,
          updated_at: "2026-03-23T00:00:00.000Z"
        },
        recentTurnCount: 1,
        latestUserMessage: null
      })
    });
  expect(
    pausedMinimalCompactedThreadSummary === null,
    "Expected paused minimal thread compaction summary to be dropped once retention budget leaves only a language hint in P4."
  );

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
        snippets: applicableKnowledge
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
    getAssistantMemoryScenarioPackId(assistantMetadata) === "project_ops",
    "Expected assistant metadata reader to expose the active scenario memory pack."
  );
  expect(
    getAssistantMemoryScenarioPackKnowledgePriorityLayer(assistantMetadata) ===
      "project",
    "Expected assistant metadata reader to expose project as the active pack knowledge-priority layer in P4."
  );
  expect(
    getAssistantMemoryScenarioPackAssemblyEmphasis(assistantMetadata) ===
      "knowledge_first",
    "Expected assistant metadata reader to expose knowledge_first assembly emphasis in P4."
  );
  expect(
    getAssistantMemoryScenarioPackRouteInfluenceReason(assistantMetadata) ===
      "project_namespace_bias",
    "Expected assistant metadata reader to expose the pack route influence reason in P4."
  );
  expect(
    getAssistantKnowledgeCount(assistantMetadata) === 3,
    "Expected assistant metadata reader to expose the namespace-filtered knowledge count."
  );
  expect(
    getAssistantKnowledgeScopeLayers(assistantMetadata).join(",") ===
      "project,world,general",
    "Expected assistant metadata reader to expose project/world knowledge scope layers in P3."
  );
  expect(
    getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
      "Focus: Finish the onboarding checklist this week."
    ),
    "Expected assistant metadata reader to expose the compacted thread summary text in P2."
  );
  expect(
    getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
      "Retention budget: 2."
    ),
    "Expected assistant metadata reader to expose the retention budget inside the compacted summary text in P4."
  );
  expect(
    !getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
      "Language hint: en."
    ),
    "Expected focus-anchor compaction summaries to prune current_language_hint from summary text once the retention budget is applied in P4."
  );
  expect(
    getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
      "Retention mode: focus_anchor."
    ),
    "Expected assistant metadata reader to expose the retention mode inside the compacted summary text."
  );
  expect(
    !getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
      "Latest user message:"
    ),
    "Expected focus-anchor compaction summaries to drop latest-user-message from retained sections."
  );
  expect(
    getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
      "Retention section order: focus_mode,continuity_status,current_language_hint."
    ) &&
      !getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "retained fields: focus_mode, continuity_status, current_language_hint"
      ),
    "Expected focus-anchor compaction summaries to expose current_language_hint only as a lower-priority section candidate, not as a retained field, in P5."
  );
  expect(
    getAssistantMemoryNamespacePrimaryLayer(assistantMetadata) === "project",
    "Expected assistant metadata reader to expose project as the primary namespace layer in P2."
  );
  expect(
    runtimeDebugMetadata.memory.pack?.pack_id === "project_ops",
    "Expected runtime debug metadata to expose the active scenario memory pack in P2."
  );
  expect(
    runtimeDebugMetadata.knowledge.count === 3,
    "Expected runtime debug metadata to expose the injected knowledge count in P2."
  );
  expect(
    Array.isArray(runtimeDebugMetadata.knowledge.scope_layers) &&
      runtimeDebugMetadata.knowledge.scope_layers.join(",") ===
        "project,world,general",
    "Expected runtime debug metadata to expose project/world knowledge scope layers in P3."
  );
  expect(
    selectedKnowledgeForPrompt.map((item) => item.title).join(",") ===
      "Onboarding checklist guide,Workspace operating norms,General reply policy",
    "Expected project_ops knowledge prompt selection to keep project/world first and then admit one general knowledge item in P3."
  );
  expect(
    companionSelection.map((item) => item.title).join(",") ===
      "Onboarding checklist guide,Workspace operating norms",
    "Expected companion knowledge prompt selection to keep a tighter budget than project_ops in P3."
  );
  expect(
    worldPrimarySelection.map((item) => item.title).join(",") ===
      "Workspace operating norms,Onboarding checklist guide",
    "Expected knowledge prompt selection to prioritize world-scoped knowledge first when the active namespace primary layer is world in P3."
  );
  const projectKnowledgeWeight = buildKnowledgeRouteWeighting({
    snippet: buildRuntimeKnowledgeSnippet(knowledgeSnapshot),
    activeNamespace: activeMemoryNamespace,
    activePackId: scenarioMemoryPack.pack_id
  });
  const worldKnowledgeWeight = buildKnowledgeRouteWeighting({
    snippet: buildRuntimeKnowledgeSnippet(worldKnowledgeSnapshot),
    activeNamespace: activeMemoryNamespace,
    activePackId: scenarioMemoryPack.pack_id
  });
  const generalKnowledgeWeight = buildKnowledgeRouteWeighting({
    snippet: buildRuntimeKnowledgeSnippet(generalKnowledgeSnapshot),
    activeNamespace: activeMemoryNamespace,
    activePackId: scenarioMemoryPack.pack_id
  });
  expect(
    projectKnowledgeWeight.total_weight > worldKnowledgeWeight.total_weight &&
      worldKnowledgeWeight.total_weight > generalKnowledgeWeight.total_weight,
    "Expected knowledge route weighting to rank project > world > general under a project_ops context in P5."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.summary_id ===
      compactedThreadSummary?.summary_id,
    "Expected runtime debug metadata to expose the compacted thread summary in P2."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.retention_mode === "focus_anchor",
    "Expected runtime debug metadata to expose the retention mode in P3."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.retention_reason ===
      "focus_mode_present",
    "Expected runtime debug metadata to expose the retention reason in P3."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.retention_policy_id ===
      "focus_continuity_anchor",
    "Expected runtime debug metadata to expose the retention policy id in P6."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.cross_layer_survival_mode ===
      "anchor_only",
    "Expected runtime debug metadata to expose the cross-layer survival mode in P6."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.retention_budget === 2,
    "Expected runtime debug metadata to expose the retention budget in P4."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.retention_layers?.join(",") ===
      "anchor",
    "Expected focus-anchor retention layering to keep only the anchor layer active in P5."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.retention_layer_budget?.anchor === 2 &&
      runtimeDebugMetadata.thread_compaction?.retention_layer_budget?.context ===
        0 &&
      runtimeDebugMetadata.thread_compaction?.retention_layer_budget?.window ===
        0,
    "Expected focus-anchor retention layer budget to allocate 2/0/0 across anchor/context/window in P5."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.retention_section_order?.join(",") ===
      "focus_mode,continuity_status,current_language_hint",
    "Expected focus-anchor retention section order to prioritize focus_mode, continuity_status, then current_language_hint in P5."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.retention_section_weights
      ?.focus_mode === 120 &&
      runtimeDebugMetadata.thread_compaction?.retention_section_weights
        ?.continuity_status === 110 &&
      runtimeDebugMetadata.thread_compaction?.retention_section_weights
        ?.current_language_hint === 30,
    "Expected focus-anchor retention section weights to prioritize focus_mode and continuity_status above current_language_hint in P5."
  );
  expect(
    Array.isArray(runtimeDebugMetadata.thread_compaction?.retained_fields) &&
      runtimeDebugMetadata.thread_compaction?.retained_fields.join(",") ===
        "focus_mode,continuity_status",
    "Expected focus-anchor retention budget to prune retained_fields down to focus_mode and continuity_status in P4."
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
    [
      promptRecalledProfile,
      {
        ...promptRecalledProfile,
        content: "The user prefers a little more directness when discussing schedules."
      },
      promptRecalledEpisode,
      promptRecalledTimeline,
      recalledRelationship
    ],
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
    systemPrompt.includes("Active Scenario Memory Pack: project_ops"),
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
    systemPrompt.includes("[project/project_document]") &&
      systemPrompt.includes("[world/workspace_note]"),
    "Expected system prompt assembly to distinguish project/world knowledge scopes in P3."
  );
  expect(
    !defaultScenarioMemoryPackPrompt.includes("General reply policy"),
    "Expected companion scenario memory pack prompt guidance to remain free of general-knowledge payloads in P3."
  );
  expect(
    !systemPrompt.includes("Other project brief"),
    "Expected system prompt assembly to filter knowledge outside the active namespace in P2."
  );
  expect(
    systemPrompt.includes("General reply policy"),
    "Expected project_ops system prompt assembly to admit one general knowledge item when the knowledge budget allows it in P3."
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
  expect(
    systemPrompt.includes("5. relationship memory: keep only a minimal relationship-grounding layer so it does not outweigh project execution context."),
    "Expected project_ops system prompt assembly to downshift relationship-memory consumption in P4."
  );
  expect(
    systemPrompt.includes("RM1:"),
    "Expected project_ops system prompt assembly to retain one relationship-memory slot in P4."
  );
  expect(
    !systemPrompt.includes("RM2:"),
    "Expected project_ops system prompt assembly to cap relationship-memory consumption at one slot in P4."
  );
  expect(
    systemPrompt.includes("SP1:"),
    "Expected project_ops system prompt assembly to retain one static-profile slot in P4."
  );
  expect(
    !systemPrompt.includes("SP2:"),
    "Expected project_ops system prompt assembly to cap static-profile consumption at one slot in P4."
  );
  expect(
    systemPrompt.includes(
      "4. memory_record: prioritize progress traces, event facts, and execution context."
    ),
    "Expected project_ops system prompt assembly to upshift memory-record consumption in P4."
  );
  expect(
    systemPrompt.includes("MR1 [timeline]:") &&
      systemPrompt.includes("MR2 [episode]:"),
    "Expected project_ops system prompt assembly to prioritize timeline before episode within the two memory-record slots in P4."
  );

  const companionSystemPrompt = buildAgentSystemPrompt(
    {
      packet_version: "v1",
      identity: {
        agent_id: "agent-1",
        agent_name: "Spark"
      },
      persona_summary: "Warm companion",
      style_guidance: "Stay steady",
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
    "Keep continuity.",
    "Thanks for sticking with me.",
    [
      promptRecalledProfile,
      {
        ...promptRecalledProfile,
        content: "The user prefers a little more directness when discussing schedules."
      },
      promptRecalledEpisode,
      promptRecalledTimeline,
      recalledRelationship,
      {
        ...recalledRelationship,
        content: "The user usually treats this agent like a steady teammate."
      }
    ],
    [buildRuntimeKnowledgeSnippet(worldKnowledgeSnapshot)],
    compactedThreadSummary,
    {
      namespace_id: "user:user-1|world:world-1",
      primary_layer: "world",
      active_layers: ["user", "world"],
      refs: [
        { layer: "user", entity_id: "user-1" },
        { layer: "world", entity_id: "world-1" }
      ],
      selection_reason: "session_and_knowledge_scope"
    },
    "en",
    undefined,
    "",
    {
      thread_id: "thread-2",
      agent_id: "agent-1",
      state_version: 1,
      lifecycle_status: "active",
      focus_mode: null,
      current_language_hint: "en",
      recent_turn_window_size: 4,
      continuity_status: "warm",
      last_user_message_id: "msg-10",
      last_assistant_message_id: "msg-11",
      updated_at: "2026-03-23T00:00:00.000Z"
    }
  );
  expect(
    companionSystemPrompt.includes(
      "5. relationship memory: use as a continuity and relationship-grounding support layer."
    ),
    "Expected companion system prompt assembly to preserve stronger relationship-memory consumption in P4."
  );
  expect(
    companionSystemPrompt.includes("RM2:"),
    "Expected companion system prompt assembly to allow two relationship-memory slots in P4."
  );
  expect(
    companionSystemPrompt.includes("SP2:"),
    "Expected companion system prompt assembly to allow two static-profile slots in P4."
  );
  expect(
    companionSystemPrompt.includes(
      "4. memory_record: keep only a minimal event-facts support layer and favor the most direct episode cue first."
    ),
    "Expected companion system prompt assembly to downshift memory-record consumption in P4."
  );
  expect(
    companionSystemPrompt.includes("MR1 [episode]:") &&
      !companionSystemPrompt.includes("MR2 [timeline]:") &&
      !companionSystemPrompt.includes("MR1 [timeline]:"),
    "Expected companion system prompt assembly to cap memory-record consumption at one slot and prefer episode over timeline in P4."
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
  const projectOpsDynamicVsRecordPrompt = buildAgentSystemPrompt(
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
    "What should I prioritize next in this onboarding flow?",
    [
      {
        memory_type: "profile",
        content: "In this thread, keep the tone extra formal.",
        confidence: 0.9,
        semantic_layer: "dynamic_profile"
      },
      promptRecalledEpisode
    ],
    runtimeKnowledge,
    compactedThreadSummary,
    activeMemoryNamespace,
    "en"
  );
  expect(
    !projectOpsDynamicVsRecordPrompt.includes("2. dynamic_profile:"),
    "Expected project_ops system prompt assembly to suppress dynamic_profile when memory_record is already carrying execution context in P4."
  );
  const companionDynamicVsRecordPrompt = buildAgentSystemPrompt(
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
    "What should I prioritize next in this onboarding flow?",
    [
      {
        memory_type: "profile",
        content: "In this thread, keep the tone extra formal.",
        confidence: 0.9,
        semantic_layer: "dynamic_profile"
      },
      promptRecalledEpisode
    ],
    [buildRuntimeKnowledgeSnippet(worldKnowledgeSnapshot)],
    compactedThreadSummary,
    {
      namespace_id: "user:user-1|world:world-1",
      primary_layer: "world",
      active_layers: ["user", "world"],
      refs: [
        { layer: "user", entity_id: "user-1" },
        { layer: "world", entity_id: "world-1" }
      ],
      selection_reason: "session_and_knowledge_scope"
    },
    "en"
  );
  expect(
    companionDynamicVsRecordPrompt.includes("2. dynamic_profile:"),
    "Expected companion system prompt assembly to preserve dynamic_profile alongside memory_record in P4."
  );
  expect(
    systemPrompt.indexOf("4. memory_record:") <
      systemPrompt.indexOf("3. static_profile:"),
    "Expected project_execution strategy bundle to place memory_record ahead of static_profile in P5."
  );
  expect(
    companionSystemPrompt.indexOf("5. relationship memory:") <
      companionSystemPrompt.indexOf("3. static_profile:") &&
      companionSystemPrompt.indexOf("3. static_profile:") <
        companionSystemPrompt.indexOf("4. memory_record:"),
    "Expected companion_continuity strategy bundle to place relationship grounding ahead of static_profile and memory_record in P5."
  );

  const p5RegressionGateChecks = {
    namespace_multi_budget_routing_ok:
      threadBoundary.parallel_timeline_budget === 0 &&
      projectBoundary.parallel_timeline_budget === 1 &&
      threadBoundary.policy_bundle_id === "thread_strict_focus" &&
      projectBoundary.policy_bundle_id === "project_balanced_coordination" &&
      threadBoundary.route_governance_mode === "thread_strict" &&
      projectBoundary.route_governance_mode === "project_balanced" &&
      threadBoundary.retrieval_fallback_mode === "strict_no_timeline" &&
      projectBoundary.write_escalation_mode ===
        "project_world_escalation" &&
      Array.isArray(threadBoundary.retrieval_route_order) &&
      threadBoundary.retrieval_route_order.join(",") ===
        "thread_state,profile,episode" &&
      Array.isArray(projectBoundary.write_fallback_order) &&
      projectBoundary.write_fallback_order.join(",") ===
        "project,world,default",
    retention_layering_v3_ok:
      runtimeDebugMetadata.thread_compaction?.retention_layers?.join(",") ===
        "anchor" &&
      runtimeDebugMetadata.thread_compaction?.retention_layer_budget?.anchor ===
        2 &&
      runtimeDebugMetadata.thread_compaction?.retention_layer_budget?.context ===
        0 &&
      runtimeDebugMetadata.thread_compaction?.retention_layer_budget?.window ===
        0 &&
      runtimeDebugMetadata.thread_compaction?.retention_section_order?.join(
        ","
      ) === "focus_mode,continuity_status,current_language_hint" &&
      runtimeDebugMetadata.thread_compaction?.retention_section_weights
        ?.focus_mode === 120 &&
      runtimeDebugMetadata.thread_compaction?.retention_section_weights
        ?.continuity_status === 110 &&
      runtimeDebugMetadata.thread_compaction?.retention_section_weights
        ?.current_language_hint === 30 &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Retention layers: anchor."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Retention section order: focus_mode,continuity_status,current_language_hint."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Retention section weights: focus_mode=120,continuity_status=110,current_language_hint=30."
      ),
    knowledge_route_weighting_v3_ok:
      scenarioMemoryPack.knowledge_priority_layer === "project" &&
      scenarioMemoryPack.assembly_emphasis === "knowledge_first" &&
      scenarioMemoryPack.knowledge_route_weight === 1 &&
      scenarioMemoryPack.knowledge_budget_weight === 0.9 &&
      scenarioMemoryPack.route_influence_reason ===
        "project_namespace_bias" &&
      projectKnowledgeWeight.total_weight > worldKnowledgeWeight.total_weight &&
      worldKnowledgeWeight.total_weight > generalKnowledgeWeight.total_weight &&
      systemPrompt.includes(
        "Current knowledge route weight = 1; knowledge budget weight = 0.9."
      ),
    strategy_metadata_consistency_v3_ok:
      getAssistantMemoryScenarioPackId(assistantMetadata) ===
        scenarioMemoryPack.pack_id &&
      getAssistantMemoryScenarioPackKnowledgePriorityLayer(
        assistantMetadata
      ) === scenarioMemoryPack.knowledge_priority_layer &&
      getAssistantMemoryScenarioPackAssemblyEmphasis(assistantMetadata) ===
        scenarioMemoryPack.assembly_emphasis &&
      getAssistantMemoryScenarioPackKnowledgeRouteWeight(assistantMetadata) ===
        scenarioMemoryPack.knowledge_route_weight &&
      getAssistantMemoryScenarioPackKnowledgeBudgetWeight(
        assistantMetadata
      ) === scenarioMemoryPack.knowledge_budget_weight &&
      getAssistantMemoryScenarioPackRouteInfluenceReason(assistantMetadata) ===
        scenarioMemoryPack.route_influence_reason &&
      getAssistantMemoryScenarioPackStrategyBundleId(assistantMetadata) ===
        scenarioMemoryPackStrategy.strategy_bundle_id &&
      getAssistantMemoryScenarioPackStrategyAssemblyOrder(
        assistantMetadata
      ).join(",") ===
        scenarioMemoryPackStrategy.assembly_layer_order.join(",") &&
      runtimeDebugMetadata.memory.pack?.pack_id === scenarioMemoryPack.pack_id &&
      runtimeDebugMetadata.memory.pack?.knowledge_priority_layer ===
        scenarioMemoryPack.knowledge_priority_layer &&
      runtimeDebugMetadata.memory.pack?.assembly_emphasis ===
        scenarioMemoryPack.assembly_emphasis &&
      runtimeDebugMetadata.memory.pack?.knowledge_route_weight ===
        scenarioMemoryPack.knowledge_route_weight &&
      runtimeDebugMetadata.memory.pack?.knowledge_budget_weight ===
        scenarioMemoryPack.knowledge_budget_weight &&
      runtimeDebugMetadata.memory.pack?.route_influence_reason ===
        scenarioMemoryPack.route_influence_reason &&
      runtimeDebugMetadata.memory.pack?.strategy_bundle_id ===
        scenarioMemoryPackStrategy.strategy_bundle_id &&
      runtimeDebugMetadata.memory.pack?.strategy_assembly_order?.join(",") ===
        scenarioMemoryPackStrategy.assembly_layer_order.join(","),
    scenario_pack_strategy_v3_ok:
      scenarioMemoryPackStrategy.strategy_bundle_id === "project_execution" &&
      scenarioMemoryPackStrategy.assembly_layer_order.join(",") ===
        "memory_record,static_profile,relationship,dynamic_profile" &&
      systemPrompt.includes("RM1:") &&
      !systemPrompt.includes("RM2:") &&
      systemPrompt.includes("SP1:") &&
      !systemPrompt.includes("SP2:") &&
      systemPrompt.includes(
        "Current strategy bundle = project_execution; relationship/static_profile/memory_record budget = 1/1/2."
      ) &&
      systemPrompt.includes(
        "Current strategy assembly order = memory_record -> static_profile -> relationship -> dynamic_profile."
      ) &&
      systemPrompt.indexOf("4. memory_record:") <
        systemPrompt.indexOf("3. static_profile:")
  } as const;
  const p5RegressionGateFailedChecks = Object.entries(
    p5RegressionGateChecks
  ).flatMap(([check, passed]) => (passed ? [] : [check]));
  const p5RegressionGate = {
    ...p5RegressionGateChecks,
    checks_passed:
      Object.keys(p5RegressionGateChecks).length -
      p5RegressionGateFailedChecks.length,
    checks_total: Object.keys(p5RegressionGateChecks).length,
    failed_checks: p5RegressionGateFailedChecks,
    all_green: p5RegressionGateFailedChecks.length === 0,
    close_candidate: p5RegressionGateFailedChecks.length === 0
  } as const;

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
          selected_routes: selectedRoutes,
          thread_scoped_routes: threadScopedRoutes,
          thread_boundary_budget: {
            profile: threadBoundary.profile_budget,
            episode: threadBoundary.episode_budget,
            timeline: threadBoundary.timeline_budget,
            parallel_timeline: threadBoundary.parallel_timeline_budget
          },
          project_boundary_budget: {
            profile: projectBoundary.profile_budget,
            episode: projectBoundary.episode_budget,
            timeline: projectBoundary.timeline_budget,
            parallel_timeline: projectBoundary.parallel_timeline_budget
          },
          namespace_route_orders: {
            thread_retrieval: threadBoundary.retrieval_route_order,
            thread_write: threadBoundary.write_fallback_order,
            project_retrieval: projectBoundary.retrieval_route_order,
            project_write: projectBoundary.write_fallback_order
          },
          namespace_policy: {
            thread_bundle: threadBoundary.policy_bundle_id,
            thread_mode: threadBoundary.route_governance_mode,
            thread_retrieval_fallback:
              threadBoundary.retrieval_fallback_mode,
            thread_write_escalation: threadBoundary.write_escalation_mode,
            project_bundle: projectBoundary.policy_bundle_id,
            project_mode: projectBoundary.route_governance_mode,
            project_retrieval_fallback:
              projectBoundary.retrieval_fallback_mode,
            project_write_escalation:
              projectBoundary.write_escalation_mode
          }
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
          pack_id: getAssistantMemoryScenarioPackId(assistantMetadata),
          knowledge_priority_layer:
            getAssistantMemoryScenarioPackKnowledgePriorityLayer(
              assistantMetadata
            ),
          assembly_emphasis:
            getAssistantMemoryScenarioPackAssemblyEmphasis(assistantMetadata),
          knowledge_route_weight:
            getAssistantMemoryScenarioPackKnowledgeRouteWeight(
              assistantMetadata
            ),
          knowledge_budget_weight:
            getAssistantMemoryScenarioPackKnowledgeBudgetWeight(
              assistantMetadata
            ),
          strategy_bundle_id:
            getAssistantMemoryScenarioPackStrategyBundleId(assistantMetadata),
          strategy_assembly_order:
            getAssistantMemoryScenarioPackStrategyAssemblyOrder(
              assistantMetadata
            ),
          route_influence_reason:
            getAssistantMemoryScenarioPackRouteInfluenceReason(
              assistantMetadata
            )
        },
        assistant_metadata_knowledge: {
          count: getAssistantKnowledgeCount(assistantMetadata),
          scope_layers: getAssistantKnowledgeScopeLayers(assistantMetadata)
        },
        filtered_knowledge_summary: knowledgeSummary,
        assistant_metadata_thread_compaction: {
          summary_text: getAssistantCompactedThreadSummaryText(assistantMetadata),
          retention_policy_id:
            getAssistantThreadRetentionPolicyId(assistantMetadata),
          cross_layer_survival_mode:
            getAssistantThreadCrossLayerSurvivalMode(assistantMetadata)
        },
        assistant_metadata_namespace: {
          primary_layer: getAssistantMemoryNamespacePrimaryLayer(assistantMetadata),
          policy_bundle_id:
            getAssistantMemoryNamespacePolicyBundleId(assistantMetadata),
          route_governance_mode:
            getAssistantMemoryNamespaceRouteGovernanceMode(assistantMetadata),
          retrieval_fallback_mode:
            getAssistantMemoryNamespaceRetrievalFallbackMode(assistantMetadata),
          write_escalation_mode:
            getAssistantMemoryNamespaceWriteEscalationMode(assistantMetadata)
        },
        runtime_debug_metadata: {
          pack_id: runtimeDebugMetadata.memory.pack?.pack_id ?? null,
          pack_knowledge_priority_layer:
            runtimeDebugMetadata.memory.pack?.knowledge_priority_layer ?? null,
          pack_assembly_emphasis:
            runtimeDebugMetadata.memory.pack?.assembly_emphasis ?? null,
          pack_knowledge_route_weight:
            runtimeDebugMetadata.memory.pack?.knowledge_route_weight ?? null,
          pack_knowledge_budget_weight:
            runtimeDebugMetadata.memory.pack?.knowledge_budget_weight ?? null,
          pack_strategy_bundle_id:
            runtimeDebugMetadata.memory.pack?.strategy_bundle_id ?? null,
          pack_strategy_assembly_order:
            runtimeDebugMetadata.memory.pack?.strategy_assembly_order ?? [],
          pack_route_influence_reason:
            runtimeDebugMetadata.memory.pack?.route_influence_reason ?? null,
          knowledge_count: runtimeDebugMetadata.knowledge.count,
          thread_compaction_summary_id:
            runtimeDebugMetadata.thread_compaction?.summary_id ?? null,
          namespace_primary_layer:
            runtimeDebugMetadata.memory_namespace?.primary_layer ?? null,
          namespace_policy_bundle_id:
            runtimeDebugMetadata.memory_namespace?.policy_bundle_id ?? null,
          namespace_route_governance_mode:
            runtimeDebugMetadata.memory_namespace?.route_governance_mode ?? null,
          namespace_retrieval_fallback_mode:
            runtimeDebugMetadata.memory_namespace?.retrieval_fallback_mode ??
            null,
          namespace_write_escalation_mode:
            runtimeDebugMetadata.memory_namespace?.write_escalation_mode ?? null
        },
        scenario_memory_pack: {
          pack_id: scenarioMemoryPack.pack_id,
          preferred_routes: scenarioMemoryPack.preferred_routes,
          assembly_order: scenarioMemoryPack.assembly_order,
          strategy_bundle_id: scenarioMemoryPackStrategy.strategy_bundle_id,
          knowledge_priority_layer:
            scenarioMemoryPack.knowledge_priority_layer,
          assembly_emphasis: scenarioMemoryPack.assembly_emphasis,
          knowledge_route_weight: scenarioMemoryPack.knowledge_route_weight,
          knowledge_budget_weight: scenarioMemoryPack.knowledge_budget_weight,
          route_influence_reason:
            scenarioMemoryPack.route_influence_reason
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
            "Active Scenario Memory Pack: project_ops"
          ),
          includes_pack_assembly_emphasis: systemPrompt.includes(
            "Current assembly emphasis: project knowledge enters context assembly first."
          ),
          includes_pack_route_influence_reason: systemPrompt.includes(
            "Current route influence reason: project_namespace_bias."
          ),
          includes_knowledge_layer: systemPrompt.includes(
            "Relevant Knowledge Layer:"
          ),
          excludes_out_of_namespace_knowledge: !systemPrompt.includes(
            "Other project brief"
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
        p3_regression_gate: {
          namespace_recall_ok:
            !systemPrompt.includes("Other project brief") &&
            runtimeDebugMetadata.memory_namespace?.primary_layer === "project",
          namespace_write_boundary_ok:
            Array.isArray(runtimeWritePreview.runtime_memory_write_boundaries) &&
            runtimeWritePreview.runtime_memory_write_boundaries.includes(
              "project"
            ),
          retention_strategy_ok:
      runtimeDebugMetadata.thread_compaction?.retention_mode ===
        "focus_anchor" &&
      runtimeDebugMetadata.thread_compaction?.retention_reason ===
        "focus_mode_present" &&
      runtimeDebugMetadata.thread_compaction?.retention_policy_id ===
        "focus_continuity_anchor" &&
      runtimeDebugMetadata.thread_compaction?.cross_layer_survival_mode ===
        "anchor_only" &&
      !getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Latest user message:"
      ),
          knowledge_scope_ok:
            knowledgeSummary.count === 3 &&
            knowledgeSummary.scope_layers.join(",") ===
              "project,world,general" &&
            selectedKnowledgeForPrompt.map((item) => item.title).join(",") ===
              "Onboarding checklist guide,Workspace operating norms,General reply policy" &&
            companionSelection.map((item) => item.title).join(",") ===
              "Onboarding checklist guide,Workspace operating norms" &&
            worldPrimarySelection.map((item) => item.title).join(",") ===
              "Workspace operating norms,Onboarding checklist guide" &&
            systemPrompt.includes("General reply policy") &&
            !defaultScenarioMemoryPackPrompt.includes("General reply policy"),
          scenario_pack_ok:
            runtimeDebugMetadata.memory.pack?.pack_id === "project_ops" &&
            getAssistantMemoryScenarioPackId(assistantMetadata) ===
              "project_ops" &&
            systemPrompt.includes("Active Scenario Memory Pack: project_ops")
        },
        p4_regression_gate: {
          namespace_boundary_v2_ok:
            threadBoundary.timeline_budget === 0 &&
            Array.isArray(threadScopedRoutes) &&
            threadScopedRoutes.join(",") ===
              "thread_state,profile,episode" &&
            runtimeWritePreview.runtime_memory_write_boundaries?.includes(
              "project"
            ) === true,
          retention_budget_v2_ok:
            runtimeDebugMetadata.thread_compaction?.retention_budget === 2 &&
            runtimeDebugMetadata.thread_compaction?.retained_fields?.join(
              ","
            ) === "focus_mode,continuity_status" &&
            !getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
              "Language hint: en."
            ),
          knowledge_route_influence_v2_ok:
            scenarioMemoryPack.knowledge_priority_layer === "project" &&
            scenarioMemoryPack.assembly_emphasis === "knowledge_first" &&
            scenarioMemoryPack.route_influence_reason ===
              "project_namespace_bias" &&
            systemPrompt.includes(
              "Current route influence reason: project_namespace_bias."
            ),
          scenario_pack_consumption_v2_ok:
            systemPrompt.includes("RM1:") &&
            !systemPrompt.includes("RM2:") &&
            companionSystemPrompt.includes("RM2:") &&
            systemPrompt.includes("SP1:") &&
            !systemPrompt.includes("SP2:") &&
            companionSystemPrompt.includes("SP2:") &&
            systemPrompt.includes("MR1 [timeline]:") &&
            companionSystemPrompt.includes("MR1 [episode]:") &&
            !projectOpsDynamicVsRecordPrompt.includes("2. dynamic_profile:") &&
            companionDynamicVsRecordPrompt.includes("2. dynamic_profile:"),
        },
        p5_regression_gate: p5RegressionGate,
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
