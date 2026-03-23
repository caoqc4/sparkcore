import type { SmokeTurnExecutionInput } from "@/lib/testing/smoke-turn-execution-types";

export function getSmokeTurnExecutionContext(args: SmokeTurnExecutionInput) {
  const {
    admin,
    smokeUser,
    thread,
    agent: ensuredAgent,
    modelProfile,
    existingMemories,
    existingMessages
  } = args.context;

  return {
    admin,
    smokeUser,
    thread,
    ensuredAgent,
    modelProfile,
    existingMemories,
    existingMessages
  };
}
