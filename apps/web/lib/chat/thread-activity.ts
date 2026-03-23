import { summarizeThreadTitle } from "@/lib/chat/thread-title";

export function buildThreadActivityPatch(args: {
  content: string;
  shouldSummarizeTitle?: boolean;
}) {
  const threadPatch: {
    updated_at: string;
    title?: string;
  } = {
    updated_at: new Date().toISOString()
  };

  if (args.shouldSummarizeTitle) {
    threadPatch.title = summarizeThreadTitle(args.content);
  }

  return threadPatch;
}
