import { createAdminSupabaseClient, getArgValue } from "./telegram-utils";

type ResolvedBindingTarget = {
  workspaceId: string;
  userId: string;
  agentId: string;
  threadId: string | null;
};

async function resolveBindingTarget(): Promise<ResolvedBindingTarget> {
  const threadId = getArgValue("--thread-id") ?? null;
  const workspaceId = getArgValue("--workspace-id");
  const userId = getArgValue("--user-id");
  const agentId = getArgValue("--agent-id");

  if (threadId) {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("threads")
      .select("id, workspace_id, owner_user_id, agent_id")
      .eq("id", threadId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load thread ${threadId}: ${error.message}`);
    }

    if (!data || !data.workspace_id || !data.owner_user_id || !data.agent_id) {
      throw new Error(
        `Thread ${threadId} is missing workspace_id, owner_user_id, or agent_id.`
      );
    }

    return {
      workspaceId: data.workspace_id,
      userId: data.owner_user_id,
      agentId: data.agent_id,
      threadId: data.id
    };
  }

  if (!workspaceId || !userId || !agentId) {
    throw new Error(
      "Provide either --thread-id, or all of --workspace-id --user-id --agent-id."
    );
  }

  return {
    workspaceId,
    userId,
    agentId,
    threadId: null
  };
}

async function main() {
  const channelId = getArgValue("--channel-id");
  const peerId = getArgValue("--peer-id");
  const platformUserId = getArgValue("--platform-user-id");
  const platform = getArgValue("--platform") ?? "telegram";

  if (!channelId || !peerId || !platformUserId) {
    throw new Error(
      "Missing Telegram identity. Required: --channel-id --peer-id --platform-user-id."
    );
  }

  const target = await resolveBindingTarget();
  const supabase = createAdminSupabaseClient();
  const identity = {
    platform,
    channel_id: channelId,
    peer_id: peerId,
    platform_user_id: platformUserId
  };

  const { data: existing, error: existingError } = await supabase
    .from("channel_bindings")
    .select("id")
    .match(identity)
    .eq("status", "active")
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to look up existing channel binding: ${existingError.message}`
    );
  }

  const payload = {
    ...identity,
    workspace_id: target.workspaceId,
    user_id: target.userId,
    agent_id: target.agentId,
    thread_id: target.threadId,
    status: "active",
    metadata: {
      source: "telegram_poc_script",
      managed_by: "telegram-upsert-binding"
    }
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("channel_bindings")
      .update({
        workspace_id: payload.workspace_id,
        user_id: payload.user_id,
        agent_id: payload.agent_id,
        thread_id: payload.thread_id,
        status: payload.status,
        metadata: payload.metadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update channel binding: ${error.message}`);
    }

    console.log(JSON.stringify({ mode: "updated", binding: data }, null, 2));
    return;
  }

  const { data, error } = await supabase
    .from("channel_bindings")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert channel binding: ${error.message}`);
  }

  console.log(JSON.stringify({ mode: "inserted", binding: data }, null, 2));
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown binding upsert failure.");
  process.exitCode = 1;
});
