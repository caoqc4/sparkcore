import { buildAssistantMessageMetadata } from "@/lib/chat/assistant-message-metadata";
import {
  getAssistantRelationshipAdoptedAgentNicknameTarget,
  getAssistantRelationshipAdoptedUserPreferredNameTarget
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
    same_thread_continuation_preferred: true
  },
  memory_handoff: null
};

function buildHarnessMetadata(args: {
  agentNicknameTarget: string | null;
  userPreferredNameTarget: string | null;
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
      content: "请简单介绍一下你自己。",
      source: "web"
    }),
    session_thread_id: "thread-1",
    session_agent_id: "agent-1",
    current_message_id: "message-1",
    recent_raw_turn_count: 3,
    approx_context_pressure: "medium",
    reply_language_target: "zh-Hans",
    reply_language_detected: "zh-Hans",
    reply_language_source: "latest-user-message",
    question_type: "open-ended-summary",
    answer_strategy: "same-thread-continuation",
    answer_strategy_reason_code: "same-thread-edge-carryover",
    answer_strategy_priority: "medium",
    answer_strategy_priority_label: "Medium",
    relationship_recall_used: true,
    relationship_recall_same_thread_continuity: true,
    relationship_recall_keys: ["agent_nickname", "user_preferred_name"],
    relationship_recall_memory_ids: ["mem-1", "mem-2"],
    relationship_recall_adopted_agent_nickname_target: args.agentNicknameTarget,
    relationship_recall_adopted_user_preferred_name_target:
      args.userPreferredNameTarget,
    continuation_reason_code: "brief-summary-carryover",
    same_thread_continuation_applicable: true,
    long_chain_pressure_candidate: false,
    same_thread_continuation_preferred: true,
    distant_memory_fallback_allowed: false,
    recalled_memories: [],
    recalled_memory_preview: [],
    memory_hit_count: 2,
    memory_used: true,
    memory_types_used: ["relationship"],
    memory_semantic_layers: ["memory_record"],
    memory_record_recall_preferred: false,
    profile_fallback_suppressed: false,
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
  const metadata = buildHarnessMetadata({
    agentNicknameTarget: "小芳",
    userPreferredNameTarget: "阿强"
  });

  const emptyMetadata = buildHarnessMetadata({
    agentNicknameTarget: null,
    userPreferredNameTarget: null
  });

  const results = [
    {
      id: "reads_relationship_adoption_targets",
      actual: {
        adopted_agent_nickname_target:
          getAssistantRelationshipAdoptedAgentNicknameTarget(metadata),
        adopted_user_preferred_name_target:
          getAssistantRelationshipAdoptedUserPreferredNameTarget(metadata)
      },
      expected: {
        adopted_agent_nickname_target: "小芳",
        adopted_user_preferred_name_target: "阿强"
      }
    },
    {
      id: "returns_null_when_relationship_adoption_targets_missing",
      actual: {
        adopted_agent_nickname_target:
          getAssistantRelationshipAdoptedAgentNicknameTarget(emptyMetadata),
        adopted_user_preferred_name_target:
          getAssistantRelationshipAdoptedUserPreferredNameTarget(emptyMetadata)
      },
      expected: {
        adopted_agent_nickname_target: null,
        adopted_user_preferred_name_target: null
      }
    }
  ].map((result) => ({
    ...result,
    pass:
      result.actual.adopted_agent_nickname_target ===
        result.expected.adopted_agent_nickname_target &&
      result.actual.adopted_user_preferred_name_target ===
        result.expected.adopted_user_preferred_name_target
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
      : "Unknown relationship adoption metadata harness failure."
  );
  process.exitCode = 1;
});
