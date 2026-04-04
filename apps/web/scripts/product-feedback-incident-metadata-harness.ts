import {
  getAssistantHumanizedNegativeProductFeedbackCategory,
  getAssistantHumanizedNegativeProductFeedbackDetected,
  getAssistantProductFeedbackIncidentId,
  getAssistantProductFeedbackReusedExisting,
  getAssistantProductFeedbackSignalCategory
} from "@/lib/chat/assistant-message-metadata-read";

function buildMetadata(args?: { reusedExisting?: boolean }) {
  return {
    product_feedback_incident: {
      incident_id: "incident-123",
      signal_category: "memory_capability_mocking",
      confidence: "high",
      captured: true,
      reused_existing: args?.reusedExisting ?? false
    },
    humanized_delivery: {
      negative_product_feedback_detected: true,
      negative_product_feedback_category: "memory_capability_mocking",
      negative_product_feedback_confidence: "high"
    }
  } as Record<string, unknown>;
}

async function main() {
  const metadata = buildMetadata();
  const reusedMetadata = buildMetadata({ reusedExisting: true });

  const results = [
    {
      id: "product_feedback_incident_reader",
      actual: {
        incident_id: getAssistantProductFeedbackIncidentId(metadata),
        signal_category: getAssistantProductFeedbackSignalCategory(metadata),
        reused_existing: getAssistantProductFeedbackReusedExisting(metadata)
      },
      expected: {
        incident_id: "incident-123",
        signal_category: "memory_capability_mocking",
        reused_existing: false
      }
    },
    {
      id: "product_feedback_reused_existing_reader",
      actual: {
        incident_id: getAssistantProductFeedbackIncidentId(reusedMetadata),
        reused_existing:
          getAssistantProductFeedbackReusedExisting(reusedMetadata)
      },
      expected: {
        incident_id: "incident-123",
        reused_existing: true
      }
    },
    {
      id: "humanized_negative_feedback_reader",
      actual: {
        detected: getAssistantHumanizedNegativeProductFeedbackDetected(metadata),
        category:
          getAssistantHumanizedNegativeProductFeedbackCategory(metadata)
      },
      expected: {
        detected: true,
        category: "memory_capability_mocking"
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
      : "Unknown product feedback incident metadata harness failure."
  );
  process.exitCode = 1;
});
