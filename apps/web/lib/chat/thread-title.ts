export function summarizeThreadTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 48) {
    return normalized;
  }

  return `${normalized.slice(0, 45).trimEnd()}...`;
}
