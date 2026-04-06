import {
  maybeRewriteGovernedAssistantText,
  resolveCompanionTextCleanupZh
} from "@/lib/chat/output-governance";
import type { BuildRuntimePostGenerationFinalAssistantContentArgs } from "@/lib/chat/runtime-post-generation-contracts";

export function buildRuntimePostGenerationFinalAssistantContent(
  args: BuildRuntimePostGenerationFinalAssistantContentArgs
): string {
  const generationHint =
    typeof args.preparedRuntimeTurn.input.message.metadata?.assistant_generation_hint ===
    "string"
      ? args.preparedRuntimeTurn.input.message.metadata.assistant_generation_hint
      : null;

  const resolvedTextCleanup =
    args.humanizedDeliveryPacket?.deliveryStrategy.textCleanupPolicy != null
      ? resolveCompanionTextCleanupZh({
          content: args.result.content,
          policy: args.humanizedDeliveryPacket.deliveryStrategy.textCleanupPolicy
        })
      : null;

  return maybeRewriteGovernedAssistantText({
    content: args.result.content,
    governance: args.preparedRuntimeTurn.governance ?? null,
    replyLanguage: args.replyLanguage,
    userMessage: args.latestUserMessageContent ?? "",
    generationHint,
    userIntent: args.humanizedDeliveryPacket?.userState.intent ?? null,
    textRenderMode:
      args.humanizedDeliveryPacket?.deliveryStrategy.textRenderMode ?? null,
    textSentenceCount:
      args.humanizedDeliveryPacket?.deliveryStrategy.textSentenceCount ?? 1,
    textSecondSentenceRole:
      args.humanizedDeliveryPacket?.deliveryStrategy.textSecondSentenceRole ??
      null,
    textRhythmVariant:
      args.humanizedDeliveryPacket?.deliveryStrategy.textRhythmVariant ?? null,
    textLeadRewriteMode:
      args.humanizedDeliveryPacket?.deliveryStrategy.textLeadRewriteMode ?? null,
    resolvedTextCleanup,
    movementImpulseMode:
      args.humanizedDeliveryPacket?.deliveryStrategy.movementImpulseMode ?? null,
    movementImpulseRepeated:
      args.humanizedDeliveryPacket?.deliveryStrategy.movementImpulseRepeated ??
      false,
    textVariantIndex:
      args.humanizedDeliveryPacket?.deliveryStrategy.textVariantIndex ?? 0,
    captionPolicy:
      args.humanizedDeliveryPacket?.deliveryStrategy.captionPolicy ?? null,
    captionSentenceCount:
      args.humanizedDeliveryPacket?.deliveryStrategy.captionSentenceCount ?? 1,
    captionRhythmVariant:
      args.humanizedDeliveryPacket?.deliveryStrategy.captionRhythmVariant ?? null,
    captionScene:
      args.humanizedDeliveryPacket?.deliveryStrategy.captionScene ?? null,
    captionVariantIndex:
      args.humanizedDeliveryPacket?.deliveryStrategy.captionVariantIndex ?? 0,
    currentPartOfDay: args.runtimeTemporalContext.partOfDay,
    inputConflict:
      args.humanizedDeliveryPacket?.patternSignals.inputConflict ?? false,
    conflictHint: args.humanizedDeliveryPacket?.patternSignals.conflictHint ?? null
  });
}
