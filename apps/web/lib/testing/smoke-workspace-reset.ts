import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteOwnedMemoryItems } from "@/lib/chat/memory-item-persistence";
import { deleteOwnedAgents, deleteOwnedThreads } from "@/lib/chat/runtime-turn-context";

export async function resetSmokeWorkspaceStateByUser(args: {
  admin: SupabaseClient;
  userId: string;
}) {
  const { error: deleteThreadsError } = await deleteOwnedThreads({
    supabase: args.admin,
    userId: args.userId
  });

  if (deleteThreadsError) {
    throw new Error(
      `Failed to clear smoke threads: ${deleteThreadsError.message}`
    );
  }

  const { error: deleteMemoryError } = await deleteOwnedMemoryItems({
    supabase: args.admin,
    userId: args.userId
  });

  if (deleteMemoryError) {
    throw new Error(
      `Failed to clear smoke memory: ${deleteMemoryError.message}`
    );
  }

  const { error: deleteAgentsError } = await deleteOwnedAgents({
    supabase: args.admin,
    userId: args.userId
  });

  if (deleteAgentsError) {
    throw new Error(
      `Failed to clear smoke agents: ${deleteAgentsError.message}`
    );
  }
}
