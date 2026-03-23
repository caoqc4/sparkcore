import {
  isSmokeAntiCorrectionFollowUpPrompt,
  isSmokeAntiConclusionFollowUpPrompt,
  isSmokeAntiLecturingFollowUpPrompt,
  isSmokeNonJudgingFollowUpPrompt,
} from "@/lib/testing/smoke-answer-strategy";
import { withSmokeZhBoundaryUserPrefix } from "@/lib/testing/smoke-zh-boundary-reply-prefix";
import type { SmokeZhBoundaryReplyInput } from "@/lib/testing/smoke-zh-boundary-reply-types";

export function buildSmokeZhBoundaryJudgmentReply(
  args: SmokeZhBoundaryReplyInput
) {
  if (isSmokeNonJudgingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别数落我")) {
      return withSmokeZhBoundaryUserPrefix(
        args.userName,
        "好，我先不数落你，就在这儿陪着你。"
      );
    }

    return withSmokeZhBoundaryUserPrefix(
      args.userName,
      "好，我先不评判你，就在这儿陪着你。"
    );
  }

  if (isSmokeAntiLecturingFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别给我上课")) {
      return withSmokeZhBoundaryUserPrefix(
        args.userName,
        "好，我先不给你上课，就在这儿陪着你。"
      );
    }

    if (args.normalized.includes("别跟我说教")) {
      return withSmokeZhBoundaryUserPrefix(
        args.userName,
        "好，我先不跟你说教，就在这儿陪着你。"
      );
    }

    return withSmokeZhBoundaryUserPrefix(
      args.userName,
      "好，我先不教育你，就在这儿陪着你。"
    );
  }

  if (isSmokeAntiCorrectionFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别老纠正我")) {
      return withSmokeZhBoundaryUserPrefix(
        args.userName,
        "好，我先不老纠正你，就在这儿陪着你。"
      );
    }

    return withSmokeZhBoundaryUserPrefix(
      args.userName,
      "好，我先不急着纠正你，就在这儿陪着你。"
    );
  }

  if (isSmokeAntiConclusionFollowUpPrompt(args.content)) {
    if (args.normalized.includes("别这么快下结论")) {
      return withSmokeZhBoundaryUserPrefix(
        args.userName,
        "好，我先不这么快给你下结论，就在这儿陪着你。"
      );
    }

    return withSmokeZhBoundaryUserPrefix(
      args.userName,
      "好，我先不急着给你下结论，就在这儿陪着你。"
    );
  }

  return null;
}
