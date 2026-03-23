import type { SmokeApproxContextPressure } from "@/lib/testing/smoke-assistant-builders";
import type {
  SmokeAnswerStrategyRule,
  SmokeContinuityReply,
  SmokeMemoryRow,
} from "@/lib/testing/smoke-turn-analysis-types";
import type { getSmokeTurnMemoryContext } from "@/lib/testing/smoke-turn-memory-context";
import type { getSmokeTurnStrategyContext } from "@/lib/testing/smoke-turn-strategy-context";

export type SmokeTurnAnalysisResult = {
  activeMemories: SmokeMemoryRow[];
  addressStyleMemory: ReturnType<
    typeof getSmokeTurnStrategyContext
  >["addressStyleMemory"];
  answerStrategyRule: SmokeAnswerStrategyRule;
  approxContextPressure: SmokeApproxContextPressure;
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
  longChainPressureCandidate: boolean;
  nicknameMemory: ReturnType<typeof getSmokeTurnStrategyContext>["nicknameMemory"];
  preferredNameMemory: ReturnType<
    typeof getSmokeTurnStrategyContext
  >["preferredNameMemory"];
  preferSameThreadContinuation: boolean;
  recentAssistantReply: SmokeContinuityReply | null;
  recentRawTurnCount: number;
  recalledMemories: ReturnType<typeof getSmokeTurnMemoryContext>["recalledMemories"];
  sameThreadContinuationApplicable: boolean;
  usedMemoryTypes: string[];
};
