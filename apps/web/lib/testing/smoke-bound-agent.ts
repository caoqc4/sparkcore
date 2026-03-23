import {
  loadOwnedActiveAgent,
  loadOwnedThread
} from "@/lib/chat/runtime-turn-context";

export async function loadSmokeBoundAgent(args: {
  supabase: Parameters<typeof loadOwnedThread>[0]["supabase"];
  threadId: string;
  workspaceId: string;
  userId: string;
}) {
  const { data: thread, error: threadError } = await loadOwnedThread({
    supabase: args.supabase,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId
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
    supabase: args.supabase,
    agentId: thread.agent_id,
    workspaceId: args.workspaceId,
    userId: args.userId
  });

  if (agentError || !agent) {
    throw new Error(
      agentError?.message ?? "The bound smoke agent is unavailable."
    );
  }

  return {
    thread,
    agent
  };
}
