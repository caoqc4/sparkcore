import type { SmokeTurnContext } from "@/lib/testing/smoke-turn-context";

export type SmokeTurnExecutionInput = {
  context: SmokeTurnContext;
  trimmedContent: string;
};
