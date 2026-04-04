import { buildDefaultThreadState } from "@/lib/chat/thread-state";
import { InMemoryThreadStateRepository } from "@/lib/chat/thread-state-repository";
import {
  buildThreadStateAfterTurn,
  maybeWriteThreadStateAfterTurn
} from "@/lib/chat/thread-state-writeback";

function buildPreparedInput(args?: {
  assistantMessageId?: string | null;
  includeAssistantMessage?: boolean;
  latestUserContent?: string;
  baseFocusMode?: string | null;
  baseContinuityStatus?: "cold" | "warm" | "engaged" | null;
  hasPriorAssistantTurn?: boolean;
}) {
  const repository = new InMemoryThreadStateRepository();

  return {
    prepared: {
      session: {
        thread_state: buildDefaultThreadState({
          threadId: "thread-1",
          agentId: "agent-1",
          lastUserMessageId: "user-msg-1",
          lastAssistantMessageId: "assistant-msg-prev",
          continuityStatus: args?.baseContinuityStatus ?? "warm",
          focusMode: args?.baseFocusMode ?? null
        }),
        continuity_signals: {
          hasPriorAssistantTurn: args?.hasPriorAssistantTurn ?? true
        }
      },
      resources: {
        assistant_message_id: args?.assistantMessageId ?? null,
        messages: [
          {
            id: "user-msg-1",
            role: "user",
            content: args?.latestUserContent ?? "继续吧",
            status: "completed",
            metadata: {},
            created_at: "2026-04-04T09:00:00.000Z"
          }
        ]
      }
    },
    result: {
      assistant_message:
        args?.includeAssistantMessage === false
          ? null
          : {
              role: "assistant" as const,
              content: "我们继续。",
              language: "zh",
              message_type: "text" as const
            },
      memory_write_requests: [],
      follow_up_requests: [],
      memory_usage_updates: [],
      runtime_events: []
    },
    repository,
    repository_name: "in_memory" as const
  };
}

async function main() {
  const fallbackRecord = buildThreadStateAfterTurn(
    buildPreparedInput({
      assistantMessageId: null,
      latestUserContent: "继续吧",
      baseFocusMode: "完成 onboarding checklist"
    }) as unknown as Parameters<typeof buildThreadStateAfterTurn>[0]
  );
  const projectedFocusRecord = buildThreadStateAfterTurn(
    buildPreparedInput({
      assistantMessageId: "assistant-msg-2",
      latestUserContent: "帮我整理一下产品反馈事故的复盘方案",
      baseFocusMode: null
    }) as unknown as Parameters<typeof buildThreadStateAfterTurn>[0]
  );

  const missingAssistantResult = await maybeWriteThreadStateAfterTurn({
    ...(buildPreparedInput({
      assistantMessageId: null,
      includeAssistantMessage: false
    }) as unknown as Parameters<typeof maybeWriteThreadStateAfterTurn>[0]),
    repository: new InMemoryThreadStateRepository(),
    repository_name: "in_memory"
  });
  const resetFocusRecord = buildThreadStateAfterTurn(
    buildPreparedInput({
      assistantMessageId: "assistant-msg-3",
      latestUserContent: "这个先放一放，换个话题吧",
      baseFocusMode: "完成 onboarding checklist",
      baseContinuityStatus: "engaged"
    }) as unknown as Parameters<typeof buildThreadStateAfterTurn>[0]
  );
  const firstTurnRecord = buildThreadStateAfterTurn(
    buildPreparedInput({
      assistantMessageId: "assistant-msg-4",
      latestUserContent: "谢谢你，先这样吧",
      baseFocusMode: null,
      baseContinuityStatus: null,
      hasPriorAssistantTurn: false
    }) as unknown as Parameters<typeof buildThreadStateAfterTurn>[0]
  );
  const refinedFocusRecord = buildThreadStateAfterTurn(
    buildPreparedInput({
      assistantMessageId: "assistant-msg-5",
      latestUserContent: "先把招募和访谈提纲展开一点",
      baseFocusMode: "帮我规划一版用户访谈方案，覆盖目标、招募和访谈提纲",
      baseContinuityStatus: "engaged"
    }) as unknown as Parameters<typeof buildThreadStateAfterTurn>[0]
  );

  const results = [
    {
      id: "fallback_to_previous_assistant_anchor",
      actual: {
        anchor_mode: fallbackRecord?.anchor_mode ?? null,
        focus_projection_reason:
          fallbackRecord?.focus_projection_reason ?? null,
        continuity_projection_reason:
          fallbackRecord?.continuity_projection_reason ?? null,
        state_version: fallbackRecord?.thread_state.state_version ?? null,
        continuity_status: fallbackRecord?.thread_state.continuity_status ?? null,
        focus_mode: fallbackRecord?.thread_state.focus_mode ?? null,
        current_language_hint:
          fallbackRecord?.thread_state.current_language_hint ?? null,
        recent_turn_window_size:
          fallbackRecord?.thread_state.recent_turn_window_size ?? null,
        last_assistant_message_id:
          fallbackRecord?.thread_state.last_assistant_message_id ?? null
      },
      expected: {
        anchor_mode: "previous_assistant_message",
        focus_projection_reason: "preserve_existing_focus",
        continuity_projection_reason: "engaged_follow_up",
        state_version: 2,
        continuity_status: "engaged",
        focus_mode: "完成 onboarding checklist",
        current_language_hint: "zh-Hans",
        recent_turn_window_size: 1,
        last_assistant_message_id: "assistant-msg-prev"
      }
    },
    {
      id: "project_focus_mode_from_task_message",
      actual: {
        anchor_mode: projectedFocusRecord?.anchor_mode ?? null,
        focus_projection_reason:
          projectedFocusRecord?.focus_projection_reason ?? null,
        continuity_projection_reason:
          projectedFocusRecord?.continuity_projection_reason ?? null,
        state_version: projectedFocusRecord?.thread_state.state_version ?? null,
        focus_mode: projectedFocusRecord?.thread_state.focus_mode ?? null,
        recent_turn_window_size:
          projectedFocusRecord?.thread_state.recent_turn_window_size ?? null,
        last_assistant_message_id:
          projectedFocusRecord?.thread_state.last_assistant_message_id ?? null
      },
      expected: {
        anchor_mode: "current_assistant_message",
        focus_projection_reason: "task_projection",
        continuity_projection_reason: "engaged_follow_up",
        state_version: 2,
        focus_mode: "帮我整理一下产品反馈事故的复盘方案",
        recent_turn_window_size: 1,
        last_assistant_message_id: "assistant-msg-2"
      }
    },
    {
      id: "skip_only_when_assistant_message_missing",
      actual: {
        status: missingAssistantResult.status,
        reason:
          missingAssistantResult.status === "written"
            ? null
            : missingAssistantResult.reason
      },
      expected: {
        status: "skipped",
        reason: "missing_thread_state_or_assistant_message"
      }
    },
    {
      id: "clear_focus_and_relax_continuity_on_topic_shift",
      actual: {
        focus_mode: resetFocusRecord?.thread_state.focus_mode ?? null,
        continuity_status: resetFocusRecord?.thread_state.continuity_status ?? null,
        anchor_mode: resetFocusRecord?.anchor_mode ?? null,
        focus_projection_reason:
          resetFocusRecord?.focus_projection_reason ?? null,
        continuity_projection_reason:
          resetFocusRecord?.continuity_projection_reason ?? null
      },
      expected: {
        focus_mode: null,
        continuity_status: "warm",
        anchor_mode: "current_assistant_message",
        focus_projection_reason: "topic_shift_clear",
        continuity_projection_reason: "topic_shift_relax"
      }
    },
    {
      id: "first_turn_stays_warm_without_prior_assistant",
      actual: {
        focus_mode: firstTurnRecord?.thread_state.focus_mode ?? null,
        continuity_status: firstTurnRecord?.thread_state.continuity_status ?? null,
        anchor_mode: firstTurnRecord?.anchor_mode ?? null,
        focus_projection_reason:
          firstTurnRecord?.focus_projection_reason ?? null,
        continuity_projection_reason:
          firstTurnRecord?.continuity_projection_reason ?? null
      },
      expected: {
        focus_mode: null,
        continuity_status: "warm",
        anchor_mode: "current_assistant_message",
        focus_projection_reason: "topic_shift_clear",
        continuity_projection_reason: "first_turn_warm"
      }
    },
    {
      id: "refine_focus_mode_for_subtask_follow_up",
      actual: {
        focus_mode: refinedFocusRecord?.thread_state.focus_mode ?? null,
        continuity_status: refinedFocusRecord?.thread_state.continuity_status ?? null,
        anchor_mode: refinedFocusRecord?.anchor_mode ?? null,
        focus_projection_reason:
          refinedFocusRecord?.focus_projection_reason ?? null,
        continuity_projection_reason:
          refinedFocusRecord?.continuity_projection_reason ?? null
      },
      expected: {
        focus_mode: "先把招募和访谈提纲展开一点",
        continuity_status: "engaged",
        anchor_mode: "current_assistant_message",
        focus_projection_reason: "subtask_refinement",
        continuity_projection_reason: "focus_change_engaged"
      }
    }
  ].map((result) => ({
    ...result,
    pass: JSON.stringify(result.actual) === JSON.stringify(result.expected)
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
      : "Unknown thread state writeback harness failure."
  );
  process.exitCode = 1;
});
