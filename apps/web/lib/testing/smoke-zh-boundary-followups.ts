import {
  isSmokeAntiAnalysisFollowUpPrompt,
  isSmokeAntiCategorizingFollowUpPrompt,
  isSmokeAntiConclusionFollowUpPrompt,
  isSmokeAntiCorrectionFollowUpPrompt,
  isSmokeAntiDefinitionFollowUpPrompt,
  isSmokeAntiLabelingFollowUpPrompt,
  isSmokeAntiLecturingFollowUpPrompt,
  isSmokeAntiMischaracterizationFollowUpPrompt,
  isSmokeAntiOverreadingFollowUpPrompt,
  isSmokeAntiTaggingFollowUpPrompt,
  isSmokeNonJudgingFollowUpPrompt
} from "@/lib/testing/smoke-answer-strategy";
import { buildSmokeZhBoundaryInterpretationReply } from "@/lib/testing/smoke-zh-boundary-interpretation-replies";
import { buildSmokeZhBoundaryJudgmentReply } from "@/lib/testing/smoke-zh-boundary-judgment-replies";
import { buildSmokeZhBoundarySupportReply } from "@/lib/testing/smoke-zh-boundary-support-replies";

export function buildSmokeZhBoundaryFollowUpReply(args: {
  content: string;
  normalized: string;
  userName: string | null;
}) {
  return (
    buildSmokeZhBoundaryJudgmentReply(args) ??
    buildSmokeZhBoundaryInterpretationReply(args) ??
    buildSmokeZhBoundarySupportReply(args)
  );
}
