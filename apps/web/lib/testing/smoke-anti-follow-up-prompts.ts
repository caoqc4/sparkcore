import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export function isSmokeAntiLecturingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别教育我") ||
    normalized.includes("别给我上课") ||
    normalized.includes("别跟我说教")
  );
}

export function isSmokeAntiCorrectionFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别急着纠正我") ||
    normalized.includes("别老纠正我")
  );
}

export function isSmokeAntiConclusionFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别给我下结论") ||
    normalized.includes("别这么快下结论")
  );
}

export function isSmokeAntiLabelingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别给我定性") ||
    normalized.includes("别急着给我定性")
  );
}

export function isSmokeAntiTaggingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别给我贴标签") ||
    normalized.includes("别急着给我贴标签")
  );
}

export function isSmokeAntiMischaracterizationFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别把我说成那样") ||
    normalized.includes("别把我想成那样")
  );
}

export function isSmokeAntiOverreadingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("别替我解读") || normalized.includes("别脑补我");
}

export function isSmokeAntiAnalysisFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别急着分析我") ||
    normalized.includes("别上来就分析我")
  );
}

export function isSmokeAntiProbingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别问我为什么") ||
    normalized.includes("别追着问我") ||
    normalized.includes("别盘问我")
  );
}

export function isSmokeAntiRushingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("别催我") || normalized.includes("别逼我");
}

export function isSmokeAntiSolutioningFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别急着帮我解决") ||
    normalized.includes("别上来就帮我解决")
  );
}

export function isSmokeAntiComfortingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别急着安慰我") ||
    normalized.includes("别给我打气")
  );
}

export function isSmokeAntiAdviceFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别急着给我建议") ||
    normalized.includes("别上来就给我建议")
  );
}

export function isSmokeAntiMinimizingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别跟我说这没什么") ||
    normalized.includes("别跟我说没什么大不了")
  );
}

export function isSmokeAntiNormalizingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别跟我说大家都这样") ||
    normalized.includes("别跟我说谁都会这样")
  );
}

export function isSmokeAntiComparingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别拿别人跟我比") ||
    normalized.includes("别老拿别人跟我比")
  );
}

export function isSmokeAntiRedirectionFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别转移话题") ||
    normalized.includes("别岔开话题")
  );
}

export function isSmokeAntiDefinitionFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return (
    normalized.includes("别替我定义") ||
    normalized.includes("别替我下定义")
  );
}

export function isSmokeAntiCategorizingFollowUpPrompt(content: string) {
  const normalized = normalizeSmokePrompt(content);

  return normalized.includes("别替我归类");
}
