import {
  buildAssistantMessageMetadata
} from "@/lib/chat/assistant-message-metadata";
import {
  getAssistantMemoryRecordRecallPreferred,
  getAssistantProfileFallbackSuppressed
} from "@/lib/chat/assistant-message-metadata-read";
import type { BuildAssistantMessageMetadataInput } from "@/lib/chat/assistant-message-metadata";
import { buildRuntimeTurnInput } from "@/lib/chat/runtime-input";

const harnessRoleCorePacket: BuildAssistantMessageMetadataInput["role_core_packet"] = {
  packet_version: "v1",
  identity: {
    agent_id: "agent-1",
    agent_name: "Smoke Memory Coach"
  },
  persona_summary: null,
  style_guidance: null,
  relationship_stance: {
    effective: "friendly",
    source: "agent_profile_default"
  },
  language_behavior: {
    reply_language_target: "zh-Hans",
    reply_language_source: "latest-user-message",
    same_thread_continuation_preferred: false
  },
  memory_handoff: null
};

function buildHarnessMetadata(args: {
  memoryRecordRecallPreferred: boolean;
  profileFallbackSuppressed: boolean;
}) {
  return buildAssistantMessageMetadata({
    agent_id: "agent-1",
    agent_name: "Smoke Memory Coach",
    model: "gpt-5.4",
    model_provider: "openai",
    model_requested: "gpt-5.4",
    model_profile_id: "profile-1",
    model_profile_name: "Default",
    model_profile_tier_label: null,
    model_profile_usage_note: null,
    underlying_model_label: "gpt-5.4",
    role_core_packet: harnessRoleCorePacket,
    runtime_input: buildRuntimeTurnInput({
      userId: "user-1",
      agentId: "agent-1",
      threadId: "thread-1",
      workspaceId: "workspace-1",
      content: "你还记得我这周的计划吗？",
      source: "web"
    }),
    session_thread_id: "thread-1",
    session_agent_id: "agent-1",
    current_message_id: "message-1",
    recent_raw_turn_count: 2,
    approx_context_pressure: "medium",
    reply_language_target: "zh-Hans",
    reply_language_detected: "zh-Hans",
    reply_language_source: "latest-user-message",
    question_type: "memory-check",
    answer_strategy: "memory-record-first",
    answer_strategy_reason_code: "memory-record-recall",
    answer_strategy_priority: "high",
    answer_strategy_priority_label: "High",
    continuation_reason_code: null,
    same_thread_continuation_applicable: false,
    long_chain_pressure_candidate: false,
    same_thread_continuation_preferred: false,
    distant_memory_fallback_allowed: false,
    recalled_memories: [],
    recalled_memory_preview: [],
    memory_hit_count: 1,
    memory_used: true,
    memory_types_used: ["goal"],
    memory_semantic_layers: ["memory_record"],
    memory_record_recall_preferred: args.memoryRecordRecallPreferred,
    profile_fallback_suppressed: args.profileFallbackSuppressed,
    profile_snapshot: [],
    hidden_memory_exclusion_count: 0,
    incorrect_memory_exclusion_count: 0,
    follow_up_request_count: 0,
    knowledge_count: 0,
    knowledge_titles: [],
    knowledge_source_kinds: [],
    knowledge_scope_layers: [],
    knowledge_governance_classes: []
  });
}

async function main() {
  const preferredMetadata = buildHarnessMetadata({
    memoryRecordRecallPreferred: true,
    profileFallbackSuppressed: true
  });
  const neutralMetadata = buildHarnessMetadata({
    memoryRecordRecallPreferred: false,
    profileFallbackSuppressed: false
  });

  const results = [
    {
      id: "preferred_recall_policy",
      actual: {
        memory_record_recall_preferred:
          getAssistantMemoryRecordRecallPreferred(preferredMetadata),
        profile_fallback_suppressed:
          getAssistantProfileFallbackSuppressed(preferredMetadata)
      },
      expected: {
        memory_record_recall_preferred: true,
        profile_fallback_suppressed: true
      }
    },
    {
      id: "neutral_recall_policy",
      actual: {
        memory_record_recall_preferred:
          getAssistantMemoryRecordRecallPreferred(neutralMetadata),
        profile_fallback_suppressed:
          getAssistantProfileFallbackSuppressed(neutralMetadata)
      },
      expected: {
        memory_record_recall_preferred: false,
        profile_fallback_suppressed: false
      }
    }
  ].map((result) => ({
    ...result,
    pass:
      result.actual.memory_record_recall_preferred ===
        result.expected.memory_record_recall_preferred &&
      result.actual.profile_fallback_suppressed ===
        result.expected.profile_fallback_suppressed
  }));

  const failed = results.filter((result) => !result.pass);

  console.log(
    JSON.stringify(
      {
        status: failed.length === 0 ? "ok" : "failed",
        total: results.length,
        passed: results.length - failed.length,
        failed: failed.length,
        results
      },
      null,
      2
    )
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Unknown recall policy metadata harness failure."
  );
  process.exitCode = 1;
});
