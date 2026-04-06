import type { RuntimeEvent } from "@/lib/chat/runtime-contract";
import {
  getRuntimeAnswerCarryoverPolicy,
  getRuntimeAnswerForbiddenMoves,
  getRuntimeAnswerSceneGoal,
  getRuntimeAnswerStrategySelectedEvent
} from "@/lib/chat/runtime-event-read";

function buildHarnessEvents(args: {
  carryoverPolicy: "style_only" | "blocked";
  forbiddenMoves: string[];
  sceneGoal: "answer_role_presence_question" | "continue_same_thread";
}): RuntimeEvent[] {
  return [
    {
      type: "answer_strategy_selected",
      payload: {
        question_type: "role-capability",
        strategy: "role-presence-first",
        reason_code: "role-capability-prompt",
        priority: "high",
        carryover_policy: args.carryoverPolicy,
        forbidden_moves: args.forbiddenMoves,
        scene_goal: args.sceneGoal,
        continuation_reason_code: null,
        reply_language: "zh-Hans"
      }
    },
    {
      type: "assistant_reply_completed",
      payload: {
        thread_id: "thread-1",
        agent_id: "agent-1",
        recalled_count: 1,
        message_type: "text",
        language: "zh-Hans"
      }
    }
  ];
}

async function main() {
  const rolePresenceEvents = buildHarnessEvents({
    carryoverPolicy: "style_only",
    forbiddenMoves: ["rewrite_into_same_thread_emotional_follow_up"],
    sceneGoal: "answer_role_presence_question"
  });
  const continuationEvents = buildHarnessEvents({
    carryoverPolicy: "blocked",
    forbiddenMoves: [],
    sceneGoal: "continue_same_thread"
  });

  const results = [
    {
      id: "reads_role_presence_answer_decision_event_fields",
      actual: {
        event_found:
          getRuntimeAnswerStrategySelectedEvent(rolePresenceEvents)?.type ?? null,
        carryover_policy: getRuntimeAnswerCarryoverPolicy(rolePresenceEvents),
        forbidden_moves: getRuntimeAnswerForbiddenMoves(rolePresenceEvents),
        scene_goal: getRuntimeAnswerSceneGoal(rolePresenceEvents)
      },
      expected: {
        event_found: "answer_strategy_selected",
        carryover_policy: "style_only",
        forbidden_moves: ["rewrite_into_same_thread_emotional_follow_up"],
        scene_goal: "answer_role_presence_question"
      }
    },
    {
      id: "reads_continuation_answer_decision_event_fields",
      actual: {
        event_found:
          getRuntimeAnswerStrategySelectedEvent(continuationEvents)?.type ?? null,
        carryover_policy: getRuntimeAnswerCarryoverPolicy(continuationEvents),
        forbidden_moves: getRuntimeAnswerForbiddenMoves(continuationEvents),
        scene_goal: getRuntimeAnswerSceneGoal(continuationEvents)
      },
      expected: {
        event_found: "answer_strategy_selected",
        carryover_policy: "blocked",
        forbidden_moves: [],
        scene_goal: "continue_same_thread"
      }
    }
  ].map((result) => ({
    ...result,
    pass:
      result.actual.event_found === result.expected.event_found &&
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
      : "Unknown answer decision event harness failure."
  );
  process.exitCode = 1;
});
