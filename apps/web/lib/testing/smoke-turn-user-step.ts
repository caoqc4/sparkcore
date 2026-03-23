import {
  insertSmokeUserTurn,
  patchSmokeThreadAfterUserTurn
} from "@/lib/testing/smoke-turn-persistence";

export async function persistSmokeUserTurnStep(args: {
  supabase: Parameters<typeof insertSmokeUserTurn>[0]["supabase"];
  threadId: string;
  workspaceId: string;
  userId: string;
  threadTitle: string;
  trimmedContent: string;
}) {
  const ensuredUserMessage = await insertSmokeUserTurn({
    supabase: args.supabase,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    content: args.trimmedContent
  });

  await patchSmokeThreadAfterUserTurn({
    supabase: args.supabase,
    threadId: args.threadId,
    userId: args.userId,
    title: args.threadTitle,
    content: args.trimmedContent
  });

  return ensuredUserMessage;
}
