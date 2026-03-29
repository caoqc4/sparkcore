import type { PendingFollowUpRecord } from "@/lib/chat/runtime-contract";
import type { ChannelBinding } from "@/lib/integrations/im-adapter";
import { createAdminClient } from "@/lib/supabase/admin";

export type FollowUpBindingResolver = (
  record: PendingFollowUpRecord
) => Promise<ChannelBinding | null>;

export function createAdminFollowUpBindingResolver({
  platform
}: {
  platform?: string;
} = {}): FollowUpBindingResolver {
  return async (record) => {
    const supabase = createAdminClient();
    let query = supabase
      .from("channel_bindings")
      .select(
        "id, platform, channel_id, peer_id, platform_user_id, workspace_id, user_id, agent_id, thread_id, status, created_at, updated_at, metadata"
      )
      .eq("thread_id", record.thread_id)
      .eq("user_id", record.user_id)
      .eq("agent_id", record.agent_id)
      .eq("status", "active");

    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      throw new Error(
        `Failed to resolve active channel binding for follow-up ${record.id}: ${error.message}`
      );
    }

    return (data as ChannelBinding | null) ?? null;
  };
}
