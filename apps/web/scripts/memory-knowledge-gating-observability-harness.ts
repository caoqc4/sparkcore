import type { RuntimeEvent } from "@/lib/chat/runtime-contract";
import {
  getAssistantKnowledgeGatingAvailable,
  getAssistantKnowledgeGatingAvailableCount,
  getAssistantKnowledgeGatingInjectionGapReason,
  getAssistantKnowledgeGatingSuppressed,
  getAssistantKnowledgeGatingShouldInject,
  getAssistantKnowledgeGatingSuppressionReason,
  getAssistantKnowledgeGatingZeroMatchFilteredCount,
  getAssistantKnowledgeGatingWeakMatchFilteredCount
} from "@/lib/chat/assistant-message-metadata-read";
import {
  getRuntimeKnowledgeAvailable,
  getRuntimeKnowledgeAvailableCount,
  getRuntimeKnowledgeInjectionGapReason,
  getRuntimeKnowledgeSelectedEvent,
  getRuntimeKnowledgeSuppressed,
  getRuntimeKnowledgeShouldInject,
  getRuntimeKnowledgeSuppressionReason,
  getRuntimeKnowledgeWeakMatchFilteredCount
} from "@/lib/chat/runtime-event-read";

function buildMetadata(args: {
  available: boolean;
  availableCount: number;
  shouldInject: boolean;
  injectionGapReason: string | null;
  suppressed: boolean;
  suppressionReason: string | null;
  zeroMatchFilteredCount: number;
  weakMatchFilteredCount: number;
}) {
  return {
    knowledge: {
      gating: {
        available: args.available,
        available_count: args.availableCount,
        should_inject: args.shouldInject,
        injection_gap_reason: args.injectionGapReason,
        suppressed: args.suppressed,
        suppression_reason: args.suppressionReason,
        query_token_count: 3,
        zero_match_filtered_count: args.zeroMatchFilteredCount,
        weak_match_filtered_count: args.weakMatchFilteredCount
      }
    }
  } as Record<string, unknown>;
}

function buildEvents(args: {
  available: boolean;
  availableCount: number;
  shouldInject: boolean;
  injectionGapReason: string | null;
  suppressed: boolean;
  suppressionReason: string | null;
}) {
  return [
    {
      type: "knowledge_selected",
      payload: {
        count: args.suppressed ? 0 : 2,
        knowledge_route: "light_knowledge",
        available: args.available,
        available_count: args.availableCount,
        should_inject: args.shouldInject,
        injection_gap_reason: args.injectionGapReason,
        suppressed: args.suppressed,
        suppression_reason: args.suppressionReason,
        query_token_count: args.suppressed ? 0 : 3,
        zero_match_filtered_count: args.suppressed ? 0 : 4,
        weak_match_filtered_count: args.suppressed ? 0 : 2
      }
    }
  ] as RuntimeEvent[];
}

async function main() {
  const suppressedMetadata = buildMetadata({
    available: false,
    availableCount: 0,
    shouldInject: false,
    injectionGapReason: null,
    suppressed: true,
    suppressionReason: "relational_turn",
    zeroMatchFilteredCount: 0,
    weakMatchFilteredCount: 0
  });
  const filteredMetadata = buildMetadata({
    available: true,
    availableCount: 3,
    shouldInject: true,
    injectionGapReason: null,
    suppressed: false,
    suppressionReason: null,
    zeroMatchFilteredCount: 5,
    weakMatchFilteredCount: 2
  });
  const suppressedEvents = buildEvents({
    available: false,
    availableCount: 0,
    shouldInject: false,
    injectionGapReason: null,
    suppressed: true,
    suppressionReason: "relational_turn"
  });
  const filteredEvents = buildEvents({
    available: true,
    availableCount: 3,
    shouldInject: true,
    injectionGapReason: null,
    suppressed: false,
    suppressionReason: null
  });
  const namespaceFilteredMetadata = buildMetadata({
    available: true,
    availableCount: 2,
    shouldInject: true,
    injectionGapReason: "namespace_filtered_after_availability",
    suppressed: false,
    suppressionReason: null,
    zeroMatchFilteredCount: 1,
    weakMatchFilteredCount: 0
  });
  const namespaceFilteredEvents = buildEvents({
    available: true,
    availableCount: 2,
    shouldInject: true,
    injectionGapReason: "namespace_filtered_after_availability",
    suppressed: false,
    suppressionReason: null
  }).map((event) => ({
    ...event,
    payload: {
      ...event.payload,
      count: 0
    }
  })) as RuntimeEvent[];

  const results = [
    {
      id: "metadata_relational_suppression",
      actual: {
        available: getAssistantKnowledgeGatingAvailable(suppressedMetadata),
        available_count:
          getAssistantKnowledgeGatingAvailableCount(suppressedMetadata),
        suppressed: getAssistantKnowledgeGatingSuppressed(suppressedMetadata),
        should_inject:
          getAssistantKnowledgeGatingShouldInject(suppressedMetadata),
        injection_gap_reason:
          getAssistantKnowledgeGatingInjectionGapReason(suppressedMetadata),
        suppression_reason:
          getAssistantKnowledgeGatingSuppressionReason(suppressedMetadata),
        zero_match_filtered_count:
          getAssistantKnowledgeGatingZeroMatchFilteredCount(suppressedMetadata),
        weak_match_filtered_count:
          getAssistantKnowledgeGatingWeakMatchFilteredCount(suppressedMetadata)
      },
      expected: {
        available: false,
        available_count: 0,
        suppressed: true,
        should_inject: false,
        injection_gap_reason: null,
        suppression_reason: "relational_turn",
        zero_match_filtered_count: 0,
        weak_match_filtered_count: 0
      }
    },
    {
      id: "metadata_zero_match_filtering",
      actual: {
        available: getAssistantKnowledgeGatingAvailable(filteredMetadata),
        available_count:
          getAssistantKnowledgeGatingAvailableCount(filteredMetadata),
        suppressed: getAssistantKnowledgeGatingSuppressed(filteredMetadata),
        should_inject:
          getAssistantKnowledgeGatingShouldInject(filteredMetadata),
        injection_gap_reason:
          getAssistantKnowledgeGatingInjectionGapReason(filteredMetadata),
        suppression_reason:
          getAssistantKnowledgeGatingSuppressionReason(filteredMetadata),
        zero_match_filtered_count:
          getAssistantKnowledgeGatingZeroMatchFilteredCount(filteredMetadata),
        weak_match_filtered_count:
          getAssistantKnowledgeGatingWeakMatchFilteredCount(filteredMetadata)
      },
      expected: {
        available: true,
        available_count: 3,
        suppressed: false,
        should_inject: true,
        injection_gap_reason: null,
        suppression_reason: null,
        zero_match_filtered_count: 5,
        weak_match_filtered_count: 2
      }
    },
    {
      id: "event_relational_suppression",
      actual: {
        type: getRuntimeKnowledgeSelectedEvent(suppressedEvents)?.type ?? null,
        available: getRuntimeKnowledgeAvailable(suppressedEvents),
        available_count: getRuntimeKnowledgeAvailableCount(suppressedEvents),
        suppressed: getRuntimeKnowledgeSuppressed(suppressedEvents),
        should_inject: getRuntimeKnowledgeShouldInject(suppressedEvents),
        injection_gap_reason:
          getRuntimeKnowledgeInjectionGapReason(suppressedEvents),
        suppression_reason:
          getRuntimeKnowledgeSuppressionReason(suppressedEvents)
      },
      expected: {
        type: "knowledge_selected",
        available: false,
        available_count: 0,
        suppressed: true,
        should_inject: false,
        injection_gap_reason: null,
        suppression_reason: "relational_turn"
      }
    },
    {
      id: "event_non_suppressed_selection",
      actual: {
        type: getRuntimeKnowledgeSelectedEvent(filteredEvents)?.type ?? null,
        available: getRuntimeKnowledgeAvailable(filteredEvents),
        available_count: getRuntimeKnowledgeAvailableCount(filteredEvents),
        suppressed: getRuntimeKnowledgeSuppressed(filteredEvents),
        should_inject: getRuntimeKnowledgeShouldInject(filteredEvents),
        injection_gap_reason:
          getRuntimeKnowledgeInjectionGapReason(filteredEvents),
        suppression_reason:
          getRuntimeKnowledgeSuppressionReason(filteredEvents),
        weak_match_filtered_count:
          getRuntimeKnowledgeWeakMatchFilteredCount(filteredEvents)
      },
      expected: {
        type: "knowledge_selected",
        available: true,
        available_count: 3,
        suppressed: false,
        should_inject: true,
        injection_gap_reason: null,
        suppression_reason: null,
        weak_match_filtered_count: 2
      }
    },
    {
      id: "metadata_namespace_filtered_gap",
      actual: {
        available: getAssistantKnowledgeGatingAvailable(namespaceFilteredMetadata),
        available_count:
          getAssistantKnowledgeGatingAvailableCount(namespaceFilteredMetadata),
        should_inject:
          getAssistantKnowledgeGatingShouldInject(namespaceFilteredMetadata),
        injection_gap_reason:
          getAssistantKnowledgeGatingInjectionGapReason(
            namespaceFilteredMetadata
          )
      },
      expected: {
        available: true,
        available_count: 2,
        should_inject: true,
        injection_gap_reason: "namespace_filtered_after_availability"
      }
    },
    {
      id: "event_namespace_filtered_gap",
      actual: {
        count: getRuntimeKnowledgeSelectedEvent(namespaceFilteredEvents)?.payload.count ?? null,
        available: getRuntimeKnowledgeAvailable(namespaceFilteredEvents),
        available_count: getRuntimeKnowledgeAvailableCount(namespaceFilteredEvents),
        should_inject: getRuntimeKnowledgeShouldInject(namespaceFilteredEvents),
        injection_gap_reason:
          getRuntimeKnowledgeInjectionGapReason(namespaceFilteredEvents)
      },
      expected: {
        count: 0,
        available: true,
        available_count: 2,
        should_inject: true,
        injection_gap_reason: "namespace_filtered_after_availability"
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
      : "Unknown knowledge gating observability harness failure."
  );
  process.exitCode = 1;
});
