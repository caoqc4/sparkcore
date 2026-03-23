import {
  getSmokeApproxContextPressure,
  getSmokeRecentRuntimeMessages
} from "@/lib/testing/smoke-context-pressure";

export function getSmokeTurnContinuityContext(args: {
  trimmedContent: string;
  existingMessages: Array<{
    role: "user" | "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
  }>;
  sameThreadContinuationApplicable: boolean;
}) {
  const recentRawTurnCount =
    getSmokeRecentRuntimeMessages(args.existingMessages).length + 1;
  const approxContextPressure = getSmokeApproxContextPressure(
    args.existingMessages,
    args.trimmedContent
  );
  const longChainPressureCandidate =
    args.sameThreadContinuationApplicable &&
    recentRawTurnCount >= 10 &&
    (approxContextPressure === "elevated" || approxContextPressure === "high");

  return {
    recentRawTurnCount,
    approxContextPressure,
    longChainPressureCandidate
  };
}
