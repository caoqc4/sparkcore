import type { SmokeTurnExecutionInput } from "@/lib/testing/smoke-turn-execution-types";

export function getSmokeTurnStepContext(args: SmokeTurnExecutionInput) {
  const {
    admin,
    smokeUser,
    thread,
    agent,
    modelProfile
  } = args.context;

  return {
    admin,
    threadId: thread.id,
    threadTitle: thread.title,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    agentId: agent.id,
    agentName: agent.name,
    personaSummary: agent.persona_summary ?? null,
    styleGuidance: agent.style_prompt ?? null,
    modelProfileId: modelProfile.id,
    modelProfileName: modelProfile.name,
    model: modelProfile.model
  };
}

export type SmokeTurnStepContext = ReturnType<typeof getSmokeTurnStepContext>;
