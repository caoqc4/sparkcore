import type {
  FollowUpRepository,
  PendingFollowUpRecord
} from "@/lib/chat/runtime-contract";
import {
  buildFollowUpExecutionMetadata,
  buildFollowUpSendFailureMetadata
} from "@/lib/chat/follow-up-result-metadata";
import type { ProactiveSendResult } from "@/lib/integrations/im-adapter";

export async function markFollowUpFromSendResult({
  repository,
  record,
  sendResult
}: {
  repository: FollowUpRepository;
  record: PendingFollowUpRecord;
  sendResult: ProactiveSendResult;
}) {
  if (sendResult.status === "sent") {
    return repository.markFollowUpExecuted({
      id: record.id,
      executed_at: new Date().toISOString(),
      execution_metadata: buildFollowUpExecutionMetadata(sendResult)
    });
  }

  return repository.markFollowUpFailed({
    id: record.id,
    failed_at: new Date().toISOString(),
    failure_reason: sendResult.failure_reason ?? `proactive send ${sendResult.status}`,
    failure_metadata: buildFollowUpSendFailureMetadata(sendResult)
  });
}
