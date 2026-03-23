import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export function hasAllSmokePromptFragments(
  content: string,
  fragments: string[]
) {
  const normalized = normalizeSmokePrompt(content);
  return fragments.every((fragment) => normalized.includes(fragment));
}

export function hasAnySmokePromptFragment(
  content: string,
  fragments: string[]
) {
  const normalized = normalizeSmokePrompt(content);
  return fragments.some((fragment) => normalized.includes(fragment));
}
