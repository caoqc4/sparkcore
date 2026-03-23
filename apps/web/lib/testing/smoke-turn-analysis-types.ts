import type { SmokeMemoryRow } from "@/lib/testing/smoke-memory-analysis";
import type { SmokeContinuityReply } from "@/lib/testing/smoke-reply-analysis";

export type SmokeRuntimeMessage = {
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
};

export type { SmokeContinuityReply, SmokeMemoryRow };
