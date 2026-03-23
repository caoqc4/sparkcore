import { isMemoryScopeValid } from "@/lib/chat/memory-v2";
import type { SmokeMemoryApplicabilityInput } from "@/lib/testing/smoke-memory-analysis-types";

export function isSmokeMemoryApplicableToThread({
  memory,
  agentId,
  threadId
}: SmokeMemoryApplicabilityInput) {
  if (!isMemoryScopeValid(memory)) {
    return false;
  }

  if (memory.scope === "user_agent") {
    return memory.target_agent_id === agentId;
  }

  if (memory.scope === "thread_local") {
    return memory.target_thread_id === threadId;
  }

  return true;
}
