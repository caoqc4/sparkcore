import type {
  ClaimDuePendingFollowUpsInput,
  PendingFollowUpRecord
} from "@/lib/chat/runtime-contract";
import type { ProactiveSendResult } from "@/lib/integrations/im-adapter";

export function buildFollowUpClaimMetadata(args: {
  claimToken: string;
  claimedAt: string;
  claimedBy: ClaimDuePendingFollowUpsInput["claimed_by"];
}) {
  return {
    claim_token: args.claimToken,
    claimed_at: args.claimedAt,
    claimed_by: args.claimedBy
  };
}

export function buildFollowUpBindingNotFoundFailureMetadata(
  record: PendingFollowUpRecord
) {
  return {
    thread_id: record.thread_id,
    user_id: record.user_id,
    agent_id: record.agent_id
  };
}

export function buildFollowUpRequestMappingFailureMetadata(
  record: PendingFollowUpRecord
) {
  return {
    follow_up_kind: record.kind
  };
}

export function buildFollowUpExecutionMetadata(
  sendResult: ProactiveSendResult
) {
  return {
    platform_message_id: sendResult.platform_message_id ?? null,
    sender_metadata: sendResult.metadata ?? {}
  };
}

export function buildFollowUpSendFailureMetadata(
  sendResult: ProactiveSendResult
) {
  return {
    status: sendResult.status,
    sender_metadata: sendResult.metadata ?? {}
  };
}
