import type { runSmokeAssistantTurnStep } from "@/lib/testing/smoke-turn-assistant-run";
import type { persistSmokeMemoryTurnStep } from "@/lib/testing/smoke-turn-memory-step";
import type { persistSmokeUserTurnStep } from "@/lib/testing/smoke-turn-user-step";
import type { SmokeTurnAnalysis } from "@/lib/testing/smoke-turn-assistant-run-types";

export function buildSmokeUserTurnStepInput(args: {
  admin: Parameters<typeof persistSmokeUserTurnStep>[0]["supabase"];
  threadId: string;
  workspaceId: string;
  userId: string;
  threadTitle: Parameters<typeof persistSmokeUserTurnStep>[0]["threadTitle"];
  trimmedContent: string;
}) {
  return {
    supabase: args.admin,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    threadTitle: args.threadTitle,
    trimmedContent: args.trimmedContent
  };
}

export function buildSmokeMemoryTurnStepInput(args: {
  admin: Parameters<typeof persistSmokeMemoryTurnStep>[0]["supabase"];
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  trimmedContent: string;
}) {
  return {
    supabase: args.admin,
    workspaceId: args.workspaceId,
    userId: args.userId,
    agentId: args.agentId,
    sourceMessageId: args.sourceMessageId,
    trimmedContent: args.trimmedContent
  };
}

export function buildSmokeAssistantTurnStepInput(args: {
  admin: Parameters<typeof runSmokeAssistantTurnStep>[0]["supabase"];
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
  createdTypes: Parameters<typeof runSmokeAssistantTurnStep>[0]["createdTypes"];
}) {
  return {
    supabase: args.admin,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    agentId: args.agentId,
    agentName: args.agentName,
    personaSummary: args.personaSummary,
    styleGuidance: args.styleGuidance,
    modelProfileId: args.modelProfileId,
    modelProfileName: args.modelProfileName,
    model: args.model,
    trimmedContent: args.trimmedContent,
    analysis: args.analysis,
    createdTypes: args.createdTypes
  };
}
