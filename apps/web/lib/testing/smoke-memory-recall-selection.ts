import {
  isSmokeDirectPlanningPreferenceQuestion,
  isSmokeDirectProfessionQuestion,
  isSmokeOpenEndedPlanningHelpQuestion,
  isSmokeOpenEndedSummaryQuestion
} from "@/lib/testing/smoke-answer-strategy";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

type SmokeMemoryRow = {
  memory_type: "profile" | "preference" | null;
  content: string;
  confidence: number;
};

type SmokeRecalledMemory = {
  memory_type: "profile" | "preference" | "relationship";
  content: string;
  confidence: number;
};

export function selectSmokeRecalledMemories(args: {
  trimmedContent: string;
  activeMemories: SmokeMemoryRow[];
}): SmokeRecalledMemory[] {
  const normalizedPrompt = normalizeSmokePrompt(args.trimmedContent);

  return args.activeMemories
    .filter((memory) => {
      const normalizedMemoryContent = memory.content.toLowerCase();

      return (
        (normalizedPrompt.includes("profession") &&
          normalizedMemoryContent.includes("product designer")) ||
        (isSmokeOpenEndedSummaryQuestion(args.trimmedContent) &&
          normalizedMemoryContent.includes("product designer")) ||
        (isSmokeDirectProfessionQuestion(args.trimmedContent) &&
          normalizedMemoryContent.includes("product designer")) ||
        ((normalizedPrompt.includes("weekly planning") ||
          isSmokeOpenEndedPlanningHelpQuestion(args.trimmedContent) ||
          isSmokeOpenEndedSummaryQuestion(args.trimmedContent) ||
          isSmokeDirectPlanningPreferenceQuestion(args.trimmedContent)) &&
          normalizedMemoryContent.includes("concise weekly planning"))
      );
    })
    .map((memory) => ({
      memory_type: (
        memory.memory_type === "preference" ? "preference" : "profile"
      ) as SmokeRecalledMemory["memory_type"],
      content: memory.content,
      confidence: memory.confidence
    }));
}
