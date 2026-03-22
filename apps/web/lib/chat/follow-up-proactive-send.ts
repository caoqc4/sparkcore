import type { PendingFollowUpRecord } from "@/lib/chat/runtime-contract";
import {
  buildProactiveSendTargetFromBinding,
  type ChannelBinding,
  type ProactiveSendRequest
} from "@/lib/integrations/im-adapter";

function resolveReplyLanguage(
  payload: Record<string, unknown>
): "zh-Hans" | "en" {
  return payload.reply_language === "en" ? "en" : "zh-Hans";
}

function buildGentleCheckInMessage(
  payload: Record<string, unknown>
): ProactiveSendRequest["message"] {
  const replyLanguage = resolveReplyLanguage(payload);

  if (replyLanguage === "en") {
    return {
      message_type: "text",
      content: "Just checking in on you a little. How are you holding up right now?",
      metadata: {
        reply_language: replyLanguage,
        message_template: "gentle_check_in_v1"
      }
    };
  }

  return {
    message_type: "text",
    content: "我来轻轻问一句，你这会儿还好吗？",
    metadata: {
      reply_language: replyLanguage,
      message_template: "gentle_check_in_v1"
    }
  };
}

export function buildProactiveSendRequestFromClaimedFollowUp({
  record,
  binding
}: {
  record: PendingFollowUpRecord;
  binding: ChannelBinding;
}): ProactiveSendRequest | null {
  if (record.status !== "claimed") {
    return null;
  }

  if (record.kind !== "gentle_check_in") {
    return null;
  }

  return {
    follow_up_id: record.id,
    kind: record.kind,
    target: buildProactiveSendTargetFromBinding(binding),
    message: buildGentleCheckInMessage(record.request_payload),
    claim_token:
      typeof record.request_payload.claim_token === "string"
        ? record.request_payload.claim_token
        : undefined,
    trace_id:
      typeof record.request_payload.trace_id === "string"
        ? record.request_payload.trace_id
        : undefined
  };
}
