import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export function isSmokeBriefGreetingRequest(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("请简单和我打个招呼") ||
    normalized.includes("简单和我打个招呼") ||
    normalized.includes("简短和我打个招呼") ||
    normalized.includes("greet me briefly") ||
    normalized.includes("say a quick hello")
  );
}

export function isSmokeSelfIntroGreetingRequest(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("请简单介绍一下你自己") ||
    normalized.includes("简单介绍一下你自己") ||
    normalized.includes("先简单介绍一下你自己") ||
    normalized.includes("你先介绍一下你自己") ||
    normalized.includes("你先介绍一下你自己吧") ||
    normalized.includes("你先介绍下你自己") ||
    normalized.includes("你先介绍下你自己吧") ||
    normalized.includes("先和我介绍一下你自己") ||
    normalized.includes("简单说说你自己") ||
    normalized.includes("introduce yourself briefly") ||
    normalized.includes("briefly introduce yourself") ||
    normalized.includes("introduce yourself first") ||
    normalized.includes("tell me who you are first")
  );
}
