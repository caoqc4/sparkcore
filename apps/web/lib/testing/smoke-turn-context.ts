import { loadThreadMessages } from "@/lib/chat/message-read";
import { loadRecentOwnedMemories } from "@/lib/chat/memory-item-read";
import {
  loadActiveModelProfileById,
  loadOwnedActiveAgent,
  loadOwnedThread
} from "@/lib/chat/runtime-turn-context";
import { getSmokeConfig } from "@/lib/testing/smoke-config";
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

  const { data: existingMemories, error: memoriesError } =
    await loadRecentOwnedMemories({
      supabase: admin,
      workspaceId: smokeUser.workspaceId,
      userId: smokeUser.id,
      select:
        "id, memory_type, content, confidence, category, key, value, scope, status, target_agent_id, target_thread_id, metadata",
      limit: 200
    });

  if (memoriesError) {
    throw new Error(`Failed to load smoke memories: ${memoriesError.message}`);
  }

  const { data: existingMessages, error: messagesError } = await loadThreadMessages({
    supabase: admin,
    threadId: thread.id,
    workspaceId: smokeUser.workspaceId,
    select: "role, content, status, metadata"
  });

  if (messagesError) {
    throw new Error(`Failed to load smoke messages: ${messagesError.message}`);
  }

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
