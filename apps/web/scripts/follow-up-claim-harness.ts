import { createAdminFollowUpRepository } from "@/lib/chat/follow-up-admin-repository";
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
      source: "follow-up-claim-harness",
      seed: true
    },
    request_reason: "Seeded pending follow-up for claim harness verification.",
    source_message_id: null,
    source_request_index: 0,
    metadata: {
      source: "follow-up-claim-harness",
      seeded_for: "claim_verification"
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

async function cleanupClaimedRows(ids: string[]) {
  if (ids.length === 0) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("pending_follow_ups").delete().in("id", ids);

  if (error) {
    throw new Error(`Failed to clean up claimed follow-ups: ${error.message}`);
  }
}

async function main() {
  const threadId = getArgValue("--thread-id");
  const limit = Number.parseInt(getArgValue("--limit") ?? "10", 10);
  const claimedBy = getArgValue("--claimed-by") ?? "follow-up-claim-harness";

  if (!threadId) {
    throw new Error("Missing required --thread-id.");
  }

  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error("Expected --limit to be a positive integer.");
  }

  const seededRow = await seedPendingFollowUp(threadId);
  const repository = createAdminFollowUpRepository();
  const claimResult = await repository.claimDuePendingFollowUps({
    now: new Date().toISOString(),
    limit,
    claimed_by: claimedBy
  });

  const seededClaimed = claimResult.records.find((record) => record.id === seededRow.id);
  if (!seededClaimed) {
    throw new Error("Seeded pending follow-up was not claimed.");
  }

  await cleanupClaimedRows([seededRow.id]);

  console.log(
    JSON.stringify(
      {
        status: "claimed",
        seeded_row_id: seededRow.id,
        claimed_count: claimResult.claimed_count,
        claimed_record: seededClaimed
      },
      null,
      2
    )
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown follow-up claim failure.");
  process.exitCode = 1;
});
