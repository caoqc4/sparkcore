import { normalizeSmokePromptText } from "@/lib/testing/smoke-prompt-normalization";

export function detectSmokeNicknameCandidate(content: string) {
  const normalized = normalizeSmokePromptText(content);
  const match = normalized.match(
    /以后(?:我)?叫你([^\s，。！？,.!?：:;；"'“”‘’()（）]{1,16})可以吗/u
  );

  return match?.[1]?.trim() ?? null;
}

export function detectSmokeUserPreferredNameCandidate(content: string) {
  const normalized = normalizeSmokePromptText(content);
  const patterns = [
    /以后你(?:可以)?叫我([^\s，。！？,.!?：:;；"'“”‘’()（）]{1,16})可以吗/u,
    /你以后(?:可以)?叫我([^\s，。！？,.!?：:;；"'“”‘’()（）]{1,16})/u,
    /你可以叫我([^\s，。！？,.!?：:;；"'“”‘’()（）]{1,16})/u,
    /please call me ([a-z0-9][a-z0-9 _-]{0,30})/i,
    /you can call me ([a-z0-9][a-z0-9 _-]{0,30})/i,
    /address me as ([a-z0-9][a-z0-9 _-]{0,30})/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const candidate = match?.[1]?.trim();

    if (candidate) {
      return candidate;
    }
  }

  return null;
}
