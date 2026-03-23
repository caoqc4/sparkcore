import type { SmokeReplyLanguage } from "@/lib/testing/smoke-assistant-builders";
import { detectSmokeExplicitLanguageOverride } from "@/lib/testing/smoke-language-hints";

export function detectSmokeReplyLanguage(content: string): SmokeReplyLanguage {
  const explicitOverride = detectSmokeExplicitLanguageOverride(content);

  if (explicitOverride !== "unknown") {
    return explicitOverride;
  }

  const hanMatches = content.match(/[\u3400-\u9fff]/g) ?? [];
  const latinMatches = content.match(/[A-Za-z]/g) ?? [];
  const cjkPunctuationMatches = content.match(/[，。！？；：“”‘’（）]/g) ?? [];
  const latinWordMatches = content.match(/\b[A-Za-z]{2,}\b/g) ?? [];

  if (
    hanMatches.length === 0 &&
    latinMatches.length === 0 &&
    cjkPunctuationMatches.length === 0
  ) {
    return "unknown";
  }

  const zhWeight = hanMatches.length + cjkPunctuationMatches.length * 0.5;
  const enWeight =
    latinMatches.length * 0.6 + latinWordMatches.length * 1.4;

  if (hanMatches.length >= 2 && zhWeight >= enWeight * 0.8) {
    return "zh-Hans";
  }

  if (latinWordMatches.length >= 2 && enWeight > zhWeight * 1.15) {
    return "en";
  }

  if (hanMatches.length > latinMatches.length) {
    return "zh-Hans";
  }

  if (latinMatches.length > hanMatches.length) {
    return "en";
  }

  return hanMatches.length > 0 ? "zh-Hans" : "en";
}
