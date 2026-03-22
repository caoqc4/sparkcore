import type {
  RuntimeFollowUpExecutionResult,
  RuntimeFollowUpRequest
} from "@/lib/chat/runtime-contract";

function isValidIsoTimestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function hasRequiredGentleCheckInPayload(payload: Record<string, unknown>) {
  return (
    typeof payload.thread_id === "string" &&
    payload.thread_id.length > 0 &&
    typeof payload.agent_id === "string" &&
    payload.agent_id.length > 0 &&
    typeof payload.user_id === "string" &&
    payload.user_id.length > 0
  );
}

export async function executeFollowUpRequests({
  requests
}: {
  requests: RuntimeFollowUpRequest[];
}): Promise<RuntimeFollowUpExecutionResult[]> {
  return requests.map((request, index) => {
    if (!isValidIsoTimestamp(request.trigger_at)) {
      return {
        request_index: index,
        kind: request.kind,
        status: "invalid",
        reason: "follow-up trigger_at is not a valid ISO timestamp",
        trigger_at: request.trigger_at
      };
    }

    if (request.kind !== "gentle_check_in") {
      return {
        request_index: index,
        kind: request.kind,
        status: "unsupported",
        reason: "follow-up kind is not supported by the current stub executor",
        trigger_at: request.trigger_at
      };
    }

    if (!hasRequiredGentleCheckInPayload(request.payload)) {
      return {
        request_index: index,
        kind: request.kind,
        status: "invalid",
        reason: "gentle_check_in payload is missing required thread/agent/user identifiers",
        trigger_at: request.trigger_at,
        payload: request.payload
      };
    }

    if (Date.parse(request.trigger_at) <= Date.now()) {
      return {
        request_index: index,
        kind: request.kind,
        status: "skipped",
        reason: "follow-up trigger_at is already in the past",
        trigger_at: request.trigger_at,
        payload: request.payload
      };
    }

    return {
      request_index: index,
      kind: request.kind,
      status: "accepted",
      reason: "stub executor accepted the follow-up request but did not schedule it",
      trigger_at: request.trigger_at,
      payload: request.payload
    };
  });
}
