import { loadSmokeBoundThreadContext } from "@/lib/testing/smoke-turn-bound-context";
import { getSmokeConfig } from "@/lib/testing/smoke-config";
import { loadSmokeTurnExistingState } from "@/lib/testing/smoke-turn-existing-state";
import {
  ensureSmokeUser,
  getSmokeAdminClient
} from "@/lib/testing/smoke-runtime-state";

export async function loadSmokeTurnContext(args: {
  threadId: string;
}) {
  const config = getSmokeConfig();

  if (!config) {
    throw new Error(
      "Smoke message creation requires the smoke env vars and service role key."
    );
  }

  const admin = getSmokeAdminClient(config);
  const smokeUser = await ensureSmokeUser(admin, config);
  const { thread, agent, modelProfile } = await loadSmokeBoundThreadContext({
    supabase: admin,
    threadId: args.threadId,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id
  });
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
