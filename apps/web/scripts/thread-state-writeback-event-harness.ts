import type { RuntimeEvent } from "@/lib/chat/runtime-contract";
import {
  getRuntimeThreadStateWritebackAnchorMode,
  getRuntimeThreadStateWritebackCompletedEvent,
  getRuntimeThreadStateWritebackContinuityProjectionReason,
  getRuntimeThreadStateWritebackFocusProjectionReason,
  getRuntimeThreadStateWritebackReason,
  getRuntimeThreadStateWritebackStatus
} from "@/lib/chat/runtime-event-read";

function buildEvents(args: {
  status: "written" | "skipped" | "failed";
  reason?: string | null;
  anchorMode?: "current_assistant_message" | "previous_assistant_message" | null;
  focusProjectionReason?: string | null;
  continuityProjectionReason?: string | null;
}) {
  return [
    {
      type: "thread_state_writeback_completed",
      payload: {
        status: args.status,
        repository: "supabase",
        reason: args.reason ?? null,
        anchor_mode: args.anchorMode ?? null,
        focus_projection_reason: args.focusProjectionReason ?? null,
        continuity_projection_reason: args.continuityProjectionReason ?? null
      }
    }
  ] as RuntimeEvent[];
}

async function main() {
  const skippedEvents = buildEvents({
    status: "skipped",
    reason: "missing_thread_state_or_assistant_message"
  });
  const writtenEvents = buildEvents({
    status: "written",
    reason: null,
    anchorMode: "previous_assistant_message",
    focusProjectionReason: "preserve_existing_focus",
    continuityProjectionReason: "engaged_follow_up"
  });

  const results = [
    {
      id: "thread_state_writeback_skipped_reason",
      actual: {
        type:
          getRuntimeThreadStateWritebackCompletedEvent(skippedEvents)?.type ??
          null,
        status: getRuntimeThreadStateWritebackStatus(skippedEvents),
        reason: getRuntimeThreadStateWritebackReason(skippedEvents),
        anchor_mode: getRuntimeThreadStateWritebackAnchorMode(skippedEvents),
        focus_projection_reason:
          getRuntimeThreadStateWritebackFocusProjectionReason(skippedEvents),
        continuity_projection_reason:
          getRuntimeThreadStateWritebackContinuityProjectionReason(
            skippedEvents
          )
      },
      expected: {
        type: "thread_state_writeback_completed",
        status: "skipped",
        reason: "missing_thread_state_or_assistant_message",
        anchor_mode: null,
        focus_projection_reason: null,
        continuity_projection_reason: null
      }
    },
    {
      id: "thread_state_writeback_written_reason_null",
      actual: {
        type:
          getRuntimeThreadStateWritebackCompletedEvent(writtenEvents)?.type ??
          null,
        status: getRuntimeThreadStateWritebackStatus(writtenEvents),
        reason: getRuntimeThreadStateWritebackReason(writtenEvents),
        anchor_mode: getRuntimeThreadStateWritebackAnchorMode(writtenEvents),
        focus_projection_reason:
          getRuntimeThreadStateWritebackFocusProjectionReason(writtenEvents),
        continuity_projection_reason:
          getRuntimeThreadStateWritebackContinuityProjectionReason(
            writtenEvents
          )
      },
      expected: {
        type: "thread_state_writeback_completed",
        status: "written",
        reason: null,
        anchor_mode: "previous_assistant_message",
        focus_projection_reason: "preserve_existing_focus",
        continuity_projection_reason: "engaged_follow_up"
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
      : "Unknown thread state writeback event harness failure."
  );
  process.exitCode = 1;
});
