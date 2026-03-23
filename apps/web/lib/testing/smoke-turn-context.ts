import { getSmokeAdminClient } from "@/lib/testing/smoke-admin-client";
import { loadSmokeBoundAgent } from "@/lib/testing/smoke-bound-agent";
import { loadSmokeBoundModelProfile } from "@/lib/testing/smoke-bound-model-profile";
import { requireSmokeConfig } from "@/lib/testing/smoke-config";
import { loadSmokeTurnExistingState } from "@/lib/testing/smoke-turn-existing-state";
import { ensureSmokeUser } from "@/lib/testing/smoke-runtime-state";

export async function loadSmokeTurnContext(args: {
  threadId: string;
}) {
  const config = requireSmokeConfig(
    "Smoke message creation requires the smoke env vars and service role key."
  );

  const admin = getSmokeAdminClient(config);
  const smokeUser = await ensureSmokeUser(admin, config);
  const { thread, agent } = await loadSmokeBoundAgent({
    supabase: admin,
    threadId: args.threadId,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id
  });
  const modelProfile = await loadSmokeBoundModelProfile({
    supabase: admin,
    modelProfileId: agent.default_model_profile_id
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
