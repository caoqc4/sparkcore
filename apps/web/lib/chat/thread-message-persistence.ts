export async function loadThreadMessages(args: {
  supabase: any;
  threadId: string;
  workspaceId: string;
}) {
  return args.supabase
    .from("messages")
    .select("id, role, content, status, metadata, created_at")
    .eq("thread_id", args.threadId)
    .eq("workspace_id", args.workspaceId)
    .order("created_at", { ascending: true });
}
