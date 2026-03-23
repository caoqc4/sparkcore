function summarizeThreadTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 48) {
    return normalized;
  }

  return `${normalized.slice(0, 45).trimEnd()}...`;
}

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
