import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export function detectSmokeUserAddressStyleCandidate(content: string) {
  const normalized = normalizeSmokePrompt(content);

  if (
    normalized.includes("别叫我全名") ||
    normalized.includes("不要叫我全名") ||
    normalized.includes("do not call me by my full name") ||
    normalized.includes("don't call me by my full name")
  ) {
    return "no_full_name";
  }

  if (
    normalized.includes("像朋友一点") ||
    normalized.includes("像朋友那样") ||
    normalized.includes("更像朋友") ||
    normalized.includes("like a friend") ||
    normalized.includes("friendlier")
  ) {
    return "friendly";
  }

  if (
    normalized.includes("正式一点") ||
    normalized.includes("更正式一点") ||
    normalized.includes("请正式一点") ||
    normalized.includes("more formal") ||
    normalized.includes("be more formal")
  ) {
    return "formal";
  }

  if (
    normalized.includes("跟我说话轻松一点") ||
    normalized.includes("和我说话轻松一点") ||
    normalized.includes("轻松点和我说") ||
    normalized.includes("轻松点和我讲") ||
    normalized.includes("别太正式") ||
    normalized.includes("不用太正式") ||
    normalized.includes("轻松一点") ||
    normalized.includes("casual with me") ||
    normalized.includes("be more casual") ||
    normalized.includes("less formal")
  ) {
    return "casual";
  }

  return null;
}
