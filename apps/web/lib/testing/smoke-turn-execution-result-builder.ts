import type { SmokeTurnExecutionResult } from "@/lib/testing/smoke-turn-execution-result";

export function buildSmokeTurnExecutionResult(args: {
  userMessageId: string;
  assistantMessageId: string;
}): SmokeTurnExecutionResult {
  return {
    userMessageId: args.userMessageId,
    assistantMessageId: args.assistantMessageId
  };
}
