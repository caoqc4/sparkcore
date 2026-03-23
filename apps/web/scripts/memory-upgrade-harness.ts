import {
  buildRuntimeMemorySemanticSummary,
  buildRecalledProfileMemoryFromStoredMemory,
  buildRecalledRelationshipMemoryFromStoredMemory,
  buildStaticProfileRecordFromStoredMemory,
  classifyStoredMemorySemanticTarget
} from "@/lib/chat/memory-records";
import { buildAgentSystemPrompt } from "@/lib/chat/runtime";
import { buildAssistantMessageMetadata } from "@/lib/chat/assistant-message-metadata";
import {
  getAssistantMemoryObservedSemanticLayers,
  getAssistantMemoryPrimarySemanticLayer
} from "@/lib/chat/assistant-message-metadata-read";
import {
  buildPlannedRelationshipMemoryRecord,
  buildPlannedStaticProfileRecord,
  buildPlannedThreadStateCandidate
} from "@/lib/chat/memory-write-record-candidates";
import type { StoredMemory } from "@/lib/chat/memory-shared";
import { buildRuntimeAssistantMetadataInput } from "@/lib/chat/runtime-assistant-metadata";
import { buildRuntimeTurnInput } from "@/lib/chat/runtime-input";

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
    content: "Call the user Alex.",
    memory_type: "preference",
    category: "preference",
    scope: "user_agent",
    target_agent_id: "agent-1"
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
      "thread_state_candidate",
    "Expected thread-local profile memory to map to thread_state_candidate."
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
    threadStateFocusMode: plannedThreadState.focus_mode
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
        profile_snapshot: ["User prefers concise technical explanations."],
        hidden_exclusion_count: 0,
        incorrect_exclusion_count: 0
      },
      follow_up: {
        request_count: 1
      }
    })
  );
  expect(
    getAssistantMemoryPrimarySemanticLayer(assistantMetadata) === "thread_state",
    "Expected assistant metadata reader to expose thread_state as primary semantic layer."
  );
  expect(
    getAssistantMemoryObservedSemanticLayers(assistantMetadata).join(",") ===
      "static_profile,memory_record,thread_state",
    "Expected assistant metadata reader to expose all observed semantic layers."
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
          planned_profile_id: plannedProfile.profile_id,
          planned_relationship_id: plannedRelationship.memory_id,
          planned_thread_focus: plannedThreadState.focus_mode
        },
        runtime_semantic_summary: semanticSummary,
        assistant_metadata_semantic_summary: {
          primary_layer: getAssistantMemoryPrimarySemanticLayer(assistantMetadata),
          observed_layers: getAssistantMemoryObservedSemanticLayers(
            assistantMetadata
          )
        },
        system_prompt_thread_state: {
          includes_focus_mode: systemPrompt.includes(
            "focus_mode = Finish the onboarding checklist this week."
          ),
          includes_language_hint: systemPrompt.includes(
            "current_language_hint = en."
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
