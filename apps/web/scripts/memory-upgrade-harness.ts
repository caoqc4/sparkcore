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
import {
  buildAgentSystemPrompt,
  buildRoleCoreMemoryCloseNoteArtifactPrompt,
  buildRoleCoreMemoryCloseNoteArchivePrompt,
  buildRoleCoreMemoryCloseNoteHandoffPrompt,
  buildRoleCoreMemoryCloseNoteRecordPrompt,
  buildRoleCoreMemoryCloseNoteOutputPrompt,
  buildVisibleMemoryRecord
} from "@/lib/chat/runtime";
import {
  buildRoleCoreMemoryCloseNoteArtifact,
  buildRoleCoreMemoryCloseNoteArchive,
  buildRoleCoreMemoryCloseNoteHandoffPacket,
  buildRoleCoreMemoryCloseNoteOutput,
  buildRoleCoreMemoryCloseNoteRecord,
  withRoleCoreMemoryHandoff
} from "@/lib/chat/role-core";
import { buildAssistantMessageMetadata } from "@/lib/chat/assistant-message-metadata";
import { buildRuntimeDebugMetadata } from "@/lib/chat/runtime-debug-metadata";
import {
  getAssistantMemoryObservedSemanticLayers,
  getAssistantCompactedThreadSummaryText,
  getAssistantKnowledgeCount,
  getAssistantKnowledgeBudgetCoordinationMode,
  getAssistantKnowledgeGovernanceAlignmentMode,
  getAssistantKnowledgeGovernanceConvergenceDigest,
  getAssistantKnowledgeGovernanceConsistencyMode,
  getAssistantKnowledgeGovernanceCoordinationSummary,
  getAssistantKnowledgeGovernanceCoordinationDigest,
  getAssistantKnowledgeGovernanceCoordinationModeV9,
  getAssistantKnowledgeGovernanceConsolidationDigest,
  getAssistantKnowledgeGovernanceConsolidationMode,
  getAssistantKnowledgeGovernanceCoordinationReuseMode,
  getAssistantKnowledgeGovernanceFabricDigest,
  getAssistantKnowledgeGovernanceFabricPlaneDigest,
  getAssistantKnowledgeGovernanceFabricPlaneMode,
  getAssistantKnowledgeGovernanceFabricPlaneReuseMode,
  getAssistantKnowledgeGovernanceFabricMode,
  getAssistantKnowledgeGovernanceFabricReuseMode,
  getAssistantKnowledgeGovernancePlaneDigest,
  getAssistantKnowledgeGovernancePlaneMode,
  getAssistantKnowledgeGovernancePlaneReuseMode,
  getAssistantKnowledgeGovernanceUnificationDigest,
  getAssistantKnowledgeGovernanceUnificationMode,
  getAssistantKnowledgeSourceBudgetAlignmentSummary,
  getAssistantKnowledgeSourceBudgetCoordinationSummary,
  getAssistantKnowledgeSourceBudgetConsolidationSummary,
  getAssistantKnowledgeSourceBudgetGovernanceFabricSummary,
  getAssistantKnowledgeSourceBudgetGovernanceFabricPlaneSummary,
  getAssistantKnowledgeSourceBudgetGovernancePlaneSummary,
  getAssistantKnowledgeSelectionRuntimeCoordinationSummary,
  getAssistantKnowledgeSourceBudgetUnificationSummary,
  getAssistantKnowledgeSourceGovernanceSummary,
  getAssistantKnowledgeScopeLayers,
  getAssistantThreadCrossLayerSurvivalMode,
  getAssistantThreadKeepDropConvergenceSummary,
  getAssistantThreadKeepDropUnificationSummary,
  getAssistantThreadKeepDropGovernanceSummary,
  getAssistantThreadLifecycleAlignmentMode,
  getAssistantThreadLifecycleConvergenceDigest,
  getAssistantThreadLifecycleUnificationDigest,
  getAssistantThreadLifecycleUnificationMode,
  getAssistantThreadLifecycleConsolidationDigest,
  getAssistantThreadLifecycleConsolidationMode,
  getAssistantThreadLifecycleCoordinationAlignmentMode,
  getAssistantThreadLifecycleCoordinationDigest,
  getAssistantThreadLifecycleCoordinationReuseMode,
  getAssistantThreadLifecycleCoordinationSummary,
  getAssistantThreadLifecycleGovernancePlaneAlignmentMode,
  getAssistantThreadLifecycleGovernancePlaneDigest,
  getAssistantThreadLifecycleGovernancePlaneReuseMode,
  getAssistantThreadLifecycleGovernanceFabricAlignmentMode,
  getAssistantThreadLifecycleGovernanceFabricDigest,
  getAssistantThreadLifecycleGovernanceFabricReuseMode,
  getAssistantThreadLifecycleGovernanceFabricPlaneAlignmentMode,
  getAssistantThreadLifecycleGovernanceFabricPlaneDigest,
  getAssistantThreadLifecycleGovernanceFabricPlaneReuseMode,
  getAssistantThreadLifecycleGovernanceDigest,
  getAssistantThreadRetentionDecisionGroup,
  getAssistantThreadKeepDropConsolidationSummary,
  getAssistantThreadKeepDropConsolidationCoordinationSummary,
  getAssistantThreadKeepDropGovernanceFabricSummary,
  getAssistantThreadKeepDropGovernanceFabricPlaneSummary,
  getAssistantThreadKeepDropGovernancePlaneSummary,
  getAssistantThreadKeepDropRuntimeCoordinationSummary,
  getAssistantThreadRetentionPolicyId,
  getAssistantThreadSurvivalConsistencyMode,
  getAssistantThreadSurvivalRationale,
  getAssistantMemoryNamespacePolicyBundleId,
  getAssistantMemoryNamespaceGovernanceConvergenceDigestId,
  getAssistantMemoryNamespaceGovernanceConvergenceSummary,
  getAssistantMemoryNamespacePolicyCoordinationSummary,
  getAssistantMemoryNamespacePolicyDigestId,
  getAssistantMemoryNamespacePrimaryLayer,
  getAssistantMemoryNamespaceGovernanceConsolidationDigestId,
  getAssistantMemoryNamespaceGovernanceConsolidationSummary,
  getAssistantMemoryNamespaceRuntimeConsolidationMode,
  getAssistantMemoryNamespaceUnifiedGovernanceConsolidationDigestId,
  getAssistantMemoryNamespaceUnifiedGovernanceConsolidationSummary,
  getAssistantMemoryNamespaceUnifiedConsolidationAlignmentMode,
  getAssistantMemoryNamespaceUnifiedConsolidationReuseMode,
  getAssistantMemoryNamespaceUnifiedConsolidationCoordinationSummary,
  getAssistantMemoryNamespaceUnifiedConsolidationConsistencyMode,
  getAssistantMemoryNamespaceRetrievalWriteDigestAlignment,
  getAssistantMemoryNamespaceUnifiedGovernanceRuntimeDigestId,
  getAssistantMemoryNamespaceUnifiedGovernanceRuntimeSummary,
  getAssistantMemoryNamespaceUnifiedRuntimeAlignmentMode,
  getAssistantMemoryNamespaceUnifiedRuntimeReuseMode,
  getAssistantMemoryNamespaceGovernancePlaneRuntimeDigestId,
  getAssistantMemoryNamespaceGovernancePlaneRuntimeSummary,
  getAssistantMemoryNamespaceGovernancePlaneAlignmentMode,
  getAssistantMemoryNamespaceGovernancePlaneReuseMode,
  getAssistantMemoryNamespaceGovernanceFabricRuntimeDigestId,
  getAssistantMemoryNamespaceGovernanceFabricRuntimeSummary,
  getAssistantMemoryNamespaceGovernanceFabricAlignmentMode,
  getAssistantMemoryNamespaceGovernanceFabricReuseMode,
  getAssistantMemoryNamespaceGovernanceFabricPlaneDigestId,
  getAssistantMemoryNamespaceGovernanceFabricPlaneSummary,
  getAssistantMemoryNamespaceGovernanceFabricPlaneAlignmentMode,
  getAssistantMemoryNamespaceGovernanceFabricPlaneReuseMode,
  getAssistantMemoryNamespaceRetrievalFallbackMode,
  getAssistantMemoryNamespaceRouteGovernanceMode,
  getAssistantMemoryNamespaceGovernanceConsistencyMode,
  getAssistantMemoryNamespaceWriteEscalationMode,
  getAssistantMemoryScenarioPackAssemblyEmphasis,
  getAssistantMemoryScenarioPackStrategyAssemblyOrder,
  getAssistantMemoryScenarioPackStrategyBundleId,
  getAssistantMemoryScenarioPackKnowledgeBudgetWeight,
  getAssistantMemoryScenarioPackKnowledgeRouteWeight,
  getAssistantMemoryScenarioPackId,
  getAssistantMemoryScenarioPackKnowledgePriorityLayer,
  getAssistantMemoryScenarioPackRouteInfluenceReason,
  getAssistantMemoryScenarioPackGovernanceRouteBias,
  getAssistantMemoryScenarioPackGovernanceConvergenceDigestId,
  getAssistantMemoryScenarioPackGovernanceConsolidationDigestId,
  getAssistantMemoryScenarioPackGovernanceCoordinationDigestId,
  getAssistantMemoryScenarioPackGovernanceCoordinationReuseMode,
  getAssistantMemoryScenarioPackGovernanceFabricDigestId,
  getAssistantMemoryScenarioPackGovernanceFabricPlaneDigestId,
  getAssistantMemoryScenarioPackGovernanceFabricPlaneReuseMode,
  getAssistantMemoryScenarioPackGovernanceFabricReuseMode,
  getAssistantMemoryScenarioPackGovernancePlaneDigestId,
  getAssistantMemoryScenarioPackGovernancePlaneReuseMode,
  getAssistantMemoryScenarioPackOrchestrationGovernanceFabricMode,
  getAssistantMemoryScenarioPackOrchestrationGovernanceFabricPlaneMode,
  getAssistantMemoryScenarioPackOrchestrationAlignmentMode,
  getAssistantMemoryScenarioPackOrchestrationConsolidationMode,
  getAssistantMemoryScenarioPackOrchestrationCoordinationModeV9,
  getAssistantMemoryScenarioPackOrchestrationCoordinationSummary,
  getAssistantMemoryScenarioPackOrchestrationGovernancePlaneMode,
  getAssistantMemoryScenarioPackOrchestrationMode,
  getAssistantMemoryScenarioPackOrchestrationDigestId,
  getAssistantMemoryScenarioPackStrategyConsistencyMode,
  getAssistantMemoryScenarioPackStrategyConsolidationSummary,
  getAssistantMemoryScenarioPackStrategyGovernanceFabricSummary,
  getAssistantMemoryScenarioPackStrategyGovernanceFabricPlaneSummary,
  getAssistantMemoryScenarioPackStrategyGovernancePlaneSummary,
  getAssistantMemoryScenarioPackStrategyRuntimeCoordinationSummary,
  getAssistantMemoryScenarioPackStrategyRuntimeReuseSummary,
  getAssistantMemoryScenarioPackStrategyConvergenceSummary,
  getAssistantMemoryScenarioPackGovernanceUnificationDigestId,
  getAssistantMemoryScenarioPackStrategyUnificationSummary,
  getAssistantMemoryScenarioPackOrchestrationUnificationMode,
  getAssistantMemoryScenarioPackStrategyPolicyId,
  getAssistantMemoryScenarioPackStrategyRationaleSummary,
  getAssistantMemoryPrimarySemanticLayer
} from "@/lib/chat/assistant-message-metadata-read";
import {
  buildScenarioMemoryPackPromptSection,
  resolveScenarioGovernanceFabricPlanePhaseSnapshot,
  type ActiveScenarioMemoryPack,
  resolveActiveScenarioMemoryPack,
  resolveScenarioMemoryPackStrategy
} from "@/lib/chat/memory-packs";
import {
  buildKnowledgeSnapshot,
  buildKnowledgeRouteWeighting,
  buildKnowledgeSummary,
  resolveKnowledgeGovernanceFabricPlanePhaseSnapshot,
  filterKnowledgeByActiveNamespace,
  buildRuntimeKnowledgeSnippet,
  selectKnowledgeForPrompt
} from "@/lib/chat/memory-knowledge";
import {
  buildMemoryNamespaceScopedMetadata,
  isMemoryWithinNamespace,
  type ActiveRuntimeMemoryNamespace,
  resolveNamespaceGovernanceFabricPlanePhaseSnapshot,
  resolveNamespaceGovernanceFabricPlaneContract,
  resolveNamespaceGovernanceFabricRuntimeContract,
  resolveNamespaceGovernancePlaneRuntimeContract,
  resolveNamespaceGovernanceConsolidationContract,
  resolveNamespaceUnifiedGovernanceConsolidationContract,
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
  getThreadCompactionRetentionDecision,
  resolveThreadGovernanceFabricPlanePhaseSnapshot,
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

function summarizeGate<T extends Record<string, boolean | undefined>>(checks: T) {
  const failedChecks = Object.entries(checks).flatMap(([check, passed]) =>
    passed === true ? [] : [check]
  );

  return {
    ...checks,
    checks_passed: Object.keys(checks).length - failedChecks.length,
    checks_total: Object.keys(checks).length,
    failed_checks: failedChecks,
    all_green: failedChecks.length === 0,
    close_candidate: failedChecks.length === 0
  } as const;
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
  const projectGovernanceFabricPlanePhaseSnapshot =
    resolveNamespaceGovernanceFabricPlanePhaseSnapshot(projectPrimaryNamespace);
  const projectBoundary = resolveRuntimeMemoryBoundary(projectPrimaryNamespace);
  const projectConsolidationContract =
    resolveNamespaceGovernanceConsolidationContract(projectPrimaryNamespace);
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
  expect(
    projectConsolidationContract.governance_consolidation_digest_id ===
      "project_coordination_governance_consolidation" &&
      projectConsolidationContract.governance_consolidation_summary ===
        "project_coordination_runtime_consolidated" &&
      projectConsolidationContract.runtime_consolidation_mode ===
        "project_runtime_consolidated" &&
      projectConsolidationContract.consolidation_retrieval_routes.join(",") ===
        projectBoundary.retrieval_route_order.join(",") &&
      projectConsolidationContract.consolidation_write_fallback_order.join(
        ","
      ) === projectBoundary.write_fallback_order.join(","),
    "Expected project-primary namespace to expose a reusable namespace governance consolidation contract in P10."
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
  const defaultScenarioGovernanceFabricPlanePhaseSnapshot =
    resolveScenarioGovernanceFabricPlanePhaseSnapshot(defaultScenarioMemoryPack);
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
  const scenarioMemoryPack: ActiveScenarioMemoryPack = resolveActiveScenarioMemoryPack({
    activeNamespace: activeMemoryNamespace,
    relevantKnowledge: runtimeKnowledge
  });
  const scenarioMemoryPackStrategy =
    resolveScenarioMemoryPackStrategy(scenarioMemoryPack);
  const scenarioGovernanceFabricPlanePhaseSnapshot =
    resolveScenarioGovernanceFabricPlanePhaseSnapshot(scenarioMemoryPack);
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
    scenarioMemoryPack.strategy_policy_id === "project_delivery_policy" &&
      scenarioMemoryPack.orchestration_mode === "execution_centered",
    "Expected project_ops scenario memory pack to expose a project_delivery_policy and execution_centered orchestration mode in P6."
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
  expect(
    scenarioMemoryPackPrompt.includes(
      "Current strategy policy = project_delivery_policy; orchestration mode = execution_centered."
    ),
    "Expected project namespace scenario memory pack prompt section to expose strategy policy and orchestration mode in P6."
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
  const worldKnowledgeDrivenScenarioMemoryPackPrompt =
    buildScenarioMemoryPackPromptSection({
      pack: worldKnowledgeDrivenScenarioMemoryPack,
      replyLanguage: "en"
    });
  const worldKnowledgeDrivenScenarioGovernanceFabricPlanePhaseSnapshot =
    resolveScenarioGovernanceFabricPlanePhaseSnapshot(
      worldKnowledgeDrivenScenarioMemoryPack
    );
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
    worldKnowledgeDrivenScenarioMemoryPackPrompt.includes(
      "Active Scenario Memory Pack: companion"
    ) &&
      worldKnowledgeDrivenScenarioMemoryPackPrompt.includes(
        "Current strategy policy = knowledge_guided_companion_policy; orchestration mode = knowledge_guided."
      ),
    "Expected world-knowledge companion prompt section to expose the knowledge-guided companion scenario contract."
  );
  expect(
    scenarioMemoryPack.knowledge_route_weight >= 1 &&
      scenarioMemoryPack.knowledge_budget_weight >= 0.9 &&
      worldKnowledgeDrivenScenarioMemoryPack.knowledge_route_weight >= 0.75 &&
      defaultScenarioMemoryPack.knowledge_route_weight >= 0.3 &&
      scenarioMemoryPack.governance_route_bias === "authoritative" &&
      worldKnowledgeDrivenScenarioMemoryPack.governance_route_bias ===
        "contextual",
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
      namespaceAwareWriteTarget.fallbackWriteBoundary === "world" &&
      namespaceAwareWriteTarget.namespaceGovernanceConvergenceDigestId ===
        "project_coordination_governance_convergence" &&
      namespaceAwareWriteTarget.namespaceGovernanceConvergenceSummary ===
        "project_coordination_alignment" &&
      namespaceAwareWriteTarget.namespaceUnifiedGovernanceRuntimeDigestId ===
        "project_coordination_unified_runtime" &&
      namespaceAwareWriteTarget.namespaceUnifiedGovernanceRuntimeSummary ===
        "project_coordination_runtime_unified" &&
      namespaceAwareWriteTarget.namespaceUnifiedRuntimeAlignmentMode ===
        "project_runtime_aligned" &&
      namespaceAwareWriteTarget.namespaceUnifiedRuntimeReuseMode ===
        "project_balanced_runtime_reuse" &&
      namespaceAwareWriteTarget.namespaceGovernanceConsolidationDigestId ===
        "project_coordination_governance_consolidation" &&
      namespaceAwareWriteTarget.namespaceGovernanceConsolidationSummary ===
        "project_coordination_runtime_consolidated" &&
      namespaceAwareWriteTarget.namespaceRuntimeConsolidationMode ===
        "project_runtime_consolidated" &&
      namespaceAwareWriteTarget.retrievalWriteDigestAlignment ===
        "project_parallel_balanced_aligned",
    "Expected namespace-aware write target resolution to expose project namespace governance consolidation in P10."
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
        ?.fallback_write_boundary === "world" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_convergence_digest_id ===
        "project_coordination_governance_convergence" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_convergence_summary ===
        "project_coordination_alignment" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_unified_governance_runtime_digest_id ===
        "project_coordination_unified_runtime" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_unified_governance_runtime_summary ===
        "project_coordination_runtime_unified" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_unified_runtime_alignment_mode ===
        "project_runtime_aligned" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_unified_runtime_reuse_mode ===
        "project_balanced_runtime_reuse" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_consolidation_digest_id ===
        "project_coordination_governance_consolidation" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_consolidation_summary ===
        "project_coordination_runtime_consolidated" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_runtime_consolidation_mode ===
        "project_runtime_consolidated" &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.retrieval_write_digest_alignment ===
        "project_parallel_balanced_aligned",
    "Expected runtime memory write preview metadata to expose namespace governance consolidation in P10."
  );
  const applicableKnowledge = filterKnowledgeByActiveNamespace({
    knowledge: runtimeKnowledge,
    namespace: activeMemoryNamespace
  });
  const knowledgeSummary = buildKnowledgeSummary({
    knowledge: runtimeKnowledge,
    activeNamespace: activeMemoryNamespace
  });
  const knowledgeGovernanceFabricPlanePhaseSnapshot =
    resolveKnowledgeGovernanceFabricPlanePhaseSnapshot({
      governanceFabricPlaneDigest:
        knowledgeSummary.governance_fabric_plane_digest,
      sourceBudgetGovernanceFabricPlaneSummary:
        knowledgeSummary.source_budget_governance_fabric_plane_summary,
      governanceFabricPlaneMode: knowledgeSummary.governance_fabric_plane_mode,
      governanceFabricPlaneReuseMode:
        knowledgeSummary.governance_fabric_plane_reuse_mode,
      applicableKnowledge
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
  const referenceOnlySelection = selectKnowledgeForPrompt({
    knowledge: [
      buildRuntimeKnowledgeSnippet(
        buildKnowledgeSnapshot({
          snapshotId: "knowledge-ref-1",
          resourceId: "resource-ref-1",
          scope: {
            user_id: "user-1"
          },
          title: "General protocol note",
          summary: "A general note for safe reference usage.",
          sourceKind: "external_reference",
          capturedAt: "2026-03-23T00:00:00.000Z"
        })
      ),
      buildRuntimeKnowledgeSnippet(
        buildKnowledgeSnapshot({
          snapshotId: "knowledge-ref-2",
          resourceId: "resource-ref-2",
          scope: {
            user_id: "user-1"
          },
          title: "General routing note",
          summary: "A general note for routing fallback.",
          sourceKind: "external_reference",
          capturedAt: "2026-03-23T00:00:00.000Z"
        })
      ),
      buildRuntimeKnowledgeSnippet(
        buildKnowledgeSnapshot({
          snapshotId: "knowledge-ref-3",
          resourceId: "resource-ref-3",
          scope: {
            user_id: "user-1"
          },
          title: "General memory note",
          summary: "A general note for memory handling.",
          sourceKind: "external_reference",
          capturedAt: "2026-03-23T00:00:00.000Z"
        })
      )
    ],
    activeNamespace: null,
    activePackId: "companion"
  });
  const referenceOnlyProjectOpsSelection = selectKnowledgeForPrompt({
    knowledge: [
      buildRuntimeKnowledgeSnippet(
        buildKnowledgeSnapshot({
          snapshotId: "knowledge-ref-po-1",
          resourceId: "resource-ref-po-1",
          scope: {
            user_id: "user-1"
          },
          title: "General execution note",
          summary: "A general note for execution fallback.",
          sourceKind: "external_reference",
          capturedAt: "2026-03-23T00:00:00.000Z"
        })
      ),
      buildRuntimeKnowledgeSnippet(
        buildKnowledgeSnapshot({
          snapshotId: "knowledge-ref-po-2",
          resourceId: "resource-ref-po-2",
          scope: {
            user_id: "user-1"
          },
          title: "General delivery note",
          summary: "A general note for delivery handling.",
          sourceKind: "external_reference",
          capturedAt: "2026-03-23T00:00:00.000Z"
        })
      ),
      buildRuntimeKnowledgeSnippet(
        buildKnowledgeSnapshot({
          snapshotId: "knowledge-ref-po-3",
          resourceId: "resource-ref-po-3",
          scope: {
            user_id: "user-1"
          },
          title: "General routing note",
          summary: "A general note for routing fallback.",
          sourceKind: "external_reference",
          capturedAt: "2026-03-23T00:00:00.000Z"
        })
      )
    ],
    activeNamespace: null,
    activePackId: "project_ops",
    limit: 3
  });
  const referenceOnlyKnowledgeGovernanceFabricPlaneSummary = buildKnowledgeSummary({
    knowledge: referenceOnlyProjectOpsSelection,
    activeNamespace: null
  });
  const referenceOnlyKnowledgeGovernanceFabricPlanePhaseSnapshot =
    resolveKnowledgeGovernanceFabricPlanePhaseSnapshot({
      governanceFabricPlaneDigest:
        referenceOnlyKnowledgeGovernanceFabricPlaneSummary.governance_fabric_plane_digest,
      sourceBudgetGovernanceFabricPlaneSummary:
        referenceOnlyKnowledgeGovernanceFabricPlaneSummary.source_budget_governance_fabric_plane_summary,
      governanceFabricPlaneMode:
        referenceOnlyKnowledgeGovernanceFabricPlaneSummary.governance_fabric_plane_mode,
      governanceFabricPlaneReuseMode:
        referenceOnlyKnowledgeGovernanceFabricPlaneSummary.governance_fabric_plane_reuse_mode,
      applicableKnowledge: referenceOnlyProjectOpsSelection
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
  const compactedThreadGovernanceFabricPlanePhaseSnapshot =
    resolveThreadGovernanceFabricPlanePhaseSnapshot({
      lifecycle_governance_fabric_plane_digest:
        compactedThreadSummary!.lifecycle_governance_fabric_plane_digest,
      keep_drop_governance_fabric_plane_summary:
        compactedThreadSummary!.keep_drop_governance_fabric_plane_summary,
      lifecycle_governance_fabric_plane_alignment_mode:
        compactedThreadSummary!
          .lifecycle_governance_fabric_plane_alignment_mode,
      lifecycle_governance_fabric_plane_reuse_mode:
        compactedThreadSummary!.lifecycle_governance_fabric_plane_reuse_mode,
      retention_section_order: compactedThreadSummary!.retention_section_order,
      retained_fields: compactedThreadSummary!.retained_fields
    });
  const roleCorePacketForHarness = withRoleCoreMemoryHandoff({
    packet: {
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
      },
      memory_handoff: null
    },
    memoryHandoff: {
      handoff_version: "v1",
      namespace_phase_snapshot_id:
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id,
      namespace_phase_snapshot_summary:
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary,
      retention_phase_snapshot_id:
        compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id,
      retention_phase_snapshot_summary:
        compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary,
      retention_decision_group:
        compactedThreadSummary?.retention_decision_group ?? null,
      retention_retained_fields: compactedThreadSummary?.retained_fields ?? [],
      knowledge_phase_snapshot_id:
        knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id,
      knowledge_phase_snapshot_summary:
        knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary,
      knowledge_scope_layers: knowledgeSummary.scope_layers,
      knowledge_governance_classes: knowledgeSummary.governance_classes,
      scenario_phase_snapshot_id:
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id,
      scenario_phase_snapshot_summary:
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary,
      scenario_strategy_bundle_id: scenarioMemoryPackStrategy.strategy_bundle_id,
      scenario_orchestration_mode: scenarioMemoryPack.orchestration_mode
    }
  });
  const p17CloseNoteReadinessSnapshot = {
    readinessJudgment: "close_ready",
    progressRange: "60% - 65%",
    closeCandidate: true,
    closeNoteRecommended: true,
    blockingItems: [] as string[],
    nonBlockingItems: [
      "close_note_acceptance_structuring",
      "close_note_gate_snapshot_consumption",
      "close_readiness_handoff_alignment"
    ] as const,
    tailCandidateItems: [
      "packet_output_symmetry_cleanup",
      "non_blocking_packet_negative_coverage",
      "close_note_tail_cleanup_alignment"
    ] as const,
    acceptanceGapBuckets: {
      blocking: 0,
      non_blocking: 3,
      tail_candidate: 3
    },
    nextExpansionFocus: [
      "close_note_acceptance_structuring",
      "close_note_gate_snapshot_consumption",
      "close_readiness_handoff_alignment"
    ] as const
  } as const;
  const p17CloseNoteHandoffPacket = buildRoleCoreMemoryCloseNoteHandoffPacket({
    roleCorePacket: roleCorePacketForHarness,
    ...p17CloseNoteReadinessSnapshot
  });
  const p18CloseNoteArtifact = buildRoleCoreMemoryCloseNoteArtifact({
    roleCorePacket: roleCorePacketForHarness,
    closeNoteHandoffPacket: p17CloseNoteHandoffPacket
  });
  const p19CloseNoteOutput = buildRoleCoreMemoryCloseNoteOutput({
    roleCorePacket: roleCorePacketForHarness,
    closeNoteHandoffPacket: p17CloseNoteHandoffPacket,
    closeNoteArtifact: p18CloseNoteArtifact
  });
  const p20CloseNoteRecord = buildRoleCoreMemoryCloseNoteRecord({
    roleCorePacket: roleCorePacketForHarness,
    closeNoteOutput: p19CloseNoteOutput,
    closeNoteArtifact: p18CloseNoteArtifact
  });
  const p21CloseNoteArchive = buildRoleCoreMemoryCloseNoteArchive({
    roleCorePacket: roleCorePacketForHarness,
    closeNoteRecord: p20CloseNoteRecord,
    closeNoteOutput: p19CloseNoteOutput
  });
  expect(
    compactedThreadSummary?.lifecycle_convergence_digest ===
      "anchor_preservation_convergence" &&
      compactedThreadSummary?.keep_drop_convergence_summary ===
        "anchor_keep_alignment" &&
      compactedThreadSummary?.lifecycle_alignment_mode ===
        "anchor_governance_aligned" &&
      compactedThreadSummary?.lifecycle_unification_digest ===
        "anchor_preservation_unification" &&
      compactedThreadSummary?.keep_drop_unification_summary ===
        "anchor_keep_unified" &&
      compactedThreadSummary?.lifecycle_unification_mode ===
        "anchor_runtime_unified",
    "Expected focus-anchor compaction summary to expose lifecycle convergence and unification facts in P8/P9."
  );
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
        role_core_packet: roleCorePacketForHarness,
        role_core_close_note_handoff_packet: p17CloseNoteHandoffPacket,
        role_core_close_note_artifact: p18CloseNoteArtifact,
        role_core_close_note_archive: p21CloseNoteArchive,
        role_core_close_note_record: p20CloseNoteRecord,
        role_core_close_note_output: p19CloseNoteOutput,
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
    compacted_thread_summary: compactedThreadSummary,
    role_core_close_note_handoff_packet: p17CloseNoteHandoffPacket,
    role_core_close_note_artifact: p18CloseNoteArtifact,
    role_core_close_note_archive: p21CloseNoteArchive,
    role_core_close_note_record: p20CloseNoteRecord,
    role_core_close_note_output: p19CloseNoteOutput
  });
  const runtimeDebugPack = runtimeDebugMetadata.memory.pack as
    | (NonNullable<typeof runtimeDebugMetadata.memory.pack> & {
        orchestration_digest_id?: string | null;
        strategy_rationale_summary?: string | null;
      })
    | null;
  const assistantRoleCorePacket = (assistantMetadata as {
    role_core_packet?: typeof roleCorePacketForHarness;
  }).role_core_packet;
  const assistantDiagnosticRoleCorePacket = (assistantMetadata as {
    developer_diagnostics?: {
      role_core_packet?: typeof roleCorePacketForHarness;
    };
  }).developer_diagnostics?.role_core_packet;
  const assistantCloseNoteHandoffPacket = (assistantMetadata as {
    role_core_close_note_handoff_packet?: typeof p17CloseNoteHandoffPacket;
  }).role_core_close_note_handoff_packet;
  const assistantDiagnosticCloseNoteHandoffPacket = (assistantMetadata as {
    developer_diagnostics?: {
      role_core_close_note_handoff_packet?: typeof p17CloseNoteHandoffPacket;
    };
  }).developer_diagnostics?.role_core_close_note_handoff_packet;
  const runtimeDebugCloseNoteHandoffPacket = (runtimeDebugMetadata.memory as {
    close_note_handoff_packet?: typeof p17CloseNoteHandoffPacket;
  }).close_note_handoff_packet;
  const assistantCloseNoteArtifact = (assistantMetadata as {
    role_core_close_note_artifact?: typeof p18CloseNoteArtifact;
  }).role_core_close_note_artifact;
  const assistantDiagnosticCloseNoteArtifact = (assistantMetadata as {
    developer_diagnostics?: {
      role_core_close_note_artifact?: typeof p18CloseNoteArtifact;
    };
  }).developer_diagnostics?.role_core_close_note_artifact;
  const runtimeDebugCloseNoteArtifact = (runtimeDebugMetadata.memory as {
    close_note_artifact?: typeof p18CloseNoteArtifact;
  }).close_note_artifact;
  const assistantCloseNoteOutput = (assistantMetadata as {
    role_core_close_note_output?: typeof p19CloseNoteOutput;
  }).role_core_close_note_output;
  const assistantCloseNoteArchive = (assistantMetadata as {
    role_core_close_note_archive?: typeof p21CloseNoteArchive;
  }).role_core_close_note_archive;
  const assistantCloseNoteRecord = (assistantMetadata as {
    role_core_close_note_record?: typeof p20CloseNoteRecord;
  }).role_core_close_note_record;
  const assistantDiagnosticCloseNoteArchive = (assistantMetadata as {
    developer_diagnostics?: {
      role_core_close_note_archive?: typeof p21CloseNoteArchive;
    };
  }).developer_diagnostics?.role_core_close_note_archive;
  const assistantDiagnosticCloseNoteRecord = (assistantMetadata as {
    developer_diagnostics?: {
      role_core_close_note_record?: typeof p20CloseNoteRecord;
    };
  }).developer_diagnostics?.role_core_close_note_record;
  const runtimeDebugCloseNoteRecord = (runtimeDebugMetadata.memory as {
    close_note_record?: typeof p20CloseNoteRecord;
  }).close_note_record;
  const runtimeDebugCloseNoteArchive = (runtimeDebugMetadata.memory as {
    close_note_archive?: typeof p21CloseNoteArchive;
  }).close_note_archive;
  const assistantDiagnosticCloseNoteOutput = (assistantMetadata as {
    developer_diagnostics?: {
      role_core_close_note_output?: typeof p19CloseNoteOutput;
    };
  }).developer_diagnostics?.role_core_close_note_output;
  const runtimeDebugCloseNoteOutput = (runtimeDebugMetadata.memory as {
    close_note_output?: typeof p19CloseNoteOutput;
  }).close_note_output;
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
  expect(
    referenceOnlySelection.length === 1 &&
      referenceOnlySelection[0]?.title === "General memory note",
    "Expected reference-heavy knowledge convergence to tighten companion prompt budget to one item in P8."
  );
  expect(
    referenceOnlyProjectOpsSelection.length === 1 &&
      referenceOnlyProjectOpsSelection[0]?.title === "General delivery note",
    "Expected reference-heavy knowledge consolidation to tighten project_ops prompt budget to one item in P10."
  );
  expect(
    knowledgeSummary.governance_unification_digest ===
      "authoritative_governance_unification" &&
      knowledgeSummary.source_budget_unification_summary ===
        "authoritative_budget_source_unified" &&
      knowledgeSummary.governance_unification_mode ===
        "authoritative_runtime_unified",
    "Expected knowledge summary to expose governance unification facts in P9."
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
    projectKnowledgeWeight.governance_class === "authoritative" &&
      worldKnowledgeWeight.governance_class === "contextual" &&
      generalKnowledgeWeight.governance_class === "reference",
    "Expected knowledge governance classes to map project_document/workspace_note/external_reference to authoritative/contextual/reference in P6."
  );
  expect(
    scenarioMemoryPack.governance_route_bias === "authoritative",
    "Expected project_ops knowledge governance weighting to bias routing toward authoritative knowledge in P6."
  );
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
    runtimeDebugMetadata.thread_compaction?.retention_decision_group ===
      "anchor_preserve",
    "Expected runtime debug metadata to expose the retention decision group in P6."
  );
  expect(
    runtimeDebugMetadata.thread_compaction?.survival_rationale ===
      "focus_anchor_survives",
    "Expected runtime debug metadata to expose the survival rationale in P6."
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
    getAssistantThreadRetentionDecisionGroup(assistantMetadata) ===
      "anchor_preserve",
    "Expected assistant metadata to expose the retention decision group in P6."
  );
  expect(
    getAssistantThreadSurvivalRationale(assistantMetadata) ===
      "focus_anchor_survives",
    "Expected assistant metadata to expose the survival rationale in P6."
  );
  expect(
    runtimeDebugMetadata.memory_namespace?.primary_layer === "project",
    "Expected runtime debug metadata to expose project as the primary namespace layer in P2."
  );

  const systemPrompt = buildAgentSystemPrompt(
    roleCorePacketForHarness,
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
    },
    p17CloseNoteHandoffPacket,
    p18CloseNoteArtifact,
    p19CloseNoteOutput,
    p20CloseNoteRecord,
    p21CloseNoteArchive
  );
  const systemPromptWithoutCloseNote = buildAgentSystemPrompt(
    roleCorePacketForHarness,
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
  const systemPromptWithoutArtifact = buildAgentSystemPrompt(
    roleCorePacketForHarness,
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
    },
    p17CloseNoteHandoffPacket
  );
  const p18CloseNoteArtifactPrompt = buildRoleCoreMemoryCloseNoteArtifactPrompt(
    p18CloseNoteArtifact,
    "en"
  );
  const p19CloseNoteOutputPrompt = buildRoleCoreMemoryCloseNoteOutputPrompt(
    p19CloseNoteOutput,
    "en"
  );
  const p20CloseNoteRecordPrompt = buildRoleCoreMemoryCloseNoteRecordPrompt(
    p20CloseNoteRecord,
    "en"
  );
  const p21CloseNoteArchivePrompt = buildRoleCoreMemoryCloseNoteArchivePrompt(
    p21CloseNoteArchive,
    "en"
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
    getAssistantThreadLifecycleConsolidationDigest(assistantMetadata) ===
      "anchor_preservation_consolidation" &&
      getAssistantThreadKeepDropConsolidationSummary(assistantMetadata) ===
        "anchor_keep_consolidated" &&
      getAssistantThreadLifecycleConsolidationMode(assistantMetadata) ===
        "anchor_runtime_consolidated" &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_consolidation_digest ===
        "anchor_preservation_consolidation" &&
      runtimeDebugMetadata.thread_compaction?.keep_drop_consolidation_summary ===
        "anchor_keep_consolidated" &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_consolidation_mode ===
        "anchor_runtime_consolidated" &&
      systemPrompt.includes(
        "Lifecycle consolidation: anchor_preservation_consolidation."
      ) &&
      systemPrompt.includes(
        "Keep/drop consolidation: anchor_keep_consolidated."
      ) &&
      systemPrompt.includes(
        "Lifecycle consolidation mode: anchor_runtime_consolidated."
      ),
    "Expected retention lifecycle consolidation to be consistent across prompt, assistant metadata, and runtime debug metadata in P10."
  );
  expect(
    getAssistantKnowledgeGovernanceConsolidationDigest(assistantMetadata) ===
      "authoritative_governance_consolidation" &&
      getAssistantKnowledgeSourceBudgetConsolidationSummary(
        assistantMetadata
      ) === "authoritative_budget_source_consolidated" &&
      getAssistantKnowledgeGovernanceConsolidationMode(assistantMetadata) ===
        "authoritative_runtime_consolidated" &&
      runtimeDebugMetadata.knowledge.governance_consolidation_digest ===
        "authoritative_governance_consolidation" &&
      runtimeDebugMetadata.knowledge.source_budget_consolidation_summary ===
        "authoritative_budget_source_consolidated" &&
      runtimeDebugMetadata.knowledge.governance_consolidation_mode ===
        "authoritative_runtime_consolidated" &&
      systemPrompt.includes(
        "Current governance consolidation = authoritative_governance_consolidation; budget/source consolidation = authoritative_budget_source_consolidated; consolidation mode = authoritative_runtime_consolidated."
      ),
    "Expected knowledge governance consolidation to be consistent across prompt, assistant metadata, and runtime debug metadata in P10."
  );
  expect(
    getAssistantMemoryScenarioPackGovernanceConsolidationDigestId(
      assistantMetadata
    ) === "project_delivery_governance_consolidation" &&
      getAssistantMemoryScenarioPackStrategyConsolidationSummary(
        assistantMetadata
      ) === "project_delivery_strategy_consolidated" &&
      getAssistantMemoryScenarioPackOrchestrationConsolidationMode(
        assistantMetadata
      ) === "execution_runtime_consolidated" &&
      runtimeDebugMetadata.memory.pack?.governance_consolidation_digest_id ===
        "project_delivery_governance_consolidation" &&
      runtimeDebugMetadata.memory.pack?.strategy_consolidation_summary ===
        "project_delivery_strategy_consolidated" &&
      runtimeDebugMetadata.memory.pack?.orchestration_consolidation_mode ===
        "execution_runtime_consolidated" &&
      systemPrompt.includes(
        "Current governance consolidation = project_delivery_governance_consolidation; strategy consolidation = project_delivery_strategy_consolidated; consolidation mode = execution_runtime_consolidated."
      ),
    "Expected scenario governance consolidation to be consistent across prompt, assistant metadata, and runtime debug metadata in P10."
  );
  expect(
    systemPrompt.includes("Active Memory Namespace: primary_layer = project."),
    "Expected system prompt assembly to include the active memory namespace in P2."
  );
  expect(
    getAssistantMemoryNamespaceUnifiedGovernanceRuntimeDigestId(
      assistantMetadata
    ) === "project_coordination_unified_runtime" &&
      getAssistantMemoryNamespaceUnifiedGovernanceRuntimeSummary(
        assistantMetadata
      ) === "project_coordination_runtime_unified" &&
      getAssistantMemoryNamespaceUnifiedRuntimeAlignmentMode(
        assistantMetadata
      ) === "project_runtime_aligned" &&
      getAssistantMemoryNamespaceUnifiedRuntimeReuseMode(assistantMetadata) ===
        "project_balanced_runtime_reuse" &&
      runtimeDebugMetadata.memory_namespace
        ?.unified_governance_runtime_digest_id ===
        "project_coordination_unified_runtime" &&
      runtimeDebugMetadata.memory_namespace
        ?.unified_governance_runtime_summary ===
        "project_coordination_runtime_unified" &&
      runtimeDebugMetadata.memory_namespace?.unified_runtime_alignment_mode ===
        "project_runtime_aligned" &&
      runtimeDebugMetadata.memory_namespace?.unified_runtime_reuse_mode ===
        "project_balanced_runtime_reuse" &&
      systemPrompt.includes(
        "Current unified governance runtime: project_coordination_unified_runtime; summary = project_coordination_runtime_unified; mode = project_runtime_aligned."
      ) &&
      systemPrompt.includes(
        "Current unified runtime reuse: project_balanced_runtime_reuse."
      ),
    "Expected namespace unified governance runtime to be consistent across prompt, assistant metadata, and runtime debug metadata in P9."
  );
  expect(
    getAssistantMemoryNamespaceGovernanceConsolidationDigestId(
      assistantMetadata
    ) === "project_coordination_governance_consolidation" &&
      getAssistantMemoryNamespaceGovernanceConsolidationSummary(
        assistantMetadata
      ) === "project_coordination_runtime_consolidated" &&
      getAssistantMemoryNamespaceRuntimeConsolidationMode(assistantMetadata) ===
        "project_runtime_consolidated" &&
      runtimeDebugMetadata.memory_namespace
        ?.governance_consolidation_digest_id ===
        "project_coordination_governance_consolidation" &&
      runtimeDebugMetadata.memory_namespace
        ?.governance_consolidation_summary ===
        "project_coordination_runtime_consolidated" &&
      runtimeDebugMetadata.memory_namespace?.runtime_consolidation_mode ===
        "project_runtime_consolidated" &&
      systemPrompt.includes(
        "Current governance consolidation: project_coordination_governance_consolidation; summary = project_coordination_runtime_consolidated; mode = project_runtime_consolidated."
      ),
    "Expected namespace governance consolidation to be consistent across prompt, assistant metadata, and runtime debug metadata in P10."
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
      scenarioMemoryPack.knowledge_route_weight >= 1 &&
      scenarioMemoryPack.knowledge_budget_weight >= 0.9 &&
      scenarioMemoryPack.route_influence_reason ===
        "project_namespace_bias" &&
      scenarioMemoryPack.governance_route_bias === "authoritative" &&
      projectKnowledgeWeight.governance_class === "authoritative" &&
      worldKnowledgeWeight.governance_class === "contextual" &&
      generalKnowledgeWeight.governance_class === "reference" &&
      projectKnowledgeWeight.total_weight > worldKnowledgeWeight.total_weight &&
      worldKnowledgeWeight.total_weight > generalKnowledgeWeight.total_weight &&
      knowledgeSummary.governance_classes.join(",") ===
        "authoritative,contextual,reference" &&
      systemPrompt.includes(
        "Current knowledge route weight = 1; knowledge budget weight = 0.95."
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
  const p6RegressionGateChecks = {
    namespace_policy_v4_ok:
      threadBoundary.policy_bundle_id === "thread_strict_focus" &&
      threadBoundary.policy_digest_id === "thread_focus_orchestration" &&
      threadBoundary.policy_coordination_summary ===
        "thread_focus_no_timeline" &&
      threadBoundary.governance_consistency_mode ===
        "retrieval_strict_write_outward" &&
      threadBoundary.route_governance_mode === "thread_strict" &&
      threadBoundary.retrieval_fallback_mode === "strict_no_timeline" &&
      threadBoundary.write_escalation_mode ===
        "thread_outward_escalation" &&
      projectBoundary.policy_bundle_id === "project_balanced_coordination" &&
      projectBoundary.policy_digest_id ===
        "project_coordination_orchestration" &&
      projectBoundary.policy_coordination_summary ===
        "project_parallel_coordination" &&
      projectBoundary.governance_consistency_mode ===
        "retrieval_write_balanced" &&
      projectBoundary.route_governance_mode === "project_balanced" &&
      projectBoundary.retrieval_fallback_mode ===
        "parallel_timeline_allowed" &&
      projectBoundary.write_escalation_mode ===
        "project_world_escalation" &&
      getAssistantMemoryNamespacePolicyBundleId(assistantMetadata) ===
        projectBoundary.policy_bundle_id &&
      getAssistantMemoryNamespacePolicyDigestId(assistantMetadata) ===
        projectBoundary.policy_digest_id &&
      getAssistantMemoryNamespacePolicyCoordinationSummary(
        assistantMetadata
      ) === projectBoundary.policy_coordination_summary &&
      getAssistantMemoryNamespaceGovernanceConsistencyMode(
        assistantMetadata
      ) === projectBoundary.governance_consistency_mode &&
      getAssistantMemoryNamespaceRouteGovernanceMode(assistantMetadata) ===
        projectBoundary.route_governance_mode &&
      getAssistantMemoryNamespaceRetrievalFallbackMode(assistantMetadata) ===
        projectBoundary.retrieval_fallback_mode &&
      getAssistantMemoryNamespaceWriteEscalationMode(assistantMetadata) ===
        projectBoundary.write_escalation_mode &&
      runtimeDebugMetadata.memory_namespace?.policy_bundle_id ===
        projectBoundary.policy_bundle_id &&
      runtimeDebugMetadata.memory_namespace?.policy_digest_id ===
        projectBoundary.policy_digest_id &&
      runtimeDebugMetadata.memory_namespace?.policy_coordination_summary ===
        projectBoundary.policy_coordination_summary &&
      runtimeDebugMetadata.memory_namespace?.governance_consistency_mode ===
        projectBoundary.governance_consistency_mode &&
      runtimeDebugMetadata.memory_namespace?.route_governance_mode ===
        projectBoundary.route_governance_mode &&
      runtimeDebugMetadata.memory_namespace?.retrieval_fallback_mode ===
        projectBoundary.retrieval_fallback_mode &&
      runtimeDebugMetadata.memory_namespace?.write_escalation_mode ===
        projectBoundary.write_escalation_mode &&
      systemPrompt.includes(
        "Current namespace policy: project_balanced_coordination; retrieval governance = project_balanced."
      ) &&
      systemPrompt.includes(
        "Current namespace policy digest: project_coordination_orchestration."
      ) &&
      systemPrompt.includes(
        "Current coordination summary: project_parallel_coordination; consistency = retrieval_write_balanced."
      ),
    retention_lifecycle_v4_ok:
      getAssistantThreadRetentionPolicyId(assistantMetadata) ===
        "focus_continuity_anchor" &&
      getAssistantThreadCrossLayerSurvivalMode(assistantMetadata) ===
        "anchor_only" &&
      getAssistantThreadRetentionDecisionGroup(assistantMetadata) ===
        "anchor_preserve" &&
      getAssistantThreadSurvivalRationale(assistantMetadata) ===
        "focus_anchor_survives" &&
      getAssistantThreadLifecycleGovernanceDigest(assistantMetadata) ===
        "anchor_preservation_governance" &&
      getAssistantThreadKeepDropGovernanceSummary(assistantMetadata) ===
        "anchor_keep_priority" &&
      getAssistantThreadLifecycleCoordinationSummary(assistantMetadata) ===
        "anchor_only_coordination" &&
      getAssistantThreadSurvivalConsistencyMode(assistantMetadata) ===
        "anchor_keep_consistent" &&
      runtimeDebugMetadata.thread_compaction?.retention_policy_id ===
        "focus_continuity_anchor" &&
      runtimeDebugMetadata.thread_compaction?.cross_layer_survival_mode ===
        "anchor_only" &&
      runtimeDebugMetadata.thread_compaction?.retention_decision_group ===
        "anchor_preserve" &&
      runtimeDebugMetadata.thread_compaction?.survival_rationale ===
        "focus_anchor_survives" &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_governance_digest ===
        "anchor_preservation_governance" &&
      runtimeDebugMetadata.thread_compaction?.keep_drop_governance_summary ===
        "anchor_keep_priority" &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_coordination_summary ===
        "anchor_only_coordination" &&
      runtimeDebugMetadata.thread_compaction?.survival_consistency_mode ===
        "anchor_keep_consistent" &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Retention policy: focus_continuity_anchor."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Cross-layer survival: anchor_only."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Retention decision group: anchor_preserve."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Survival rationale: focus_anchor_survives."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle governance digest: anchor_preservation_governance."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Keep/drop governance: anchor_keep_priority."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle coordination: anchor_only_coordination."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Survival consistency: anchor_keep_consistent."
      ),
    knowledge_governance_weighting_v4_ok:
      projectKnowledgeWeight.governance_class === "authoritative" &&
      worldKnowledgeWeight.governance_class === "contextual" &&
      generalKnowledgeWeight.governance_class === "reference" &&
      projectKnowledgeWeight.governance_weight >
        worldKnowledgeWeight.governance_weight &&
      worldKnowledgeWeight.governance_weight >
        generalKnowledgeWeight.governance_weight &&
      knowledgeSummary.governance_classes.join(",") ===
        "authoritative,contextual,reference" &&
      knowledgeSummary.governance_coordination_summary ===
        "authoritative_priority_coordination" &&
      knowledgeSummary.budget_coordination_mode ===
        "authoritative_budget_priority" &&
      knowledgeSummary.source_governance_summary ===
        "authoritative_source_priority" &&
      knowledgeSummary.governance_consistency_mode ===
        "authoritative_governance_aligned" &&
      runtimeDebugMetadata.knowledge.governance_classes?.join(",") ===
        "authoritative,contextual,reference" &&
      runtimeDebugMetadata.knowledge.governance_coordination_summary ===
        "authoritative_priority_coordination" &&
      runtimeDebugMetadata.knowledge.budget_coordination_mode ===
        "authoritative_budget_priority" &&
      runtimeDebugMetadata.knowledge.source_governance_summary ===
        "authoritative_source_priority" &&
      runtimeDebugMetadata.knowledge.governance_consistency_mode ===
        "authoritative_governance_aligned" &&
      getAssistantKnowledgeGovernanceCoordinationSummary(assistantMetadata) ===
        "authoritative_priority_coordination" &&
      getAssistantKnowledgeBudgetCoordinationMode(assistantMetadata) ===
        "authoritative_budget_priority" &&
      getAssistantKnowledgeSourceGovernanceSummary(assistantMetadata) ===
        "authoritative_source_priority" &&
      getAssistantKnowledgeGovernanceConsistencyMode(assistantMetadata) ===
        "authoritative_governance_aligned" &&
      getAssistantKnowledgeGovernanceConvergenceDigest(assistantMetadata) ===
        "authoritative_governance_convergence" &&
      getAssistantKnowledgeSourceBudgetAlignmentSummary(assistantMetadata) ===
        "authoritative_budget_source_aligned" &&
      getAssistantKnowledgeGovernanceAlignmentMode(assistantMetadata) ===
        "authoritative_convergence_aligned" &&
      scenarioMemoryPack.governance_route_bias === "authoritative" &&
      scenarioMemoryPack.knowledge_budget_weight === 0.95 &&
      selectedKnowledgeForPrompt.length === 3 &&
      getAssistantMemoryScenarioPackGovernanceRouteBias(
        assistantMetadata
      ) === scenarioMemoryPack.governance_route_bias &&
      systemPrompt.includes(
        "Current knowledge governance coordination = authoritative_priority_coordination; budget coordination = authoritative_budget_priority."
      ) &&
      systemPrompt.includes(
        "Current source orchestration = authoritative_source_priority; consistency = authoritative_governance_aligned."
      ) &&
      systemPrompt.includes(
        "Current governance route bias = authoritative."
      ),
    scenario_strategy_orchestration_v4_ok:
      scenarioMemoryPack.strategy_policy_id === "project_delivery_policy" &&
      scenarioMemoryPack.orchestration_mode === "execution_centered" &&
      scenarioMemoryPack.orchestration_digest_id ===
        "project_delivery_orchestration" &&
      scenarioMemoryPack.strategy_rationale_summary ===
        "execution_priority_alignment" &&
      scenarioMemoryPack.orchestration_coordination_summary ===
        "project_delivery_coordination" &&
      scenarioMemoryPack.strategy_consistency_mode ===
        "execution_governance_aligned" &&
      scenarioMemoryPack.governance_convergence_digest_id ===
        "project_delivery_governance_convergence" &&
      scenarioMemoryPack.strategy_convergence_summary ===
        "project_delivery_strategy_alignment" &&
      scenarioMemoryPack.orchestration_alignment_mode ===
        "execution_convergence_aligned" &&
      scenarioMemoryPack.governance_unification_digest_id ===
        "project_delivery_governance_unification" &&
      scenarioMemoryPack.strategy_unification_summary ===
        "project_delivery_strategy_unified" &&
      scenarioMemoryPack.orchestration_unification_mode ===
        "execution_runtime_unified" &&
      getAssistantMemoryScenarioPackStrategyPolicyId(assistantMetadata) ===
        scenarioMemoryPack.strategy_policy_id &&
      getAssistantMemoryScenarioPackOrchestrationMode(assistantMetadata) ===
        scenarioMemoryPack.orchestration_mode &&
      getAssistantMemoryScenarioPackOrchestrationDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_digest_id &&
      getAssistantMemoryScenarioPackStrategyRationaleSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_rationale_summary &&
      getAssistantMemoryScenarioPackOrchestrationCoordinationSummary(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_coordination_summary &&
      getAssistantMemoryScenarioPackStrategyConsistencyMode(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_consistency_mode &&
      getAssistantMemoryScenarioPackGovernanceConvergenceDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.governance_convergence_digest_id &&
      getAssistantMemoryScenarioPackStrategyConvergenceSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_convergence_summary &&
      getAssistantMemoryScenarioPackOrchestrationAlignmentMode(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_alignment_mode &&
      getAssistantMemoryScenarioPackGovernanceUnificationDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.governance_unification_digest_id &&
      getAssistantMemoryScenarioPackStrategyUnificationSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_unification_summary &&
      getAssistantMemoryScenarioPackOrchestrationUnificationMode(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_unification_mode &&
      runtimeDebugMetadata.memory.pack?.strategy_policy_id ===
        scenarioMemoryPack.strategy_policy_id &&
      runtimeDebugMetadata.memory.pack?.orchestration_mode ===
        scenarioMemoryPack.orchestration_mode &&
      runtimeDebugPack?.orchestration_digest_id ===
        scenarioMemoryPack.orchestration_digest_id &&
      runtimeDebugPack?.strategy_rationale_summary ===
        scenarioMemoryPack.strategy_rationale_summary &&
      runtimeDebugMetadata.memory.pack?.orchestration_coordination_summary ===
        scenarioMemoryPack.orchestration_coordination_summary &&
      runtimeDebugMetadata.memory.pack?.strategy_consistency_mode ===
        scenarioMemoryPack.strategy_consistency_mode &&
      runtimeDebugPack?.governance_convergence_digest_id ===
        scenarioMemoryPack.governance_convergence_digest_id &&
      runtimeDebugPack?.strategy_convergence_summary ===
        scenarioMemoryPack.strategy_convergence_summary &&
      runtimeDebugPack?.orchestration_alignment_mode ===
        scenarioMemoryPack.orchestration_alignment_mode &&
      runtimeDebugPack?.governance_unification_digest_id ===
        scenarioMemoryPack.governance_unification_digest_id &&
      runtimeDebugPack?.strategy_unification_summary ===
        scenarioMemoryPack.strategy_unification_summary &&
      runtimeDebugPack?.orchestration_unification_mode ===
        scenarioMemoryPack.orchestration_unification_mode &&
      systemPrompt.includes(
        "Current strategy policy = project_delivery_policy; orchestration mode = execution_centered."
      ) &&
      systemPrompt.includes(
        "Current orchestration digest = project_delivery_orchestration; strategy rationale = execution_priority_alignment."
      ) &&
      systemPrompt.includes(
        "Current orchestration coordination = project_delivery_coordination; consistency = execution_governance_aligned."
      ) &&
      systemPrompt.includes(
        "Current governance convergence = project_delivery_governance_convergence; strategy convergence = project_delivery_strategy_alignment; alignment mode = execution_convergence_aligned."
      ) &&
      systemPrompt.includes(
        "Current governance unification = project_delivery_governance_unification; strategy unification = project_delivery_strategy_unified; unification mode = execution_runtime_unified."
      ),
    strategy_policy_consistency_v4_ok:
      getAssistantMemoryScenarioPackId(assistantMetadata) ===
        scenarioMemoryPack.pack_id &&
      getAssistantMemoryScenarioPackStrategyPolicyId(assistantMetadata) ===
        scenarioMemoryPack.strategy_policy_id &&
      getAssistantMemoryScenarioPackOrchestrationMode(assistantMetadata) ===
        scenarioMemoryPack.orchestration_mode &&
      getAssistantMemoryScenarioPackOrchestrationDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_digest_id &&
      getAssistantMemoryScenarioPackStrategyRationaleSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_rationale_summary &&
      getAssistantMemoryScenarioPackOrchestrationCoordinationSummary(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_coordination_summary &&
      getAssistantMemoryScenarioPackStrategyConsistencyMode(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_consistency_mode &&
      getAssistantMemoryScenarioPackGovernanceRouteBias(assistantMetadata) ===
        scenarioMemoryPack.governance_route_bias &&
      getAssistantMemoryScenarioPackStrategyBundleId(assistantMetadata) ===
        scenarioMemoryPackStrategy.strategy_bundle_id &&
      getAssistantMemoryScenarioPackStrategyAssemblyOrder(
        assistantMetadata
      ).join(",") ===
        scenarioMemoryPackStrategy.assembly_layer_order.join(",") &&
      runtimeDebugMetadata.memory.pack?.pack_id === scenarioMemoryPack.pack_id &&
      runtimeDebugMetadata.memory.pack?.strategy_policy_id ===
        scenarioMemoryPack.strategy_policy_id &&
      runtimeDebugMetadata.memory.pack?.orchestration_mode ===
        scenarioMemoryPack.orchestration_mode &&
      runtimeDebugPack?.orchestration_digest_id ===
        scenarioMemoryPack.orchestration_digest_id &&
      runtimeDebugPack?.strategy_rationale_summary ===
        scenarioMemoryPack.strategy_rationale_summary &&
      runtimeDebugMetadata.memory.pack?.orchestration_coordination_summary ===
        scenarioMemoryPack.orchestration_coordination_summary &&
      runtimeDebugMetadata.memory.pack?.strategy_consistency_mode ===
        scenarioMemoryPack.strategy_consistency_mode &&
      runtimeDebugMetadata.memory.pack?.governance_route_bias ===
        scenarioMemoryPack.governance_route_bias &&
      runtimeDebugMetadata.memory.pack?.strategy_bundle_id ===
        scenarioMemoryPackStrategy.strategy_bundle_id &&
      runtimeDebugMetadata.memory.pack?.strategy_assembly_order?.join(",") ===
        scenarioMemoryPackStrategy.assembly_layer_order.join(",") &&
      systemPrompt.includes("Active Scenario Memory Pack: project_ops") &&
      systemPrompt.includes(
        "Current strategy policy = project_delivery_policy; orchestration mode = execution_centered."
      ) &&
      systemPrompt.includes(
        "Current orchestration digest = project_delivery_orchestration; strategy rationale = execution_priority_alignment."
      ) &&
      systemPrompt.includes(
        "Current orchestration coordination = project_delivery_coordination; consistency = execution_governance_aligned."
      ) &&
      systemPrompt.includes(
        "Current governance route bias = authoritative."
      ) &&
      systemPrompt.includes(
        "Current strategy bundle = project_execution; relationship/static_profile/memory_record budget = 1/1/2."
      ) &&
      systemPrompt.includes(
        "Current strategy assembly order = memory_record -> static_profile -> relationship -> dynamic_profile."
      )
  } as const;
  const p6RegressionGateFailedChecks = Object.entries(
    p6RegressionGateChecks
  ).flatMap(([check, passed]) => (passed ? [] : [check]));
  const p6RegressionGate = {
    ...p6RegressionGateChecks,
    checks_passed:
      Object.keys(p6RegressionGateChecks).length -
      p6RegressionGateFailedChecks.length,
    checks_total: Object.keys(p6RegressionGateChecks).length,
    failed_checks: p6RegressionGateFailedChecks,
    all_green: p6RegressionGateFailedChecks.length === 0,
    close_candidate: p6RegressionGateFailedChecks.length === 0
  } as const;

  const p7RegressionGateChecks = {
    namespace_policy_orchestration_v2_ok:
      projectBoundary.policy_digest_id === "project_coordination_orchestration" &&
      projectBoundary.policy_coordination_summary ===
        "project_parallel_coordination" &&
      projectBoundary.governance_consistency_mode ===
        "retrieval_write_balanced" &&
      getAssistantMemoryNamespacePolicyDigestId(assistantMetadata) ===
        projectBoundary.policy_digest_id &&
      getAssistantMemoryNamespacePolicyCoordinationSummary(
        assistantMetadata
      ) === projectBoundary.policy_coordination_summary &&
      getAssistantMemoryNamespaceGovernanceConsistencyMode(
        assistantMetadata
      ) === projectBoundary.governance_consistency_mode &&
      runtimeDebugMetadata.memory_namespace?.policy_digest_id ===
        projectBoundary.policy_digest_id &&
      runtimeDebugMetadata.memory_namespace?.policy_coordination_summary ===
        projectBoundary.policy_coordination_summary &&
      runtimeDebugMetadata.memory_namespace?.governance_consistency_mode ===
        projectBoundary.governance_consistency_mode,
    retention_lifecycle_governance_v5_ok:
      compactedThreadSummary?.lifecycle_governance_digest ===
        "anchor_preservation_governance" &&
      compactedThreadSummary?.keep_drop_governance_summary ===
        "anchor_keep_priority" &&
      compactedThreadSummary?.lifecycle_coordination_summary ===
        "anchor_only_coordination" &&
      compactedThreadSummary?.survival_consistency_mode ===
        "anchor_keep_consistent" &&
      getAssistantThreadLifecycleGovernanceDigest(assistantMetadata) ===
        compactedThreadSummary?.lifecycle_governance_digest &&
      getAssistantThreadKeepDropGovernanceSummary(assistantMetadata) ===
        compactedThreadSummary?.keep_drop_governance_summary &&
      getAssistantThreadLifecycleCoordinationSummary(assistantMetadata) ===
        compactedThreadSummary?.lifecycle_coordination_summary &&
      getAssistantThreadSurvivalConsistencyMode(assistantMetadata) ===
        compactedThreadSummary?.survival_consistency_mode,
    knowledge_governance_coordination_v5_ok:
      knowledgeSummary.governance_coordination_summary ===
        "authoritative_priority_coordination" &&
      knowledgeSummary.budget_coordination_mode ===
        "authoritative_budget_priority" &&
      knowledgeSummary.source_governance_summary ===
        "authoritative_source_priority" &&
      knowledgeSummary.governance_consistency_mode ===
        "authoritative_governance_aligned" &&
      getAssistantKnowledgeGovernanceCoordinationSummary(assistantMetadata) ===
        knowledgeSummary.governance_coordination_summary &&
      getAssistantKnowledgeBudgetCoordinationMode(assistantMetadata) ===
        knowledgeSummary.budget_coordination_mode &&
      getAssistantKnowledgeSourceGovernanceSummary(assistantMetadata) ===
        knowledgeSummary.source_governance_summary &&
      getAssistantKnowledgeGovernanceConsistencyMode(assistantMetadata) ===
        knowledgeSummary.governance_consistency_mode,
    scenario_orchestration_digest_v5_ok:
      scenarioMemoryPack.orchestration_digest_id ===
        "project_delivery_orchestration" &&
      scenarioMemoryPack.strategy_rationale_summary ===
        "execution_priority_alignment" &&
      scenarioMemoryPack.orchestration_coordination_summary ===
        "project_delivery_coordination" &&
      scenarioMemoryPack.strategy_consistency_mode ===
        "execution_governance_aligned" &&
      getAssistantMemoryScenarioPackOrchestrationDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_digest_id &&
      getAssistantMemoryScenarioPackStrategyRationaleSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_rationale_summary &&
      getAssistantMemoryScenarioPackOrchestrationCoordinationSummary(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_coordination_summary &&
      getAssistantMemoryScenarioPackStrategyConsistencyMode(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_consistency_mode &&
      runtimeDebugPack?.orchestration_digest_id ===
        scenarioMemoryPack.orchestration_digest_id &&
      runtimeDebugPack?.strategy_rationale_summary ===
        scenarioMemoryPack.strategy_rationale_summary &&
      runtimeDebugMetadata.memory.pack?.orchestration_coordination_summary ===
        scenarioMemoryPack.orchestration_coordination_summary &&
      runtimeDebugMetadata.memory.pack?.strategy_consistency_mode ===
        scenarioMemoryPack.strategy_consistency_mode &&
      systemPrompt.includes(
        "Current orchestration digest = project_delivery_orchestration; strategy rationale = execution_priority_alignment."
      ) &&
      systemPrompt.includes(
        "Current orchestration coordination = project_delivery_coordination; consistency = execution_governance_aligned."
      )
  } as const;
  const p7RegressionGateFailedChecks = Object.entries(
    p7RegressionGateChecks
  ).flatMap(([check, passed]) => (passed ? [] : [check]));
  const p7RegressionGate = {
    ...p7RegressionGateChecks,
    checks_passed:
      Object.keys(p7RegressionGateChecks).length -
      p7RegressionGateFailedChecks.length,
    checks_total: Object.keys(p7RegressionGateChecks).length,
    failed_checks: p7RegressionGateFailedChecks,
    all_green: p7RegressionGateFailedChecks.length === 0,
    close_candidate: p7RegressionGateFailedChecks.length === 0
  } as const;

  const p8RegressionGateChecks = {
    namespace_governance_convergence_v3_ok:
      projectBoundary.governance_convergence_digest_id ===
        "project_coordination_governance_convergence" &&
      projectBoundary.governance_convergence_summary ===
        "project_coordination_alignment" &&
      projectBoundary.retrieval_write_digest_alignment ===
        "project_parallel_balanced_aligned" &&
      getAssistantMemoryNamespaceGovernanceConvergenceDigestId(
        assistantMetadata
      ) === projectBoundary.governance_convergence_digest_id &&
      getAssistantMemoryNamespaceGovernanceConvergenceSummary(
        assistantMetadata
      ) === projectBoundary.governance_convergence_summary &&
      getAssistantMemoryNamespaceRetrievalWriteDigestAlignment(
        assistantMetadata
      ) === projectBoundary.retrieval_write_digest_alignment &&
      runtimeDebugMetadata.memory_namespace?.governance_convergence_digest_id ===
        projectBoundary.governance_convergence_digest_id &&
      runtimeDebugMetadata.memory_namespace?.governance_convergence_summary ===
        projectBoundary.governance_convergence_summary &&
      runtimeDebugMetadata.memory_namespace?.retrieval_write_digest_alignment ===
        projectBoundary.retrieval_write_digest_alignment,
    retention_lifecycle_convergence_v6_ok:
      compactedThreadSummary?.lifecycle_convergence_digest ===
        "anchor_preservation_convergence" &&
      compactedThreadSummary?.keep_drop_convergence_summary ===
        "anchor_keep_alignment" &&
      compactedThreadSummary?.lifecycle_alignment_mode ===
        "anchor_governance_aligned" &&
      getAssistantThreadLifecycleConvergenceDigest(assistantMetadata) ===
        compactedThreadSummary?.lifecycle_convergence_digest &&
      getAssistantThreadKeepDropConvergenceSummary(assistantMetadata) ===
        compactedThreadSummary?.keep_drop_convergence_summary &&
      getAssistantThreadLifecycleAlignmentMode(assistantMetadata) ===
        compactedThreadSummary?.lifecycle_alignment_mode &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_convergence_digest ===
        compactedThreadSummary?.lifecycle_convergence_digest &&
      runtimeDebugMetadata.thread_compaction?.keep_drop_convergence_summary ===
        compactedThreadSummary?.keep_drop_convergence_summary &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_alignment_mode ===
        compactedThreadSummary?.lifecycle_alignment_mode,
    knowledge_governance_convergence_v6_ok:
      knowledgeSummary.governance_convergence_digest ===
        "authoritative_governance_convergence" &&
      knowledgeSummary.source_budget_alignment_summary ===
        "authoritative_budget_source_aligned" &&
      knowledgeSummary.governance_alignment_mode ===
        "authoritative_convergence_aligned" &&
      getAssistantKnowledgeGovernanceConvergenceDigest(assistantMetadata) ===
        knowledgeSummary.governance_convergence_digest &&
      getAssistantKnowledgeSourceBudgetAlignmentSummary(assistantMetadata) ===
        knowledgeSummary.source_budget_alignment_summary &&
      getAssistantKnowledgeGovernanceAlignmentMode(assistantMetadata) ===
        knowledgeSummary.governance_alignment_mode &&
      runtimeDebugMetadata.knowledge.governance_convergence_digest ===
        knowledgeSummary.governance_convergence_digest &&
      runtimeDebugMetadata.knowledge.source_budget_alignment_summary ===
        knowledgeSummary.source_budget_alignment_summary &&
      runtimeDebugMetadata.knowledge.governance_alignment_mode ===
        knowledgeSummary.governance_alignment_mode,
    scenario_governance_convergence_v6_ok:
      scenarioMemoryPack.governance_convergence_digest_id ===
        "project_delivery_governance_convergence" &&
      scenarioMemoryPack.strategy_convergence_summary ===
        "project_delivery_strategy_alignment" &&
      scenarioMemoryPack.orchestration_alignment_mode ===
        "execution_convergence_aligned" &&
      getAssistantMemoryScenarioPackGovernanceConvergenceDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.governance_convergence_digest_id &&
      getAssistantMemoryScenarioPackStrategyConvergenceSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_convergence_summary &&
      getAssistantMemoryScenarioPackOrchestrationAlignmentMode(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_alignment_mode &&
      runtimeDebugPack?.governance_convergence_digest_id ===
        scenarioMemoryPack.governance_convergence_digest_id &&
      runtimeDebugPack?.strategy_convergence_summary ===
        scenarioMemoryPack.strategy_convergence_summary &&
      runtimeDebugPack?.orchestration_alignment_mode ===
        scenarioMemoryPack.orchestration_alignment_mode &&
      systemPrompt.includes(
        "Current governance convergence = project_delivery_governance_convergence; strategy convergence = project_delivery_strategy_alignment; alignment mode = execution_convergence_aligned."
      ),
    convergence_metadata_consistency_v6_ok:
      getAssistantMemoryNamespaceGovernanceConvergenceDigestId(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace?.governance_convergence_digest_id &&
      getAssistantMemoryNamespaceGovernanceConvergenceSummary(
        assistantMetadata
      ) === runtimeDebugMetadata.memory_namespace?.governance_convergence_summary &&
      getAssistantMemoryNamespaceRetrievalWriteDigestAlignment(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace?.retrieval_write_digest_alignment &&
      getAssistantKnowledgeGovernanceConvergenceDigest(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.governance_convergence_digest &&
      getAssistantKnowledgeSourceBudgetAlignmentSummary(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.source_budget_alignment_summary &&
      getAssistantKnowledgeGovernanceAlignmentMode(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.governance_alignment_mode &&
      getAssistantThreadLifecycleConvergenceDigest(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.lifecycle_convergence_digest &&
      getAssistantThreadKeepDropConvergenceSummary(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.keep_drop_convergence_summary &&
      getAssistantThreadLifecycleAlignmentMode(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.lifecycle_alignment_mode &&
      getAssistantThreadLifecycleUnificationDigest(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.lifecycle_unification_digest &&
      getAssistantThreadKeepDropUnificationSummary(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.keep_drop_unification_summary &&
      getAssistantThreadLifecycleUnificationMode(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.lifecycle_unification_mode &&
      getAssistantMemoryScenarioPackGovernanceConvergenceDigestId(
        assistantMetadata
      ) === runtimeDebugPack?.governance_convergence_digest_id &&
      getAssistantMemoryScenarioPackStrategyConvergenceSummary(
        assistantMetadata
      ) === runtimeDebugPack?.strategy_convergence_summary &&
      getAssistantMemoryScenarioPackOrchestrationAlignmentMode(
        assistantMetadata
      ) === runtimeDebugPack?.orchestration_alignment_mode
  } as const;
  const p8RegressionGateFailedChecks = Object.entries(
    p8RegressionGateChecks
  ).flatMap(([check, passed]) => (passed ? [] : [check]));
  const p8RegressionGate = {
    ...p8RegressionGateChecks,
    checks_passed:
      Object.keys(p8RegressionGateChecks).length -
      p8RegressionGateFailedChecks.length,
    checks_total: Object.keys(p8RegressionGateChecks).length,
    failed_checks: p8RegressionGateFailedChecks,
    all_green: p8RegressionGateFailedChecks.length === 0,
    close_candidate: p8RegressionGateFailedChecks.length === 0
  } as const;

  const p9RegressionGateChecks = {
    namespace_unified_governance_runtime_v4_ok:
      projectBoundary.unified_governance_runtime_digest_id ===
        "project_coordination_unified_runtime" &&
      projectBoundary.unified_governance_runtime_summary ===
        "project_coordination_runtime_unified" &&
      projectBoundary.unified_runtime_alignment_mode ===
        "project_runtime_aligned" &&
      getAssistantMemoryNamespaceUnifiedGovernanceRuntimeDigestId(
        assistantMetadata
      ) === projectBoundary.unified_governance_runtime_digest_id &&
      getAssistantMemoryNamespaceUnifiedGovernanceRuntimeSummary(
        assistantMetadata
      ) === projectBoundary.unified_governance_runtime_summary &&
      getAssistantMemoryNamespaceUnifiedRuntimeAlignmentMode(
        assistantMetadata
      ) === projectBoundary.unified_runtime_alignment_mode &&
      runtimeDebugMetadata.memory_namespace
        ?.unified_governance_runtime_digest_id ===
        projectBoundary.unified_governance_runtime_digest_id &&
      runtimeDebugMetadata.memory_namespace?.unified_governance_runtime_summary ===
        projectBoundary.unified_governance_runtime_summary &&
      runtimeDebugMetadata.memory_namespace?.unified_runtime_alignment_mode ===
        projectBoundary.unified_runtime_alignment_mode,
    retention_lifecycle_unification_v7_ok:
      compactedThreadSummary?.lifecycle_unification_digest ===
        "anchor_preservation_unification" &&
      compactedThreadSummary?.keep_drop_unification_summary ===
        "anchor_keep_unified" &&
      compactedThreadSummary?.lifecycle_unification_mode ===
        "anchor_runtime_unified" &&
      getAssistantThreadLifecycleUnificationDigest(assistantMetadata) ===
        compactedThreadSummary?.lifecycle_unification_digest &&
      getAssistantThreadKeepDropUnificationSummary(assistantMetadata) ===
        compactedThreadSummary?.keep_drop_unification_summary &&
      getAssistantThreadLifecycleUnificationMode(assistantMetadata) ===
        compactedThreadSummary?.lifecycle_unification_mode &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_unification_digest ===
        compactedThreadSummary?.lifecycle_unification_digest &&
      runtimeDebugMetadata.thread_compaction?.keep_drop_unification_summary ===
        compactedThreadSummary?.keep_drop_unification_summary &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_unification_mode ===
        compactedThreadSummary?.lifecycle_unification_mode,
    knowledge_governance_unification_v7_ok:
      knowledgeSummary.governance_unification_digest ===
        "authoritative_governance_unification" &&
      knowledgeSummary.source_budget_unification_summary ===
        "authoritative_budget_source_unified" &&
      knowledgeSummary.governance_unification_mode ===
        "authoritative_runtime_unified" &&
      getAssistantKnowledgeGovernanceUnificationDigest(assistantMetadata) ===
        knowledgeSummary.governance_unification_digest &&
      getAssistantKnowledgeSourceBudgetUnificationSummary(assistantMetadata) ===
        knowledgeSummary.source_budget_unification_summary &&
      getAssistantKnowledgeGovernanceUnificationMode(assistantMetadata) ===
        knowledgeSummary.governance_unification_mode &&
      runtimeDebugMetadata.knowledge.governance_unification_digest ===
        knowledgeSummary.governance_unification_digest &&
      runtimeDebugMetadata.knowledge.source_budget_unification_summary ===
        knowledgeSummary.source_budget_unification_summary &&
      runtimeDebugMetadata.knowledge.governance_unification_mode ===
        knowledgeSummary.governance_unification_mode,
    scenario_governance_unification_v7_ok:
      scenarioMemoryPack.governance_unification_digest_id ===
        "project_delivery_governance_unification" &&
      scenarioMemoryPack.strategy_unification_summary ===
        "project_delivery_strategy_unified" &&
      scenarioMemoryPack.orchestration_unification_mode ===
        "execution_runtime_unified" &&
      getAssistantMemoryScenarioPackGovernanceUnificationDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.governance_unification_digest_id &&
      getAssistantMemoryScenarioPackStrategyUnificationSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_unification_summary &&
      getAssistantMemoryScenarioPackOrchestrationUnificationMode(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_unification_mode &&
      runtimeDebugPack?.governance_unification_digest_id ===
        scenarioMemoryPack.governance_unification_digest_id &&
      runtimeDebugPack?.strategy_unification_summary ===
        scenarioMemoryPack.strategy_unification_summary &&
      runtimeDebugPack?.orchestration_unification_mode ===
        scenarioMemoryPack.orchestration_unification_mode &&
      systemPrompt.includes(
        "Current governance unification = project_delivery_governance_unification; strategy unification = project_delivery_strategy_unified; unification mode = execution_runtime_unified."
      ),
    unification_metadata_consistency_v7_ok:
      getAssistantMemoryNamespaceUnifiedGovernanceRuntimeDigestId(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace
          ?.unified_governance_runtime_digest_id &&
      getAssistantMemoryNamespaceUnifiedGovernanceRuntimeSummary(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace
          ?.unified_governance_runtime_summary &&
      getAssistantMemoryNamespaceUnifiedRuntimeAlignmentMode(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace?.unified_runtime_alignment_mode &&
      getAssistantThreadLifecycleUnificationDigest(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.lifecycle_unification_digest &&
      getAssistantThreadKeepDropUnificationSummary(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.keep_drop_unification_summary &&
      getAssistantThreadLifecycleUnificationMode(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.lifecycle_unification_mode &&
      getAssistantKnowledgeGovernanceUnificationDigest(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.governance_unification_digest &&
      getAssistantKnowledgeSourceBudgetUnificationSummary(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.source_budget_unification_summary &&
      getAssistantKnowledgeGovernanceUnificationMode(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.governance_unification_mode &&
      getAssistantMemoryScenarioPackGovernanceUnificationDigestId(
        assistantMetadata
      ) === runtimeDebugPack?.governance_unification_digest_id &&
      getAssistantMemoryScenarioPackStrategyUnificationSummary(
        assistantMetadata
      ) === runtimeDebugPack?.strategy_unification_summary &&
      getAssistantMemoryScenarioPackOrchestrationUnificationMode(
        assistantMetadata
      ) === runtimeDebugPack?.orchestration_unification_mode
  } as const;
  const p9RegressionGateFailedChecks = Object.entries(
    p9RegressionGateChecks
  ).flatMap(([check, passed]) => (passed ? [] : [check]));
  const p9RegressionGate = {
    ...p9RegressionGateChecks,
    checks_passed:
      Object.keys(p9RegressionGateChecks).length -
      p9RegressionGateFailedChecks.length,
    checks_total: Object.keys(p9RegressionGateChecks).length,
    failed_checks: p9RegressionGateFailedChecks,
    all_green: p9RegressionGateFailedChecks.length === 0,
    close_candidate: p9RegressionGateFailedChecks.length === 0
  } as const;

  const p10NamespaceConsolidationChecks = {
    namespace_governance_consolidation_v5_ok:
      projectBoundary.governance_consolidation_digest_id ===
        "project_coordination_governance_consolidation" &&
      projectBoundary.governance_consolidation_summary ===
        "project_coordination_runtime_consolidated" &&
      projectBoundary.runtime_consolidation_mode ===
        "project_runtime_consolidated" &&
      getAssistantMemoryNamespaceGovernanceConsolidationDigestId(
        assistantMetadata
      ) === projectBoundary.governance_consolidation_digest_id &&
      getAssistantMemoryNamespaceGovernanceConsolidationSummary(
        assistantMetadata
      ) === projectBoundary.governance_consolidation_summary &&
      getAssistantMemoryNamespaceRuntimeConsolidationMode(
        assistantMetadata
      ) === projectBoundary.runtime_consolidation_mode &&
      runtimeDebugMetadata.memory_namespace
        ?.governance_consolidation_digest_id ===
        projectBoundary.governance_consolidation_digest_id &&
      runtimeDebugMetadata.memory_namespace?.governance_consolidation_summary ===
        projectBoundary.governance_consolidation_summary &&
      runtimeDebugMetadata.memory_namespace?.runtime_consolidation_mode ===
        projectBoundary.runtime_consolidation_mode &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_consolidation_digest_id ===
        projectBoundary.governance_consolidation_digest_id &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_consolidation_summary ===
        projectBoundary.governance_consolidation_summary &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_runtime_consolidation_mode ===
        projectBoundary.runtime_consolidation_mode
  } as const;

  const projectUnifiedConsolidationContract =
    resolveNamespaceUnifiedGovernanceConsolidationContract(
      projectPrimaryNamespace
    );
  const projectGovernancePlaneContract =
    resolveNamespaceGovernancePlaneRuntimeContract(projectPrimaryNamespace);
  const projectGovernanceFabricContract =
    resolveNamespaceGovernanceFabricRuntimeContract(projectPrimaryNamespace);
  const projectGovernanceFabricPlaneContract =
    resolveNamespaceGovernanceFabricPlaneContract(projectPrimaryNamespace);
  const p12NamespaceGovernancePlaneChecks = {
    namespace_governance_plane_runtime_v7_ok:
      projectBoundary.governance_plane_runtime_digest_id ===
        "project_coordination_governance_plane" &&
      projectBoundary.governance_plane_runtime_summary ===
        "project_coordination_governance_plane_runtime" &&
      projectBoundary.governance_plane_alignment_mode ===
        "project_plane_aligned" &&
      projectBoundary.governance_plane_reuse_mode ===
        "project_coordination_governance_plane_reuse" &&
      projectGovernancePlaneContract.governance_plane_runtime_digest_id ===
        projectBoundary.governance_plane_runtime_digest_id &&
      projectGovernancePlaneContract.governance_plane_runtime_summary ===
        projectBoundary.governance_plane_runtime_summary &&
      projectGovernancePlaneContract.governance_plane_alignment_mode ===
        projectBoundary.governance_plane_alignment_mode &&
      projectGovernancePlaneContract.governance_plane_reuse_mode ===
        projectBoundary.governance_plane_reuse_mode &&
      getAssistantMemoryNamespaceGovernancePlaneRuntimeDigestId(
        assistantMetadata
      ) === projectBoundary.governance_plane_runtime_digest_id &&
      getAssistantMemoryNamespaceGovernancePlaneRuntimeSummary(
        assistantMetadata
      ) === projectBoundary.governance_plane_runtime_summary &&
      getAssistantMemoryNamespaceGovernancePlaneAlignmentMode(
        assistantMetadata
      ) === projectBoundary.governance_plane_alignment_mode &&
      getAssistantMemoryNamespaceGovernancePlaneReuseMode(
        assistantMetadata
      ) === projectBoundary.governance_plane_reuse_mode &&
      runtimeDebugMetadata.memory_namespace?.governance_plane_runtime_digest_id ===
        projectBoundary.governance_plane_runtime_digest_id &&
      runtimeDebugMetadata.memory_namespace?.governance_plane_runtime_summary ===
        projectBoundary.governance_plane_runtime_summary &&
      runtimeDebugMetadata.memory_namespace?.governance_plane_alignment_mode ===
        projectBoundary.governance_plane_alignment_mode &&
      runtimeDebugMetadata.memory_namespace?.governance_plane_reuse_mode ===
        projectBoundary.governance_plane_reuse_mode &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_plane_runtime_digest_id ===
        projectBoundary.governance_plane_runtime_digest_id &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_plane_runtime_summary ===
        projectBoundary.governance_plane_runtime_summary &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_plane_alignment_mode ===
        projectBoundary.governance_plane_alignment_mode &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_plane_reuse_mode ===
        projectBoundary.governance_plane_reuse_mode
  } as const;
  const p13NamespaceGovernanceFabricChecks = {
    namespace_governance_fabric_runtime_v8_ok:
      projectBoundary.governance_fabric_runtime_digest_id ===
        "project_coordination_governance_fabric" &&
      projectBoundary.governance_fabric_runtime_summary ===
        "project_coordination_governance_fabric_runtime" &&
      projectBoundary.governance_fabric_alignment_mode ===
        "project_fabric_aligned" &&
      projectBoundary.governance_fabric_reuse_mode ===
        "project_coordination_governance_fabric_reuse" &&
      projectGovernanceFabricContract.governance_fabric_runtime_digest_id ===
        projectBoundary.governance_fabric_runtime_digest_id &&
      projectGovernanceFabricContract.governance_fabric_runtime_summary ===
        projectBoundary.governance_fabric_runtime_summary &&
      projectGovernanceFabricContract.governance_fabric_alignment_mode ===
        projectBoundary.governance_fabric_alignment_mode &&
      projectGovernanceFabricContract.governance_fabric_reuse_mode ===
        projectBoundary.governance_fabric_reuse_mode &&
      getAssistantMemoryNamespaceGovernanceFabricRuntimeDigestId(
        assistantMetadata
      ) === projectBoundary.governance_fabric_runtime_digest_id &&
      getAssistantMemoryNamespaceGovernanceFabricRuntimeSummary(
        assistantMetadata
      ) === projectBoundary.governance_fabric_runtime_summary &&
      getAssistantMemoryNamespaceGovernanceFabricAlignmentMode(
        assistantMetadata
      ) === projectBoundary.governance_fabric_alignment_mode &&
      getAssistantMemoryNamespaceGovernanceFabricReuseMode(
        assistantMetadata
      ) === projectBoundary.governance_fabric_reuse_mode &&
      runtimeDebugMetadata.memory_namespace?.governance_fabric_runtime_digest_id ===
        projectBoundary.governance_fabric_runtime_digest_id &&
      runtimeDebugMetadata.memory_namespace?.governance_fabric_runtime_summary ===
        projectBoundary.governance_fabric_runtime_summary &&
      runtimeDebugMetadata.memory_namespace?.governance_fabric_alignment_mode ===
        projectBoundary.governance_fabric_alignment_mode &&
      runtimeDebugMetadata.memory_namespace?.governance_fabric_reuse_mode ===
        projectBoundary.governance_fabric_reuse_mode &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_fabric_runtime_digest_id ===
        projectBoundary.governance_fabric_runtime_digest_id &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_fabric_runtime_summary ===
        projectBoundary.governance_fabric_runtime_summary &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_fabric_alignment_mode ===
        projectBoundary.governance_fabric_alignment_mode &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_fabric_reuse_mode ===
        projectBoundary.governance_fabric_reuse_mode
  } as const;
  const p14NamespaceGovernanceFabricPlaneChecks = {
    namespace_governance_fabric_plane_v9_ok:
      projectBoundary.governance_fabric_plane_digest_id ===
        "project_coordination_governance_fabric_plane" &&
      projectBoundary.governance_fabric_plane_summary ===
        "project_coordination_governance_fabric_plane" &&
      projectBoundary.governance_fabric_plane_alignment_mode ===
        "project_fabric_plane_aligned" &&
      projectBoundary.governance_fabric_plane_reuse_mode ===
        "project_coordination_governance_fabric_plane_reuse" &&
      projectGovernanceFabricPlaneContract.governance_fabric_plane_digest_id ===
        projectBoundary.governance_fabric_plane_digest_id &&
      projectGovernanceFabricPlaneContract.governance_fabric_plane_summary ===
        projectBoundary.governance_fabric_plane_summary &&
      projectGovernanceFabricPlaneContract.governance_fabric_plane_alignment_mode ===
        projectBoundary.governance_fabric_plane_alignment_mode &&
      projectGovernanceFabricPlaneContract.governance_fabric_plane_reuse_mode ===
        projectBoundary.governance_fabric_plane_reuse_mode &&
      getAssistantMemoryNamespaceGovernanceFabricPlaneDigestId(
        assistantMetadata
      ) === projectBoundary.governance_fabric_plane_digest_id &&
      getAssistantMemoryNamespaceGovernanceFabricPlaneSummary(
        assistantMetadata
      ) === projectBoundary.governance_fabric_plane_summary &&
      getAssistantMemoryNamespaceGovernanceFabricPlaneAlignmentMode(
        assistantMetadata
      ) === projectBoundary.governance_fabric_plane_alignment_mode &&
      getAssistantMemoryNamespaceGovernanceFabricPlaneReuseMode(
        assistantMetadata
      ) === projectBoundary.governance_fabric_plane_reuse_mode &&
      runtimeDebugMetadata.memory_namespace?.governance_fabric_plane_digest_id ===
        projectBoundary.governance_fabric_plane_digest_id &&
      runtimeDebugMetadata.memory_namespace?.governance_fabric_plane_summary ===
        projectBoundary.governance_fabric_plane_summary &&
      runtimeDebugMetadata.memory_namespace
        ?.governance_fabric_plane_alignment_mode ===
        projectBoundary.governance_fabric_plane_alignment_mode &&
      runtimeDebugMetadata.memory_namespace
        ?.governance_fabric_plane_reuse_mode ===
        projectBoundary.governance_fabric_plane_reuse_mode &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_fabric_plane_digest_id ===
        projectBoundary.governance_fabric_plane_digest_id &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_fabric_plane_summary ===
        projectBoundary.governance_fabric_plane_summary &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_fabric_plane_alignment_mode ===
        projectBoundary.governance_fabric_plane_alignment_mode &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_fabric_plane_reuse_mode ===
        projectBoundary.governance_fabric_plane_reuse_mode
  } as const;
  const p11NamespaceUnifiedConsolidationChecks = {
    namespace_unified_governance_consolidation_v6_ok:
      projectBoundary.unified_governance_consolidation_digest_id ===
        "project_coordination_unified_governance_consolidation" &&
      projectBoundary.unified_governance_consolidation_summary ===
        "project_coordination_unified_runtime_consolidated" &&
      projectBoundary.unified_consolidation_alignment_mode ===
        "project_unified_runtime_consolidated" &&
      projectBoundary.unified_consolidation_reuse_mode ===
        "project_coordination_unified_consolidation_reuse" &&
      projectBoundary.unified_consolidation_coordination_summary ===
        "project_parallel_unified_coordination" &&
      projectBoundary.unified_consolidation_consistency_mode ===
        "project_unified_consistent" &&
      projectUnifiedConsolidationContract.unified_governance_consolidation_digest_id ===
        projectBoundary.unified_governance_consolidation_digest_id &&
      getAssistantMemoryNamespaceUnifiedGovernanceConsolidationDigestId(
        assistantMetadata
      ) === projectBoundary.unified_governance_consolidation_digest_id &&
      getAssistantMemoryNamespaceUnifiedGovernanceConsolidationSummary(
        assistantMetadata
      ) === projectBoundary.unified_governance_consolidation_summary &&
      getAssistantMemoryNamespaceUnifiedConsolidationAlignmentMode(
        assistantMetadata
      ) === projectBoundary.unified_consolidation_alignment_mode &&
      getAssistantMemoryNamespaceUnifiedConsolidationReuseMode(
        assistantMetadata
      ) === projectBoundary.unified_consolidation_reuse_mode &&
      getAssistantMemoryNamespaceUnifiedConsolidationCoordinationSummary(
        assistantMetadata
      ) === projectBoundary.unified_consolidation_coordination_summary &&
      getAssistantMemoryNamespaceUnifiedConsolidationConsistencyMode(
        assistantMetadata
      ) === projectBoundary.unified_consolidation_consistency_mode &&
      runtimeDebugMetadata.memory_namespace
        ?.unified_governance_consolidation_digest_id ===
        projectBoundary.unified_governance_consolidation_digest_id &&
      runtimeDebugMetadata.memory_namespace
        ?.unified_governance_consolidation_summary ===
        projectBoundary.unified_governance_consolidation_summary &&
      runtimeDebugMetadata.memory_namespace
        ?.unified_consolidation_alignment_mode ===
        projectBoundary.unified_consolidation_alignment_mode &&
      runtimeDebugMetadata.memory_namespace
        ?.unified_consolidation_reuse_mode ===
        projectBoundary.unified_consolidation_reuse_mode &&
      runtimeDebugMetadata.memory_namespace
        ?.unified_consolidation_coordination_summary ===
        projectBoundary.unified_consolidation_coordination_summary &&
      runtimeDebugMetadata.memory_namespace
        ?.unified_consolidation_consistency_mode ===
        projectBoundary.unified_consolidation_consistency_mode &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_unified_governance_consolidation_digest_id ===
        projectBoundary.unified_governance_consolidation_digest_id &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_unified_governance_consolidation_summary ===
        projectBoundary.unified_governance_consolidation_summary &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_unified_consolidation_alignment_mode ===
        projectBoundary.unified_consolidation_alignment_mode &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_unified_consolidation_reuse_mode ===
        projectBoundary.unified_consolidation_reuse_mode &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_unified_consolidation_coordination_summary ===
        projectBoundary.unified_consolidation_coordination_summary &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_unified_consolidation_consistency_mode ===
        projectBoundary.unified_consolidation_consistency_mode
  } as const;

  const p11RetentionCoordinationChecks = {
    retention_lifecycle_coordination_v9_ok:
      compactedThreadSummary?.lifecycle_coordination_digest ===
        "anchor_preservation_coordination" &&
      compactedThreadSummary?.keep_drop_consolidation_coordination_summary ===
        "anchor_keep_consolidation_coordination" &&
      compactedThreadSummary?.lifecycle_coordination_alignment_mode ===
        "anchor_consolidation_aligned" &&
      compactedThreadSummary?.keep_drop_runtime_coordination_summary ===
        "anchor_keep_runtime_coordination" &&
      compactedThreadSummary?.lifecycle_coordination_reuse_mode ===
        "anchor_runtime_coordination_reuse" &&
      getAssistantThreadLifecycleCoordinationDigest(assistantMetadata) ===
        compactedThreadSummary?.lifecycle_coordination_digest &&
      getAssistantThreadKeepDropConsolidationCoordinationSummary(
        assistantMetadata
      ) === compactedThreadSummary?.keep_drop_consolidation_coordination_summary &&
      getAssistantThreadLifecycleCoordinationAlignmentMode(
        assistantMetadata
      ) === compactedThreadSummary?.lifecycle_coordination_alignment_mode &&
      getAssistantThreadKeepDropRuntimeCoordinationSummary(
        assistantMetadata
      ) === compactedThreadSummary?.keep_drop_runtime_coordination_summary &&
      getAssistantThreadLifecycleCoordinationReuseMode(
        assistantMetadata
      ) === compactedThreadSummary?.lifecycle_coordination_reuse_mode &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_coordination_digest ===
        compactedThreadSummary?.lifecycle_coordination_digest &&
      runtimeDebugMetadata.thread_compaction
        ?.keep_drop_consolidation_coordination_summary ===
        compactedThreadSummary?.keep_drop_consolidation_coordination_summary &&
      runtimeDebugMetadata.thread_compaction
        ?.lifecycle_coordination_alignment_mode ===
        compactedThreadSummary?.lifecycle_coordination_alignment_mode &&
      runtimeDebugMetadata.thread_compaction
        ?.keep_drop_runtime_coordination_summary ===
        compactedThreadSummary?.keep_drop_runtime_coordination_summary &&
      runtimeDebugMetadata.thread_compaction
        ?.lifecycle_coordination_reuse_mode ===
        compactedThreadSummary?.lifecycle_coordination_reuse_mode &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle coordination digest: anchor_preservation_coordination."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Keep/drop consolidation coordination: anchor_keep_consolidation_coordination."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle coordination alignment: anchor_consolidation_aligned."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Keep/drop runtime coordination: anchor_keep_runtime_coordination."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle coordination reuse mode: anchor_runtime_coordination_reuse."
      ) &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "closed",
          retained_fields: ["focus_mode"],
          keep_drop_consolidation_coordination_summary:
            "closed_drop_consolidation_coordination",
          lifecycle_coordination_alignment_mode:
            "closed_consolidation_aligned",
          keep_drop_runtime_coordination_summary:
            "closed_drop_runtime_coordination",
          lifecycle_coordination_reuse_mode:
            "closed_runtime_coordination_reuse"
        }
      }).retain === false &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "paused",
          retention_budget: 1,
          keep_drop_consolidation_coordination_summary:
            "minimal_decay_consolidation_coordination",
          lifecycle_coordination_alignment_mode:
            "minimal_consolidation_aligned",
          keep_drop_runtime_coordination_summary:
            "minimal_decay_runtime_coordination",
          lifecycle_coordination_reuse_mode:
            "minimal_runtime_coordination_reuse"
        }
      }).retain === false
  } as const;

  const p12RetentionGovernancePlaneChecks = {
    retention_lifecycle_governance_plane_v10_ok:
      compactedThreadSummary?.lifecycle_governance_plane_digest ===
        "anchor_preservation_governance_plane" &&
      compactedThreadSummary?.keep_drop_governance_plane_summary ===
        "anchor_keep_governance_plane" &&
      compactedThreadSummary?.lifecycle_governance_plane_alignment_mode ===
        "anchor_governance_plane_aligned" &&
      compactedThreadSummary?.lifecycle_governance_plane_reuse_mode ===
        "anchor_runtime_governance_plane_reuse" &&
      getAssistantThreadLifecycleGovernancePlaneDigest(assistantMetadata) ===
        compactedThreadSummary?.lifecycle_governance_plane_digest &&
      getAssistantThreadKeepDropGovernancePlaneSummary(assistantMetadata) ===
        compactedThreadSummary?.keep_drop_governance_plane_summary &&
      getAssistantThreadLifecycleGovernancePlaneAlignmentMode(
        assistantMetadata
      ) === compactedThreadSummary?.lifecycle_governance_plane_alignment_mode &&
      getAssistantThreadLifecycleGovernancePlaneReuseMode(
        assistantMetadata
      ) === compactedThreadSummary?.lifecycle_governance_plane_reuse_mode &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_governance_plane_digest ===
        compactedThreadSummary?.lifecycle_governance_plane_digest &&
      runtimeDebugMetadata.thread_compaction
        ?.keep_drop_governance_plane_summary ===
        compactedThreadSummary?.keep_drop_governance_plane_summary &&
      runtimeDebugMetadata.thread_compaction
        ?.lifecycle_governance_plane_alignment_mode ===
        compactedThreadSummary?.lifecycle_governance_plane_alignment_mode &&
      runtimeDebugMetadata.thread_compaction
        ?.lifecycle_governance_plane_reuse_mode ===
        compactedThreadSummary?.lifecycle_governance_plane_reuse_mode &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle governance plane: anchor_preservation_governance_plane."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Keep/drop governance plane: anchor_keep_governance_plane."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle governance plane alignment: anchor_governance_plane_aligned."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle governance plane reuse: anchor_runtime_governance_plane_reuse."
      ) &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "closed",
          retained_fields: ["focus_mode"],
          keep_drop_governance_plane_summary: "closed_drop_governance_plane",
          lifecycle_governance_plane_alignment_mode:
            "closed_governance_plane_aligned",
          lifecycle_governance_plane_reuse_mode:
            "closed_runtime_governance_plane_reuse"
        }
      }).retain === false &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "paused",
          retention_budget: 1,
          keep_drop_governance_plane_summary: "minimal_decay_governance_plane",
          lifecycle_governance_plane_alignment_mode:
            "minimal_governance_plane_aligned",
          lifecycle_governance_plane_reuse_mode:
            "minimal_runtime_governance_plane_reuse"
        }
      }).retain === false
  } as const;

  const p13RetentionGovernanceFabricChecks = {
    retention_lifecycle_governance_fabric_v11_ok:
      compactedThreadSummary?.lifecycle_governance_fabric_digest ===
        "anchor_preservation_governance_fabric" &&
      compactedThreadSummary?.keep_drop_governance_fabric_summary ===
        "anchor_keep_governance_fabric" &&
      compactedThreadSummary?.lifecycle_governance_fabric_alignment_mode ===
        "anchor_governance_fabric_aligned" &&
      compactedThreadSummary?.lifecycle_governance_fabric_reuse_mode ===
        "anchor_runtime_governance_fabric_reuse" &&
      getAssistantThreadLifecycleGovernanceFabricDigest(assistantMetadata) ===
        compactedThreadSummary?.lifecycle_governance_fabric_digest &&
      getAssistantThreadKeepDropGovernanceFabricSummary(assistantMetadata) ===
        compactedThreadSummary?.keep_drop_governance_fabric_summary &&
      getAssistantThreadLifecycleGovernanceFabricAlignmentMode(
        assistantMetadata
      ) === compactedThreadSummary?.lifecycle_governance_fabric_alignment_mode &&
      getAssistantThreadLifecycleGovernanceFabricReuseMode(
        assistantMetadata
      ) === compactedThreadSummary?.lifecycle_governance_fabric_reuse_mode &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_governance_fabric_digest ===
        compactedThreadSummary?.lifecycle_governance_fabric_digest &&
      runtimeDebugMetadata.thread_compaction
        ?.keep_drop_governance_fabric_summary ===
        compactedThreadSummary?.keep_drop_governance_fabric_summary &&
      runtimeDebugMetadata.thread_compaction
        ?.lifecycle_governance_fabric_alignment_mode ===
        compactedThreadSummary?.lifecycle_governance_fabric_alignment_mode &&
      runtimeDebugMetadata.thread_compaction
        ?.lifecycle_governance_fabric_reuse_mode ===
        compactedThreadSummary?.lifecycle_governance_fabric_reuse_mode &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle governance fabric: anchor_preservation_governance_fabric."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Keep/drop governance fabric: anchor_keep_governance_fabric."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle governance fabric alignment: anchor_governance_fabric_aligned."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle governance fabric reuse: anchor_runtime_governance_fabric_reuse."
      ) &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "closed",
          retained_fields: ["focus_mode"],
          keep_drop_governance_fabric_summary:
            "closed_drop_governance_fabric",
          lifecycle_governance_fabric_alignment_mode:
            "closed_governance_fabric_aligned",
          lifecycle_governance_fabric_reuse_mode:
            "closed_runtime_governance_fabric_reuse"
        }
      }).retain === false &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "paused",
          retention_budget: 1,
          keep_drop_governance_fabric_summary:
            "minimal_decay_governance_fabric",
          lifecycle_governance_fabric_alignment_mode:
            "minimal_governance_fabric_aligned",
          lifecycle_governance_fabric_reuse_mode:
            "minimal_runtime_governance_fabric_reuse"
        }
      }).retain === false
  } as const;

  const p14RetentionGovernanceFabricPlaneChecks = {
    retention_lifecycle_governance_fabric_plane_v12_ok:
      compactedThreadSummary?.lifecycle_governance_fabric_plane_digest ===
        "anchor_preservation_governance_fabric_plane" &&
      compactedThreadSummary?.keep_drop_governance_fabric_plane_summary ===
        "anchor_keep_governance_fabric_plane" &&
      compactedThreadSummary?.lifecycle_governance_fabric_plane_alignment_mode ===
        "anchor_governance_fabric_plane_aligned" &&
      compactedThreadSummary?.lifecycle_governance_fabric_plane_reuse_mode ===
        "anchor_runtime_governance_fabric_plane_reuse" &&
      getAssistantThreadLifecycleGovernanceFabricPlaneDigest(
        assistantMetadata
      ) === compactedThreadSummary?.lifecycle_governance_fabric_plane_digest &&
      getAssistantThreadKeepDropGovernanceFabricPlaneSummary(
        assistantMetadata
      ) ===
        compactedThreadSummary?.keep_drop_governance_fabric_plane_summary &&
      getAssistantThreadLifecycleGovernanceFabricPlaneAlignmentMode(
        assistantMetadata
      ) ===
        compactedThreadSummary?.lifecycle_governance_fabric_plane_alignment_mode &&
      getAssistantThreadLifecycleGovernanceFabricPlaneReuseMode(
        assistantMetadata
      ) ===
        compactedThreadSummary?.lifecycle_governance_fabric_plane_reuse_mode &&
      runtimeDebugMetadata.thread_compaction
        ?.lifecycle_governance_fabric_plane_digest ===
        compactedThreadSummary?.lifecycle_governance_fabric_plane_digest &&
      runtimeDebugMetadata.thread_compaction
        ?.keep_drop_governance_fabric_plane_summary ===
        compactedThreadSummary?.keep_drop_governance_fabric_plane_summary &&
      runtimeDebugMetadata.thread_compaction
        ?.lifecycle_governance_fabric_plane_alignment_mode ===
        compactedThreadSummary?.lifecycle_governance_fabric_plane_alignment_mode &&
      runtimeDebugMetadata.thread_compaction
        ?.lifecycle_governance_fabric_plane_reuse_mode ===
        compactedThreadSummary?.lifecycle_governance_fabric_plane_reuse_mode &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle governance fabric plane: anchor_preservation_governance_fabric_plane."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Keep/drop governance fabric plane: anchor_keep_governance_fabric_plane."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle governance fabric plane alignment: anchor_governance_fabric_plane_aligned."
      ) &&
      getAssistantCompactedThreadSummaryText(assistantMetadata)?.includes(
        "Lifecycle governance fabric plane reuse: anchor_runtime_governance_fabric_plane_reuse."
      ) &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "closed",
          retained_fields: ["focus_mode"],
          keep_drop_governance_fabric_plane_summary:
            "closed_drop_governance_fabric_plane",
          lifecycle_governance_fabric_plane_alignment_mode:
            "closed_governance_fabric_plane_aligned",
          lifecycle_governance_fabric_plane_reuse_mode:
            "closed_runtime_governance_fabric_plane_reuse"
        }
      }).retain === false &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "paused",
          retention_budget: 1,
          keep_drop_governance_fabric_plane_summary:
            "minimal_decay_governance_fabric_plane",
          lifecycle_governance_fabric_plane_alignment_mode:
            "minimal_governance_fabric_plane_aligned",
          lifecycle_governance_fabric_plane_reuse_mode:
            "minimal_runtime_governance_fabric_plane_reuse"
        }
      }).retain === false
  } as const;

  const p11KnowledgeCoordinationChecks = {
    knowledge_governance_coordination_v9_ok:
      knowledgeSummary.governance_coordination_digest ===
        "authoritative_governance_coordination" &&
      knowledgeSummary.source_budget_coordination_summary ===
        "authoritative_budget_source_coordination" &&
      knowledgeSummary.governance_coordination_mode_v9 ===
        "authoritative_runtime_coordination" &&
      knowledgeSummary.selection_runtime_coordination_summary ===
        "authoritative_selection_runtime_coordination" &&
      knowledgeSummary.governance_coordination_reuse_mode ===
        "authoritative_runtime_coordination_reuse" &&
      getAssistantKnowledgeGovernanceCoordinationDigest(assistantMetadata) ===
        knowledgeSummary.governance_coordination_digest &&
      getAssistantKnowledgeSourceBudgetCoordinationSummary(
        assistantMetadata
      ) === knowledgeSummary.source_budget_coordination_summary &&
      getAssistantKnowledgeGovernanceCoordinationModeV9(
        assistantMetadata
      ) === knowledgeSummary.governance_coordination_mode_v9 &&
      getAssistantKnowledgeSelectionRuntimeCoordinationSummary(
        assistantMetadata
      ) === knowledgeSummary.selection_runtime_coordination_summary &&
      getAssistantKnowledgeGovernanceCoordinationReuseMode(
        assistantMetadata
      ) === knowledgeSummary.governance_coordination_reuse_mode &&
      runtimeDebugMetadata.knowledge.governance_coordination_digest ===
        knowledgeSummary.governance_coordination_digest &&
      runtimeDebugMetadata.knowledge.source_budget_coordination_summary ===
        knowledgeSummary.source_budget_coordination_summary &&
      runtimeDebugMetadata.knowledge.governance_coordination_mode_v9 ===
        knowledgeSummary.governance_coordination_mode_v9 &&
      runtimeDebugMetadata.knowledge.selection_runtime_coordination_summary ===
        knowledgeSummary.selection_runtime_coordination_summary &&
      runtimeDebugMetadata.knowledge.governance_coordination_reuse_mode ===
        knowledgeSummary.governance_coordination_reuse_mode &&
      selectedKnowledgeForPrompt[0]?.title === "Onboarding checklist guide" &&
      referenceOnlyProjectOpsSelection.length === 1 &&
      referenceOnlyProjectOpsSelection[0]?.title ===
        "General delivery note"
  } as const;

  const p12KnowledgeGovernancePlaneChecks = {
    knowledge_governance_plane_v10_ok:
      knowledgeSummary.governance_plane_digest ===
        "authoritative_governance_plane" &&
      knowledgeSummary.source_budget_governance_plane_summary ===
        "authoritative_budget_source_governance_plane" &&
      knowledgeSummary.governance_plane_mode ===
        "authoritative_runtime_governance_plane" &&
      knowledgeSummary.governance_plane_reuse_mode ===
        "authoritative_runtime_governance_plane_reuse" &&
      getAssistantKnowledgeGovernancePlaneDigest(assistantMetadata) ===
        knowledgeSummary.governance_plane_digest &&
      getAssistantKnowledgeSourceBudgetGovernancePlaneSummary(
        assistantMetadata
      ) === knowledgeSummary.source_budget_governance_plane_summary &&
      getAssistantKnowledgeGovernancePlaneMode(assistantMetadata) ===
        knowledgeSummary.governance_plane_mode &&
      getAssistantKnowledgeGovernancePlaneReuseMode(assistantMetadata) ===
        knowledgeSummary.governance_plane_reuse_mode &&
      runtimeDebugMetadata.knowledge.governance_plane_digest ===
        knowledgeSummary.governance_plane_digest &&
      runtimeDebugMetadata.knowledge.source_budget_governance_plane_summary ===
        knowledgeSummary.source_budget_governance_plane_summary &&
      runtimeDebugMetadata.knowledge.governance_plane_mode ===
        knowledgeSummary.governance_plane_mode &&
      runtimeDebugMetadata.knowledge.governance_plane_reuse_mode ===
        knowledgeSummary.governance_plane_reuse_mode &&
      selectedKnowledgeForPrompt[0]?.title === "Onboarding checklist guide" &&
      referenceOnlyProjectOpsSelection.length === 1
  } as const;

  const p13KnowledgeGovernanceFabricChecks = {
    knowledge_governance_fabric_v11_ok:
      knowledgeSummary.governance_fabric_digest ===
        "authoritative_governance_fabric" &&
      knowledgeSummary.source_budget_governance_fabric_summary ===
        "authoritative_budget_source_governance_fabric" &&
      knowledgeSummary.governance_fabric_mode ===
        "authoritative_runtime_governance_fabric" &&
      knowledgeSummary.governance_fabric_reuse_mode ===
        "authoritative_runtime_governance_fabric_reuse" &&
      getAssistantKnowledgeGovernanceFabricDigest(assistantMetadata) ===
        knowledgeSummary.governance_fabric_digest &&
      getAssistantKnowledgeSourceBudgetGovernanceFabricSummary(
        assistantMetadata
      ) === knowledgeSummary.source_budget_governance_fabric_summary &&
      getAssistantKnowledgeGovernanceFabricMode(assistantMetadata) ===
        knowledgeSummary.governance_fabric_mode &&
      getAssistantKnowledgeGovernanceFabricReuseMode(assistantMetadata) ===
        knowledgeSummary.governance_fabric_reuse_mode &&
      runtimeDebugMetadata.knowledge.governance_fabric_digest ===
        knowledgeSummary.governance_fabric_digest &&
      runtimeDebugMetadata.knowledge
        .source_budget_governance_fabric_summary ===
        knowledgeSummary.source_budget_governance_fabric_summary &&
      runtimeDebugMetadata.knowledge.governance_fabric_mode ===
        knowledgeSummary.governance_fabric_mode &&
      runtimeDebugMetadata.knowledge.governance_fabric_reuse_mode ===
        knowledgeSummary.governance_fabric_reuse_mode &&
      selectedKnowledgeForPrompt[0]?.title === "Onboarding checklist guide" &&
      referenceOnlyProjectOpsSelection.length === 1
  } as const;

  const p14KnowledgeGovernanceFabricPlaneChecks = {
    knowledge_governance_fabric_plane_v12_ok:
      knowledgeSummary.governance_fabric_plane_digest ===
        "authoritative_governance_fabric_plane" &&
      knowledgeSummary.source_budget_governance_fabric_plane_summary ===
        "authoritative_budget_source_governance_fabric_plane" &&
      knowledgeSummary.governance_fabric_plane_mode ===
        "authoritative_runtime_governance_fabric_plane" &&
      knowledgeSummary.governance_fabric_plane_reuse_mode ===
        "authoritative_runtime_governance_fabric_plane_reuse" &&
      getAssistantKnowledgeGovernanceFabricPlaneDigest(assistantMetadata) ===
        knowledgeSummary.governance_fabric_plane_digest &&
      getAssistantKnowledgeSourceBudgetGovernanceFabricPlaneSummary(
        assistantMetadata
      ) === knowledgeSummary.source_budget_governance_fabric_plane_summary &&
      getAssistantKnowledgeGovernanceFabricPlaneMode(assistantMetadata) ===
        knowledgeSummary.governance_fabric_plane_mode &&
      getAssistantKnowledgeGovernanceFabricPlaneReuseMode(assistantMetadata) ===
        knowledgeSummary.governance_fabric_plane_reuse_mode &&
      runtimeDebugMetadata.knowledge.governance_fabric_plane_digest ===
        knowledgeSummary.governance_fabric_plane_digest &&
      runtimeDebugMetadata.knowledge
        .source_budget_governance_fabric_plane_summary ===
        knowledgeSummary.source_budget_governance_fabric_plane_summary &&
      runtimeDebugMetadata.knowledge.governance_fabric_plane_mode ===
        knowledgeSummary.governance_fabric_plane_mode &&
      runtimeDebugMetadata.knowledge.governance_fabric_plane_reuse_mode ===
        knowledgeSummary.governance_fabric_plane_reuse_mode
  } as const;

  const p11ScenarioCoordinationChecks = {
    scenario_governance_coordination_v9_ok:
      scenarioMemoryPack.governance_coordination_digest_id ===
        "project_delivery_governance_coordination" &&
      scenarioMemoryPack.strategy_runtime_coordination_summary ===
        "project_delivery_strategy_runtime_coordination" &&
      scenarioMemoryPack.orchestration_coordination_mode_v9 ===
        "execution_runtime_coordination" &&
      scenarioMemoryPack.strategy_runtime_reuse_summary ===
        "project_delivery_strategy_runtime_reuse" &&
      scenarioMemoryPack.governance_coordination_reuse_mode ===
        "execution_runtime_coordination_reuse" &&
      getAssistantMemoryScenarioPackGovernanceCoordinationDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.governance_coordination_digest_id &&
      getAssistantMemoryScenarioPackStrategyRuntimeCoordinationSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_runtime_coordination_summary &&
      getAssistantMemoryScenarioPackOrchestrationCoordinationModeV9(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_coordination_mode_v9 &&
      getAssistantMemoryScenarioPackStrategyRuntimeReuseSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_runtime_reuse_summary &&
      getAssistantMemoryScenarioPackGovernanceCoordinationReuseMode(
        assistantMetadata
      ) === scenarioMemoryPack.governance_coordination_reuse_mode &&
      runtimeDebugMetadata.memory.pack?.governance_coordination_digest_id ===
        scenarioMemoryPack.governance_coordination_digest_id &&
      runtimeDebugMetadata.memory.pack?.strategy_runtime_coordination_summary ===
        scenarioMemoryPack.strategy_runtime_coordination_summary &&
      runtimeDebugMetadata.memory.pack?.orchestration_coordination_mode_v9 ===
        scenarioMemoryPack.orchestration_coordination_mode_v9 &&
      runtimeDebugMetadata.memory.pack?.strategy_runtime_reuse_summary ===
        scenarioMemoryPack.strategy_runtime_reuse_summary &&
      runtimeDebugMetadata.memory.pack?.governance_coordination_reuse_mode ===
        scenarioMemoryPack.governance_coordination_reuse_mode
  } as const;

  const p12ScenarioGovernancePlaneChecks = {
    scenario_governance_plane_v10_ok:
      scenarioMemoryPack.governance_plane_digest_id ===
        "project_delivery_governance_plane" &&
      scenarioMemoryPack.strategy_governance_plane_summary ===
        "project_delivery_strategy_governance_plane" &&
      scenarioMemoryPack.orchestration_governance_plane_mode ===
        "execution_runtime_governance_plane" &&
      scenarioMemoryPack.governance_plane_reuse_mode ===
        "execution_runtime_governance_plane_reuse" &&
      getAssistantMemoryScenarioPackGovernancePlaneDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.governance_plane_digest_id &&
      getAssistantMemoryScenarioPackStrategyGovernancePlaneSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_governance_plane_summary &&
      getAssistantMemoryScenarioPackOrchestrationGovernancePlaneMode(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_governance_plane_mode &&
      getAssistantMemoryScenarioPackGovernancePlaneReuseMode(
        assistantMetadata
      ) === scenarioMemoryPack.governance_plane_reuse_mode &&
      runtimeDebugMetadata.memory.pack?.governance_plane_digest_id ===
        scenarioMemoryPack.governance_plane_digest_id &&
      runtimeDebugMetadata.memory.pack?.strategy_governance_plane_summary ===
        scenarioMemoryPack.strategy_governance_plane_summary &&
      runtimeDebugMetadata.memory.pack?.orchestration_governance_plane_mode ===
        scenarioMemoryPack.orchestration_governance_plane_mode &&
      runtimeDebugMetadata.memory.pack?.governance_plane_reuse_mode ===
        scenarioMemoryPack.governance_plane_reuse_mode
  } as const;

  const p13ScenarioGovernanceFabricChecks = {
    scenario_governance_fabric_v11_ok:
      scenarioMemoryPack.governance_fabric_digest_id ===
        "project_delivery_governance_fabric" &&
      scenarioMemoryPack.strategy_governance_fabric_summary ===
        "project_delivery_strategy_governance_fabric" &&
      scenarioMemoryPack.orchestration_governance_fabric_mode ===
        "execution_runtime_governance_fabric" &&
      scenarioMemoryPack.governance_fabric_reuse_mode ===
        "execution_runtime_governance_fabric_reuse" &&
      getAssistantMemoryScenarioPackGovernanceFabricDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.governance_fabric_digest_id &&
      getAssistantMemoryScenarioPackStrategyGovernanceFabricSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_governance_fabric_summary &&
      getAssistantMemoryScenarioPackOrchestrationGovernanceFabricMode(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_governance_fabric_mode &&
      getAssistantMemoryScenarioPackGovernanceFabricReuseMode(
        assistantMetadata
      ) === scenarioMemoryPack.governance_fabric_reuse_mode &&
      runtimeDebugMetadata.memory.pack?.governance_fabric_digest_id ===
        scenarioMemoryPack.governance_fabric_digest_id &&
      runtimeDebugMetadata.memory.pack?.strategy_governance_fabric_summary ===
        scenarioMemoryPack.strategy_governance_fabric_summary &&
      runtimeDebugMetadata.memory.pack?.orchestration_governance_fabric_mode ===
        scenarioMemoryPack.orchestration_governance_fabric_mode &&
      runtimeDebugMetadata.memory.pack?.governance_fabric_reuse_mode ===
        scenarioMemoryPack.governance_fabric_reuse_mode
  } as const;

  const p14ScenarioGovernanceFabricPlaneChecks = {
    scenario_governance_fabric_plane_v12_ok:
      scenarioMemoryPack.governance_fabric_plane_digest_id ===
        "project_delivery_governance_fabric_plane" &&
      scenarioMemoryPack.strategy_governance_fabric_plane_summary ===
        "project_delivery_strategy_governance_fabric_plane" &&
      scenarioMemoryPack.orchestration_governance_fabric_plane_mode ===
        "execution_runtime_governance_fabric_plane" &&
      scenarioMemoryPack.governance_fabric_plane_reuse_mode ===
        "execution_runtime_governance_fabric_plane_reuse" &&
      getAssistantMemoryScenarioPackGovernanceFabricPlaneDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.governance_fabric_plane_digest_id &&
      getAssistantMemoryScenarioPackStrategyGovernanceFabricPlaneSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_governance_fabric_plane_summary &&
      getAssistantMemoryScenarioPackOrchestrationGovernanceFabricPlaneMode(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_governance_fabric_plane_mode &&
      getAssistantMemoryScenarioPackGovernanceFabricPlaneReuseMode(
        assistantMetadata
      ) === scenarioMemoryPack.governance_fabric_plane_reuse_mode &&
      runtimeDebugMetadata.memory.pack?.governance_fabric_plane_digest_id ===
        scenarioMemoryPack.governance_fabric_plane_digest_id &&
      runtimeDebugMetadata.memory.pack
        ?.strategy_governance_fabric_plane_summary ===
        scenarioMemoryPack.strategy_governance_fabric_plane_summary &&
      runtimeDebugMetadata.memory.pack
        ?.orchestration_governance_fabric_plane_mode ===
        scenarioMemoryPack.orchestration_governance_fabric_plane_mode &&
      runtimeDebugMetadata.memory.pack?.governance_fabric_plane_reuse_mode ===
        scenarioMemoryPack.governance_fabric_plane_reuse_mode
  } as const;

  const p13PositiveContractChecks = {
    ...p13NamespaceGovernanceFabricChecks,
    ...p13RetentionGovernanceFabricChecks,
    ...p13KnowledgeGovernanceFabricChecks,
    ...p13ScenarioGovernanceFabricChecks
  } as const;
  const p13MetadataConsistencyChecks = {
    fabric_metadata_consistency_v11_ok:
      getAssistantMemoryNamespaceGovernanceFabricRuntimeDigestId(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace?.governance_fabric_runtime_digest_id &&
      getAssistantMemoryNamespaceGovernanceFabricRuntimeSummary(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace?.governance_fabric_runtime_summary &&
      getAssistantMemoryNamespaceGovernanceFabricAlignmentMode(
        assistantMetadata
      ) === runtimeDebugMetadata.memory_namespace?.governance_fabric_alignment_mode &&
      getAssistantMemoryNamespaceGovernanceFabricReuseMode(
        assistantMetadata
      ) === runtimeDebugMetadata.memory_namespace?.governance_fabric_reuse_mode &&
      getAssistantMemoryNamespaceGovernanceFabricRuntimeDigestId(
        assistantMetadata
      ) ===
        runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
          ?.namespace_governance_fabric_runtime_digest_id &&
      getAssistantMemoryNamespaceGovernanceFabricRuntimeSummary(
        assistantMetadata
      ) ===
        runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
          ?.namespace_governance_fabric_runtime_summary &&
      getAssistantMemoryNamespaceGovernanceFabricAlignmentMode(
        assistantMetadata
      ) ===
        runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
          ?.namespace_governance_fabric_alignment_mode &&
      getAssistantMemoryNamespaceGovernanceFabricReuseMode(
        assistantMetadata
      ) ===
        runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
          ?.namespace_governance_fabric_reuse_mode &&
      getAssistantThreadLifecycleGovernanceFabricDigest(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.lifecycle_governance_fabric_digest &&
      getAssistantThreadKeepDropGovernanceFabricSummary(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.keep_drop_governance_fabric_summary &&
      getAssistantThreadLifecycleGovernanceFabricAlignmentMode(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.thread_compaction
          ?.lifecycle_governance_fabric_alignment_mode &&
      getAssistantThreadLifecycleGovernanceFabricReuseMode(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.thread_compaction
          ?.lifecycle_governance_fabric_reuse_mode &&
      getAssistantKnowledgeGovernanceFabricDigest(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.governance_fabric_digest &&
      getAssistantKnowledgeSourceBudgetGovernanceFabricSummary(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.knowledge
          .source_budget_governance_fabric_summary &&
      getAssistantKnowledgeGovernanceFabricMode(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.governance_fabric_mode &&
      getAssistantKnowledgeGovernanceFabricReuseMode(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.governance_fabric_reuse_mode &&
      getAssistantMemoryScenarioPackGovernanceFabricDigestId(
        assistantMetadata
      ) === runtimeDebugPack?.governance_fabric_digest_id &&
      getAssistantMemoryScenarioPackStrategyGovernanceFabricSummary(
        assistantMetadata
      ) === runtimeDebugPack?.strategy_governance_fabric_summary &&
      getAssistantMemoryScenarioPackOrchestrationGovernanceFabricMode(
        assistantMetadata
      ) === runtimeDebugPack?.orchestration_governance_fabric_mode &&
      getAssistantMemoryScenarioPackGovernanceFabricReuseMode(
        assistantMetadata
      ) === runtimeDebugPack?.governance_fabric_reuse_mode
  } as const;
  const p13DriftGuardChecks = {
    fabric_drift_guard_v11_ok:
      threadBoundary.retrieval_fallback_mode === "strict_no_timeline" &&
      threadScopedRoutes.join(",") === "thread_state,profile,episode" &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "closed",
          retained_fields: ["focus_mode"],
          keep_drop_governance_fabric_summary:
            "closed_drop_governance_fabric",
          lifecycle_governance_fabric_alignment_mode:
            "closed_governance_fabric_aligned",
          lifecycle_governance_fabric_reuse_mode:
            "closed_runtime_governance_fabric_reuse"
        }
      }).retain === false &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "paused",
          retention_budget: 1,
          keep_drop_governance_fabric_summary:
            "minimal_decay_governance_fabric",
          lifecycle_governance_fabric_alignment_mode:
            "minimal_governance_fabric_aligned",
          lifecycle_governance_fabric_reuse_mode:
            "minimal_runtime_governance_fabric_reuse"
        }
      }).retain === false &&
      referenceOnlyProjectOpsSelection.length === 1 &&
      referenceOnlyProjectOpsSelection[0]?.title === "General delivery note" &&
      selectedKnowledgeForPrompt[0]?.title === "Onboarding checklist guide" &&
      !defaultScenarioMemoryPackPrompt.includes("General reply policy"),
    scenario_fabric_drift_guard_v11_ok:
      defaultScenarioMemoryPack.governance_fabric_digest_id ===
        "continuity_governance_fabric" &&
      defaultScenarioMemoryPack.strategy_governance_fabric_summary ===
        "continuity_strategy_governance_fabric" &&
      defaultScenarioMemoryPack.orchestration_governance_fabric_mode ===
        "continuity_runtime_governance_fabric" &&
      defaultScenarioMemoryPack.governance_fabric_reuse_mode ===
        "continuity_runtime_governance_fabric_reuse" &&
      !defaultScenarioMemoryPackPrompt.includes(
        "project_delivery_policy"
      ) &&
      !defaultScenarioMemoryPackPrompt.includes(
        "project_delivery_governance_fabric"
      ) &&
      worldKnowledgeDrivenScenarioMemoryPack.pack_id === "companion" &&
      worldKnowledgeDrivenScenarioMemoryPack.governance_fabric_digest_id ===
        "knowledge_guided_governance_fabric" &&
      worldKnowledgeDrivenScenarioMemoryPack.strategy_governance_fabric_summary ===
        "knowledge_guided_strategy_governance_fabric" &&
      worldKnowledgeDrivenScenarioMemoryPack.orchestration_governance_fabric_mode ===
        "knowledge_guided_runtime_governance_fabric" &&
      worldKnowledgeDrivenScenarioMemoryPack.governance_fabric_reuse_mode ===
        "knowledge_guided_runtime_governance_fabric_reuse" &&
      !worldKnowledgeDrivenScenarioMemoryPackPrompt.includes(
        "project_delivery_policy"
      ) &&
      !worldKnowledgeDrivenScenarioMemoryPackPrompt.includes(
        "project_delivery_governance_fabric"
      ) &&
      scenarioMemoryPack.governance_fabric_digest_id ===
        "project_delivery_governance_fabric" &&
      getAssistantMemoryScenarioPackGovernanceFabricDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.governance_fabric_digest_id &&
      runtimeDebugPack?.governance_fabric_digest_id ===
        scenarioMemoryPack.governance_fabric_digest_id
  } as const;
  const p13PositiveContracts = summarizeGate(p13PositiveContractChecks);
  const p13MetadataConsistency = summarizeGate(p13MetadataConsistencyChecks);
  const p13DriftGuards = summarizeGate(p13DriftGuardChecks);
  const p13RegressionGateChecks = {
    ...p13PositiveContractChecks,
    ...p13MetadataConsistencyChecks,
    ...p13DriftGuardChecks
  } as const;
  const p13RegressionGateSummary = summarizeGate(p13RegressionGateChecks);
  const p13RegressionGate = {
    positive_contracts: p13PositiveContracts,
    metadata_consistency: p13MetadataConsistency,
    drift_guards: p13DriftGuards,
    ...p13RegressionGateSummary
  } as const;
  const p13GateSnapshot = {
    gate_id: "p13_regression_gate_v1",
    stage: "P13-5",
    focus: "regression_acceptance_expansion",
    blocking_items: [] as string[],
    next_expansion_focus: [
      "scenario_negative_coverage",
      "close_readiness_consumption",
      "remaining_acceptance_gaps"
    ] as const,
    positive_contracts: {
      checks_passed: p13PositiveContracts.checks_passed,
      checks_total: p13PositiveContracts.checks_total,
      all_green: p13PositiveContracts.all_green
    },
    metadata_consistency: {
      checks_passed: p13MetadataConsistency.checks_passed,
      checks_total: p13MetadataConsistency.checks_total,
      all_green: p13MetadataConsistency.all_green
    },
    drift_guards: {
      checks_passed: p13DriftGuards.checks_passed,
      checks_total: p13DriftGuards.checks_total,
      all_green: p13DriftGuards.all_green
    },
    overall: {
      checks_passed: p13RegressionGate.checks_passed,
      checks_total: p13RegressionGate.checks_total,
      failed_checks: p13RegressionGate.failed_checks,
      all_green: p13RegressionGate.all_green,
      close_candidate: p13RegressionGate.close_candidate
    }
  } as const;
  const p14PositiveContractChecks = {
    ...p14NamespaceGovernanceFabricPlaneChecks,
    ...p14RetentionGovernanceFabricPlaneChecks,
    ...p14KnowledgeGovernanceFabricPlaneChecks,
    ...p14ScenarioGovernanceFabricPlaneChecks
  } as const;
  const p14MetadataConsistencyChecks = {
    fabric_plane_metadata_consistency_v12_ok:
      getAssistantMemoryNamespaceGovernanceFabricPlaneDigestId(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace?.governance_fabric_plane_digest_id &&
      getAssistantMemoryNamespaceGovernanceFabricPlaneSummary(
        assistantMetadata
      ) === runtimeDebugMetadata.memory_namespace?.governance_fabric_plane_summary &&
      getAssistantMemoryNamespaceGovernanceFabricPlaneAlignmentMode(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace
          ?.governance_fabric_plane_alignment_mode &&
      getAssistantMemoryNamespaceGovernanceFabricPlaneReuseMode(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace?.governance_fabric_plane_reuse_mode &&
      getAssistantMemoryNamespaceGovernanceFabricPlaneDigestId(
        assistantMetadata
      ) ===
        runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
          ?.namespace_governance_fabric_plane_digest_id &&
      getAssistantMemoryNamespaceGovernanceFabricPlaneSummary(
        assistantMetadata
      ) ===
        runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
          ?.namespace_governance_fabric_plane_summary &&
      getAssistantMemoryNamespaceGovernanceFabricPlaneAlignmentMode(
        assistantMetadata
      ) ===
        runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
          ?.namespace_governance_fabric_plane_alignment_mode &&
      getAssistantMemoryNamespaceGovernanceFabricPlaneReuseMode(
        assistantMetadata
      ) ===
        runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
          ?.namespace_governance_fabric_plane_reuse_mode &&
      getAssistantThreadLifecycleGovernanceFabricPlaneDigest(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.thread_compaction
          ?.lifecycle_governance_fabric_plane_digest &&
      getAssistantThreadKeepDropGovernanceFabricPlaneSummary(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.thread_compaction
          ?.keep_drop_governance_fabric_plane_summary &&
      getAssistantThreadLifecycleGovernanceFabricPlaneAlignmentMode(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.thread_compaction
          ?.lifecycle_governance_fabric_plane_alignment_mode &&
      getAssistantThreadLifecycleGovernanceFabricPlaneReuseMode(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.thread_compaction
          ?.lifecycle_governance_fabric_plane_reuse_mode &&
      getAssistantKnowledgeGovernanceFabricPlaneDigest(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.governance_fabric_plane_digest &&
      getAssistantKnowledgeSourceBudgetGovernanceFabricPlaneSummary(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.knowledge
          .source_budget_governance_fabric_plane_summary &&
      getAssistantKnowledgeGovernanceFabricPlaneMode(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.governance_fabric_plane_mode &&
      getAssistantKnowledgeGovernanceFabricPlaneReuseMode(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.governance_fabric_plane_reuse_mode &&
      getAssistantMemoryScenarioPackGovernanceFabricPlaneDigestId(
        assistantMetadata
      ) === runtimeDebugPack?.governance_fabric_plane_digest_id &&
      getAssistantMemoryScenarioPackStrategyGovernanceFabricPlaneSummary(
        assistantMetadata
      ) === runtimeDebugPack?.strategy_governance_fabric_plane_summary &&
      getAssistantMemoryScenarioPackOrchestrationGovernanceFabricPlaneMode(
        assistantMetadata
      ) === runtimeDebugPack?.orchestration_governance_fabric_plane_mode &&
      getAssistantMemoryScenarioPackGovernanceFabricPlaneReuseMode(
        assistantMetadata
      ) === runtimeDebugPack?.governance_fabric_plane_reuse_mode
    ,
    fabric_plane_prompt_surface_v12_ok:
      scenarioMemoryPackPrompt.includes(
        "Current governance fabric plane = project_delivery_governance_fabric_plane; strategy governance fabric plane = project_delivery_strategy_governance_fabric_plane; fabric plane mode = execution_runtime_governance_fabric_plane; fabric plane reuse = execution_runtime_governance_fabric_plane_reuse."
      ) &&
      defaultScenarioMemoryPackPrompt.includes(
        "Current governance fabric plane = continuity_governance_fabric_plane; strategy governance fabric plane = continuity_strategy_governance_fabric_plane; fabric plane mode = continuity_runtime_governance_fabric_plane; fabric plane reuse = continuity_runtime_governance_fabric_plane_reuse."
      ) &&
      worldKnowledgeDrivenScenarioMemoryPackPrompt.includes(
        "Current governance fabric plane = knowledge_guided_governance_fabric_plane; strategy governance fabric plane = knowledge_guided_strategy_governance_fabric_plane; fabric plane mode = knowledge_guided_runtime_governance_fabric_plane; fabric plane reuse = knowledge_guided_runtime_governance_fabric_plane_reuse."
      ) &&
      systemPrompt.includes(
        "Current governance fabric plane = authoritative_governance_fabric_plane; budget/source governance fabric plane = authoritative_budget_source_governance_fabric_plane; fabric plane mode = authoritative_runtime_governance_fabric_plane; fabric plane reuse = authoritative_runtime_governance_fabric_plane_reuse."
      ) &&
      systemPrompt.includes(
        "Lifecycle governance fabric plane: anchor_preservation_governance_fabric_plane."
      ) &&
      systemPrompt.includes(
        "Keep/drop governance fabric plane: anchor_keep_governance_fabric_plane."
      )
  } as const;
  const p14DriftGuardChecks = {
    fabric_plane_drift_guard_v12_ok:
      threadBoundary.retrieval_fallback_mode === "strict_no_timeline" &&
      threadScopedRoutes.join(",") === "thread_state,profile,episode" &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "closed",
          retained_fields: ["focus_mode"],
          keep_drop_governance_fabric_plane_summary:
            "closed_drop_governance_fabric_plane",
          lifecycle_governance_fabric_plane_alignment_mode:
            "closed_governance_fabric_plane_aligned",
          lifecycle_governance_fabric_plane_reuse_mode:
            "closed_runtime_governance_fabric_plane_reuse"
        }
      }).retain === false &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "paused",
          retention_budget: 1,
          keep_drop_governance_fabric_plane_summary:
            "minimal_decay_governance_fabric_plane",
          lifecycle_governance_fabric_plane_alignment_mode:
            "minimal_governance_fabric_plane_aligned",
          lifecycle_governance_fabric_plane_reuse_mode:
            "minimal_runtime_governance_fabric_plane_reuse"
        }
      }).retain === false &&
      referenceOnlyProjectOpsSelection.length === 1 &&
      referenceOnlyProjectOpsSelection[0]?.title === "General delivery note" &&
      selectedKnowledgeForPrompt[0]?.title === "Onboarding checklist guide" &&
      !defaultScenarioMemoryPackPrompt.includes("General reply policy"),
    scenario_fabric_plane_drift_guard_v12_ok:
      defaultScenarioMemoryPack.governance_fabric_plane_digest_id ===
        "continuity_governance_fabric_plane" &&
      defaultScenarioMemoryPack.strategy_governance_fabric_plane_summary ===
        "continuity_strategy_governance_fabric_plane" &&
      defaultScenarioMemoryPack.orchestration_governance_fabric_plane_mode ===
        "continuity_runtime_governance_fabric_plane" &&
      defaultScenarioMemoryPack.governance_fabric_plane_reuse_mode ===
        "continuity_runtime_governance_fabric_plane_reuse" &&
      !defaultScenarioMemoryPackPrompt.includes(
        "project_delivery_governance_fabric_plane"
      ) &&
      worldKnowledgeDrivenScenarioMemoryPack.pack_id === "companion" &&
      worldKnowledgeDrivenScenarioMemoryPack.governance_fabric_plane_digest_id ===
        "knowledge_guided_governance_fabric_plane" &&
      worldKnowledgeDrivenScenarioMemoryPack.strategy_governance_fabric_plane_summary ===
        "knowledge_guided_strategy_governance_fabric_plane" &&
      worldKnowledgeDrivenScenarioMemoryPack.orchestration_governance_fabric_plane_mode ===
        "knowledge_guided_runtime_governance_fabric_plane" &&
      worldKnowledgeDrivenScenarioMemoryPack.governance_fabric_plane_reuse_mode ===
        "knowledge_guided_runtime_governance_fabric_plane_reuse" &&
      !worldKnowledgeDrivenScenarioMemoryPackPrompt.includes(
        "project_delivery_governance_fabric_plane"
      ) &&
      scenarioMemoryPack.governance_fabric_plane_digest_id ===
        "project_delivery_governance_fabric_plane" &&
      getAssistantMemoryScenarioPackGovernanceFabricPlaneDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.governance_fabric_plane_digest_id &&
      runtimeDebugPack?.governance_fabric_plane_digest_id ===
        scenarioMemoryPack.governance_fabric_plane_digest_id
  } as const;
  const p14PositiveContracts = summarizeGate(p14PositiveContractChecks);
  const p14MetadataConsistency = summarizeGate(p14MetadataConsistencyChecks);
  const p14DriftGuards = summarizeGate(p14DriftGuardChecks);
  const p14RegressionGateChecks = {
    ...p14PositiveContractChecks,
    ...p14MetadataConsistencyChecks,
    ...p14DriftGuardChecks
  } as const;
  const p14RegressionGateSummary = summarizeGate(p14RegressionGateChecks);
  const p14RegressionGate = {
    positive_contracts: p14PositiveContracts,
    metadata_consistency: p14MetadataConsistency,
    drift_guards: p14DriftGuards,
    ...p14RegressionGateSummary
  } as const;
  const p14GateSnapshot = {
    gate_id: "p14_regression_gate_v1",
    stage: "P14-5",
    focus: "regression_acceptance_expansion",
    blocking_items: [] as string[],
    next_expansion_focus: [
      "plane_negative_coverage",
      "close_readiness_consumption",
      "remaining_acceptance_gaps"
    ] as const,
    positive_contracts: {
      checks_passed: p14PositiveContracts.checks_passed,
      checks_total: p14PositiveContracts.checks_total,
      all_green: p14PositiveContracts.all_green
    },
    metadata_consistency: {
      checks_passed: p14MetadataConsistency.checks_passed,
      checks_total: p14MetadataConsistency.checks_total,
      all_green: p14MetadataConsistency.all_green
    },
    drift_guards: {
      checks_passed: p14DriftGuards.checks_passed,
      checks_total: p14DriftGuards.checks_total,
      all_green: p14DriftGuards.all_green
    },
    overall: {
      checks_passed: p14RegressionGate.checks_passed,
      checks_total: p14RegressionGate.checks_total,
      failed_checks: p14RegressionGate.failed_checks,
      all_green: p14RegressionGate.all_green,
      close_candidate: p14RegressionGate.close_candidate
    }
  } as const;
  const p15NamespaceGovernancePlaneContractChecks = {
    namespace_governance_plane_contract_unification_v1_ok:
      projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id ===
        "project_coordination_governance_fabric_plane_phase_snapshot" &&
      projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary ===
        "project_coordination_governance_fabric_plane_phase_snapshot" &&
      projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode ===
        "project_coordination_governance_fabric_plane_reuse_phase_consumption" &&
      projectGovernanceFabricPlanePhaseSnapshot.governance_fabric_plane_digest_id ===
        projectBoundary.governance_fabric_plane_digest_id &&
      projectGovernanceFabricPlanePhaseSnapshot.governance_fabric_plane_summary ===
        projectBoundary.governance_fabric_plane_summary &&
      projectGovernanceFabricPlanePhaseSnapshot.governance_fabric_plane_alignment_mode ===
        projectBoundary.governance_fabric_plane_alignment_mode &&
      projectGovernanceFabricPlanePhaseSnapshot.governance_fabric_plane_reuse_mode ===
        projectBoundary.governance_fabric_plane_reuse_mode &&
      projectGovernanceFabricPlanePhaseSnapshot.retrieval_write_digest_alignment ===
        projectBoundary.retrieval_write_digest_alignment &&
      projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_retrieval_routes.join(
        ","
      ) === projectBoundary.retrieval_route_order.join(",") &&
      projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_write_fallback_order.join(
        ","
      ) === projectBoundary.write_fallback_order.join(",") &&
      runtimeDebugMetadata.memory_namespace?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_id ===
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      runtimeDebugMetadata.memory_namespace?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_summary ===
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary &&
      runtimeDebugMetadata.memory_namespace?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_consumption_mode ===
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_fabric_plane_phase_snapshot_id ===
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_fabric_plane_phase_snapshot_summary ===
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary &&
      runtimeWritePreview.runtime_memory_write_requests_preview?.[0]
        ?.namespace_governance_fabric_plane_phase_snapshot_consumption_mode ===
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode
  } as const;
  const p15RetentionGovernancePlaneConsumptionChecks = {
    retention_governance_plane_consumption_unification_v1_ok:
      compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id ===
        "anchor_preservation_governance_fabric_plane_phase_snapshot" &&
      compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary ===
        "anchor_keep_governance_fabric_plane_phase_snapshot" &&
      compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode ===
        "anchor_runtime_governance_fabric_plane_reuse_phase_consumption" &&
      compactedThreadGovernanceFabricPlanePhaseSnapshot.lifecycle_governance_fabric_plane_digest ===
        compactedThreadSummary?.lifecycle_governance_fabric_plane_digest &&
      compactedThreadGovernanceFabricPlanePhaseSnapshot.keep_drop_governance_fabric_plane_summary ===
        compactedThreadSummary?.keep_drop_governance_fabric_plane_summary &&
      compactedThreadGovernanceFabricPlanePhaseSnapshot.lifecycle_governance_fabric_plane_alignment_mode ===
        compactedThreadSummary
          ?.lifecycle_governance_fabric_plane_alignment_mode &&
      compactedThreadGovernanceFabricPlanePhaseSnapshot.lifecycle_governance_fabric_plane_reuse_mode ===
        compactedThreadSummary?.lifecycle_governance_fabric_plane_reuse_mode &&
      compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_retention_section_order.join(
        ","
      ) === compactedThreadSummary?.retention_section_order.join(",") &&
      compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_retained_fields.join(
        ","
      ) === compactedThreadSummary?.retained_fields.join(",") &&
      runtimeDebugMetadata.thread_compaction?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_id ===
        compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      runtimeDebugMetadata.thread_compaction?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_summary ===
        compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary &&
      runtimeDebugMetadata.thread_compaction?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_consumption_mode ===
        compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode &&
      systemPrompt.includes(
        "Lifecycle governance fabric plane: anchor_preservation_governance_fabric_plane."
      ) &&
      systemPrompt.includes(
        "Keep/drop governance fabric plane: anchor_keep_governance_fabric_plane."
      )
  } as const;
  const p15KnowledgeGovernancePlaneConsumptionChecks = {
    knowledge_governance_plane_consumption_unification_v1_ok:
      knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id ===
        "authoritative_governance_fabric_plane_phase_snapshot" &&
      knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary ===
        "authoritative_budget_source_governance_fabric_plane_phase_snapshot" &&
      knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode ===
        "authoritative_runtime_governance_fabric_plane_reuse_phase_consumption" &&
      knowledgeGovernanceFabricPlanePhaseSnapshot.governance_fabric_plane_digest ===
        knowledgeSummary.governance_fabric_plane_digest &&
      knowledgeGovernanceFabricPlanePhaseSnapshot
        .source_budget_governance_fabric_plane_summary ===
        knowledgeSummary.source_budget_governance_fabric_plane_summary &&
      knowledgeGovernanceFabricPlanePhaseSnapshot.governance_fabric_plane_mode ===
        knowledgeSummary.governance_fabric_plane_mode &&
      knowledgeGovernanceFabricPlanePhaseSnapshot
        .governance_fabric_plane_reuse_mode ===
        knowledgeSummary.governance_fabric_plane_reuse_mode &&
      knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_titles.join(
        ","
      ) === knowledgeSummary.titles.join(",") &&
      knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_scope_layers.join(
        ","
      ) === knowledgeSummary.scope_layers.join(",") &&
      runtimeDebugMetadata.knowledge.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_id ===
        knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      runtimeDebugMetadata.knowledge.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_summary ===
        knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary &&
      runtimeDebugMetadata.knowledge.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_consumption_mode ===
        knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode &&
      systemPrompt.includes(
        "Current governance fabric plane = authoritative_governance_fabric_plane; budget/source governance fabric plane = authoritative_budget_source_governance_fabric_plane; fabric plane mode = authoritative_runtime_governance_fabric_plane; fabric plane reuse = authoritative_runtime_governance_fabric_plane_reuse."
      )
  } as const;
  const p15ScenarioGovernancePlaneConsumptionChecks = {
    scenario_governance_plane_consumption_unification_v1_ok:
      scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id ===
        "project_delivery_governance_fabric_plane_phase_snapshot" &&
      scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary ===
        "project_delivery_strategy_governance_fabric_plane_phase_snapshot" &&
      scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode ===
        "execution_runtime_governance_fabric_plane_reuse_phase_consumption" &&
      scenarioGovernanceFabricPlanePhaseSnapshot
        .governance_fabric_plane_digest_id ===
        scenarioMemoryPack.governance_fabric_plane_digest_id &&
      scenarioGovernanceFabricPlanePhaseSnapshot
        .strategy_governance_fabric_plane_summary ===
        scenarioMemoryPack.strategy_governance_fabric_plane_summary &&
      scenarioGovernanceFabricPlanePhaseSnapshot
        .orchestration_governance_fabric_plane_mode ===
        scenarioMemoryPack.orchestration_governance_fabric_plane_mode &&
      scenarioGovernanceFabricPlanePhaseSnapshot
        .governance_fabric_plane_reuse_mode ===
        scenarioMemoryPack.governance_fabric_plane_reuse_mode &&
      scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_preferred_routes.join(
        ","
      ) === scenarioMemoryPack.preferred_routes.join(",") &&
      scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_assembly_order.join(
        ","
      ) === scenarioMemoryPack.assembly_order.join(",") &&
      runtimeDebugPack?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_id ===
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      runtimeDebugPack?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_summary ===
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary &&
      runtimeDebugPack?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_consumption_mode ===
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode &&
      scenarioMemoryPackPrompt.includes(
        "Current governance fabric plane = project_delivery_governance_fabric_plane; strategy governance fabric plane = project_delivery_strategy_governance_fabric_plane; fabric plane mode = execution_runtime_governance_fabric_plane; fabric plane reuse = execution_runtime_governance_fabric_plane_reuse."
      )
  } as const;
  const p15MetadataConsistencyChecks = {
    phase_snapshot_metadata_consistency_v1_ok:
      runtimeDebugMetadata.memory_namespace?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_id ===
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      runtimeDebugMetadata.thread_compaction?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_id ===
        compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      runtimeDebugMetadata.knowledge.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_id ===
        knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      runtimeDebugPack?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_id ===
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      runtimeDebugMetadata.memory_namespace?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_consumption_mode ===
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode &&
      runtimeDebugMetadata.thread_compaction?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_consumption_mode ===
        compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode &&
      runtimeDebugMetadata.knowledge.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_consumption_mode ===
        knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode &&
      runtimeDebugPack?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_consumption_mode ===
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode,
    phase_snapshot_prompt_surface_v1_ok:
      systemPrompt.includes(
        "Current governance fabric plane = authoritative_governance_fabric_plane; budget/source governance fabric plane = authoritative_budget_source_governance_fabric_plane; fabric plane mode = authoritative_runtime_governance_fabric_plane; fabric plane reuse = authoritative_runtime_governance_fabric_plane_reuse."
      ) &&
      systemPrompt.includes(
        "Lifecycle governance fabric plane: anchor_preservation_governance_fabric_plane."
      ) &&
      systemPrompt.includes(
        "Keep/drop governance fabric plane: anchor_keep_governance_fabric_plane."
      ) &&
      scenarioMemoryPackPrompt.includes(
        "Current governance fabric plane = project_delivery_governance_fabric_plane; strategy governance fabric plane = project_delivery_strategy_governance_fabric_plane; fabric plane mode = execution_runtime_governance_fabric_plane; fabric plane reuse = execution_runtime_governance_fabric_plane_reuse."
      )
  } as const;
  const p15DriftGuardChecks = {
    phase_snapshot_drift_guard_v1_ok:
      resolveNamespaceGovernanceFabricPlanePhaseSnapshot(threadPrimaryNamespace)
        .phase_snapshot_id ===
        "thread_focus_governance_fabric_plane_phase_snapshot" &&
      resolveNamespaceGovernanceFabricPlanePhaseSnapshot(threadPrimaryNamespace)
        .phase_snapshot_retrieval_routes.join(",") ===
        "thread_state,profile,episode" &&
      !resolveNamespaceGovernanceFabricPlanePhaseSnapshot(threadPrimaryNamespace)
        .phase_snapshot_retrieval_routes.includes("timeline") &&
      resolveThreadGovernanceFabricPlanePhaseSnapshot({
        lifecycle_governance_fabric_plane_digest:
          compactedThreadSummary!.lifecycle_governance_fabric_plane_digest,
        keep_drop_governance_fabric_plane_summary:
          "closed_drop_governance_fabric_plane",
        lifecycle_governance_fabric_plane_alignment_mode:
          "closed_governance_fabric_plane_aligned",
        lifecycle_governance_fabric_plane_reuse_mode:
          "closed_runtime_governance_fabric_plane_reuse",
        retention_section_order: [],
        retained_fields: []
      }).phase_snapshot_summary ===
        "closed_drop_governance_fabric_plane_phase_snapshot" &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "closed",
          retained_fields: [],
          keep_drop_governance_fabric_plane_summary:
            "closed_drop_governance_fabric_plane",
          lifecycle_governance_fabric_plane_alignment_mode:
            "closed_governance_fabric_plane_aligned",
          lifecycle_governance_fabric_plane_reuse_mode:
            "closed_runtime_governance_fabric_plane_reuse"
        }
      }).retain === false &&
      resolveThreadGovernanceFabricPlanePhaseSnapshot({
        lifecycle_governance_fabric_plane_digest:
          compactedThreadSummary!.lifecycle_governance_fabric_plane_digest,
        keep_drop_governance_fabric_plane_summary:
          "minimal_decay_governance_fabric_plane",
        lifecycle_governance_fabric_plane_alignment_mode:
          "minimal_governance_fabric_plane_aligned",
        lifecycle_governance_fabric_plane_reuse_mode:
          "minimal_runtime_governance_fabric_plane_reuse",
        retention_section_order: ["current_language_hint"],
        retained_fields: ["current_language_hint"]
      }).phase_snapshot_consumption_mode ===
        "minimal_runtime_governance_fabric_plane_reuse_phase_consumption" &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "paused",
          retention_budget: 1,
          keep_drop_governance_fabric_plane_summary:
            "minimal_decay_governance_fabric_plane",
          lifecycle_governance_fabric_plane_alignment_mode:
            "minimal_governance_fabric_plane_aligned",
          lifecycle_governance_fabric_plane_reuse_mode:
            "minimal_runtime_governance_fabric_plane_reuse"
        }
      }).retain === false &&
      referenceOnlyKnowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_titles.join(
        ","
      ) === "General delivery note" &&
      referenceOnlyKnowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_scope_layers.join(
        ","
      ) === "general" &&
      !referenceOnlyKnowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_titles.includes(
        "Onboarding checklist guide"
      ) &&
      selectedKnowledgeForPrompt[0]?.title === "Onboarding checklist guide",
    scenario_phase_snapshot_drift_guard_v1_ok:
      defaultScenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id ===
        "continuity_governance_fabric_plane_phase_snapshot" &&
      defaultScenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary ===
        "continuity_strategy_governance_fabric_plane_phase_snapshot" &&
      defaultScenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode ===
        "continuity_runtime_governance_fabric_plane_reuse_phase_consumption" &&
      !defaultScenarioMemoryPackPrompt.includes(
        "project_delivery_governance_fabric_plane"
      ) &&
      worldKnowledgeDrivenScenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id ===
        "knowledge_guided_governance_fabric_plane_phase_snapshot" &&
      worldKnowledgeDrivenScenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary ===
        "knowledge_guided_strategy_governance_fabric_plane_phase_snapshot" &&
      worldKnowledgeDrivenScenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode ===
        "knowledge_guided_runtime_governance_fabric_plane_reuse_phase_consumption" &&
      !worldKnowledgeDrivenScenarioMemoryPackPrompt.includes(
        "project_delivery_governance_fabric_plane"
      ) &&
      scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id ===
        "project_delivery_governance_fabric_plane_phase_snapshot" &&
      scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary ===
        "project_delivery_strategy_governance_fabric_plane_phase_snapshot" &&
      scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode ===
        "execution_runtime_governance_fabric_plane_reuse_phase_consumption" &&
      runtimeDebugPack?.governance_fabric_plane_phase_snapshot
        ?.phase_snapshot_id ===
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id
  } as const;
  const p15PositiveContracts = summarizeGate(
    {
      ...p15NamespaceGovernancePlaneContractChecks,
      ...p15RetentionGovernancePlaneConsumptionChecks,
      ...p15KnowledgeGovernancePlaneConsumptionChecks,
      ...p15ScenarioGovernancePlaneConsumptionChecks
    }
  );
  const p15MetadataConsistency = summarizeGate(p15MetadataConsistencyChecks);
  const p15DriftGuards = summarizeGate(p15DriftGuardChecks);
  const p15RegressionGateChecks = {
    ...p15NamespaceGovernancePlaneContractChecks,
    ...p15RetentionGovernancePlaneConsumptionChecks,
    ...p15KnowledgeGovernancePlaneConsumptionChecks,
    ...p15ScenarioGovernancePlaneConsumptionChecks,
    ...p15MetadataConsistencyChecks,
    ...p15DriftGuardChecks
  } as const;
  const p15RegressionGateSummary = summarizeGate(p15RegressionGateChecks);
  const p15RegressionGate = {
    positive_contracts: p15PositiveContracts,
    metadata_consistency: p15MetadataConsistency,
    drift_guards: p15DriftGuards,
    ...p15RegressionGateSummary
  } as const;
  const p15GateSnapshot = {
    gate_id: "p15_regression_gate_v1",
    stage: "P15-5",
    focus: "regression_acceptance_continuation",
    readiness_judgment: "entered_close_readiness_not_close_ready" as const,
    progress_range: "70% - 75%" as const,
    close_note_recommended: false,
    blocking_items: [] as string[],
    non_blocking_items: [
      "close_readiness_consumption_surface",
      "acceptance_gap_structuring",
      "close_note_handoff_clarity"
    ] as const,
    tail_candidate_items: [
      "phase_snapshot_negative_coverage_expansion",
      "gate_output_symmetry_cleanup",
      "non_blocking_coverage_alignment"
    ] as const,
    acceptance_gap_buckets: {
      blocking: 0,
      non_blocking: 3,
      tail_candidate: 3
    },
    next_expansion_focus: [
      "close_readiness_consumption",
      "acceptance_gap_classification",
      "remaining_acceptance_gaps"
    ] as const,
    positive_contracts: {
      checks_passed: p15PositiveContracts.checks_passed,
      checks_total: p15PositiveContracts.checks_total,
      all_green: p15PositiveContracts.all_green
    },
    metadata_consistency: {
      checks_passed: p15MetadataConsistency.checks_passed,
      checks_total: p15MetadataConsistency.checks_total,
      all_green: p15MetadataConsistency.all_green
    },
    drift_guards: {
      checks_passed: p15DriftGuards.checks_passed,
      checks_total: p15DriftGuards.checks_total,
      all_green: p15DriftGuards.all_green
    },
    overall: {
      checks_passed: p15RegressionGate.checks_passed,
      checks_total: p15RegressionGate.checks_total,
      failed_checks: p15RegressionGate.failed_checks,
      all_green: p15RegressionGate.all_green,
      close_candidate: p15RegressionGate.close_candidate
    }
  } as const;
  const p16RoleCoreMemoryHandoffChecks = {
    role_core_memory_handoff_packet_v2_ok:
      roleCorePacketForHarness.packet_version === "v2" &&
      roleCorePacketForHarness.memory_handoff?.namespace_phase_snapshot_id ===
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      roleCorePacketForHarness.memory_handoff?.retention_phase_snapshot_id ===
        compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      roleCorePacketForHarness.memory_handoff?.retention_decision_group ===
        compactedThreadSummary?.retention_decision_group &&
      roleCorePacketForHarness.memory_handoff?.retention_retained_fields?.join(
        ","
      ) === compactedThreadSummary?.retained_fields.join(",") &&
      roleCorePacketForHarness.memory_handoff?.knowledge_phase_snapshot_id ===
        knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      roleCorePacketForHarness.memory_handoff?.knowledge_scope_layers?.join(
        ","
      ) === knowledgeSummary.scope_layers.join(",") &&
      roleCorePacketForHarness.memory_handoff?.knowledge_governance_classes?.join(
        ","
      ) === knowledgeSummary.governance_classes.join(",") &&
      roleCorePacketForHarness.memory_handoff?.scenario_phase_snapshot_id ===
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id &&
      roleCorePacketForHarness.memory_handoff?.scenario_strategy_bundle_id ===
        scenarioMemoryPackStrategy.strategy_bundle_id &&
      roleCorePacketForHarness.memory_handoff?.scenario_orchestration_mode ===
        scenarioMemoryPack.orchestration_mode &&
      assistantRoleCorePacket?.packet_version === "v2" &&
      assistantRoleCorePacket.memory_handoff?.namespace_phase_snapshot_summary ===
        projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary &&
      assistantRoleCorePacket.memory_handoff?.retention_phase_snapshot_summary ===
        compactedThreadGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary &&
      assistantRoleCorePacket.memory_handoff?.retention_decision_group ===
        compactedThreadSummary?.retention_decision_group &&
      assistantRoleCorePacket.memory_handoff?.retention_retained_fields?.join(
        ","
      ) === compactedThreadSummary?.retained_fields.join(",") &&
      assistantRoleCorePacket.memory_handoff?.knowledge_phase_snapshot_summary ===
        knowledgeGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary &&
      assistantRoleCorePacket.memory_handoff?.knowledge_scope_layers?.join(
        ","
      ) === knowledgeSummary.scope_layers.join(",") &&
      assistantRoleCorePacket.memory_handoff?.knowledge_governance_classes?.join(
        ","
      ) === knowledgeSummary.governance_classes.join(",") &&
      assistantRoleCorePacket.memory_handoff?.scenario_phase_snapshot_summary ===
        scenarioGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary &&
      assistantRoleCorePacket.memory_handoff?.scenario_strategy_bundle_id ===
        scenarioMemoryPackStrategy.strategy_bundle_id &&
      assistantRoleCorePacket.memory_handoff?.scenario_orchestration_mode ===
        scenarioMemoryPack.orchestration_mode &&
      assistantDiagnosticRoleCorePacket?.packet_version === "v2" &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.namespace_phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.namespace_phase_snapshot_id &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.retention_phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.retention_phase_snapshot_id &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.retention_decision_group ===
        roleCorePacketForHarness.memory_handoff?.retention_decision_group &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.knowledge_phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.knowledge_phase_snapshot_id &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.knowledge_scope_layers?.join(
        ","
      ) ===
        roleCorePacketForHarness.memory_handoff?.knowledge_scope_layers?.join(
          ","
        ) &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.knowledge_governance_classes?.join(
        ","
      ) ===
        roleCorePacketForHarness.memory_handoff?.knowledge_governance_classes?.join(
          ","
        ) &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.scenario_phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.scenario_phase_snapshot_id &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.scenario_strategy_bundle_id ===
        roleCorePacketForHarness.memory_handoff?.scenario_strategy_bundle_id &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.scenario_orchestration_mode ===
        roleCorePacketForHarness.memory_handoff?.scenario_orchestration_mode
  } as const;
  const p16RoleCoreMemoryHandoffMetadataConsistencyChecks = {
    role_core_memory_handoff_metadata_consistency_v1_ok:
      assistantRoleCorePacket?.memory_handoff?.handoff_version === "v1" &&
      assistantDiagnosticRoleCorePacket?.memory_handoff?.handoff_version ===
        "v1" &&
      assistantRoleCorePacket.memory_handoff?.namespace_phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.namespace_phase_snapshot_id &&
      assistantRoleCorePacket.memory_handoff?.retention_phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.retention_phase_snapshot_id &&
      assistantRoleCorePacket.memory_handoff?.retention_decision_group ===
        roleCorePacketForHarness.memory_handoff?.retention_decision_group &&
      assistantRoleCorePacket.memory_handoff?.retention_retained_fields?.join(
        ","
      ) ===
        roleCorePacketForHarness.memory_handoff?.retention_retained_fields?.join(
          ","
        ) &&
      assistantRoleCorePacket.memory_handoff?.knowledge_phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.knowledge_phase_snapshot_id &&
      assistantRoleCorePacket.memory_handoff?.knowledge_scope_layers?.join(
        ","
      ) ===
        roleCorePacketForHarness.memory_handoff?.knowledge_scope_layers?.join(
          ","
        ) &&
      assistantRoleCorePacket.memory_handoff?.knowledge_governance_classes?.join(
        ","
      ) ===
        roleCorePacketForHarness.memory_handoff?.knowledge_governance_classes?.join(
          ","
        ) &&
      assistantRoleCorePacket.memory_handoff?.scenario_phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.scenario_phase_snapshot_id &&
      assistantRoleCorePacket.memory_handoff?.scenario_strategy_bundle_id ===
        roleCorePacketForHarness.memory_handoff?.scenario_strategy_bundle_id &&
      assistantRoleCorePacket.memory_handoff?.scenario_orchestration_mode ===
        roleCorePacketForHarness.memory_handoff?.scenario_orchestration_mode &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.namespace_phase_snapshot_summary ===
        roleCorePacketForHarness.memory_handoff?.namespace_phase_snapshot_summary &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.retention_phase_snapshot_summary ===
        roleCorePacketForHarness.memory_handoff?.retention_phase_snapshot_summary &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.retention_retained_fields?.join(
        ","
      ) ===
        roleCorePacketForHarness.memory_handoff?.retention_retained_fields?.join(
          ","
        ) &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.knowledge_phase_snapshot_summary ===
        roleCorePacketForHarness.memory_handoff?.knowledge_phase_snapshot_summary &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.knowledge_scope_layers?.join(
        ","
      ) ===
        roleCorePacketForHarness.memory_handoff?.knowledge_scope_layers?.join(
          ","
        ) &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.knowledge_governance_classes?.join(
        ","
      ) ===
        roleCorePacketForHarness.memory_handoff?.knowledge_governance_classes?.join(
          ","
        ) &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.scenario_phase_snapshot_summary ===
        roleCorePacketForHarness.memory_handoff?.scenario_phase_snapshot_summary &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.scenario_strategy_bundle_id ===
        roleCorePacketForHarness.memory_handoff?.scenario_strategy_bundle_id &&
      assistantDiagnosticRoleCorePacket.memory_handoff?.scenario_orchestration_mode ===
        roleCorePacketForHarness.memory_handoff?.scenario_orchestration_mode,
    role_core_memory_handoff_prompt_surface_v1_ok:
      systemPrompt.includes("Role core memory handoff: handoff_version = v1.") &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.namespace_phase_snapshot_id ??
          ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.namespace_phase_snapshot_summary ??
          ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.retention_phase_snapshot_id ??
          ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.retention_phase_snapshot_summary ??
          ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.retention_decision_group ?? ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.retention_retained_fields?.join(
          ", "
        ) ?? ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.knowledge_phase_snapshot_id ??
          ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.knowledge_phase_snapshot_summary ??
          ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.knowledge_scope_layers?.join(
          ", "
        ) ?? ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.knowledge_governance_classes?.join(
          ", "
        ) ?? ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.scenario_phase_snapshot_id ??
          ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.scenario_phase_snapshot_summary ??
          ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.scenario_strategy_bundle_id ??
          ""
      ) &&
      systemPrompt.includes(
        roleCorePacketForHarness.memory_handoff?.scenario_orchestration_mode ??
          ""
      )
  } as const;
  const p16PositiveContracts = summarizeGate(p16RoleCoreMemoryHandoffChecks);
  const p16MetadataConsistency = summarizeGate(
    p16RoleCoreMemoryHandoffMetadataConsistencyChecks
  );
  const p16PacketConsumptionSnapshot = {
    packet_handoff_readiness:
      "knowledge_depth_started_not_close_ready" as const,
    progress_range: "65% - 70%" as const,
    close_note_recommended: false,
    blocking_items: [] as string[],
    non_blocking_items: [
      "close_note_handoff_packet_consumption",
      "packet_acceptance_gap_structuring",
      "remaining_packet_gap_cleanup"
    ] as const,
    tail_candidate_items: [
      "packet_output_symmetry_cleanup",
      "non_blocking_prompt_coverage_alignment",
      "packet_negative_coverage_expansion"
    ] as const,
    acceptance_gap_buckets: {
      blocking: 0,
      non_blocking: 3,
      tail_candidate: 3
    },
    next_expansion_focus: [
      "retention_role_core_handoff_depth",
      "close_note_handoff_packet",
      "remaining_packet_acceptance_gaps"
    ] as const
  } as const;
  const p16PacketConsumptionChecks = {
    role_core_memory_handoff_close_note_consumption_v1_ok:
      p16PacketConsumptionSnapshot.packet_handoff_readiness ===
        "knowledge_depth_started_not_close_ready" &&
      p16PacketConsumptionSnapshot.progress_range === "65% - 70%" &&
      p16PacketConsumptionSnapshot.close_note_recommended === false &&
      p16PacketConsumptionSnapshot.blocking_items.length === 0 &&
      p16PacketConsumptionSnapshot.acceptance_gap_buckets.blocking === 0 &&
      p16PacketConsumptionSnapshot.acceptance_gap_buckets.non_blocking ===
        p16PacketConsumptionSnapshot.non_blocking_items.length &&
      p16PacketConsumptionSnapshot.acceptance_gap_buckets.tail_candidate ===
        p16PacketConsumptionSnapshot.tail_candidate_items.length &&
      p16PacketConsumptionSnapshot.next_expansion_focus.includes(
        "close_note_handoff_packet"
      )
  } as const;
  const p16PacketConsumption = summarizeGate(p16PacketConsumptionChecks);
  const p16RegressionGateSummary = summarizeGate({
    ...p16RoleCoreMemoryHandoffChecks,
    ...p16RoleCoreMemoryHandoffMetadataConsistencyChecks,
    ...p16PacketConsumptionChecks
  });
  const p16RegressionGate = {
    positive_contracts: p16PositiveContracts,
    metadata_consistency: p16MetadataConsistency,
    packet_consumption: p16PacketConsumption,
    ...p16RegressionGateSummary
  } as const;
  const p16GateSnapshot = {
    gate_id: "p16_regression_gate_v1",
    stage: "P16-5",
    focus: "role_core_memory_handoff_packetization",
    packet_handoff_readiness: p16PacketConsumptionSnapshot.packet_handoff_readiness,
    progress_range: p16PacketConsumptionSnapshot.progress_range,
    close_note_recommended: p16PacketConsumptionSnapshot.close_note_recommended,
    blocking_items: p16PacketConsumptionSnapshot.blocking_items,
    non_blocking_items: p16PacketConsumptionSnapshot.non_blocking_items,
    tail_candidate_items: p16PacketConsumptionSnapshot.tail_candidate_items,
    acceptance_gap_buckets: p16PacketConsumptionSnapshot.acceptance_gap_buckets,
    next_expansion_focus: p16PacketConsumptionSnapshot.next_expansion_focus,
    positive_contracts: {
      checks_passed: p16PositiveContracts.checks_passed,
      checks_total: p16PositiveContracts.checks_total,
      all_green: p16PositiveContracts.all_green
    },
    metadata_consistency: {
      checks_passed: p16MetadataConsistency.checks_passed,
      checks_total: p16MetadataConsistency.checks_total,
      all_green: p16MetadataConsistency.all_green
    },
    packet_consumption: {
      checks_passed: p16PacketConsumption.checks_passed,
      checks_total: p16PacketConsumption.checks_total,
      all_green: p16PacketConsumption.all_green
    },
    overall: {
      checks_passed: p16RegressionGate.checks_passed,
      checks_total: p16RegressionGate.checks_total,
      failed_checks: p16RegressionGate.failed_checks,
      all_green: p16RegressionGate.all_green,
      close_candidate: p16RegressionGate.close_candidate
    }
  } as const;
  const p17CloseNotePrompt = buildRoleCoreMemoryCloseNoteHandoffPrompt(
    p17CloseNoteHandoffPacket,
    "en"
  );
  const p17CloseNoteHandoffPacketChecks = {
    role_core_memory_close_note_handoff_packet_v1_ok:
      p17CloseNoteHandoffPacket?.packet_version === "v1" &&
      p17CloseNoteHandoffPacket.source_packet_version === "v2" &&
      p17CloseNoteHandoffPacket.handoff_version === "v1" &&
      p17CloseNoteHandoffPacket.readiness_judgment ===
        p17CloseNoteReadinessSnapshot.readinessJudgment &&
      p17CloseNoteHandoffPacket.progress_range ===
        p17CloseNoteReadinessSnapshot.progressRange &&
      p17CloseNoteHandoffPacket.close_candidate ===
        p17CloseNoteReadinessSnapshot.closeCandidate &&
      p17CloseNoteHandoffPacket.close_note_recommended ===
        p17CloseNoteReadinessSnapshot.closeNoteRecommended &&
      p17CloseNoteHandoffPacket.blocking_items.length === 0 &&
      p17CloseNoteHandoffPacket.acceptance_gap_buckets.blocking ===
        p17CloseNoteReadinessSnapshot.acceptanceGapBuckets.blocking &&
      p17CloseNoteHandoffPacket.acceptance_gap_buckets.non_blocking ===
        p17CloseNoteReadinessSnapshot.acceptanceGapBuckets.non_blocking &&
      p17CloseNoteHandoffPacket.acceptance_gap_buckets.tail_candidate ===
        p17CloseNoteReadinessSnapshot.acceptanceGapBuckets.tail_candidate &&
      p17CloseNoteHandoffPacket.namespace.phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.namespace_phase_snapshot_id &&
      p17CloseNoteHandoffPacket.namespace.phase_snapshot_summary ===
        roleCorePacketForHarness.memory_handoff?.namespace_phase_snapshot_summary &&
      p17CloseNoteHandoffPacket.retention.phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.retention_phase_snapshot_id &&
      p17CloseNoteHandoffPacket.retention.decision_group ===
        roleCorePacketForHarness.memory_handoff?.retention_decision_group &&
      p17CloseNoteHandoffPacket.retention.retained_fields.join(",") ===
        roleCorePacketForHarness.memory_handoff?.retention_retained_fields?.join(
          ","
        ) &&
      p17CloseNoteHandoffPacket.knowledge.phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.knowledge_phase_snapshot_id &&
      p17CloseNoteHandoffPacket.knowledge.scope_layers.join(",") ===
        roleCorePacketForHarness.memory_handoff?.knowledge_scope_layers?.join(
          ","
        ) &&
      p17CloseNoteHandoffPacket.knowledge.governance_classes.join(",") ===
        roleCorePacketForHarness.memory_handoff?.knowledge_governance_classes?.join(
          ","
        ) &&
      p17CloseNoteHandoffPacket.scenario.phase_snapshot_id ===
        roleCorePacketForHarness.memory_handoff?.scenario_phase_snapshot_id &&
      p17CloseNoteHandoffPacket.scenario.strategy_bundle_id ===
        roleCorePacketForHarness.memory_handoff?.scenario_strategy_bundle_id &&
      p17CloseNoteHandoffPacket.scenario.orchestration_mode ===
        roleCorePacketForHarness.memory_handoff?.scenario_orchestration_mode &&
      p17CloseNoteHandoffPacket.non_blocking_items.includes(
        "close_note_acceptance_structuring"
      ) &&
      p17CloseNoteHandoffPacket.next_expansion_focus.includes(
        "close_readiness_handoff_alignment"
      ) &&
      p17CloseNoteHandoffPacket.tail_candidate_items.includes(
        "close_note_tail_cleanup_alignment"
      ),
    role_core_memory_close_note_handoff_metadata_consistency_v1_ok:
      assistantCloseNoteHandoffPacket?.packet_version === "v1" &&
      assistantDiagnosticCloseNoteHandoffPacket?.packet_version === "v1" &&
      assistantCloseNoteHandoffPacket.readiness_judgment ===
        p17CloseNoteHandoffPacket?.readiness_judgment &&
      assistantCloseNoteHandoffPacket.progress_range ===
        p17CloseNoteHandoffPacket?.progress_range &&
      assistantCloseNoteHandoffPacket.close_candidate ===
        p17CloseNoteHandoffPacket?.close_candidate &&
      assistantCloseNoteHandoffPacket.close_note_recommended ===
        p17CloseNoteHandoffPacket?.close_note_recommended &&
      assistantCloseNoteHandoffPacket.namespace.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.namespace.phase_snapshot_id &&
      assistantCloseNoteHandoffPacket.retention.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.retention.phase_snapshot_id &&
      assistantCloseNoteHandoffPacket.retention.retained_fields.join(",") ===
        p17CloseNoteHandoffPacket?.retention.retained_fields.join(",") &&
      assistantCloseNoteHandoffPacket.knowledge.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.knowledge.phase_snapshot_id &&
      assistantCloseNoteHandoffPacket.knowledge.scope_layers.join(",") ===
        p17CloseNoteHandoffPacket?.knowledge.scope_layers.join(",") &&
      assistantCloseNoteHandoffPacket.knowledge.governance_classes.join(
        ","
      ) === p17CloseNoteHandoffPacket?.knowledge.governance_classes.join(",") &&
      assistantCloseNoteHandoffPacket.scenario.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.scenario.phase_snapshot_id &&
      assistantCloseNoteHandoffPacket.scenario.strategy_bundle_id ===
        p17CloseNoteHandoffPacket?.scenario.strategy_bundle_id &&
      assistantCloseNoteHandoffPacket.scenario.orchestration_mode ===
        p17CloseNoteHandoffPacket?.scenario.orchestration_mode &&
      assistantDiagnosticCloseNoteHandoffPacket.readiness_judgment ===
        p17CloseNoteHandoffPacket?.readiness_judgment &&
      assistantDiagnosticCloseNoteHandoffPacket.progress_range ===
        p17CloseNoteHandoffPacket?.progress_range &&
      assistantDiagnosticCloseNoteHandoffPacket.namespace.phase_snapshot_summary ===
        p17CloseNoteHandoffPacket?.namespace.phase_snapshot_summary &&
      assistantDiagnosticCloseNoteHandoffPacket.retention.phase_snapshot_summary ===
        p17CloseNoteHandoffPacket?.retention.phase_snapshot_summary &&
      assistantDiagnosticCloseNoteHandoffPacket.retention.decision_group ===
        p17CloseNoteHandoffPacket?.retention.decision_group &&
      assistantDiagnosticCloseNoteHandoffPacket.knowledge.phase_snapshot_summary ===
        p17CloseNoteHandoffPacket?.knowledge.phase_snapshot_summary &&
      assistantDiagnosticCloseNoteHandoffPacket.knowledge.scope_layers.join(",") ===
        p17CloseNoteHandoffPacket?.knowledge.scope_layers.join(",") &&
      assistantDiagnosticCloseNoteHandoffPacket.scenario.phase_snapshot_summary ===
        p17CloseNoteHandoffPacket?.scenario.phase_snapshot_summary &&
      assistantDiagnosticCloseNoteHandoffPacket.scenario.strategy_bundle_id ===
        p17CloseNoteHandoffPacket?.scenario.strategy_bundle_id &&
      assistantDiagnosticCloseNoteHandoffPacket.scenario.orchestration_mode ===
        p17CloseNoteHandoffPacket?.scenario.orchestration_mode,
    role_core_memory_close_note_handoff_prompt_surface_v1_ok:
      p17CloseNotePrompt.includes("Role core close-note handoff") &&
      p17CloseNotePrompt.includes(
        p17CloseNoteHandoffPacket?.readiness_judgment ?? ""
      ) &&
      p17CloseNotePrompt.includes(
        p17CloseNoteHandoffPacket?.progress_range ?? ""
      ) &&
      p17CloseNotePrompt.includes(
        p17CloseNoteHandoffPacket?.namespace.phase_snapshot_id ?? ""
      ) &&
      p17CloseNotePrompt.includes(
        p17CloseNoteHandoffPacket?.retention.phase_snapshot_id ?? ""
      ) &&
      p17CloseNotePrompt.includes(
        p17CloseNoteHandoffPacket?.knowledge.phase_snapshot_id ?? ""
      ) &&
      p17CloseNotePrompt.includes(
        p17CloseNoteHandoffPacket?.scenario.phase_snapshot_id ?? ""
      ) &&
      p17CloseNotePrompt.includes(
        p17CloseNoteHandoffPacket?.non_blocking_items.join(", ") ?? ""
      ) &&
      p17CloseNotePrompt.includes(
        p17CloseNoteHandoffPacket?.next_expansion_focus.join(", ") ?? ""
      ),
    role_core_memory_close_note_handoff_runtime_consumption_v1_ok:
      runtimeDebugCloseNoteHandoffPacket?.packet_version === "v1" &&
      runtimeDebugCloseNoteHandoffPacket.readiness_judgment ===
        p17CloseNoteHandoffPacket?.readiness_judgment &&
      runtimeDebugCloseNoteHandoffPacket.progress_range ===
        p17CloseNoteHandoffPacket?.progress_range &&
      runtimeDebugCloseNoteHandoffPacket.namespace.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.namespace.phase_snapshot_id &&
      runtimeDebugCloseNoteHandoffPacket.retention.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.retention.phase_snapshot_id &&
      runtimeDebugCloseNoteHandoffPacket.knowledge.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.knowledge.phase_snapshot_id &&
      runtimeDebugCloseNoteHandoffPacket.scenario.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.scenario.phase_snapshot_id &&
      runtimeDebugCloseNoteHandoffPacket.acceptance_gap_buckets.non_blocking ===
        p17CloseNoteHandoffPacket?.acceptance_gap_buckets.non_blocking &&
      runtimeDebugCloseNoteHandoffPacket.next_expansion_focus.includes(
        "close_readiness_handoff_alignment"
      ) &&
      systemPrompt.includes("Role core close-note handoff") &&
      systemPrompt.includes(
        p17CloseNoteHandoffPacket?.readiness_judgment ?? ""
      )
  } as const;
  const p17PositiveContracts = summarizeGate({
    role_core_memory_close_note_handoff_packet_v1_ok:
      p17CloseNoteHandoffPacketChecks.role_core_memory_close_note_handoff_packet_v1_ok
  });
  const p17MetadataConsistency = summarizeGate({
    role_core_memory_close_note_handoff_metadata_consistency_v1_ok:
      p17CloseNoteHandoffPacketChecks.role_core_memory_close_note_handoff_metadata_consistency_v1_ok
  });
  const p17PacketConsumption = summarizeGate({
    role_core_memory_close_note_handoff_prompt_surface_v1_ok:
      p17CloseNoteHandoffPacketChecks.role_core_memory_close_note_handoff_prompt_surface_v1_ok,
    role_core_memory_close_note_handoff_runtime_consumption_v1_ok:
      p17CloseNoteHandoffPacketChecks.role_core_memory_close_note_handoff_runtime_consumption_v1_ok
  });
  const p17DriftGuardChecks = {
    role_core_memory_close_note_handoff_null_guard_v1_ok:
      buildRoleCoreMemoryCloseNoteHandoffPacket({
        roleCorePacket: {
          ...roleCorePacketForHarness,
          packet_version: "v1",
          memory_handoff: null
        },
        ...p17CloseNoteReadinessSnapshot
      }) === null,
    role_core_memory_close_note_handoff_prompt_drift_guard_v1_ok:
      !systemPromptWithoutCloseNote.includes("Role core close-note handoff") &&
      !systemPromptWithoutCloseNote.includes(
        p17CloseNoteHandoffPacket?.readiness_judgment ?? ""
      ) &&
      systemPrompt.includes("Role core close-note handoff") &&
      systemPrompt.includes(p17CloseNoteHandoffPacket?.progress_range ?? "")
  } as const;
  const p17DriftGuards = summarizeGate(p17DriftGuardChecks);
  const p17RegressionGate = {
    positive_contracts: p17PositiveContracts,
    metadata_consistency: p17MetadataConsistency,
    packet_consumption: p17PacketConsumption,
    drift_guards: p17DriftGuards,
    ...summarizeGate({
      ...p17CloseNoteHandoffPacketChecks,
      ...p17DriftGuardChecks
    })
  } as const;
  const p17GateSnapshot = {
    gate_id: "p17_regression_gate_v1",
    stage: "P17-5",
    focus: "close_note_handoff_packetization",
    readiness_judgment:
      p17CloseNoteHandoffPacket?.readiness_judgment ?? "not_started",
    progress_range:
      p17CloseNoteReadinessSnapshot.progressRange,
    close_note_recommended:
      p17CloseNoteHandoffPacket?.close_note_recommended ?? false,
    blocking_items: p17CloseNoteHandoffPacket?.blocking_items ?? [],
    non_blocking_items: p17CloseNoteHandoffPacket?.non_blocking_items ?? [],
    tail_candidate_items: p17CloseNoteHandoffPacket?.tail_candidate_items ?? [],
    acceptance_gap_buckets:
      p17CloseNoteHandoffPacket?.acceptance_gap_buckets ?? {
        blocking: 0,
        non_blocking: 0,
        tail_candidate: 0
      },
    next_expansion_focus: p17CloseNoteHandoffPacket?.next_expansion_focus ?? [],
    positive_contracts: {
      checks_passed: p17PositiveContracts.checks_passed,
      checks_total: p17PositiveContracts.checks_total,
      all_green: p17PositiveContracts.all_green
    },
    metadata_consistency: {
      checks_passed: p17MetadataConsistency.checks_passed,
      checks_total: p17MetadataConsistency.checks_total,
      all_green: p17MetadataConsistency.all_green
    },
    packet_consumption: {
      checks_passed: p17PacketConsumption.checks_passed,
      checks_total: p17PacketConsumption.checks_total,
      all_green: p17PacketConsumption.all_green
    },
    drift_guards: {
      checks_passed: p17DriftGuards.checks_passed,
      checks_total: p17DriftGuards.checks_total,
      all_green: p17DriftGuards.all_green
    },
    overall: {
      checks_passed: p17RegressionGate.checks_passed,
      checks_total: p17RegressionGate.checks_total,
      failed_checks: p17RegressionGate.failed_checks,
      all_green: p17RegressionGate.all_green,
      close_candidate: p17RegressionGate.close_candidate
    }
  } as const;
  const p18CloseNoteArtifactChecks = {
    role_core_memory_close_note_artifact_v1_ok:
      p18CloseNoteArtifact?.artifact_version === "v1" &&
      p18CloseNoteArtifact.source_packet_version === "v2" &&
      p18CloseNoteArtifact.source_handoff_packet_version === "v1" &&
      p18CloseNoteArtifact.readiness_judgment ===
        p17CloseNoteHandoffPacket?.readiness_judgment &&
      p18CloseNoteArtifact.progress_range ===
        p17CloseNoteHandoffPacket?.progress_range &&
      p18CloseNoteArtifact.close_candidate ===
        p17CloseNoteHandoffPacket?.close_candidate &&
      p18CloseNoteArtifact.headline.includes("Helper close-note artifact") &&
      p18CloseNoteArtifact.sections.namespace.includes(
        p17CloseNoteHandoffPacket?.namespace.phase_snapshot_id ?? ""
      ) &&
      p18CloseNoteArtifact.sections.knowledge.includes(
        p17CloseNoteHandoffPacket?.knowledge.phase_snapshot_id ?? ""
      ) &&
      p18CloseNoteArtifact.next_expansion_focus.includes(
        "close_readiness_handoff_alignment"
      ),
    role_core_memory_close_note_artifact_metadata_consistency_v1_ok:
      assistantCloseNoteArtifact?.artifact_version === "v1" &&
      assistantDiagnosticCloseNoteArtifact?.artifact_version === "v1" &&
      assistantCloseNoteArtifact.headline === p18CloseNoteArtifact?.headline &&
      assistantCloseNoteArtifact.carry_through_summary ===
        p18CloseNoteArtifact?.carry_through_summary &&
      assistantCloseNoteArtifact.acceptance_summary ===
        p18CloseNoteArtifact?.acceptance_summary &&
      assistantDiagnosticCloseNoteArtifact.sections.namespace ===
        p18CloseNoteArtifact?.sections.namespace &&
      assistantDiagnosticCloseNoteArtifact.sections.retention ===
        p18CloseNoteArtifact?.sections.retention &&
      assistantDiagnosticCloseNoteArtifact.sections.knowledge ===
        p18CloseNoteArtifact?.sections.knowledge &&
      assistantDiagnosticCloseNoteArtifact.sections.scenario ===
        p18CloseNoteArtifact?.sections.scenario,
    role_core_memory_close_note_artifact_prompt_surface_v1_ok:
      p18CloseNoteArtifactPrompt.includes("Role core close-note artifact") &&
      p18CloseNoteArtifactPrompt.includes(p18CloseNoteArtifact?.headline ?? "") &&
      p18CloseNoteArtifactPrompt.includes(
        p18CloseNoteArtifact?.carry_through_summary ?? ""
      ) &&
      p18CloseNoteArtifactPrompt.includes(
        p18CloseNoteArtifact?.acceptance_summary ?? ""
      ) &&
      p18CloseNoteArtifactPrompt.includes(
        p18CloseNoteArtifact?.sections.scenario ?? ""
      ),
    role_core_memory_close_note_artifact_runtime_consumption_v1_ok:
      runtimeDebugCloseNoteArtifact?.artifact_version === "v1" &&
      runtimeDebugCloseNoteArtifact.headline === p18CloseNoteArtifact?.headline &&
      runtimeDebugCloseNoteArtifact.acceptance_summary ===
        p18CloseNoteArtifact?.acceptance_summary &&
      runtimeDebugCloseNoteArtifact.next_expansion_focus.includes(
        "close_note_gate_snapshot_consumption"
      ) &&
      systemPrompt.includes("Role core close-note artifact") &&
      systemPrompt.includes(p18CloseNoteArtifact?.headline ?? "")
  } as const;
  const p19CloseNoteOutputChecks = {
    namespace_close_note_output_contract_v1_ok:
      p19CloseNoteOutput?.output_version === "v1" &&
      p19CloseNoteOutput.source_artifact_version === "v1" &&
      p19CloseNoteOutput.source_handoff_packet_version === "v1" &&
      p19CloseNoteOutput.headline.includes("Helper close-note output") &&
      p19CloseNoteOutput.namespace.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.namespace.phase_snapshot_id &&
      p19CloseNoteOutput.namespace.output_summary.includes(
        p18CloseNoteArtifact?.headline ?? ""
      ),
    namespace_close_note_output_metadata_consistency_v1_ok:
      assistantCloseNoteOutput?.headline === p19CloseNoteOutput?.headline &&
      assistantDiagnosticCloseNoteOutput?.namespace.output_summary ===
        p19CloseNoteOutput?.namespace.output_summary &&
      runtimeDebugCloseNoteOutput?.emission_summary ===
        p19CloseNoteOutput?.emission_summary,
    namespace_close_note_output_prompt_surface_v1_ok:
      p19CloseNoteOutputPrompt.includes("Role core close-note output") &&
      p19CloseNoteOutputPrompt.includes(p19CloseNoteOutput?.headline ?? "") &&
      p19CloseNoteOutputPrompt.includes(
        p19CloseNoteOutput?.namespace.output_summary ?? ""
      ) &&
      systemPrompt.includes("Role core close-note output") &&
      systemPrompt.includes(p19CloseNoteOutput?.headline ?? ""),
    retention_close_note_output_contract_v1_ok:
      p19CloseNoteOutput?.retention.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.retention.phase_snapshot_id &&
      p19CloseNoteOutput?.retention.decision_group ===
        p17CloseNoteHandoffPacket?.retention.decision_group &&
      p19CloseNoteOutput?.retention.output_summary.includes(
        p17CloseNoteHandoffPacket?.retention.retained_fields.join(", ") ?? ""
      ),
    retention_close_note_output_metadata_consistency_v1_ok:
      assistantCloseNoteOutput?.retention.output_summary ===
        p19CloseNoteOutput?.retention.output_summary &&
      assistantDiagnosticCloseNoteOutput?.retention.decision_group ===
        p19CloseNoteOutput?.retention.decision_group &&
      runtimeDebugCloseNoteOutput?.retention.phase_snapshot_summary ===
        p19CloseNoteOutput?.retention.phase_snapshot_summary,
    retention_close_note_output_prompt_surface_v1_ok:
      p19CloseNoteOutputPrompt.includes(
        p19CloseNoteOutput?.retention.output_summary ?? ""
      ) &&
      systemPrompt.includes(
        p19CloseNoteOutput?.retention.output_summary ?? ""
      ) &&
      p19CloseNoteOutputPrompt.includes("Retention output section"),
    knowledge_close_note_output_contract_v1_ok:
      p19CloseNoteOutput?.knowledge.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.knowledge.phase_snapshot_id &&
      p19CloseNoteOutput?.knowledge.output_summary.includes(
        p17CloseNoteHandoffPacket?.knowledge.scope_layers.join(", ") ?? ""
      ) &&
      p19CloseNoteOutput?.knowledge.output_summary.includes(
        p17CloseNoteHandoffPacket?.knowledge.governance_classes.join(", ") ?? ""
      ),
    knowledge_close_note_output_metadata_consistency_v1_ok:
      assistantCloseNoteOutput?.knowledge.output_summary ===
        p19CloseNoteOutput?.knowledge.output_summary &&
      assistantDiagnosticCloseNoteOutput?.knowledge.phase_snapshot_summary ===
        p19CloseNoteOutput?.knowledge.phase_snapshot_summary &&
      runtimeDebugCloseNoteOutput?.knowledge.governance_classes.join(",") ===
        p19CloseNoteOutput?.knowledge.governance_classes.join(","),
    knowledge_close_note_output_prompt_surface_v1_ok:
      p19CloseNoteOutputPrompt.includes(
        p19CloseNoteOutput?.knowledge.output_summary ?? ""
      ) &&
      systemPrompt.includes(
        p19CloseNoteOutput?.knowledge.output_summary ?? ""
      ) &&
      p19CloseNoteOutputPrompt.includes("Knowledge output section"),
    scenario_close_note_output_contract_v1_ok:
      p19CloseNoteOutput?.scenario.phase_snapshot_id ===
        p17CloseNoteHandoffPacket?.scenario.phase_snapshot_id &&
      p19CloseNoteOutput?.scenario.strategy_bundle_id ===
        p17CloseNoteHandoffPacket?.scenario.strategy_bundle_id &&
      p19CloseNoteOutput?.scenario.orchestration_mode ===
        p17CloseNoteHandoffPacket?.scenario.orchestration_mode,
    scenario_close_note_output_metadata_consistency_v1_ok:
      assistantCloseNoteOutput?.scenario.output_summary ===
        p19CloseNoteOutput?.scenario.output_summary &&
      assistantDiagnosticCloseNoteOutput?.scenario.strategy_bundle_id ===
        p19CloseNoteOutput?.scenario.strategy_bundle_id &&
      runtimeDebugCloseNoteOutput?.scenario.orchestration_mode ===
        p19CloseNoteOutput?.scenario.orchestration_mode,
    scenario_close_note_output_prompt_surface_v1_ok:
      p19CloseNoteOutputPrompt.includes(
        p19CloseNoteOutput?.scenario.output_summary ?? ""
      ) &&
      systemPrompt.includes(
        p19CloseNoteOutput?.scenario.output_summary ?? ""
      ) &&
      p19CloseNoteOutputPrompt.includes("Scenario output section")
  } as const;
  const p19PositiveContracts = summarizeGate({
    namespace_close_note_output_contract_v1_ok:
      p19CloseNoteOutputChecks.namespace_close_note_output_contract_v1_ok,
    retention_close_note_output_contract_v1_ok:
      p19CloseNoteOutputChecks.retention_close_note_output_contract_v1_ok,
    knowledge_close_note_output_contract_v1_ok:
      p19CloseNoteOutputChecks.knowledge_close_note_output_contract_v1_ok,
    scenario_close_note_output_contract_v1_ok:
      p19CloseNoteOutputChecks.scenario_close_note_output_contract_v1_ok
  });
  const p19MetadataConsistency = summarizeGate({
    namespace_close_note_output_metadata_consistency_v1_ok:
      p19CloseNoteOutputChecks.namespace_close_note_output_metadata_consistency_v1_ok,
    retention_close_note_output_metadata_consistency_v1_ok:
      p19CloseNoteOutputChecks.retention_close_note_output_metadata_consistency_v1_ok,
    knowledge_close_note_output_metadata_consistency_v1_ok:
      p19CloseNoteOutputChecks.knowledge_close_note_output_metadata_consistency_v1_ok,
    scenario_close_note_output_metadata_consistency_v1_ok:
      p19CloseNoteOutputChecks.scenario_close_note_output_metadata_consistency_v1_ok
  });
  const p19PromptSurface = summarizeGate({
    namespace_close_note_output_prompt_surface_v1_ok:
      p19CloseNoteOutputChecks.namespace_close_note_output_prompt_surface_v1_ok,
    retention_close_note_output_prompt_surface_v1_ok:
      p19CloseNoteOutputChecks.retention_close_note_output_prompt_surface_v1_ok,
    knowledge_close_note_output_prompt_surface_v1_ok:
      p19CloseNoteOutputChecks.knowledge_close_note_output_prompt_surface_v1_ok,
    scenario_close_note_output_prompt_surface_v1_ok:
      p19CloseNoteOutputChecks.scenario_close_note_output_prompt_surface_v1_ok
  });
  const p19CloseReadinessConsumptionChecks = {
    role_core_memory_close_note_output_close_readiness_prompt_v1_ok:
      p19CloseNoteOutputPrompt.includes(
        p19CloseNoteOutput?.readiness_judgment ?? ""
      ) &&
      p19CloseNoteOutputPrompt.includes(
        p19CloseNoteOutput?.progress_range ?? ""
      ) &&
      p19CloseNoteOutputPrompt.includes(
        p19CloseNoteOutput?.close_note_recommended ? "true" : "false"
      ) &&
      p19CloseNoteOutputPrompt.includes(
        `blocking = ${p19CloseNoteOutput?.acceptance_gap_buckets.blocking ?? 0}`
      ) &&
      p19CloseNoteOutputPrompt.includes("close_readiness_output_consumption"),
    role_core_memory_close_note_output_gap_bucket_consumption_v1_ok:
      assistantCloseNoteOutput?.readiness_judgment ===
        p19CloseNoteOutput?.readiness_judgment &&
      assistantCloseNoteOutput?.progress_range ===
        p19CloseNoteOutput?.progress_range &&
      assistantCloseNoteOutput?.close_candidate ===
        p19CloseNoteOutput?.close_candidate &&
      assistantCloseNoteOutput?.close_note_recommended ===
        p19CloseNoteOutput?.close_note_recommended &&
      assistantCloseNoteOutput?.acceptance_gap_buckets.non_blocking ===
        p19CloseNoteOutput?.acceptance_gap_buckets.non_blocking &&
      assistantDiagnosticCloseNoteOutput?.acceptance_gap_buckets
        .tail_candidate ===
        p19CloseNoteOutput?.acceptance_gap_buckets.tail_candidate &&
      runtimeDebugCloseNoteOutput?.readiness_judgment ===
        p19CloseNoteOutput?.readiness_judgment &&
      runtimeDebugCloseNoteOutput?.progress_range ===
        p19CloseNoteOutput?.progress_range &&
      runtimeDebugCloseNoteOutput?.close_note_recommended ===
        p19CloseNoteOutput?.close_note_recommended &&
      runtimeDebugCloseNoteOutput?.acceptance_gap_buckets.blocking ===
        p19CloseNoteOutput?.acceptance_gap_buckets.blocking &&
      runtimeDebugCloseNoteOutput?.next_expansion_focus.includes(
        "close_readiness_output_consumption"
      ),
    role_core_memory_close_note_output_gap_structuring_v1_ok:
      (p19CloseNoteOutput?.blocking_items.length ?? 0) ===
        (p19CloseNoteOutput?.acceptance_gap_buckets.blocking ?? -1) &&
      (p19CloseNoteOutput?.non_blocking_items.length ?? 0) ===
        (p19CloseNoteOutput?.acceptance_gap_buckets.non_blocking ?? -1) &&
      (p19CloseNoteOutput?.tail_candidate_items.length ?? 0) ===
        (p19CloseNoteOutput?.acceptance_gap_buckets.tail_candidate ?? -1) &&
      p19CloseNoteOutput?.next_expansion_focus.includes(
        "output_regression_gate_layering"
      ) &&
      p19CloseNoteOutput?.next_expansion_focus.includes(
        "close_readiness_output_consumption"
      ) &&
      p19CloseNoteOutput?.next_expansion_focus.includes(
        "remaining_output_acceptance_gaps"
      ),
    role_core_memory_close_note_output_close_note_input_readiness_v1_ok:
      p19CloseNoteOutputPrompt.includes(
        p19CloseNoteOutput?.non_blocking_items.join(", ") ?? ""
      ) &&
      p19CloseNoteOutputPrompt.includes(
        p19CloseNoteOutput?.tail_candidate_items.join(", ") ?? ""
      ) &&
      p19CloseNoteOutputPrompt.includes(
        p19CloseNoteOutput?.next_expansion_focus.join(", ") ?? ""
      ) &&
      systemPrompt.includes(
        p19CloseNoteOutput?.non_blocking_items.join(", ") ?? ""
      ) &&
      systemPrompt.includes(
        p19CloseNoteOutput?.tail_candidate_items.join(", ") ?? ""
      ) &&
      (assistantCloseNoteOutput?.non_blocking_items.length ?? -1) ===
        (p19CloseNoteOutput?.non_blocking_items.length ?? -2) &&
      (assistantDiagnosticCloseNoteOutput?.tail_candidate_items.length ?? -1) ===
        (p19CloseNoteOutput?.tail_candidate_items.length ?? -2) &&
      (runtimeDebugCloseNoteOutput?.next_expansion_focus.length ?? -1) ===
        (p19CloseNoteOutput?.next_expansion_focus.length ?? -2)
  } as const;
  const p19CloseReadinessConsumption = summarizeGate(
    p19CloseReadinessConsumptionChecks
  );
  const p19RegressionGate = {
    positive_contracts: p19PositiveContracts,
    metadata_consistency: p19MetadataConsistency,
    prompt_surface: p19PromptSurface,
    close_readiness_consumption: p19CloseReadinessConsumption,
    ...summarizeGate({
      ...p19CloseNoteOutputChecks,
      ...p19CloseReadinessConsumptionChecks
    })
  } as const;
  const p19GateSnapshot = {
    gate_id: "p19_regression_gate_v2",
    stage: "P19-5",
    focus: "close_note_outputization",
    output_contract_readiness:
      p19CloseNoteOutput?.close_note_recommended === true
        ? "output_close_ready"
        : "output_close_readiness_consumption_started",
    progress_range: "80% - 85%",
    close_note_recommended:
      p19CloseNoteOutput?.close_note_recommended ?? false,
    blocking_items: p19CloseNoteOutput?.blocking_items ?? [],
    non_blocking_items: p19CloseNoteOutput?.non_blocking_items ?? [],
    tail_candidate_items: p19CloseNoteOutput?.tail_candidate_items ?? [],
    acceptance_gap_buckets:
      p19CloseNoteOutput?.acceptance_gap_buckets ?? {
        blocking: 0,
        non_blocking: 0,
        tail_candidate: 0
      },
    next_expansion_focus: p19CloseNoteOutput?.next_expansion_focus ?? [],
    positive_contracts: {
      checks_passed: p19PositiveContracts.checks_passed,
      checks_total: p19PositiveContracts.checks_total,
      all_green: p19PositiveContracts.all_green
    },
    metadata_consistency: {
      checks_passed: p19MetadataConsistency.checks_passed,
      checks_total: p19MetadataConsistency.checks_total,
      all_green: p19MetadataConsistency.all_green
    },
    prompt_surface: {
      checks_passed: p19PromptSurface.checks_passed,
      checks_total: p19PromptSurface.checks_total,
      all_green: p19PromptSurface.all_green
    },
    close_readiness_consumption: {
      checks_passed: p19CloseReadinessConsumption.checks_passed,
      checks_total: p19CloseReadinessConsumption.checks_total,
      all_green: p19CloseReadinessConsumption.all_green
    },
    overall: {
      checks_passed: p19RegressionGate.checks_passed,
      checks_total: p19RegressionGate.checks_total,
      failed_checks: p19RegressionGate.failed_checks,
      all_green: p19RegressionGate.all_green,
      close_candidate: p19RegressionGate.close_candidate
    }
  } as const;
  const p20CloseNoteRecordChecks = {
    namespace_close_note_record_contract_v1_ok:
      p20CloseNoteRecord?.namespace.phase_snapshot_id ===
        p19CloseNoteOutput?.namespace.phase_snapshot_id &&
      p20CloseNoteRecord?.namespace.phase_snapshot_summary ===
        p19CloseNoteOutput?.namespace.phase_snapshot_summary &&
      p20CloseNoteRecord?.namespace.record_summary.includes(
        p19CloseNoteOutput?.headline ?? ""
      ),
    namespace_close_note_record_metadata_consistency_v1_ok:
      assistantCloseNoteRecord?.namespace.record_summary ===
        p20CloseNoteRecord?.namespace.record_summary &&
      assistantDiagnosticCloseNoteRecord?.headline ===
        p20CloseNoteRecord?.headline &&
      runtimeDebugCloseNoteRecord?.readiness_judgment ===
        p20CloseNoteRecord?.readiness_judgment,
    namespace_close_note_record_prompt_surface_v1_ok:
      p20CloseNoteRecordPrompt.includes("Role core close-note record") &&
      p20CloseNoteRecordPrompt.includes(p20CloseNoteRecord?.headline ?? "") &&
      p20CloseNoteRecordPrompt.includes(
        p20CloseNoteRecord?.namespace.record_summary ?? ""
      ) &&
      systemPrompt.includes("Role core close-note record") &&
      systemPrompt.includes(p20CloseNoteRecord?.headline ?? ""),
    retention_close_note_record_contract_v1_ok:
      p20CloseNoteRecord?.retention.phase_snapshot_id ===
        p19CloseNoteOutput?.retention.phase_snapshot_id &&
      p20CloseNoteRecord?.retention.decision_group ===
        p19CloseNoteOutput?.retention.decision_group &&
      p20CloseNoteRecord?.retention.record_summary.includes(
        p19CloseNoteOutput?.retention.retained_fields.join(", ") ?? ""
      ),
    retention_close_note_record_metadata_consistency_v1_ok:
      assistantCloseNoteRecord?.retention.record_summary ===
        p20CloseNoteRecord?.retention.record_summary &&
      assistantDiagnosticCloseNoteRecord?.retention.decision_group ===
        p20CloseNoteRecord?.retention.decision_group &&
      runtimeDebugCloseNoteRecord?.retention.phase_snapshot_summary ===
        p20CloseNoteRecord?.retention.phase_snapshot_summary,
    retention_close_note_record_prompt_surface_v1_ok:
      p20CloseNoteRecordPrompt.includes(
        p20CloseNoteRecord?.retention.record_summary ?? ""
      ) &&
      systemPrompt.includes(
        p20CloseNoteRecord?.retention.record_summary ?? ""
      ) &&
      p20CloseNoteRecordPrompt.includes("Retention record section"),
    knowledge_close_note_record_contract_v1_ok:
      p20CloseNoteRecord?.knowledge.phase_snapshot_id ===
        p19CloseNoteOutput?.knowledge.phase_snapshot_id &&
      p20CloseNoteRecord?.knowledge.phase_snapshot_summary ===
        p19CloseNoteOutput?.knowledge.phase_snapshot_summary &&
      p20CloseNoteRecord?.knowledge.record_summary.includes(
        p19CloseNoteOutput?.knowledge.scope_layers.join(", ") ?? ""
      ) &&
      p20CloseNoteRecord?.knowledge.record_summary.includes(
        p19CloseNoteOutput?.knowledge.governance_classes.join(", ") ?? ""
      ),
    knowledge_close_note_record_metadata_consistency_v1_ok:
      assistantCloseNoteRecord?.knowledge.record_summary ===
        p20CloseNoteRecord?.knowledge.record_summary &&
      assistantDiagnosticCloseNoteRecord?.knowledge.phase_snapshot_summary ===
        p20CloseNoteRecord?.knowledge.phase_snapshot_summary &&
      runtimeDebugCloseNoteRecord?.knowledge.governance_classes.join(",") ===
        p20CloseNoteRecord?.knowledge.governance_classes.join(","),
    knowledge_close_note_record_prompt_surface_v1_ok:
      p20CloseNoteRecordPrompt.includes(
        p20CloseNoteRecord?.knowledge.record_summary ?? ""
      ) &&
      systemPrompt.includes(
        p20CloseNoteRecord?.knowledge.record_summary ?? ""
      ) &&
      p20CloseNoteRecordPrompt.includes("Knowledge record section"),
    scenario_close_note_record_contract_v1_ok:
      p20CloseNoteRecord?.scenario.phase_snapshot_id ===
        p19CloseNoteOutput?.scenario.phase_snapshot_id &&
      p20CloseNoteRecord?.scenario.strategy_bundle_id ===
        p19CloseNoteOutput?.scenario.strategy_bundle_id &&
      p20CloseNoteRecord?.scenario.orchestration_mode ===
        p19CloseNoteOutput?.scenario.orchestration_mode,
    scenario_close_note_record_metadata_consistency_v1_ok:
      assistantCloseNoteRecord?.scenario.record_summary ===
        p20CloseNoteRecord?.scenario.record_summary &&
      assistantDiagnosticCloseNoteRecord?.scenario.strategy_bundle_id ===
        p20CloseNoteRecord?.scenario.strategy_bundle_id &&
      runtimeDebugCloseNoteRecord?.scenario.orchestration_mode ===
        p20CloseNoteRecord?.scenario.orchestration_mode,
    scenario_close_note_record_prompt_surface_v1_ok:
      p20CloseNoteRecordPrompt.includes(
        p20CloseNoteRecord?.scenario.record_summary ?? ""
      ) &&
      systemPrompt.includes(
        p20CloseNoteRecord?.scenario.record_summary ?? ""
      ) &&
      p20CloseNoteRecordPrompt.includes("Scenario record section")
  } as const;
  const p20PositiveContracts = summarizeGate({
    namespace_close_note_record_contract_v1_ok:
      p20CloseNoteRecordChecks.namespace_close_note_record_contract_v1_ok,
    retention_close_note_record_contract_v1_ok:
      p20CloseNoteRecordChecks.retention_close_note_record_contract_v1_ok,
    knowledge_close_note_record_contract_v1_ok:
      p20CloseNoteRecordChecks.knowledge_close_note_record_contract_v1_ok,
    scenario_close_note_record_contract_v1_ok:
      p20CloseNoteRecordChecks.scenario_close_note_record_contract_v1_ok
  });
  const p20MetadataConsistency = summarizeGate({
    namespace_close_note_record_metadata_consistency_v1_ok:
      p20CloseNoteRecordChecks.namespace_close_note_record_metadata_consistency_v1_ok,
    retention_close_note_record_metadata_consistency_v1_ok:
      p20CloseNoteRecordChecks.retention_close_note_record_metadata_consistency_v1_ok,
    knowledge_close_note_record_metadata_consistency_v1_ok:
      p20CloseNoteRecordChecks.knowledge_close_note_record_metadata_consistency_v1_ok,
    scenario_close_note_record_metadata_consistency_v1_ok:
      p20CloseNoteRecordChecks.scenario_close_note_record_metadata_consistency_v1_ok
  });
  const p20PromptSurface = summarizeGate({
    namespace_close_note_record_prompt_surface_v1_ok:
      p20CloseNoteRecordChecks.namespace_close_note_record_prompt_surface_v1_ok,
    retention_close_note_record_prompt_surface_v1_ok:
      p20CloseNoteRecordChecks.retention_close_note_record_prompt_surface_v1_ok,
    knowledge_close_note_record_prompt_surface_v1_ok:
      p20CloseNoteRecordChecks.knowledge_close_note_record_prompt_surface_v1_ok,
    scenario_close_note_record_prompt_surface_v1_ok:
      p20CloseNoteRecordChecks.scenario_close_note_record_prompt_surface_v1_ok
  });
  const p20DriftGuardChecks = {
    role_core_memory_close_note_record_null_guard_v1_ok:
      buildRoleCoreMemoryCloseNoteRecord({
        roleCorePacket: roleCorePacketForHarness,
        closeNoteOutput: null,
        closeNoteArtifact: p18CloseNoteArtifact
      }) === null &&
      buildRoleCoreMemoryCloseNoteRecord({
        roleCorePacket: roleCorePacketForHarness,
        closeNoteOutput: p19CloseNoteOutput,
        closeNoteArtifact: null
      }) === null,
    role_core_memory_close_note_record_prompt_drift_guard_v1_ok:
      !systemPromptWithoutCloseNote.includes("Role core close-note record") &&
      !systemPromptWithoutCloseNote.includes(
        p20CloseNoteRecord?.headline ?? ""
      ) &&
      systemPrompt.includes("Role core close-note record") &&
      systemPrompt.includes(p20CloseNoteRecord?.record_summary ?? "")
  } as const;
  const p20DriftGuards = summarizeGate(p20DriftGuardChecks);
  const p20CloseReadinessConsumptionChecks = {
    role_core_memory_close_note_record_close_readiness_prompt_v1_ok:
      p20CloseNoteRecordPrompt.includes(
        p20CloseNoteRecord?.readiness_judgment ?? ""
      ) &&
      p20CloseNoteRecordPrompt.includes(
        p20CloseNoteRecord?.progress_range ?? ""
      ) &&
      p20CloseNoteRecordPrompt.includes(
        p20CloseNoteRecord?.close_candidate ? "true" : "false"
      ) &&
      p20CloseNoteRecordPrompt.includes(
        `blocking = ${p20CloseNoteRecord?.acceptance_gap_buckets.blocking ?? 0}`
      ) &&
      p20CloseNoteRecordPrompt.includes(
        "close_readiness_record_consumption"
      ),
    role_core_memory_close_note_record_gap_bucket_consumption_v1_ok:
      assistantCloseNoteRecord?.readiness_judgment ===
        p20CloseNoteRecord?.readiness_judgment &&
      assistantCloseNoteRecord?.progress_range ===
        p20CloseNoteRecord?.progress_range &&
      assistantCloseNoteRecord?.close_candidate ===
        p20CloseNoteRecord?.close_candidate &&
      assistantCloseNoteRecord?.close_note_recommended ===
        p20CloseNoteRecord?.close_note_recommended &&
      assistantCloseNoteRecord?.acceptance_gap_buckets.non_blocking ===
        p20CloseNoteRecord?.acceptance_gap_buckets.non_blocking &&
      assistantDiagnosticCloseNoteRecord?.acceptance_gap_buckets
        .tail_candidate ===
        p20CloseNoteRecord?.acceptance_gap_buckets.tail_candidate &&
      runtimeDebugCloseNoteRecord?.readiness_judgment ===
        p20CloseNoteRecord?.readiness_judgment &&
      runtimeDebugCloseNoteRecord?.progress_range ===
        p20CloseNoteRecord?.progress_range &&
      runtimeDebugCloseNoteRecord?.close_note_recommended ===
        p20CloseNoteRecord?.close_note_recommended &&
      runtimeDebugCloseNoteRecord?.acceptance_gap_buckets.blocking ===
        p20CloseNoteRecord?.acceptance_gap_buckets.blocking &&
      runtimeDebugCloseNoteRecord?.next_expansion_focus.includes(
        "close_readiness_record_consumption"
      ),
    role_core_memory_close_note_record_gap_structuring_v1_ok:
      (p20CloseNoteRecord?.blocking_items.length ?? 0) ===
        (p20CloseNoteRecord?.acceptance_gap_buckets.blocking ?? -1) &&
      (p20CloseNoteRecord?.non_blocking_items.length ?? 0) ===
        (p20CloseNoteRecord?.acceptance_gap_buckets.non_blocking ?? -1) &&
      (p20CloseNoteRecord?.tail_candidate_items.length ?? 0) ===
        (p20CloseNoteRecord?.acceptance_gap_buckets.tail_candidate ?? -1) &&
      p20CloseNoteRecord?.next_expansion_focus.includes(
        "record_regression_gate_layering"
      ) &&
      p20CloseNoteRecord?.next_expansion_focus.includes(
        "close_readiness_record_consumption"
      ) &&
      p20CloseNoteRecord?.next_expansion_focus.includes(
        "remaining_record_acceptance_gaps"
      ),
    role_core_memory_close_note_record_close_note_input_readiness_v1_ok:
      p20CloseNoteRecordPrompt.includes(
        p20CloseNoteRecord?.non_blocking_items.join(", ") ?? ""
      ) &&
      p20CloseNoteRecordPrompt.includes(
        p20CloseNoteRecord?.tail_candidate_items.join(", ") ?? ""
      ) &&
      p20CloseNoteRecordPrompt.includes(
        p20CloseNoteRecord?.next_expansion_focus.join(", ") ?? ""
      ) &&
      systemPrompt.includes(
        p20CloseNoteRecord?.non_blocking_items.join(", ") ?? ""
      ) &&
      systemPrompt.includes(
        p20CloseNoteRecord?.tail_candidate_items.join(", ") ?? ""
      ) &&
      (assistantCloseNoteRecord?.non_blocking_items.length ?? -1) ===
        (p20CloseNoteRecord?.non_blocking_items.length ?? -2) &&
      (assistantDiagnosticCloseNoteRecord?.tail_candidate_items.length ?? -1) ===
        (p20CloseNoteRecord?.tail_candidate_items.length ?? -2) &&
      (runtimeDebugCloseNoteRecord?.next_expansion_focus.length ?? -1) ===
        (p20CloseNoteRecord?.next_expansion_focus.length ?? -2)
  } as const;
  const p20CloseReadinessConsumption = summarizeGate(
    p20CloseReadinessConsumptionChecks
  );
  const p20RegressionGate = {
    positive_contracts: p20PositiveContracts,
    metadata_consistency: p20MetadataConsistency,
    prompt_surface: p20PromptSurface,
    drift_guards: p20DriftGuards,
    close_readiness_consumption: p20CloseReadinessConsumption,
    ...summarizeGate({
      ...p20CloseNoteRecordChecks,
      ...p20DriftGuardChecks,
      ...p20CloseReadinessConsumptionChecks
    })
  } as const;
  const p20GateSnapshot = {
    gate_id: "p20_regression_gate_v2",
    stage: "P20-5",
    focus: "close_note_recordization",
    record_contract_readiness:
      p20CloseNoteRecord?.close_note_recommended === true
        ? "record_close_ready"
        : "record_close_readiness_consumption_started",
    progress_range: "70% - 75%",
    close_note_recommended: p20CloseNoteRecord?.close_note_recommended ?? false,
    blocking_items: p20CloseNoteRecord?.blocking_items ?? [],
    non_blocking_items: p20CloseNoteRecord?.non_blocking_items ?? [],
    tail_candidate_items: p20CloseNoteRecord?.tail_candidate_items ?? [],
    acceptance_gap_buckets:
      p20CloseNoteRecord?.acceptance_gap_buckets ?? {
        blocking: 0,
        non_blocking: 0,
        tail_candidate: 0
      },
    next_expansion_focus: p20CloseNoteRecord?.next_expansion_focus ?? [],
    positive_contracts: {
      checks_passed: p20PositiveContracts.checks_passed,
      checks_total: p20PositiveContracts.checks_total,
      all_green: p20PositiveContracts.all_green
    },
    metadata_consistency: {
      checks_passed: p20MetadataConsistency.checks_passed,
      checks_total: p20MetadataConsistency.checks_total,
      all_green: p20MetadataConsistency.all_green
    },
    prompt_surface: {
      checks_passed: p20PromptSurface.checks_passed,
      checks_total: p20PromptSurface.checks_total,
      all_green: p20PromptSurface.all_green
    },
    drift_guards: {
      checks_passed: p20DriftGuards.checks_passed,
      checks_total: p20DriftGuards.checks_total,
      all_green: p20DriftGuards.all_green
    },
    close_readiness_consumption: {
      checks_passed: p20CloseReadinessConsumption.checks_passed,
      checks_total: p20CloseReadinessConsumption.checks_total,
      all_green: p20CloseReadinessConsumption.all_green
    },
    overall: {
      checks_passed: p20RegressionGate.checks_passed,
      checks_total: p20RegressionGate.checks_total,
      failed_checks: p20RegressionGate.failed_checks,
      all_green: p20RegressionGate.all_green,
      close_candidate: p20RegressionGate.close_candidate
    }
  } as const;
  const p21CloseNoteArchiveChecks = {
    namespace_close_note_archive_contract_v1_ok:
      p21CloseNoteArchive?.archive_version === "v1" &&
      p21CloseNoteArchive.source_record_version === "v1" &&
      p21CloseNoteArchive.source_output_version === "v1" &&
      p21CloseNoteArchive.headline.includes("Helper close-note archive") &&
      p21CloseNoteArchive.namespace.phase_snapshot_id ===
        p20CloseNoteRecord?.namespace.phase_snapshot_id &&
      p21CloseNoteArchive.namespace.archive_summary.includes(
        p20CloseNoteRecord?.headline ?? ""
      ),
    namespace_close_note_archive_metadata_consistency_v1_ok:
      assistantCloseNoteArchive?.headline === p21CloseNoteArchive?.headline &&
      assistantDiagnosticCloseNoteArchive?.namespace.archive_summary ===
        p21CloseNoteArchive?.namespace.archive_summary &&
      runtimeDebugCloseNoteArchive?.archive_summary ===
        p21CloseNoteArchive?.archive_summary,
    namespace_close_note_archive_prompt_surface_v1_ok:
      p21CloseNoteArchivePrompt.includes("Role core close-note archive") &&
      p21CloseNoteArchivePrompt.includes(p21CloseNoteArchive?.headline ?? "") &&
      p21CloseNoteArchivePrompt.includes(
        p21CloseNoteArchive?.namespace.archive_summary ?? ""
      ) &&
      systemPrompt.includes("Role core close-note archive") &&
      systemPrompt.includes(p21CloseNoteArchive?.headline ?? ""),
    retention_close_note_archive_contract_v1_ok:
      p21CloseNoteArchive?.retention.phase_snapshot_id ===
        p20CloseNoteRecord?.retention.phase_snapshot_id &&
      p21CloseNoteArchive?.retention.decision_group ===
        p20CloseNoteRecord?.retention.decision_group &&
      p21CloseNoteArchive?.retention.archive_summary.includes(
        p20CloseNoteRecord?.retention.retained_fields.join(", ") ?? ""
      ),
    retention_close_note_archive_metadata_consistency_v1_ok:
      assistantCloseNoteArchive?.retention.archive_summary ===
        p21CloseNoteArchive?.retention.archive_summary &&
      assistantDiagnosticCloseNoteArchive?.retention.decision_group ===
        p21CloseNoteArchive?.retention.decision_group &&
      runtimeDebugCloseNoteArchive?.retention.phase_snapshot_summary ===
        p21CloseNoteArchive?.retention.phase_snapshot_summary,
    retention_close_note_archive_prompt_surface_v1_ok:
      p21CloseNoteArchivePrompt.includes(
        p21CloseNoteArchive?.retention.archive_summary ?? ""
      ) &&
      systemPrompt.includes(
        p21CloseNoteArchive?.retention.archive_summary ?? ""
      ) &&
      p21CloseNoteArchivePrompt.includes("Retention archive section"),
    knowledge_close_note_archive_contract_v1_ok:
      p21CloseNoteArchive?.knowledge.phase_snapshot_id ===
        p20CloseNoteRecord?.knowledge.phase_snapshot_id &&
      p21CloseNoteArchive?.knowledge.phase_snapshot_summary ===
        p20CloseNoteRecord?.knowledge.phase_snapshot_summary &&
      p21CloseNoteArchive?.knowledge.archive_summary.includes(
        p20CloseNoteRecord?.knowledge.scope_layers.join(", ") ?? ""
      ) &&
      p21CloseNoteArchive?.knowledge.archive_summary.includes(
        p20CloseNoteRecord?.knowledge.governance_classes.join(", ") ?? ""
      ),
    knowledge_close_note_archive_metadata_consistency_v1_ok:
      assistantCloseNoteArchive?.knowledge.archive_summary ===
        p21CloseNoteArchive?.knowledge.archive_summary &&
      assistantDiagnosticCloseNoteArchive?.knowledge.phase_snapshot_summary ===
        p21CloseNoteArchive?.knowledge.phase_snapshot_summary &&
      runtimeDebugCloseNoteArchive?.knowledge.governance_classes.join(",") ===
        p21CloseNoteArchive?.knowledge.governance_classes.join(","),
    knowledge_close_note_archive_prompt_surface_v1_ok:
      p21CloseNoteArchivePrompt.includes(
        p21CloseNoteArchive?.knowledge.archive_summary ?? ""
      ) &&
      systemPrompt.includes(
        p21CloseNoteArchive?.knowledge.archive_summary ?? ""
      ) &&
      p21CloseNoteArchivePrompt.includes("Knowledge archive section"),
    scenario_close_note_archive_contract_v1_ok:
      p21CloseNoteArchive?.scenario.phase_snapshot_id ===
        p20CloseNoteRecord?.scenario.phase_snapshot_id &&
      p21CloseNoteArchive?.scenario.strategy_bundle_id ===
        p20CloseNoteRecord?.scenario.strategy_bundle_id &&
      p21CloseNoteArchive?.scenario.orchestration_mode ===
        p20CloseNoteRecord?.scenario.orchestration_mode,
    scenario_close_note_archive_metadata_consistency_v1_ok:
      assistantCloseNoteArchive?.scenario.archive_summary ===
        p21CloseNoteArchive?.scenario.archive_summary &&
      assistantDiagnosticCloseNoteArchive?.scenario.strategy_bundle_id ===
        p21CloseNoteArchive?.scenario.strategy_bundle_id &&
      runtimeDebugCloseNoteArchive?.scenario.orchestration_mode ===
        p21CloseNoteArchive?.scenario.orchestration_mode,
    scenario_close_note_archive_prompt_surface_v1_ok:
      p21CloseNoteArchivePrompt.includes(
        p21CloseNoteArchive?.scenario.archive_summary ?? ""
      ) &&
      systemPrompt.includes(
        p21CloseNoteArchive?.scenario.archive_summary ?? ""
      ) &&
      p21CloseNoteArchivePrompt.includes("Scenario archive section")
  } as const;
  const p21PositiveContracts = summarizeGate({
    namespace_close_note_archive_contract_v1_ok:
      p21CloseNoteArchiveChecks.namespace_close_note_archive_contract_v1_ok,
    retention_close_note_archive_contract_v1_ok:
      p21CloseNoteArchiveChecks.retention_close_note_archive_contract_v1_ok,
    knowledge_close_note_archive_contract_v1_ok:
      p21CloseNoteArchiveChecks.knowledge_close_note_archive_contract_v1_ok,
    scenario_close_note_archive_contract_v1_ok:
      p21CloseNoteArchiveChecks.scenario_close_note_archive_contract_v1_ok
  });
  const p21MetadataConsistency = summarizeGate({
    namespace_close_note_archive_metadata_consistency_v1_ok:
      p21CloseNoteArchiveChecks.namespace_close_note_archive_metadata_consistency_v1_ok,
    retention_close_note_archive_metadata_consistency_v1_ok:
      p21CloseNoteArchiveChecks.retention_close_note_archive_metadata_consistency_v1_ok,
    knowledge_close_note_archive_metadata_consistency_v1_ok:
      p21CloseNoteArchiveChecks.knowledge_close_note_archive_metadata_consistency_v1_ok,
    scenario_close_note_archive_metadata_consistency_v1_ok:
      p21CloseNoteArchiveChecks.scenario_close_note_archive_metadata_consistency_v1_ok
  });
  const p21PromptSurface = summarizeGate({
    namespace_close_note_archive_prompt_surface_v1_ok:
      p21CloseNoteArchiveChecks.namespace_close_note_archive_prompt_surface_v1_ok,
    retention_close_note_archive_prompt_surface_v1_ok:
      p21CloseNoteArchiveChecks.retention_close_note_archive_prompt_surface_v1_ok,
    knowledge_close_note_archive_prompt_surface_v1_ok:
      p21CloseNoteArchiveChecks.knowledge_close_note_archive_prompt_surface_v1_ok,
    scenario_close_note_archive_prompt_surface_v1_ok:
      p21CloseNoteArchiveChecks.scenario_close_note_archive_prompt_surface_v1_ok
  });
  const p21RegressionGate = {
    positive_contracts: p21PositiveContracts,
    metadata_consistency: p21MetadataConsistency,
    prompt_surface: p21PromptSurface,
    ...summarizeGate(p21CloseNoteArchiveChecks)
  } as const;
  const p21GateSnapshot = {
    gate_id: "p21_regression_gate_v1",
    stage: "P21-5",
    focus: "close_note_archiveization",
    archive_contract_readiness: "scenario_archive_started_not_close_ready",
    progress_range: "40% - 45%",
    close_note_recommended: p21CloseNoteArchive?.close_note_recommended ?? false,
    positive_contracts: {
      checks_passed: p21PositiveContracts.checks_passed,
      checks_total: p21PositiveContracts.checks_total,
      all_green: p21PositiveContracts.all_green
    },
    metadata_consistency: {
      checks_passed: p21MetadataConsistency.checks_passed,
      checks_total: p21MetadataConsistency.checks_total,
      all_green: p21MetadataConsistency.all_green
    },
    prompt_surface: {
      checks_passed: p21PromptSurface.checks_passed,
      checks_total: p21PromptSurface.checks_total,
      all_green: p21PromptSurface.all_green
    },
    overall: {
      checks_passed: p21RegressionGate.checks_passed,
      checks_total: p21RegressionGate.checks_total,
      failed_checks: p21RegressionGate.failed_checks,
      all_green: p21RegressionGate.all_green,
      close_candidate: p21RegressionGate.close_candidate
    }
  } as const;
  const p18PositiveContracts = summarizeGate({
    role_core_memory_close_note_artifact_v1_ok:
      p18CloseNoteArtifactChecks.role_core_memory_close_note_artifact_v1_ok
  });
  const p18MetadataConsistency = summarizeGate({
    role_core_memory_close_note_artifact_metadata_consistency_v1_ok:
      p18CloseNoteArtifactChecks.role_core_memory_close_note_artifact_metadata_consistency_v1_ok
  });
  const p18PacketConsumption = summarizeGate({
    role_core_memory_close_note_artifact_prompt_surface_v1_ok:
      p18CloseNoteArtifactChecks.role_core_memory_close_note_artifact_prompt_surface_v1_ok,
    role_core_memory_close_note_artifact_runtime_consumption_v1_ok:
      p18CloseNoteArtifactChecks.role_core_memory_close_note_artifact_runtime_consumption_v1_ok
  });
  const p18CloseReadinessConsumptionChecks = {
    role_core_memory_close_note_artifact_close_readiness_prompt_v1_ok:
      p18CloseNoteArtifactPrompt.includes(
        p18CloseNoteArtifact?.readiness_judgment ?? ""
      ) &&
      p18CloseNoteArtifactPrompt.includes(
        p18CloseNoteArtifact?.progress_range ?? ""
      ) &&
      p18CloseNoteArtifactPrompt.includes(
        p18CloseNoteArtifact?.close_note_recommended ? "true" : "false"
      ) &&
      p18CloseNoteArtifactPrompt.includes(
        `blocking = ${p18CloseNoteArtifact?.acceptance_gap_buckets.blocking ?? 0}`
      ) &&
      p18CloseNoteArtifactPrompt.includes(
        "close_readiness_handoff_alignment"
      ),
    role_core_memory_close_note_artifact_gap_bucket_consumption_v1_ok:
      assistantCloseNoteArtifact?.readiness_judgment ===
        p18CloseNoteArtifact?.readiness_judgment &&
      assistantCloseNoteArtifact?.progress_range ===
        p18CloseNoteArtifact?.progress_range &&
      assistantCloseNoteArtifact?.close_candidate ===
        p18CloseNoteArtifact?.close_candidate &&
      assistantCloseNoteArtifact?.close_note_recommended ===
        p18CloseNoteArtifact?.close_note_recommended &&
      assistantCloseNoteArtifact?.acceptance_gap_buckets.non_blocking ===
        p18CloseNoteArtifact?.acceptance_gap_buckets.non_blocking &&
      assistantDiagnosticCloseNoteArtifact?.acceptance_gap_buckets
        .tail_candidate ===
        p18CloseNoteArtifact?.acceptance_gap_buckets.tail_candidate &&
      runtimeDebugCloseNoteArtifact?.readiness_judgment ===
        p18CloseNoteArtifact?.readiness_judgment &&
      runtimeDebugCloseNoteArtifact?.progress_range ===
        p18CloseNoteArtifact?.progress_range &&
      runtimeDebugCloseNoteArtifact?.close_note_recommended ===
        p18CloseNoteArtifact?.close_note_recommended &&
      runtimeDebugCloseNoteArtifact?.acceptance_gap_buckets.blocking ===
        p18CloseNoteArtifact?.acceptance_gap_buckets.blocking &&
      runtimeDebugCloseNoteArtifact?.next_expansion_focus.includes(
        "close_readiness_handoff_alignment"
      ),
    role_core_memory_close_note_artifact_gap_structuring_v1_ok:
      (p18CloseNoteArtifact?.blocking_items.length ?? 0) ===
        (p18CloseNoteArtifact?.acceptance_gap_buckets.blocking ?? -1) &&
      (p18CloseNoteArtifact?.non_blocking_items.length ?? 0) ===
        (p18CloseNoteArtifact?.acceptance_gap_buckets.non_blocking ?? -1) &&
      (p18CloseNoteArtifact?.tail_candidate_items.length ?? 0) ===
        (p18CloseNoteArtifact?.acceptance_gap_buckets.tail_candidate ?? -1) &&
      p18CloseNoteArtifact?.next_expansion_focus.includes(
        "close_note_acceptance_structuring"
      ) &&
      p18CloseNoteArtifact?.next_expansion_focus.includes(
        "close_note_gate_snapshot_consumption"
      ) &&
      p18CloseNoteArtifact?.next_expansion_focus.includes(
        "close_readiness_handoff_alignment"
      ),
    role_core_memory_close_note_artifact_close_note_input_readiness_v1_ok:
      p18CloseNoteArtifactPrompt.includes(
        p18CloseNoteArtifact?.non_blocking_items.join(", ") ?? ""
      ) &&
      p18CloseNoteArtifactPrompt.includes(
        p18CloseNoteArtifact?.tail_candidate_items.join(", ") ?? ""
      ) &&
      p18CloseNoteArtifactPrompt.includes(
        p18CloseNoteArtifact?.next_expansion_focus.join(", ") ?? ""
      ) &&
      systemPrompt.includes(
        p18CloseNoteArtifact?.non_blocking_items.join(", ") ?? ""
      ) &&
      systemPrompt.includes(
        p18CloseNoteArtifact?.tail_candidate_items.join(", ") ?? ""
      ) &&
      (assistantCloseNoteArtifact?.non_blocking_items.length ?? -1) ===
        (p18CloseNoteArtifact?.non_blocking_items.length ?? -2) &&
      (assistantDiagnosticCloseNoteArtifact?.tail_candidate_items.length ?? -1) ===
        (p18CloseNoteArtifact?.tail_candidate_items.length ?? -2) &&
      (runtimeDebugCloseNoteArtifact?.next_expansion_focus.length ?? -1) ===
        (p18CloseNoteArtifact?.next_expansion_focus.length ?? -2)
  } as const;
  const p18CloseReadinessConsumption = summarizeGate(
    p18CloseReadinessConsumptionChecks
  );
  const p18DriftGuardChecks = {
    role_core_memory_close_note_artifact_null_guard_v1_ok:
      buildRoleCoreMemoryCloseNoteArtifact({
        roleCorePacket: roleCorePacketForHarness,
        closeNoteHandoffPacket: null
      }) === null,
    role_core_memory_close_note_artifact_prompt_drift_guard_v1_ok:
      !systemPromptWithoutArtifact.includes("Role core close-note artifact") &&
      !systemPromptWithoutArtifact.includes(p18CloseNoteArtifact?.headline ?? "") &&
      systemPrompt.includes("Role core close-note artifact") &&
      systemPrompt.includes(p18CloseNoteArtifact?.acceptance_summary ?? "")
  } as const;
  const p18DriftGuards = summarizeGate(p18DriftGuardChecks);
  const p18RegressionGate = {
    positive_contracts: p18PositiveContracts,
    metadata_consistency: p18MetadataConsistency,
    artifact_consumption: p18PacketConsumption,
    close_readiness_consumption: p18CloseReadinessConsumption,
    drift_guards: p18DriftGuards,
    ...summarizeGate({
      ...p18CloseNoteArtifactChecks,
      ...p18CloseReadinessConsumptionChecks,
      ...p18DriftGuardChecks
    })
  } as const;
  const p18GateSnapshot = {
    gate_id: "p18_regression_gate_v3",
    stage: "P18-5",
    focus: "close_note_artifactization",
    artifact_readiness:
      p18CloseNoteArtifact?.close_note_recommended === true
        ? "artifact_close_readiness_handoff_started"
        : "not_started",
    progress_range: "80% - 85%",
    close_note_recommended:
      p18CloseNoteArtifact?.close_note_recommended ?? false,
    blocking_items: p18CloseNoteArtifact?.blocking_items ?? [],
    non_blocking_items: p18CloseNoteArtifact?.non_blocking_items ?? [],
    tail_candidate_items: p18CloseNoteArtifact?.tail_candidate_items ?? [],
    acceptance_gap_buckets:
      p18CloseNoteArtifact?.acceptance_gap_buckets ?? {
        blocking: 0,
        non_blocking: 0,
        tail_candidate: 0
      },
    next_expansion_focus: p18CloseNoteArtifact?.next_expansion_focus ?? [],
    positive_contracts: {
      checks_passed: p18PositiveContracts.checks_passed,
      checks_total: p18PositiveContracts.checks_total,
      all_green: p18PositiveContracts.all_green
    },
    metadata_consistency: {
      checks_passed: p18MetadataConsistency.checks_passed,
      checks_total: p18MetadataConsistency.checks_total,
      all_green: p18MetadataConsistency.all_green
    },
    artifact_consumption: {
      checks_passed: p18PacketConsumption.checks_passed,
      checks_total: p18PacketConsumption.checks_total,
      all_green: p18PacketConsumption.all_green
    },
    close_readiness_consumption: {
      checks_passed: p18CloseReadinessConsumption.checks_passed,
      checks_total: p18CloseReadinessConsumption.checks_total,
      all_green: p18CloseReadinessConsumption.all_green
    },
    drift_guards: {
      checks_passed: p18DriftGuards.checks_passed,
      checks_total: p18DriftGuards.checks_total,
      all_green: p18DriftGuards.all_green
    },
    overall: {
      checks_passed: p18RegressionGate.checks_passed,
      checks_total: p18RegressionGate.checks_total,
      failed_checks: p18RegressionGate.failed_checks,
      all_green: p18RegressionGate.all_green,
      close_candidate: p18RegressionGate.close_candidate
    }
  } as const;

  const p12RegressionGateChecks = {
    ...p12NamespaceGovernancePlaneChecks,
    ...p12RetentionGovernancePlaneChecks,
    ...p12KnowledgeGovernancePlaneChecks,
    ...p12ScenarioGovernancePlaneChecks
  } as const;
  const p12RegressionGateFailedChecks = Object.entries(
    p12RegressionGateChecks
  ).flatMap(([check, passed]) => (passed ? [] : [check]));
  const p12RegressionGate = {
    ...p12RegressionGateChecks,
    checks_passed:
      Object.keys(p12RegressionGateChecks).length -
      p12RegressionGateFailedChecks.length,
    checks_total: Object.keys(p12RegressionGateChecks).length,
    failed_checks: p12RegressionGateFailedChecks,
    all_green: p12RegressionGateFailedChecks.length === 0,
    close_candidate: p12RegressionGateFailedChecks.length === 0
  } as const;

  const p11RegressionGateChecks = {
    ...p11NamespaceUnifiedConsolidationChecks,
    ...p11RetentionCoordinationChecks,
    ...p11KnowledgeCoordinationChecks,
    ...p11ScenarioCoordinationChecks
  } as const;
  const p11RegressionGateFailedChecks = Object.entries(
    p11RegressionGateChecks
  ).flatMap(([check, passed]) => (passed ? [] : [check]));
  const p11RegressionGate = {
    ...p11RegressionGateChecks,
    checks_passed:
      Object.keys(p11RegressionGateChecks).length -
      p11RegressionGateFailedChecks.length,
    checks_total: Object.keys(p11RegressionGateChecks).length,
    failed_checks: p11RegressionGateFailedChecks,
    all_green: p11RegressionGateFailedChecks.length === 0,
    close_candidate: p11RegressionGateFailedChecks.length === 0
  } as const;

  const p10RetentionConsolidationChecks = {
    retention_lifecycle_consolidation_v8_ok:
      compactedThreadSummary?.lifecycle_consolidation_digest ===
        "anchor_preservation_consolidation" &&
      compactedThreadSummary?.keep_drop_consolidation_summary ===
        "anchor_keep_consolidated" &&
      compactedThreadSummary?.lifecycle_consolidation_mode ===
        "anchor_runtime_consolidated" &&
      getAssistantThreadLifecycleConsolidationDigest(assistantMetadata) ===
        compactedThreadSummary?.lifecycle_consolidation_digest &&
      getAssistantThreadKeepDropConsolidationSummary(assistantMetadata) ===
        compactedThreadSummary?.keep_drop_consolidation_summary &&
      getAssistantThreadLifecycleConsolidationMode(assistantMetadata) ===
        compactedThreadSummary?.lifecycle_consolidation_mode &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_consolidation_digest ===
        compactedThreadSummary?.lifecycle_consolidation_digest &&
      runtimeDebugMetadata.thread_compaction?.keep_drop_consolidation_summary ===
        compactedThreadSummary?.keep_drop_consolidation_summary &&
      runtimeDebugMetadata.thread_compaction?.lifecycle_consolidation_mode ===
        compactedThreadSummary?.lifecycle_consolidation_mode &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "closed",
          retained_fields: ["focus_mode"],
          keep_drop_consolidation_summary: "closed_drop_consolidated",
          lifecycle_consolidation_mode: "closed_runtime_consolidated"
        }
      }).retain === false &&
      getThreadCompactionRetentionDecision({
        compactedThreadSummary: {
          ...compactedThreadSummary!,
          lifecycle_status: "paused",
          retention_budget: 1,
          keep_drop_consolidation_summary: "minimal_decay_consolidated",
          lifecycle_consolidation_mode: "minimal_runtime_consolidated"
        }
      }).retain === false
  } as const;

  const p10KnowledgeConsolidationChecks = {
    knowledge_governance_consolidation_v8_ok:
      knowledgeSummary.governance_consolidation_digest ===
        "authoritative_governance_consolidation" &&
      knowledgeSummary.source_budget_consolidation_summary ===
        "authoritative_budget_source_consolidated" &&
      knowledgeSummary.governance_consolidation_mode ===
        "authoritative_runtime_consolidated" &&
      getAssistantKnowledgeGovernanceConsolidationDigest(
        assistantMetadata
      ) === knowledgeSummary.governance_consolidation_digest &&
      getAssistantKnowledgeSourceBudgetConsolidationSummary(
        assistantMetadata
      ) === knowledgeSummary.source_budget_consolidation_summary &&
      getAssistantKnowledgeGovernanceConsolidationMode(
        assistantMetadata
      ) === knowledgeSummary.governance_consolidation_mode &&
      runtimeDebugMetadata.knowledge.governance_consolidation_digest ===
        knowledgeSummary.governance_consolidation_digest &&
      runtimeDebugMetadata.knowledge.source_budget_consolidation_summary ===
        knowledgeSummary.source_budget_consolidation_summary &&
      runtimeDebugMetadata.knowledge.governance_consolidation_mode ===
        knowledgeSummary.governance_consolidation_mode &&
      selectedKnowledgeForPrompt[0]?.title === "Onboarding checklist guide" &&
      referenceOnlyProjectOpsSelection.length === 1 &&
      referenceOnlyProjectOpsSelection[0]?.title ===
        "General delivery note"
  } as const;

  const p10ScenarioConsolidationChecks = {
    scenario_governance_consolidation_v8_ok:
      scenarioMemoryPack.governance_consolidation_digest_id ===
        "project_delivery_governance_consolidation" &&
      scenarioMemoryPack.strategy_consolidation_summary ===
        "project_delivery_strategy_consolidated" &&
      scenarioMemoryPack.orchestration_consolidation_mode ===
        "execution_runtime_consolidated" &&
      getAssistantMemoryScenarioPackGovernanceConsolidationDigestId(
        assistantMetadata
      ) === scenarioMemoryPack.governance_consolidation_digest_id &&
      getAssistantMemoryScenarioPackStrategyConsolidationSummary(
        assistantMetadata
      ) === scenarioMemoryPack.strategy_consolidation_summary &&
      getAssistantMemoryScenarioPackOrchestrationConsolidationMode(
        assistantMetadata
      ) === scenarioMemoryPack.orchestration_consolidation_mode &&
      runtimeDebugMetadata.memory.pack?.governance_consolidation_digest_id ===
        scenarioMemoryPack.governance_consolidation_digest_id &&
      runtimeDebugMetadata.memory.pack?.strategy_consolidation_summary ===
        scenarioMemoryPack.strategy_consolidation_summary &&
      runtimeDebugMetadata.memory.pack?.orchestration_consolidation_mode ===
        scenarioMemoryPack.orchestration_consolidation_mode
  } as const;

  const p10RegressionGateChecks = {
    ...p10NamespaceConsolidationChecks,
    ...p10RetentionConsolidationChecks,
    ...p10KnowledgeConsolidationChecks,
    ...p10ScenarioConsolidationChecks,
    consolidation_metadata_consistency_v8_ok:
      getAssistantMemoryNamespaceGovernanceConsolidationDigestId(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace
          ?.governance_consolidation_digest_id &&
      getAssistantMemoryNamespaceGovernanceConsolidationSummary(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.memory_namespace?.governance_consolidation_summary &&
      getAssistantMemoryNamespaceRuntimeConsolidationMode(assistantMetadata) ===
        runtimeDebugMetadata.memory_namespace?.runtime_consolidation_mode &&
      getAssistantThreadLifecycleConsolidationDigest(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.lifecycle_consolidation_digest &&
      getAssistantThreadKeepDropConsolidationSummary(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.keep_drop_consolidation_summary &&
      getAssistantThreadLifecycleConsolidationMode(assistantMetadata) ===
        runtimeDebugMetadata.thread_compaction?.lifecycle_consolidation_mode &&
      getAssistantKnowledgeGovernanceConsolidationDigest(
        assistantMetadata
      ) === runtimeDebugMetadata.knowledge.governance_consolidation_digest &&
      getAssistantKnowledgeSourceBudgetConsolidationSummary(
        assistantMetadata
      ) ===
        runtimeDebugMetadata.knowledge.source_budget_consolidation_summary &&
      getAssistantKnowledgeGovernanceConsolidationMode(assistantMetadata) ===
        runtimeDebugMetadata.knowledge.governance_consolidation_mode &&
      getAssistantMemoryScenarioPackGovernanceConsolidationDigestId(
        assistantMetadata
      ) === runtimeDebugPack?.governance_consolidation_digest_id &&
      getAssistantMemoryScenarioPackStrategyConsolidationSummary(
        assistantMetadata
      ) === runtimeDebugPack?.strategy_consolidation_summary &&
      getAssistantMemoryScenarioPackOrchestrationConsolidationMode(
        assistantMetadata
      ) === runtimeDebugPack?.orchestration_consolidation_mode
  } as const;
  const p10RegressionGateFailedChecks = Object.entries(
    p10RegressionGateChecks
  ).flatMap(([check, passed]) => (passed ? [] : [check]));
  const p10RegressionGate = {
    ...p10RegressionGateChecks,
    checks_passed:
      Object.keys(p10RegressionGateChecks).length -
      p10RegressionGateFailedChecks.length,
    checks_total: Object.keys(p10RegressionGateChecks).length,
    failed_checks: p10RegressionGateFailedChecks,
    all_green: p10RegressionGateFailedChecks.length === 0,
    close_candidate: p10RegressionGateFailedChecks.length === 0
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
            thread_digest: threadBoundary.policy_digest_id,
            thread_convergence_digest:
              threadBoundary.governance_convergence_digest_id,
            thread_coordination: threadBoundary.policy_coordination_summary,
            thread_consistency: threadBoundary.governance_consistency_mode,
            thread_mode: threadBoundary.route_governance_mode,
            thread_retrieval_fallback:
              threadBoundary.retrieval_fallback_mode,
            thread_write_escalation: threadBoundary.write_escalation_mode,
            thread_convergence_summary:
              threadBoundary.governance_convergence_summary,
            thread_digest_alignment:
              threadBoundary.retrieval_write_digest_alignment,
            project_bundle: projectBoundary.policy_bundle_id,
            project_digest: projectBoundary.policy_digest_id,
            project_convergence_digest:
              projectBoundary.governance_convergence_digest_id,
            project_coordination: projectBoundary.policy_coordination_summary,
            project_consistency: projectBoundary.governance_consistency_mode,
            project_mode: projectBoundary.route_governance_mode,
            project_retrieval_fallback:
              projectBoundary.retrieval_fallback_mode,
            project_write_escalation:
              projectBoundary.write_escalation_mode,
            project_convergence_summary:
              projectBoundary.governance_convergence_summary,
            project_digest_alignment:
              projectBoundary.retrieval_write_digest_alignment,
            project_consolidation_digest:
              projectConsolidationContract.governance_consolidation_digest_id,
            project_consolidation_summary:
              projectConsolidationContract.governance_consolidation_summary,
            project_runtime_consolidation_mode:
              projectConsolidationContract.runtime_consolidation_mode,
            project_unified_consolidation_digest:
              projectUnifiedConsolidationContract.unified_governance_consolidation_digest_id,
            project_unified_consolidation_summary:
              projectUnifiedConsolidationContract.unified_governance_consolidation_summary,
            project_unified_consolidation_alignment_mode:
              projectUnifiedConsolidationContract.unified_consolidation_alignment_mode,
            project_unified_consolidation_reuse_mode:
              projectUnifiedConsolidationContract.unified_consolidation_reuse_mode,
            project_unified_consolidation_coordination_summary:
              projectUnifiedConsolidationContract.unified_consolidation_coordination_summary,
            project_unified_consolidation_consistency_mode:
              projectUnifiedConsolidationContract.unified_consolidation_consistency_mode,
            project_governance_plane_digest:
              projectGovernancePlaneContract.governance_plane_runtime_digest_id,
            project_governance_plane_summary:
              projectGovernancePlaneContract.governance_plane_runtime_summary,
            project_governance_plane_alignment_mode:
              projectGovernancePlaneContract.governance_plane_alignment_mode,
            project_governance_plane_reuse_mode:
              projectGovernancePlaneContract.governance_plane_reuse_mode,
            project_governance_fabric_digest:
              projectGovernanceFabricContract.governance_fabric_runtime_digest_id,
            project_governance_fabric_summary:
              projectGovernanceFabricContract.governance_fabric_runtime_summary,
            project_governance_fabric_alignment_mode:
              projectGovernanceFabricContract.governance_fabric_alignment_mode,
            project_governance_fabric_reuse_mode:
              projectGovernanceFabricContract.governance_fabric_reuse_mode,
            project_governance_fabric_plane_digest:
              projectGovernanceFabricPlaneContract.governance_fabric_plane_digest_id,
            project_governance_fabric_plane_summary:
              projectGovernanceFabricPlaneContract.governance_fabric_plane_summary,
            project_governance_fabric_plane_alignment_mode:
              projectGovernanceFabricPlaneContract.governance_fabric_plane_alignment_mode,
            project_governance_fabric_plane_reuse_mode:
              projectGovernanceFabricPlaneContract.governance_fabric_plane_reuse_mode,
            project_governance_fabric_plane_phase_snapshot_id:
              projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_id,
            project_governance_fabric_plane_phase_snapshot_summary:
              projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_summary,
            project_governance_fabric_plane_phase_snapshot_consumption_mode:
              projectGovernanceFabricPlanePhaseSnapshot.phase_snapshot_consumption_mode
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
            ),
          governance_route_bias:
            getAssistantMemoryScenarioPackGovernanceRouteBias(
              assistantMetadata
            ),
          strategy_policy_id:
            getAssistantMemoryScenarioPackStrategyPolicyId(assistantMetadata),
          orchestration_mode:
            getAssistantMemoryScenarioPackOrchestrationMode(assistantMetadata),
          orchestration_digest_id:
            getAssistantMemoryScenarioPackOrchestrationDigestId(
              assistantMetadata
            ),
          strategy_rationale_summary:
            getAssistantMemoryScenarioPackStrategyRationaleSummary(
              assistantMetadata
            ),
          orchestration_coordination_summary:
            getAssistantMemoryScenarioPackOrchestrationCoordinationSummary(
              assistantMetadata
            ),
          strategy_consistency_mode:
            getAssistantMemoryScenarioPackStrategyConsistencyMode(
              assistantMetadata
            ),
          governance_convergence_digest_id:
            getAssistantMemoryScenarioPackGovernanceConvergenceDigestId(
              assistantMetadata
            ),
          strategy_convergence_summary:
            getAssistantMemoryScenarioPackStrategyConvergenceSummary(
              assistantMetadata
            ),
          orchestration_alignment_mode:
            getAssistantMemoryScenarioPackOrchestrationAlignmentMode(
              assistantMetadata
            ),
          governance_unification_digest_id:
            getAssistantMemoryScenarioPackGovernanceUnificationDigestId(
              assistantMetadata
            ),
          strategy_unification_summary:
            getAssistantMemoryScenarioPackStrategyUnificationSummary(
              assistantMetadata
            ),
          orchestration_unification_mode:
            getAssistantMemoryScenarioPackOrchestrationUnificationMode(
              assistantMetadata
            ),
          governance_consolidation_digest_id:
            getAssistantMemoryScenarioPackGovernanceConsolidationDigestId(
              assistantMetadata
            ),
          strategy_consolidation_summary:
            getAssistantMemoryScenarioPackStrategyConsolidationSummary(
              assistantMetadata
            ),
          orchestration_consolidation_mode:
            getAssistantMemoryScenarioPackOrchestrationConsolidationMode(
              assistantMetadata
            ),
          governance_coordination_digest_id:
            getAssistantMemoryScenarioPackGovernanceCoordinationDigestId(
              assistantMetadata
            ),
          strategy_runtime_coordination_summary:
            getAssistantMemoryScenarioPackStrategyRuntimeCoordinationSummary(
              assistantMetadata
            ),
          orchestration_coordination_mode_v9:
            getAssistantMemoryScenarioPackOrchestrationCoordinationModeV9(
              assistantMetadata
            ),
          strategy_runtime_reuse_summary:
            getAssistantMemoryScenarioPackStrategyRuntimeReuseSummary(
              assistantMetadata
            ),
          governance_coordination_reuse_mode:
            getAssistantMemoryScenarioPackGovernanceCoordinationReuseMode(
              assistantMetadata
            ),
          governance_plane_digest_id:
            getAssistantMemoryScenarioPackGovernancePlaneDigestId(
              assistantMetadata
            ),
          strategy_governance_plane_summary:
            getAssistantMemoryScenarioPackStrategyGovernancePlaneSummary(
              assistantMetadata
            ),
          orchestration_governance_plane_mode:
            getAssistantMemoryScenarioPackOrchestrationGovernancePlaneMode(
              assistantMetadata
            ),
          governance_plane_reuse_mode:
            getAssistantMemoryScenarioPackGovernancePlaneReuseMode(
              assistantMetadata
            ),
          governance_fabric_digest_id:
            getAssistantMemoryScenarioPackGovernanceFabricDigestId(
              assistantMetadata
            ),
          strategy_governance_fabric_summary:
            getAssistantMemoryScenarioPackStrategyGovernanceFabricSummary(
              assistantMetadata
            ),
          orchestration_governance_fabric_mode:
            getAssistantMemoryScenarioPackOrchestrationGovernanceFabricMode(
              assistantMetadata
            ),
          governance_fabric_reuse_mode:
            getAssistantMemoryScenarioPackGovernanceFabricReuseMode(
              assistantMetadata
            )
        },
        assistant_metadata_knowledge: {
          count: getAssistantKnowledgeCount(assistantMetadata),
          scope_layers: getAssistantKnowledgeScopeLayers(assistantMetadata),
          governance_classes:
            (assistantMetadata?.knowledge as { governance_classes?: string[] } | undefined)
              ?.governance_classes ?? [],
          governance_coordination_summary:
            getAssistantKnowledgeGovernanceCoordinationSummary(
              assistantMetadata
            ),
          budget_coordination_mode:
            getAssistantKnowledgeBudgetCoordinationMode(assistantMetadata),
          source_governance_summary:
            getAssistantKnowledgeSourceGovernanceSummary(assistantMetadata),
          governance_consistency_mode:
            getAssistantKnowledgeGovernanceConsistencyMode(
              assistantMetadata
            ),
          governance_convergence_digest:
            getAssistantKnowledgeGovernanceConvergenceDigest(
              assistantMetadata
            ),
          source_budget_alignment_summary:
            getAssistantKnowledgeSourceBudgetAlignmentSummary(
              assistantMetadata
            ),
          governance_alignment_mode:
            getAssistantKnowledgeGovernanceAlignmentMode(
              assistantMetadata
            ),
          governance_unification_digest:
            getAssistantKnowledgeGovernanceUnificationDigest(
              assistantMetadata
            ),
          source_budget_unification_summary:
            getAssistantKnowledgeSourceBudgetUnificationSummary(
              assistantMetadata
            ),
          governance_unification_mode:
            getAssistantKnowledgeGovernanceUnificationMode(
              assistantMetadata
            ),
          governance_consolidation_digest:
            getAssistantKnowledgeGovernanceConsolidationDigest(
              assistantMetadata
            ),
          source_budget_consolidation_summary:
            getAssistantKnowledgeSourceBudgetConsolidationSummary(
              assistantMetadata
            ),
          governance_consolidation_mode:
            getAssistantKnowledgeGovernanceConsolidationMode(
              assistantMetadata
            ),
          governance_coordination_digest:
            getAssistantKnowledgeGovernanceCoordinationDigest(
              assistantMetadata
            ),
          source_budget_coordination_summary:
            getAssistantKnowledgeSourceBudgetCoordinationSummary(
              assistantMetadata
            ),
          governance_coordination_mode_v9:
            getAssistantKnowledgeGovernanceCoordinationModeV9(
              assistantMetadata
            ),
          selection_runtime_coordination_summary:
            getAssistantKnowledgeSelectionRuntimeCoordinationSummary(
              assistantMetadata
            ),
          governance_coordination_reuse_mode:
            getAssistantKnowledgeGovernanceCoordinationReuseMode(
              assistantMetadata
            ),
          governance_plane_digest:
            getAssistantKnowledgeGovernancePlaneDigest(assistantMetadata),
          source_budget_governance_plane_summary:
            getAssistantKnowledgeSourceBudgetGovernancePlaneSummary(
              assistantMetadata
            ),
          governance_plane_mode:
            getAssistantKnowledgeGovernancePlaneMode(assistantMetadata),
          governance_plane_reuse_mode:
            getAssistantKnowledgeGovernancePlaneReuseMode(assistantMetadata),
          governance_fabric_digest:
            getAssistantKnowledgeGovernanceFabricDigest(assistantMetadata),
          source_budget_governance_fabric_summary:
            getAssistantKnowledgeSourceBudgetGovernanceFabricSummary(
              assistantMetadata
            ),
          governance_fabric_mode:
            getAssistantKnowledgeGovernanceFabricMode(assistantMetadata),
          governance_fabric_reuse_mode:
            getAssistantKnowledgeGovernanceFabricReuseMode(assistantMetadata)
        },
        filtered_knowledge_summary: knowledgeSummary,
        assistant_metadata_thread_compaction: {
          summary_text: getAssistantCompactedThreadSummaryText(assistantMetadata),
          retention_policy_id:
            getAssistantThreadRetentionPolicyId(assistantMetadata),
          cross_layer_survival_mode:
            getAssistantThreadCrossLayerSurvivalMode(assistantMetadata),
          retention_decision_group:
            getAssistantThreadRetentionDecisionGroup(assistantMetadata),
          survival_rationale:
            getAssistantThreadSurvivalRationale(assistantMetadata),
          lifecycle_governance_digest:
            getAssistantThreadLifecycleGovernanceDigest(assistantMetadata),
          keep_drop_governance_summary:
            getAssistantThreadKeepDropGovernanceSummary(assistantMetadata),
          lifecycle_coordination_summary:
            getAssistantThreadLifecycleCoordinationSummary(assistantMetadata),
          survival_consistency_mode:
            getAssistantThreadSurvivalConsistencyMode(assistantMetadata),
          lifecycle_convergence_digest:
            getAssistantThreadLifecycleConvergenceDigest(assistantMetadata),
          keep_drop_convergence_summary:
            getAssistantThreadKeepDropConvergenceSummary(assistantMetadata),
          lifecycle_alignment_mode:
            getAssistantThreadLifecycleAlignmentMode(assistantMetadata),
          lifecycle_unification_digest:
            getAssistantThreadLifecycleUnificationDigest(assistantMetadata),
          keep_drop_unification_summary:
            getAssistantThreadKeepDropUnificationSummary(assistantMetadata),
          lifecycle_unification_mode:
            getAssistantThreadLifecycleUnificationMode(assistantMetadata),
          lifecycle_consolidation_digest:
            getAssistantThreadLifecycleConsolidationDigest(assistantMetadata),
          keep_drop_consolidation_summary:
            getAssistantThreadKeepDropConsolidationSummary(assistantMetadata),
          lifecycle_consolidation_mode:
            getAssistantThreadLifecycleConsolidationMode(assistantMetadata),
          lifecycle_coordination_digest:
            getAssistantThreadLifecycleCoordinationDigest(assistantMetadata),
          keep_drop_consolidation_coordination_summary:
            getAssistantThreadKeepDropConsolidationCoordinationSummary(
              assistantMetadata
            ),
          lifecycle_coordination_alignment_mode:
            getAssistantThreadLifecycleCoordinationAlignmentMode(
              assistantMetadata
            ),
          keep_drop_runtime_coordination_summary:
            getAssistantThreadKeepDropRuntimeCoordinationSummary(
              assistantMetadata
            ),
          lifecycle_coordination_reuse_mode:
            getAssistantThreadLifecycleCoordinationReuseMode(
              assistantMetadata
            ),
          lifecycle_governance_plane_digest:
            getAssistantThreadLifecycleGovernancePlaneDigest(
              assistantMetadata
            ),
          keep_drop_governance_plane_summary:
            getAssistantThreadKeepDropGovernancePlaneSummary(
              assistantMetadata
            ),
          lifecycle_governance_plane_alignment_mode:
            getAssistantThreadLifecycleGovernancePlaneAlignmentMode(
              assistantMetadata
            ),
          lifecycle_governance_plane_reuse_mode:
            getAssistantThreadLifecycleGovernancePlaneReuseMode(
              assistantMetadata
            ),
          lifecycle_governance_fabric_digest:
            getAssistantThreadLifecycleGovernanceFabricDigest(
              assistantMetadata
            ),
          keep_drop_governance_fabric_summary:
            getAssistantThreadKeepDropGovernanceFabricSummary(
              assistantMetadata
            ),
          lifecycle_governance_fabric_alignment_mode:
            getAssistantThreadLifecycleGovernanceFabricAlignmentMode(
              assistantMetadata
            ),
          lifecycle_governance_fabric_reuse_mode:
            getAssistantThreadLifecycleGovernanceFabricReuseMode(
              assistantMetadata
            ),
          lifecycle_governance_fabric_plane_digest:
            getAssistantThreadLifecycleGovernanceFabricPlaneDigest(
              assistantMetadata
            ),
          keep_drop_governance_fabric_plane_summary:
            getAssistantThreadKeepDropGovernanceFabricPlaneSummary(
              assistantMetadata
            ),
          lifecycle_governance_fabric_plane_alignment_mode:
            getAssistantThreadLifecycleGovernanceFabricPlaneAlignmentMode(
              assistantMetadata
            ),
          lifecycle_governance_fabric_plane_reuse_mode:
            getAssistantThreadLifecycleGovernanceFabricPlaneReuseMode(
              assistantMetadata
            )
        },
        assistant_metadata_namespace: {
          primary_layer: getAssistantMemoryNamespacePrimaryLayer(assistantMetadata),
          policy_bundle_id:
            getAssistantMemoryNamespacePolicyBundleId(assistantMetadata),
          policy_digest_id:
            getAssistantMemoryNamespacePolicyDigestId(assistantMetadata),
          governance_convergence_digest_id:
            getAssistantMemoryNamespaceGovernanceConvergenceDigestId(
              assistantMetadata
            ),
          policy_coordination_summary:
            getAssistantMemoryNamespacePolicyCoordinationSummary(
              assistantMetadata
            ),
          governance_consistency_mode:
            getAssistantMemoryNamespaceGovernanceConsistencyMode(
              assistantMetadata
            ),
          route_governance_mode:
            getAssistantMemoryNamespaceRouteGovernanceMode(assistantMetadata),
          retrieval_fallback_mode:
            getAssistantMemoryNamespaceRetrievalFallbackMode(assistantMetadata),
          write_escalation_mode:
            getAssistantMemoryNamespaceWriteEscalationMode(assistantMetadata),
          governance_convergence_summary:
            getAssistantMemoryNamespaceGovernanceConvergenceSummary(
              assistantMetadata
            ),
          governance_consolidation_digest_id:
            getAssistantMemoryNamespaceGovernanceConsolidationDigestId(
              assistantMetadata
            ),
          governance_consolidation_summary:
            getAssistantMemoryNamespaceGovernanceConsolidationSummary(
              assistantMetadata
            ),
          runtime_consolidation_mode:
            getAssistantMemoryNamespaceRuntimeConsolidationMode(
              assistantMetadata
            ),
          unified_governance_runtime_digest_id:
            getAssistantMemoryNamespaceUnifiedGovernanceRuntimeDigestId(
              assistantMetadata
            ),
          unified_governance_runtime_summary:
            getAssistantMemoryNamespaceUnifiedGovernanceRuntimeSummary(
              assistantMetadata
            ),
          unified_runtime_alignment_mode:
            getAssistantMemoryNamespaceUnifiedRuntimeAlignmentMode(
              assistantMetadata
            ),
          governance_plane_runtime_digest_id:
            getAssistantMemoryNamespaceGovernancePlaneRuntimeDigestId(
              assistantMetadata
            ),
          governance_plane_runtime_summary:
            getAssistantMemoryNamespaceGovernancePlaneRuntimeSummary(
              assistantMetadata
            ),
          governance_plane_alignment_mode:
            getAssistantMemoryNamespaceGovernancePlaneAlignmentMode(
              assistantMetadata
            ),
          governance_plane_reuse_mode:
            getAssistantMemoryNamespaceGovernancePlaneReuseMode(
              assistantMetadata
            ),
          retrieval_write_digest_alignment:
            getAssistantMemoryNamespaceRetrievalWriteDigestAlignment(
              assistantMetadata
            )
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
          knowledge_governance_classes:
            runtimeDebugMetadata.knowledge.governance_classes ?? [],
          pack_strategy_bundle_id:
            runtimeDebugMetadata.memory.pack?.strategy_bundle_id ?? null,
          pack_strategy_assembly_order:
            runtimeDebugMetadata.memory.pack?.strategy_assembly_order ?? [],
          pack_route_influence_reason:
            runtimeDebugMetadata.memory.pack?.route_influence_reason ?? null,
          pack_governance_route_bias:
            runtimeDebugMetadata.memory.pack?.governance_route_bias ?? null,
          pack_strategy_policy_id:
            runtimeDebugMetadata.memory.pack?.strategy_policy_id ?? null,
          pack_orchestration_mode:
            runtimeDebugMetadata.memory.pack?.orchestration_mode ?? null,
          pack_orchestration_digest_id:
            runtimeDebugPack?.orchestration_digest_id ?? null,
          pack_strategy_rationale_summary:
            runtimeDebugPack?.strategy_rationale_summary ?? null,
          pack_orchestration_coordination_summary:
            runtimeDebugMetadata.memory.pack?.orchestration_coordination_summary ??
            null,
          pack_strategy_consistency_mode:
            runtimeDebugMetadata.memory.pack?.strategy_consistency_mode ?? null,
          pack_governance_convergence_digest_id:
            runtimeDebugPack?.governance_convergence_digest_id ?? null,
          pack_strategy_convergence_summary:
            runtimeDebugPack?.strategy_convergence_summary ?? null,
          pack_orchestration_alignment_mode:
            runtimeDebugPack?.orchestration_alignment_mode ?? null,
          pack_governance_unification_digest_id:
            runtimeDebugPack?.governance_unification_digest_id ?? null,
          pack_strategy_unification_summary:
            runtimeDebugPack?.strategy_unification_summary ?? null,
          pack_orchestration_unification_mode:
            runtimeDebugPack?.orchestration_unification_mode ?? null,
          pack_governance_fabric_digest_id:
            runtimeDebugMetadata.memory.pack?.governance_fabric_digest_id ?? null,
          pack_strategy_governance_fabric_summary:
            runtimeDebugMetadata.memory.pack?.strategy_governance_fabric_summary ??
            null,
          pack_orchestration_governance_fabric_mode:
            runtimeDebugMetadata.memory.pack
              ?.orchestration_governance_fabric_mode ?? null,
          pack_governance_fabric_reuse_mode:
            runtimeDebugMetadata.memory.pack?.governance_fabric_reuse_mode ??
            null,
          knowledge_count: runtimeDebugMetadata.knowledge.count,
          knowledge_governance_unification_digest:
            runtimeDebugMetadata.knowledge.governance_unification_digest ?? null,
          knowledge_source_budget_unification_summary:
            runtimeDebugMetadata.knowledge.source_budget_unification_summary ??
            null,
          knowledge_governance_unification_mode:
            runtimeDebugMetadata.knowledge.governance_unification_mode ?? null,
          thread_compaction_summary_id:
            runtimeDebugMetadata.thread_compaction?.summary_id ?? null,
          thread_lifecycle_convergence_digest:
            runtimeDebugMetadata.thread_compaction?.lifecycle_convergence_digest ??
            null,
          thread_keep_drop_convergence_summary:
            runtimeDebugMetadata.thread_compaction?.keep_drop_convergence_summary ??
            null,
          thread_lifecycle_alignment_mode:
            runtimeDebugMetadata.thread_compaction?.lifecycle_alignment_mode ??
            null,
          thread_lifecycle_unification_digest:
            runtimeDebugMetadata.thread_compaction?.lifecycle_unification_digest ??
            null,
          thread_keep_drop_unification_summary:
            runtimeDebugMetadata.thread_compaction?.keep_drop_unification_summary ??
            null,
          thread_lifecycle_unification_mode:
            runtimeDebugMetadata.thread_compaction?.lifecycle_unification_mode ??
            null,
          thread_lifecycle_governance_plane_digest:
            runtimeDebugMetadata.thread_compaction
              ?.lifecycle_governance_plane_digest ?? null,
          thread_keep_drop_governance_plane_summary:
            runtimeDebugMetadata.thread_compaction
              ?.keep_drop_governance_plane_summary ?? null,
          thread_lifecycle_governance_plane_alignment_mode:
            runtimeDebugMetadata.thread_compaction
              ?.lifecycle_governance_plane_alignment_mode ?? null,
          thread_lifecycle_governance_plane_reuse_mode:
            runtimeDebugMetadata.thread_compaction
              ?.lifecycle_governance_plane_reuse_mode ?? null,
          namespace_primary_layer:
            runtimeDebugMetadata.memory_namespace?.primary_layer ?? null,
          namespace_policy_bundle_id:
            runtimeDebugMetadata.memory_namespace?.policy_bundle_id ?? null,
          namespace_policy_digest_id:
            runtimeDebugMetadata.memory_namespace?.policy_digest_id ?? null,
          namespace_governance_convergence_digest_id:
            runtimeDebugMetadata.memory_namespace?.governance_convergence_digest_id ??
            null,
          namespace_policy_coordination_summary:
            runtimeDebugMetadata.memory_namespace?.policy_coordination_summary ??
            null,
          namespace_governance_consistency_mode:
            runtimeDebugMetadata.memory_namespace?.governance_consistency_mode ??
            null,
          namespace_route_governance_mode:
            runtimeDebugMetadata.memory_namespace?.route_governance_mode ?? null,
          namespace_retrieval_fallback_mode:
            runtimeDebugMetadata.memory_namespace?.retrieval_fallback_mode ??
            null,
          namespace_write_escalation_mode:
            runtimeDebugMetadata.memory_namespace?.write_escalation_mode ?? null,
          namespace_governance_convergence_summary:
            runtimeDebugMetadata.memory_namespace?.governance_convergence_summary ??
            null,
          namespace_governance_consolidation_digest_id:
            runtimeDebugMetadata.memory_namespace
              ?.governance_consolidation_digest_id ?? null,
          namespace_governance_consolidation_summary:
            runtimeDebugMetadata.memory_namespace
              ?.governance_consolidation_summary ?? null,
          namespace_runtime_consolidation_mode:
            runtimeDebugMetadata.memory_namespace?.runtime_consolidation_mode ??
            null,
          namespace_unified_governance_consolidation_digest_id:
            runtimeDebugMetadata.memory_namespace
              ?.unified_governance_consolidation_digest_id ?? null,
          namespace_unified_governance_consolidation_summary:
            runtimeDebugMetadata.memory_namespace
              ?.unified_governance_consolidation_summary ?? null,
          namespace_unified_consolidation_alignment_mode:
            runtimeDebugMetadata.memory_namespace
              ?.unified_consolidation_alignment_mode ?? null,
          namespace_unified_consolidation_reuse_mode:
            runtimeDebugMetadata.memory_namespace
              ?.unified_consolidation_reuse_mode ?? null,
          namespace_unified_consolidation_coordination_summary:
            runtimeDebugMetadata.memory_namespace
              ?.unified_consolidation_coordination_summary ?? null,
          namespace_unified_consolidation_consistency_mode:
            runtimeDebugMetadata.memory_namespace
              ?.unified_consolidation_consistency_mode ?? null,
          namespace_unified_governance_runtime_digest_id:
            runtimeDebugMetadata.memory_namespace
              ?.unified_governance_runtime_digest_id ?? null,
          namespace_unified_governance_runtime_summary:
            runtimeDebugMetadata.memory_namespace
              ?.unified_governance_runtime_summary ?? null,
          namespace_unified_runtime_alignment_mode:
            runtimeDebugMetadata.memory_namespace?.unified_runtime_alignment_mode ??
            null,
          namespace_governance_plane_runtime_digest_id:
            runtimeDebugMetadata.memory_namespace
              ?.governance_plane_runtime_digest_id ?? null,
          namespace_governance_plane_runtime_summary:
            runtimeDebugMetadata.memory_namespace
              ?.governance_plane_runtime_summary ?? null,
          namespace_governance_plane_alignment_mode:
            runtimeDebugMetadata.memory_namespace
              ?.governance_plane_alignment_mode ?? null,
          namespace_governance_plane_reuse_mode:
            runtimeDebugMetadata.memory_namespace
              ?.governance_plane_reuse_mode ?? null,
          namespace_retrieval_write_digest_alignment:
            runtimeDebugMetadata.memory_namespace?.retrieval_write_digest_alignment ??
            null
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
            scenarioMemoryPack.route_influence_reason,
          governance_route_bias:
            scenarioMemoryPack.governance_route_bias,
          strategy_policy_id:
            scenarioMemoryPack.strategy_policy_id,
          orchestration_mode:
            scenarioMemoryPack.orchestration_mode,
          orchestration_digest_id:
            scenarioMemoryPack.orchestration_digest_id,
          strategy_rationale_summary:
            scenarioMemoryPack.strategy_rationale_summary,
          orchestration_coordination_summary:
            scenarioMemoryPack.orchestration_coordination_summary,
          strategy_consistency_mode:
            scenarioMemoryPack.strategy_consistency_mode,
          governance_convergence_digest_id:
            scenarioMemoryPack.governance_convergence_digest_id,
          strategy_convergence_summary:
            scenarioMemoryPack.strategy_convergence_summary,
          orchestration_alignment_mode:
            scenarioMemoryPack.orchestration_alignment_mode,
          governance_unification_digest_id:
            scenarioMemoryPack.governance_unification_digest_id,
          strategy_unification_summary:
            scenarioMemoryPack.strategy_unification_summary,
          orchestration_unification_mode:
            scenarioMemoryPack.orchestration_unification_mode,
          governance_consolidation_digest_id:
            scenarioMemoryPack.governance_consolidation_digest_id,
          strategy_consolidation_summary:
            scenarioMemoryPack.strategy_consolidation_summary,
          orchestration_consolidation_mode:
            scenarioMemoryPack.orchestration_consolidation_mode,
          governance_coordination_digest_id:
            scenarioMemoryPack.governance_coordination_digest_id,
          strategy_runtime_coordination_summary:
            scenarioMemoryPack.strategy_runtime_coordination_summary,
          orchestration_coordination_mode_v9:
            scenarioMemoryPack.orchestration_coordination_mode_v9,
          strategy_runtime_reuse_summary:
            scenarioMemoryPack.strategy_runtime_reuse_summary,
          governance_coordination_reuse_mode:
            scenarioMemoryPack.governance_coordination_reuse_mode,
          governance_plane_digest_id:
            scenarioMemoryPack.governance_plane_digest_id,
          strategy_governance_plane_summary:
            scenarioMemoryPack.strategy_governance_plane_summary,
          orchestration_governance_plane_mode:
            scenarioMemoryPack.orchestration_governance_plane_mode,
          governance_plane_reuse_mode:
            scenarioMemoryPack.governance_plane_reuse_mode,
          governance_fabric_digest_id:
            scenarioMemoryPack.governance_fabric_digest_id,
          strategy_governance_fabric_summary:
            scenarioMemoryPack.strategy_governance_fabric_summary,
          orchestration_governance_fabric_mode:
            scenarioMemoryPack.orchestration_governance_fabric_mode,
          governance_fabric_reuse_mode:
            scenarioMemoryPack.governance_fabric_reuse_mode
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
        p6_regression_gate: p6RegressionGate,
        p7_regression_gate: p7RegressionGate,
        p8_regression_gate: p8RegressionGate,
        p9_regression_gate: p9RegressionGate,
        p10_namespace_consolidation: p10NamespaceConsolidationChecks,
        p11_namespace_unified_consolidation:
          p11NamespaceUnifiedConsolidationChecks,
        p12_namespace_governance_plane: p12NamespaceGovernancePlaneChecks,
        p13_namespace_governance_fabric: p13NamespaceGovernanceFabricChecks,
        p14_namespace_governance_fabric_plane:
          p14NamespaceGovernanceFabricPlaneChecks,
        p10_retention_consolidation: p10RetentionConsolidationChecks,
        p11_retention_coordination: p11RetentionCoordinationChecks,
        p12_retention_governance_plane: p12RetentionGovernancePlaneChecks,
        p13_retention_governance_fabric: p13RetentionGovernanceFabricChecks,
        p14_retention_governance_fabric_plane:
          p14RetentionGovernanceFabricPlaneChecks,
        p11_knowledge_coordination: p11KnowledgeCoordinationChecks,
        p12_knowledge_governance_plane: p12KnowledgeGovernancePlaneChecks,
        p13_knowledge_governance_fabric: p13KnowledgeGovernanceFabricChecks,
        p14_knowledge_governance_fabric_plane:
          p14KnowledgeGovernanceFabricPlaneChecks,
        p11_scenario_coordination: p11ScenarioCoordinationChecks,
        p12_scenario_governance_plane: p12ScenarioGovernancePlaneChecks,
        p13_scenario_governance_fabric: p13ScenarioGovernanceFabricChecks,
        p14_scenario_governance_fabric_plane:
          p14ScenarioGovernanceFabricPlaneChecks,
        p15_namespace_governance_plane_contract:
          p15NamespaceGovernancePlaneContractChecks,
        p15_retention_governance_plane_consumption:
          p15RetentionGovernancePlaneConsumptionChecks,
        p15_knowledge_governance_plane_consumption:
          p15KnowledgeGovernancePlaneConsumptionChecks,
        p15_scenario_governance_plane_consumption:
          p15ScenarioGovernancePlaneConsumptionChecks,
        p16_role_core_memory_handoff: p16RoleCoreMemoryHandoffChecks,
        p16_role_core_memory_handoff_metadata_consistency:
          p16RoleCoreMemoryHandoffMetadataConsistencyChecks,
        p16_role_core_memory_handoff_packet_consumption:
          p16PacketConsumptionChecks,
        p16_regression_gate: p16RegressionGate,
        p16_gate_snapshot: p16GateSnapshot,
        p17_close_note_handoff_packet: p17CloseNoteHandoffPacketChecks,
        p17_regression_gate: p17RegressionGate,
        p17_gate_snapshot: p17GateSnapshot,
        p18_close_note_artifact: p18CloseNoteArtifactChecks,
        p21_close_note_archive: p21CloseNoteArchiveChecks,
        p21_regression_gate: p21RegressionGate,
        p21_gate_snapshot: p21GateSnapshot,
        p20_close_note_record: p20CloseNoteRecordChecks,
        p20_regression_gate: p20RegressionGate,
        p20_gate_snapshot: p20GateSnapshot,
        p19_close_note_output: p19CloseNoteOutputChecks,
        p19_regression_gate: p19RegressionGate,
        p19_gate_snapshot: p19GateSnapshot,
        p18_regression_gate: p18RegressionGate,
        p18_gate_snapshot: p18GateSnapshot,
        p15_regression_gate: p15RegressionGate,
        p15_gate_snapshot: p15GateSnapshot,
        p14_regression_gate: p14RegressionGate,
        p14_gate_snapshot: p14GateSnapshot,
        p13_regression_gate: p13RegressionGate,
        p13_gate_snapshot: p13GateSnapshot,
        p12_regression_gate: p12RegressionGate,
        p11_regression_gate: p11RegressionGate,
        p10_knowledge_consolidation: p10KnowledgeConsolidationChecks,
        p10_scenario_consolidation: p10ScenarioConsolidationChecks,
        p10_regression_gate: p10RegressionGate,
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
