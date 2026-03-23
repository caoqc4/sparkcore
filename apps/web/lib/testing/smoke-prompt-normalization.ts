export function normalizeSmokePrompt(content: string) {
  return content.normalize("NFKC").trim().toLowerCase();
}

export function normalizeSmokePromptText(content: string) {
  return content.normalize("NFKC").trim();
}
