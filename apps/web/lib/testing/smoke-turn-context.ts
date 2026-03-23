import { getSmokeAdminClient } from "@/lib/testing/smoke-admin-client";
import {
  loadActiveModelProfileById,
  loadOwnedActiveAgent,
  loadOwnedThread
} from "@/lib/chat/runtime-turn-context";
import { requireSmokeConfig } from "@/lib/testing/smoke-config";
import { loadSmokeTurnExistingState } from "@/lib/testing/smoke-turn-existing-state";
import { ensureSmokeUserState } from "@/lib/testing/smoke-user-state";

export async function loadSmokeTurnContext(args: {
  threadId: string;
}) {
  const config = requireSmokeConfig(
    "Smoke message creation requires the smoke env vars and service role key."
  );

  const admin = getSmokeAdminClient(config);
  const smokeUser = await ensureSmokeUserState(admin, config);
  const { data: thread, error: threadError } = await loadOwnedThread({
    supabase: admin,
    threadId: args.threadId,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id
  });

  if (threadError || !thread) {
    throw new Error(
      threadError?.message ?? "The requested smoke thread is unavailable."
    );
  }

  if (!thread.agent_id) {
    throw new Error("The smoke thread is not bound to an agent.");
  }

  const { data: agent, error: agentError } = await loadOwnedActiveAgent({
    supabase: admin,
    agentId: thread.agent_id,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id
  });

  if (agentError || !agent) {
    throw new Error(
      agentError?.message ?? "The bound smoke agent is unavailable."
    );
  }

  const { data: modelProfile, error: modelProfileError } =
    await loadActiveModelProfileById({
      supabase: admin,
      modelProfileId: agent.default_model_profile_id
    });

  if (modelProfileError || !modelProfile) {
    throw new Error(
      modelProfileError?.message ??
        "The bound smoke model profile is unavailable."
    );
  }

  const { existingMemories, existingMessages } =
    await loadSmokeTurnExistingState({
      supabase: admin,
      threadId: thread.id,
      workspaceId: smokeUser.workspaceId,
      userId: smokeUser.id
    });

  return {
    admin,
    smokeUser,
    thread,
    agent,
    modelProfile,
    existingMemories,
    existingMessages
  };
}

export type SmokeTurnContext = Awaited<ReturnType<typeof loadSmokeTurnContext>>;
