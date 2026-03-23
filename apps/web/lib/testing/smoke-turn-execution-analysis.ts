import { prepareSmokeTurnExecutionState } from "@/lib/testing/smoke-turn-execution-state";
import type { SmokeTurnExecutionInput } from "@/lib/testing/smoke-turn-execution-types";

export function prepareSmokeExecutionAnalysis(args: {
  trimmedContent: SmokeTurnExecutionInput["trimmedContent"];
  existingMemories: SmokeTurnExecutionInput["context"]["existingMemories"];
  existingMessages: SmokeTurnExecutionInput["context"]["existingMessages"];
  agentId: string;
  threadId: string;
}) {
  return prepareSmokeTurnExecutionState({
    trimmedContent: args.trimmedContent,
    existingMemories: args.existingMemories,
    existingMessages: args.existingMessages,
    agentId: args.agentId,
    threadId: args.threadId
  }).analysis;
}
