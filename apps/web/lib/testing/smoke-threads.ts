import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  createOwnedThread,
  loadOwnedActiveAgentByName,
  loadOwnedThread
} from "@/lib/chat/runtime-turn-context";
import { requireSmokeConfig } from "@/lib/testing/smoke-config";
import { ensureSmokeUserState } from "@/lib/testing/smoke-user-state";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createSmokeThread(args: {
  agentName: string;
}) {
  const config = requireSmokeConfig(
    "Smoke thread creation requires the smoke env vars and service role key."
  );

  const admin = createSupabaseClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  const smokeUser = await ensureSmokeUserState(admin, config);

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

  // Supabase reads can briefly lag right after the insert during CI.
  // Confirm the thread is queryable before returning it to the smoke test flow.
  let threadReadable = false;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: readableThread, error: readableThreadError } =
      await loadOwnedThread({
        supabase: admin,
        threadId: thread.id,
        workspaceId: smokeUser.workspaceId,
        userId: smokeUser.id
      });

    if (readableThreadError) {
      throw new Error(
        `Failed to confirm the smoke test thread: ${readableThreadError.message}`
      );
    }

    if (readableThread) {
      threadReadable = true;
      break;
    }

    await sleep(250 * (attempt + 1));
  }

  if (!threadReadable) {
    throw new Error("The created smoke test thread was not readable yet.");
  }

  return {
    threadId: thread.id
  };
}
