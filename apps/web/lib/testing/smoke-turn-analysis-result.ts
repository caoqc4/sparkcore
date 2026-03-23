import type { SmokeApproxContextPressure } from "@/lib/testing/smoke-assistant-builders";
import type {
  SmokeAnswerStrategyRule,
  SmokeContinuityReply,
  SmokeMemoryRow,
} from "@/lib/testing/smoke-turn-analysis-types";
import type { SmokeTurnMemoryContext } from "@/lib/testing/smoke-turn-memory-context";
import type { SmokeTurnStrategyContext } from "@/lib/testing/smoke-turn-strategy-context";

export type SmokeTurnAnalysisResult = {
  activeMemories: SmokeMemoryRow[];
  addressStyleMemory: SmokeTurnStrategyContext["addressStyleMemory"];
  answerStrategyRule: SmokeAnswerStrategyRule;
  approxContextPressure: SmokeApproxContextPressure;
  hiddenExclusionCount: number;
  incorrectExclusionCount: number;
  longChainPressureCandidate: boolean;
  nicknameMemory: SmokeTurnStrategyContext["nicknameMemory"];
  preferredNameMemory: SmokeTurnStrategyContext["preferredNameMemory"];
  preferSameThreadContinuation: boolean;
  recentAssistantReply: SmokeContinuityReply | null;
  recentRawTurnCount: number;
  recalledMemories: SmokeTurnMemoryContext["recalledMemories"];
  sameThreadContinuationApplicable: boolean;
  usedMemoryTypes: string[];
};
