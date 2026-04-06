import { elapsedMs, nowMs } from "@/lib/chat/runtime-core-helpers";
import {
  buildGenerateAgentReplyDebugMetadata,
  buildGenerateAgentReplyLogFields,
} from "@/lib/chat/runtime-turn-observability";
import { buildRuntimeTurnPreparation } from "@/lib/chat/runtime-turn-preparation";
import { runPreparedRuntimeTurn } from "@/lib/chat/runtime-prepared-turn-runner";
import type { RuntimeTurnResult } from "@/lib/chat/runtime-contract";
import { createClient } from "@/lib/supabase/server";
import type {
  GenerateAgentReplyArgs,
  PreparedRuntimeTurnRunnerArgs
} from "@/lib/chat/runtime-entry-contracts";

export async function generateAgentReplyRuntime(
  args: GenerateAgentReplyArgs
): Promise<RuntimeTurnResult> {
  const {
    userId,
    workspace,
    thread,
    agent,
    messages,
    assistantMessageId,
    runtimeTurnInput,
    supabase: providedSupabase
  } = args;

  const supabase = providedSupabase ?? (await createClient());
  const {
    preparedRuntimeTurn,
    prepareRuntimeMemoryDurationMs,
    runtimeMemoryTimingMs,
    modelProfileDurationMs,
    prepareRuntimeTurnDurationMs,
    ...preparedTurnArgs
  } = await buildRuntimeTurnPreparation({
    userId,
    workspace,
    thread,
    agent,
    messages,
    assistantMessageId,
    runtimeTurnInput,
    supabase
  });

  const runPreparedRuntimeTurnStartedAt = nowMs();
  const runtimeTurnResult = await runPreparedRuntimeTurn({
    preparedRuntimeTurn,
    userId,
    ...(preparedTurnArgs as Omit<
      PreparedRuntimeTurnRunnerArgs,
      "preparedRuntimeTurn" | "userId"
    >)
  });
  const runPreparedRuntimeTurnDurationMs = elapsedMs(runPreparedRuntimeTurnStartedAt);

  runtimeTurnResult.debug_metadata = buildGenerateAgentReplyDebugMetadata({
    existingDebugMetadata: runtimeTurnResult.debug_metadata,
    prepareRuntimeMemoryDurationMs,
    runtimeMemoryTimingMs,
    modelProfileDurationMs,
    prepareRuntimeTurnDurationMs,
    runPreparedRuntimeTurnDurationMs
  });

  console.info(
    "[runtime-turn]",
    buildGenerateAgentReplyLogFields({
      threadId: thread.id,
      agentId: agent.id,
      prepareRuntimeMemoryDurationMs,
      runtimeMemoryTimingMs,
      modelProfileDurationMs,
      prepareRuntimeTurnDurationMs,
      runPreparedRuntimeTurnDurationMs
    })
  );

  return runtimeTurnResult;
}
