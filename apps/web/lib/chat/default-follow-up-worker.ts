import { claimDuePendingFollowUps } from "@/lib/chat/follow-up-claim";
import {
  createAdminFollowUpBindingResolver,
  type FollowUpBindingResolver
} from "@/lib/chat/follow-up-binding";
import { createAdminFollowUpRepository } from "@/lib/chat/follow-up-admin-repository";
import { buildProactiveSendRequestFromClaimedFollowUp } from "@/lib/chat/follow-up-proactive-send";
import { StubProactiveSender } from "@/lib/chat/follow-up-proactive-sender";
import { markFollowUpFromSendResult } from "@/lib/chat/follow-up-result-marking";
import type {
  FollowUpRepository,
  PendingFollowUpRecord
} from "@/lib/chat/runtime-contract";
import type { ProactiveSender } from "@/lib/integrations/im-adapter";

export type DefaultFollowUpWorkerRecordResult = {
  follow_up_id: string;
  status: "executed" | "failed" | "skipped";
  reason?: string;
};

export type DefaultFollowUpWorkerResult = {
  claimed_count: number;
  processed_count: number;
  executed_count: number;
  failed_count: number;
  skipped_count: number;
  records: DefaultFollowUpWorkerRecordResult[];
};

async function processClaimedRecord(args: {
  record: PendingFollowUpRecord;
  repository: FollowUpRepository;
  sender: ProactiveSender;
  resolveBinding: FollowUpBindingResolver;
}): Promise<DefaultFollowUpWorkerRecordResult> {
  const binding = await args.resolveBinding(args.record);

  if (!binding) {
    await args.repository.markFollowUpFailed({
      id: args.record.id,
      failed_at: new Date().toISOString(),
      failure_reason: "binding_not_found",
      failure_metadata: {
        thread_id: args.record.thread_id,
        user_id: args.record.user_id,
        agent_id: args.record.agent_id
      }
    });

    return {
      follow_up_id: args.record.id,
      status: "failed",
      reason: "binding_not_found"
    };
  }

  const sendRequest = buildProactiveSendRequestFromClaimedFollowUp({
    record: args.record,
    binding
  });

  if (!sendRequest) {
    await args.repository.markFollowUpFailed({
      id: args.record.id,
      failed_at: new Date().toISOString(),
      failure_reason: "proactive_request_mapping_failed",
      failure_metadata: {
        follow_up_kind: args.record.kind
      }
    });

    return {
      follow_up_id: args.record.id,
      status: "failed",
      reason: "proactive_request_mapping_failed"
    };
  }

  const sendResult = await args.sender.send(sendRequest);
  const markResult = await markFollowUpFromSendResult({
    repository: args.repository,
    record: args.record,
    sendResult
  });

  if (!markResult.updated || !markResult.record) {
    return {
      follow_up_id: args.record.id,
      status: "skipped",
      reason: "result_marking_did_not_update_record"
    };
  }

  if (markResult.record.status === "executed") {
    return {
      follow_up_id: args.record.id,
      status: "executed"
    };
  }

  return {
    follow_up_id: args.record.id,
    status: "failed",
    reason:
      sendResult.failure_reason ??
      (markResult.record.status === "failed"
        ? "proactive_send_failed"
        : `unexpected_terminal_status:${markResult.record.status}`)
  };
}

export async function runDefaultFollowUpWorker({
  now = new Date().toISOString(),
  limit = 10,
  claimedBy = "default-follow-up-worker",
  sender = new StubProactiveSender(),
  repository = createAdminFollowUpRepository(),
  resolveBinding = createAdminFollowUpBindingResolver()
}: {
  now?: string;
  limit?: number;
  claimedBy?: string;
  sender?: ProactiveSender;
  repository?: FollowUpRepository;
  resolveBinding?: FollowUpBindingResolver;
} = {}): Promise<DefaultFollowUpWorkerResult> {
  const claimResult = await claimDuePendingFollowUps({
    repository,
    now,
    limit,
    claimed_by: claimedBy
  });

  const records = await Promise.all(
    claimResult.records.map((record) =>
      processClaimedRecord({
        record,
        repository,
        sender,
        resolveBinding
      })
    )
  );

  return {
    claimed_count: claimResult.claimed_count,
    processed_count: records.length,
    executed_count: records.filter((record) => record.status === "executed").length,
    failed_count: records.filter((record) => record.status === "failed").length,
    skipped_count: records.filter((record) => record.status === "skipped").length,
    records
  };
}
