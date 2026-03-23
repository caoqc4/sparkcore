import { createOwnedThread, loadOwnedActiveAgentByName } from "@/lib/chat/runtime-turn-context";
import { getSmokeConfig } from "@/lib/testing/smoke-config";
import {
  ensureSmokeUser,
  getSmokeAdminClient
} from "@/lib/testing/smoke-runtime-state";

export async function createSmokeThread(args: {
  agentName: string;
}) {
  const config = getSmokeConfig();

  if (!config) {
    throw new Error(
      "Smoke thread creation requires the smoke env vars and service role key."
    );
  }

  const admin = getSmokeAdminClient(config);
  const smokeUser = await ensureSmokeUser(admin, config);

  const { data: agent, error: agentError } = await loadOwnedActiveAgentByName({
    supabase: admin,
    agentName: args.agentName,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id
  });

  if (agentError || !agent) {
    throw new Error(
      agentError?.message ?? `Smoke agent "${args.agentName}" is unavailable.`
    );
  }

  const { data: thread, error: threadError } = await createOwnedThread({
    supabase: admin,
    workspaceId: smokeUser.workspaceId,
    userId: smokeUser.id,
    agentId: agent.id
  });

  if (threadError || !thread) {
    throw new Error(
      threadError?.message ?? "Failed to create the smoke test thread."
    );
  }

  return {
    threadId: thread.id
  };
}
