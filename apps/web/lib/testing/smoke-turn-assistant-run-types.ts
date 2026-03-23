import type { prepareSmokeTurnExecutionState } from "@/lib/testing/smoke-turn-execution-state";
import type { persistPreparedSmokeAssistantTurn } from "@/lib/testing/smoke-turn-assistant-persistence";

export type SmokeTurnAnalysis = ReturnType<
  typeof prepareSmokeTurnExecutionState
>["analysis"];

export type SmokeAssistantTurnRunInput = {
  supabase: Parameters<typeof persistPreparedSmokeAssistantTurn>[0]["supabase"];
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  agentName: string;
  personaSummary: string | null;
  styleGuidance: string | null;
  modelProfileId: string;
  modelProfileName: string;
  model: string;
  trimmedContent: string;
  analysis: SmokeTurnAnalysis;
  createdTypes: Parameters<typeof persistPreparedSmokeAssistantTurn>[0]["createdTypes"];
};
