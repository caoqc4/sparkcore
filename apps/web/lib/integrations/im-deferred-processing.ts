import type {
  AdapterDeferredPostProcessingPayload,
  AdapterInboundHandlingResult,
} from "@/lib/integrations/im-adapter";
import { runDeferredImPostProcessing } from "@/lib/chat/im-runtime-port";

function getProcessedRuntimeResult(result: AdapterInboundHandlingResult) {
  if (result.status !== "processed") {
    return null;
  }

  return result.runtime_output;
}

export function getDeferredPostProcessingTask(
  result: AdapterInboundHandlingResult
) {
  const runtimeOutput = getProcessedRuntimeResult(result);

  if (!runtimeOutput?.deferred_post_processing) {
    return null;
  }

  return {
    task: runtimeOutput.deferred_post_processing,
    runtimeTurnResult: {
      memory_write_requests: runtimeOutput.memory_write_requests,
      follow_up_requests: runtimeOutput.follow_up_requests,
    } satisfies AdapterDeferredPostProcessingPayload,
  };
}

export async function runDeferredPostProcessingForInboundResult(
  result: AdapterInboundHandlingResult
) {
  const deferredTask = getDeferredPostProcessingTask(result);

  if (!deferredTask) {
    return false;
  }

  await runDeferredImPostProcessing({
    assistantMessageId: deferredTask.task.assistant_message_id,
    threadId: deferredTask.task.thread_id,
    workspaceId: deferredTask.task.workspace_id,
    userId: deferredTask.task.user_id,
    agentId: deferredTask.task.agent_id,
    sourceMessageId: deferredTask.task.source_message_id,
    runtimeTurnResult: deferredTask.runtimeTurnResult,
  });

  return true;
}
