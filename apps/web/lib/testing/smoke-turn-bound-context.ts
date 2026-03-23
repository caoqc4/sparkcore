import { loadOwnedThread } from "@/lib/chat/runtime-turn-context";
import { loadSmokeBoundAgent } from "@/lib/testing/smoke-bound-agent";
import { loadSmokeBoundModelProfile } from "@/lib/testing/smoke-bound-model-profile";

export async function loadSmokeBoundThreadContext(args: {
  supabase: Parameters<typeof loadOwnedThread>[0]["supabase"];
  threadId: string;
  workspaceId: string;
  userId: string;
}) {
  const { thread, agent } = await loadSmokeBoundAgent({
    supabase: args.supabase,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId
  });
  const modelProfile = await loadSmokeBoundModelProfile({
    supabase: args.supabase,
    modelProfileId: agent.default_model_profile_id
  });

  return {
    thread,
    agent,
    modelProfile
  };
}
