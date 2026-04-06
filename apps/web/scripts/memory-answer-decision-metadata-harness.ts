import {
  buildAssistantMessageMetadata
} from "@/lib/chat/assistant-message-metadata";
import {
  getAssistantAnswerCarryoverPolicy,
  getAssistantAnswerForbiddenMoves,
  getAssistantAnswerSceneGoal
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
  carryoverPolicy: "style_only" | "blocked";
  forbiddenMoves: string[];
  sceneGoal: "answer_role_presence_question" | "continue_same_thread";
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
      content: "你平时会怎么帮我？",
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
    question_type: "role-capability",
    answer_strategy: "role-presence-first",
    answer_strategy_reason_code: "role-capability-prompt",
    answer_strategy_priority: "high",
    answer_strategy_priority_label: "High",
    answer_carryover_policy: args.carryoverPolicy,
    answer_forbidden_moves: args.forbiddenMoves,
    answer_scene_goal: args.sceneGoal,
    continuation_reason_code: null,
    same_thread_continuation_applicable: true,
    long_chain_pressure_candidate: false,
    same_thread_continuation_preferred: true,
    distant_memory_fallback_allowed: false,
    recalled_memories: [],
    recalled_memory_preview: [],
    memory_hit_count: 1,
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
  const rolePresenceMetadata = buildHarnessMetadata({
    carryoverPolicy: "style_only",
    forbiddenMoves: ["rewrite_into_same_thread_emotional_follow_up"],
    sceneGoal: "answer_role_presence_question"
  });
  const continuationMetadata = buildHarnessMetadata({
    carryoverPolicy: "blocked",
    forbiddenMoves: [],
    sceneGoal: "continue_same_thread"
  });

  const results = [
    {
      id: "reads_role_presence_answer_decision_fields",
      actual: {
        carryover_policy:
          getAssistantAnswerCarryoverPolicy(rolePresenceMetadata),
        forbidden_moves:
          getAssistantAnswerForbiddenMoves(rolePresenceMetadata),
        scene_goal: getAssistantAnswerSceneGoal(rolePresenceMetadata)
      },
      expected: {
        carryover_policy: "style_only",
        forbidden_moves: ["rewrite_into_same_thread_emotional_follow_up"],
        scene_goal: "answer_role_presence_question"
      }
    },
    {
      id: "reads_continuation_answer_decision_fields",
      actual: {
        carryover_policy:
          getAssistantAnswerCarryoverPolicy(continuationMetadata),
        forbidden_moves:
          getAssistantAnswerForbiddenMoves(continuationMetadata),
        scene_goal: getAssistantAnswerSceneGoal(continuationMetadata)
      },
      expected: {
        carryover_policy: "blocked",
        forbidden_moves: [],
        scene_goal: "continue_same_thread"
      }
    }
  ].map((result) => ({
    ...result,
    pass:
      result.actual.carryover_policy === result.expected.carryover_policy &&
      JSON.stringify(result.actual.forbidden_moves) ===
        JSON.stringify(result.expected.forbidden_moves) &&
      result.actual.scene_goal === result.expected.scene_goal
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
      : "Unknown answer decision metadata harness failure."
  );
  process.exitCode = 1;
});
