import type { RuntimeEvent } from "@/lib/chat/runtime-contract";
import {
  getRuntimeMemoryRecalledEvent,
  getRuntimeMemoryRecordRecallPreferred,
  getRuntimeProfileFallbackSuppressed
} from "@/lib/chat/runtime-event-read";

function buildHarnessEvents(args: {
  memoryRecordRecallPreferred: boolean;
  profileFallbackSuppressed: boolean;
}): RuntimeEvent[] {
  return [
    {
      type: "memory_recalled",
      payload: {
        count: 1,
        memory_types: ["goal"],
        hidden_exclusion_count: 0,
        incorrect_exclusion_count: 0,
        memory_record_recall_preferred: args.memoryRecordRecallPreferred,
        profile_fallback_suppressed: args.profileFallbackSuppressed
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
  const preferredEvents = buildHarnessEvents({
    memoryRecordRecallPreferred: true,
    profileFallbackSuppressed: true
  });
  const neutralEvents = buildHarnessEvents({
    memoryRecordRecallPreferred: false,
    profileFallbackSuppressed: false
  });

  const results = [
    {
      id: "preferred_event_policy",
      actual: {
        event_found: getRuntimeMemoryRecalledEvent(preferredEvents)?.type ?? null,
        memory_record_recall_preferred:
          getRuntimeMemoryRecordRecallPreferred(preferredEvents),
        profile_fallback_suppressed:
          getRuntimeProfileFallbackSuppressed(preferredEvents)
      },
      expected: {
        event_found: "memory_recalled",
        memory_record_recall_preferred: true,
        profile_fallback_suppressed: true
      }
    },
    {
      id: "neutral_event_policy",
      actual: {
        event_found: getRuntimeMemoryRecalledEvent(neutralEvents)?.type ?? null,
        memory_record_recall_preferred:
          getRuntimeMemoryRecordRecallPreferred(neutralEvents),
        profile_fallback_suppressed:
          getRuntimeProfileFallbackSuppressed(neutralEvents)
      },
      expected: {
        event_found: "memory_recalled",
        memory_record_recall_preferred: false,
        profile_fallback_suppressed: false
      }
    }
  ].map((result) => ({
    ...result,
    pass:
      result.actual.event_found === result.expected.event_found &&
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
    error instanceof Error ? error.message : "Unknown recall event harness failure."
  );
  process.exitCode = 1;
});
