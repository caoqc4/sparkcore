import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

const ENGLISH_HINTS = [
  "reply in english",
  "respond in english",
  "answer in english",
  "please use english",
  "请用英文",
  "请用英语",
  "用英文回答",
  "用英语回答"
];

const CHINESE_HINTS = [
  "reply in chinese",
  "respond in chinese",
  "answer in chinese",
  "continue in chinese",
  "keep replying in chinese",
  "please use chinese",
  "请用中文",
  "用中文回答",
  "请用简体中文",
  "用简体中文回答"
];

export function detectSmokeExplicitLanguageOverride(
  content: string
): SmokeReplyLanguage {
  const normalized = normalizeSmokePrompt(content);

  if (ENGLISH_HINTS.some((hint) => normalized.includes(hint))) {
    return "en";
  }

  if (CHINESE_HINTS.some((hint) => normalized.includes(hint))) {
    return "zh-Hans";
  }

  return "unknown";
}
