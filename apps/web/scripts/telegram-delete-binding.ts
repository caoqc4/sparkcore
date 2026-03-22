import { createAdminSupabaseClient, getArgValue } from "./telegram-utils";

async function main() {
  const id = getArgValue("--id");
  const channelId = getArgValue("--channel-id");
  const peerId = getArgValue("--peer-id");
  const platformUserId = getArgValue("--platform-user-id");
  const platform = getArgValue("--platform") ?? "telegram";
  const supabase = createAdminSupabaseClient();

  if (id) {
    const { error, count } = await supabase
      .from("channel_bindings")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete channel binding ${id}: ${error.message}`);
    }

    console.log(JSON.stringify({ mode: "delete_by_id", count }, null, 2));
    return;
  }

  if (!channelId || !peerId || !platformUserId) {
    throw new Error(
      "Provide either --id, or all of --channel-id --peer-id --platform-user-id."
    );
  }

  const { error, count } = await supabase
    .from("channel_bindings")
    .delete({ count: "exact" })
    .eq("platform", platform)
    .eq("channel_id", channelId)
    .eq("peer_id", peerId)
    .eq("platform_user_id", platformUserId);

  if (error) {
    throw new Error(`Failed to delete channel binding(s): ${error.message}`);
  }

  console.log(JSON.stringify({ mode: "delete_by_identity", count }, null, 2));
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown binding deletion failure.");
  process.exitCode = 1;
});
