import { loadThreadMessages as loadScopedThreadMessages } from "@/lib/chat/message-read";

export async function loadThreadMessages(args: {
  supabase: any;
  threadId: string;
  workspaceId: string;
}) {
  return loadScopedThreadMessages(args);
}
