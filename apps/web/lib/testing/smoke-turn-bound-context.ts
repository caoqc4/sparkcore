import {
  loadActiveModelProfileById,
  loadOwnedActiveAgent,
  loadOwnedThread
} from "@/lib/chat/runtime-turn-context";

export async function loadSmokeBoundThreadContext(args: {
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

  const { data: modelProfile, error: modelProfileError } =
    await loadActiveModelProfileById({
      supabase: args.supabase,
      modelProfileId: agent.default_model_profile_id
    });

  if (modelProfileError || !modelProfile) {
    throw new Error(
      modelProfileError?.message ??
        "The bound smoke model profile is unavailable."
    );
  }

  return {
    thread,
    agent,
    modelProfile
  };
}
