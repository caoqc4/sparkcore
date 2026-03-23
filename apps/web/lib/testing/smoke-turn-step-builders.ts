import type { runSmokeAssistantTurnStep } from "@/lib/testing/smoke-turn-assistant-run";
import type { persistSmokeMemoryTurnStep } from "@/lib/testing/smoke-turn-memory-step";
import type { SmokeTurnStepContext } from "@/lib/testing/smoke-turn-step-context";
import type { persistSmokeUserTurnStep } from "@/lib/testing/smoke-turn-user-step";
import type { SmokeTurnAnalysis } from "@/lib/testing/smoke-turn-assistant-run-types";

export function buildSmokeUserTurnStepInput(args: {
  context: SmokeTurnStepContext;
  trimmedContent: string;
}) {
  return {
    supabase: args.context.admin,
    threadId: args.context.threadId,
    workspaceId: args.context.workspaceId,
    userId: args.context.userId,
    threadTitle: args.context.threadTitle,
    trimmedContent: args.trimmedContent
  };
}

export function buildSmokeMemoryTurnStepInput(args: {
  context: SmokeTurnStepContext;
  sourceMessageId: string;
  trimmedContent: string;
}) {
  return {
    supabase: args.context.admin,
    workspaceId: args.context.workspaceId,
    userId: args.context.userId,
    agentId: args.context.agentId,
    sourceMessageId: args.sourceMessageId,
    trimmedContent: args.trimmedContent
  };
}

export function buildSmokeAssistantTurnStepInput(args: {
  context: SmokeTurnStepContext;
  trimmedContent: string;
  analysis: SmokeTurnAnalysis;
  createdTypes: Parameters<typeof runSmokeAssistantTurnStep>[0]["createdTypes"];
}) {
  return {
    supabase: args.context.admin,
    threadId: args.context.threadId,
    workspaceId: args.context.workspaceId,
    userId: args.context.userId,
    agentId: args.context.agentId,
    agentName: args.context.agentName,
    personaSummary: args.context.personaSummary,
    styleGuidance: args.context.styleGuidance,
    modelProfileId: args.context.modelProfileId,
    modelProfileName: args.context.modelProfileName,
    model: args.context.model,
    trimmedContent: args.trimmedContent,
    analysis: args.analysis,
    createdTypes: args.createdTypes
  };
}
