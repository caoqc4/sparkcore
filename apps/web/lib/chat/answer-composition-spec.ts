import type {
  AnswerCompositionSpec,
  AnswerInstructionCompositionSpec
} from "@/lib/chat/runtime-composition-contracts";

export type {
  AnswerCompositionRuntimeSurface,
  AnswerCompositionTemporalContext,
  AnswerCompositionTemporalHints,
  AnswerCompositionSpec,
  AnswerStrategyRelationshipRecallSpec,
  AnswerInstructionCompositionSpec
} from "@/lib/chat/runtime-composition-contracts";

export function buildAnswerCompositionSpec(
  args: AnswerCompositionSpec
): AnswerCompositionSpec {
  return args;
}

export function buildAnswerInstructionCompositionSpec(
  args: AnswerInstructionCompositionSpec
): AnswerInstructionCompositionSpec {
  return args;
}
