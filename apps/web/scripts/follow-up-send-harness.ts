import { claimDuePendingFollowUps } from "@/lib/chat/follow-up-claim";
import { createAdminFollowUpRepository } from "@/lib/chat/follow-up-admin-repository";
import { buildProactiveSendRequestFromClaimedFollowUp } from "@/lib/chat/follow-up-proactive-send";
import {
  createFollowUpSender,
  type FollowUpSenderKind
} from "@/lib/chat/follow-up-sender-policy";
import { markFollowUpFromSendResult } from "@/lib/chat/follow-up-result-marking";
import type { ChannelBinding } from "@/lib/integrations/im-adapter";
import { createAdminSupabaseClient, getArgValue } from "./telegram-utils";

async function resolveThreadTarget(threadId: string) {
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
    threadId: data.id,
    workspaceId: data.workspace_id,
    userId: data.owner_user_id,
    agentId: data.agent_id
  };
}

async function resolveActiveBindingForThread(args: {
  threadId: string;
  platform?: string;
  allowSynthetic?: boolean;
}): Promise<ChannelBinding> {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("channel_bindings")
    .select(
      "platform, channel_id, peer_id, platform_user_id, workspace_id, user_id, agent_id, thread_id, status, created_at, updated_at, metadata"
    )
    .eq("thread_id", args.threadId)
    .eq("status", "active");

  if (args.platform) {
    query = query.eq("platform", args.platform);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load active channel binding for thread ${args.threadId}: ${error.message}`
    );
  }

  if (!data) {
    if (args.allowSynthetic) {
      const target = await resolveThreadTarget(args.threadId);
      return {
        platform: args.platform ?? "stub",
        channel_id: target.threadId,
        peer_id: target.userId,
        platform_user_id: target.userId,
        workspace_id: target.workspaceId,
        user_id: target.userId,
        agent_id: target.agentId,
        thread_id: target.threadId,
        status: "active",
        metadata: {
          source: "follow-up-send-harness",
          synthetic_binding: true
        }
      };
    }

    throw new Error(
      `No active channel binding found for thread ${args.threadId}${args.platform ? ` on ${args.platform}` : ""}.`
    );
  }

  return data as ChannelBinding;
}

async function seedPendingFollowUp(threadId: string) {
  const target = await resolveThreadTarget(threadId);
  const supabase = createAdminSupabaseClient();
  const now = new Date();
  const triggerAt = new Date(now.getTime() - 60_000).toISOString();
  const createdAt = now.toISOString();

  const row = {
    kind: "gentle_check_in",
    status: "pending",
    trigger_at: triggerAt,
    workspace_id: target.workspaceId,
    user_id: target.userId,
    agent_id: target.agentId,
    thread_id: target.threadId,
    request_payload: {
      thread_id: target.threadId,
      agent_id: target.agentId,
      user_id: target.userId,
      reply_language: "zh-Hans",
      source: "follow-up-send-harness",
      seed: true
    },
    request_reason: "Seeded pending follow-up for proactive send harness verification.",
    source_message_id: null,
    source_request_index: 0,
    metadata: {
      source: "follow-up-send-harness",
      seeded_for: "proactive_send_verification"
    },
    created_at: createdAt,
    updated_at: createdAt
  };

  const { data, error } = await supabase
    .from("pending_follow_ups")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to seed pending follow-up: ${error.message}`);
  }

  return data;
}

async function cleanupFollowUpRow(id: string) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("pending_follow_ups").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to clean up follow-up row ${id}: ${error.message}`);
  }
}

async function main() {
  const threadId = getArgValue("--thread-id");
  const platform = getArgValue("--platform") ?? "telegram";
  const senderKind = (getArgValue("--sender") ?? "stub") as FollowUpSenderKind;

  if (!threadId) {
    throw new Error("Missing required --thread-id.");
  }

  const seededRow = await seedPendingFollowUp(threadId);
  const repository = createAdminFollowUpRepository();

  try {
    const claimResult = await claimDuePendingFollowUps({
      repository,
      limit: 1,
      claimed_by: "follow-up-send-harness"
    });

    const claimedRecord = claimResult.records.find((record) => record.id === seededRow.id);
    if (!claimedRecord) {
      throw new Error("Seeded pending follow-up was not claimed.");
    }

    const binding = await resolveActiveBindingForThread({
      threadId: claimedRecord.thread_id,
      platform,
      allowSynthetic: senderKind === "stub"
    });

    const sendRequest = buildProactiveSendRequestFromClaimedFollowUp({
      record: claimedRecord,
      binding
    });

    if (!sendRequest) {
      throw new Error("Claimed follow-up could not be mapped into a proactive send request.");
    }

    const sender = createFollowUpSender(senderKind);

    const sendResult = await sender.send(sendRequest);
    const markResult = await markFollowUpFromSendResult({
      repository,
      record: claimedRecord,
      sendResult
    });

    console.log(
      JSON.stringify(
        {
          status: "processed",
          sender: senderKind,
          seeded_row_id: seededRow.id,
          claimed_record: claimedRecord,
          send_request: sendRequest,
          send_result: sendResult,
          mark_result: markResult
        },
        null,
        2
      )
    );
  } finally {
    await cleanupFollowUpRow(seededRow.id);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown proactive send harness failure.");
  process.exitCode = 1;
});
