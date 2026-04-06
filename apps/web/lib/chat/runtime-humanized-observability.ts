import type { HumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-contracts";

export function buildHumanizedDeliveryDebugMetadata(
  packet: HumanizedDeliveryPacket | null
): Record<string, unknown> | null {
  if (!packet) {
    return null;
  }

  return {
    response_objective: packet.deliveryStrategy.responseObjective,
    text_follow_up_policy: packet.deliveryStrategy.textFollowUpPolicy,
    text_follow_up_depth: packet.deliveryStrategy.textFollowUpDepth,
    should_include_second_sentence:
      packet.deliveryStrategy.shouldIncludeSecondSentence,
    text_render_mode: packet.deliveryStrategy.textRenderMode,
    text_sentence_count: packet.deliveryStrategy.textSentenceCount,
    text_second_sentence_role: packet.deliveryStrategy.textSecondSentenceRole,
    text_rhythm_variant: packet.deliveryStrategy.textRhythmVariant,
    text_lead_rewrite_mode: packet.deliveryStrategy.textLeadRewriteMode,
    directness_level: packet.deliveryStrategy.directnessLevel,
    soothing_intensity: packet.deliveryStrategy.soothingIntensity,
    emotional_recurrence_level:
      packet.deliveryStrategy.emotionalRecurrenceLevel,
    response_familiarity_mode:
      packet.deliveryStrategy.responseFamiliarityMode,
    companionship_action_mode:
      packet.deliveryStrategy.companionshipActionMode,
    advice_action_mode: packet.deliveryStrategy.adviceActionMode,
    avoid_recent_reply_shape: packet.deliveryStrategy.avoidRecentReplyShape,
    avoid_recent_opening_phrase:
      packet.deliveryStrategy.avoidRecentOpeningPhrase,
    stay_close_to_user_wording:
      packet.deliveryStrategy.stayCloseToUserWording,
    avoid_stock_soothing: packet.deliveryStrategy.avoidStockSoothing,
    text_cleanup_policy: packet.deliveryStrategy.textCleanupPolicy,
    movement_impulse_mode: packet.deliveryStrategy.movementImpulseMode,
    movement_impulse_repeated: packet.deliveryStrategy.movementImpulseRepeated,
    text_variant_index: packet.deliveryStrategy.textVariantIndex,
    caption_policy: packet.deliveryStrategy.captionPolicy,
    caption_sentence_count: packet.deliveryStrategy.captionSentenceCount,
    caption_rhythm_variant: packet.deliveryStrategy.captionRhythmVariant,
    caption_scene: packet.deliveryStrategy.captionScene,
    caption_variant_index: packet.deliveryStrategy.captionVariantIndex,
    artifact_action: packet.deliveryStrategy.artifactAction,
    image_artifact_action: packet.deliveryStrategy.imageArtifactAction,
    audio_artifact_action: packet.deliveryStrategy.audioArtifactAction,
    negative_product_feedback_detected:
      packet.patternSignals.negativeProductFeedback,
    negative_product_feedback_category:
      packet.patternSignals.negativeProductFeedbackCategory
  };
}

export function buildHumanizedDeliveryLogFields(
  packet: HumanizedDeliveryPacket | null
): Record<string, unknown> {
  return {
    humanized_temporal_mode: packet?.temporalContext.temporalMode ?? null,
    humanized_user_emotion: packet?.userState.emotion ?? null,
    humanized_user_intent: packet?.userState.intent ?? null,
    humanized_interaction_stage: packet?.userState.interactionStage ?? null,
    humanized_primary_posture: packet?.deliveryStrategy.primaryPosture ?? null,
    humanized_secondary_posture:
      packet?.deliveryStrategy.secondaryPosture ?? null,
    humanized_forbidden_posture:
      packet?.deliveryStrategy.forbiddenPosture ?? null,
    humanized_response_objective:
      packet?.deliveryStrategy.responseObjective ?? null,
    humanized_response_length:
      packet?.deliveryStrategy.responseLength ?? null,
    humanized_opening_style: packet?.deliveryStrategy.openingStyle ?? null,
    humanized_text_follow_up_policy:
      packet?.deliveryStrategy.textFollowUpPolicy ?? null,
    humanized_text_follow_up_depth:
      packet?.deliveryStrategy.textFollowUpDepth ?? null,
    humanized_should_include_second_sentence:
      packet?.deliveryStrategy.shouldIncludeSecondSentence ?? false,
    humanized_text_render_mode:
      packet?.deliveryStrategy.textRenderMode ?? null,
    humanized_text_sentence_count:
      packet?.deliveryStrategy.textSentenceCount ?? null,
    humanized_text_second_sentence_role:
      packet?.deliveryStrategy.textSecondSentenceRole ?? null,
    humanized_text_rhythm_variant:
      packet?.deliveryStrategy.textRhythmVariant ?? null,
    humanized_text_lead_rewrite_mode:
      packet?.deliveryStrategy.textLeadRewriteMode ?? null,
    humanized_directness_level:
      packet?.deliveryStrategy.directnessLevel ?? null,
    humanized_soothing_intensity:
      packet?.deliveryStrategy.soothingIntensity ?? null,
    humanized_emotional_recurrence_level:
      packet?.deliveryStrategy.emotionalRecurrenceLevel ?? null,
    humanized_response_familiarity_mode:
      packet?.deliveryStrategy.responseFamiliarityMode ?? null,
    humanized_companionship_action_mode:
      packet?.deliveryStrategy.companionshipActionMode ?? null,
    humanized_advice_action_mode:
      packet?.deliveryStrategy.adviceActionMode ?? null,
    humanized_avoid_recent_reply_shape:
      packet?.deliveryStrategy.avoidRecentReplyShape ?? false,
    humanized_avoid_recent_opening_phrase:
      packet?.deliveryStrategy.avoidRecentOpeningPhrase ?? false,
    humanized_stay_close_to_user_wording:
      packet?.deliveryStrategy.stayCloseToUserWording ?? false,
    humanized_avoid_stock_soothing:
      packet?.deliveryStrategy.avoidStockSoothing ?? false,
    humanized_text_cleanup_policy:
      packet?.deliveryStrategy.textCleanupPolicy ?? null,
    humanized_movement_impulse_mode:
      packet?.deliveryStrategy.movementImpulseMode ?? null,
    humanized_movement_impulse_repeated:
      packet?.deliveryStrategy.movementImpulseRepeated ?? false,
    humanized_text_variant_index:
      packet?.deliveryStrategy.textVariantIndex ?? null,
    humanized_caption_policy:
      packet?.deliveryStrategy.captionPolicy ?? null,
    humanized_caption_sentence_count:
      packet?.deliveryStrategy.captionSentenceCount ?? null,
    humanized_caption_rhythm_variant:
      packet?.deliveryStrategy.captionRhythmVariant ?? null,
    humanized_caption_scene: packet?.deliveryStrategy.captionScene ?? null,
    humanized_caption_variant_index:
      packet?.deliveryStrategy.captionVariantIndex ?? null,
    humanized_artifact_action:
      packet?.deliveryStrategy.artifactAction ?? null,
    humanized_image_artifact_action:
      packet?.deliveryStrategy.imageArtifactAction ?? null,
    humanized_audio_artifact_action:
      packet?.deliveryStrategy.audioArtifactAction ?? null,
    humanized_intent_confidence:
      packet?.deliveryStrategy.confidence.intent ?? null,
    humanized_emotion_confidence:
      packet?.deliveryStrategy.confidence.emotion ?? null,
    humanized_today_turn_count:
      packet?.sessionActivityContext.todayTurnCount ?? null,
    humanized_recent_hour_turn_count:
      packet?.sessionActivityContext.recentHourTurnCount ?? null,
    humanized_thread_depth: packet?.threadFreshness.threadDepth ?? null,
    humanized_topic_state: packet?.dialogState.topicState ?? null,
    humanized_relationship_state:
      packet?.dialogState.relationshipState ?? null,
    humanized_recurrent_theme:
      packet?.patternSignals.recurrentTheme ?? null,
    humanized_repeated_emotion:
      packet?.patternSignals.repeatedEmotion ?? null,
    humanized_input_conflict:
      packet?.patternSignals.inputConflict ?? false,
    humanized_conflict_hint: packet?.patternSignals.conflictHint ?? null,
    humanized_negative_product_feedback:
      packet?.patternSignals.negativeProductFeedback ?? false,
    humanized_negative_product_feedback_category:
      packet?.patternSignals.negativeProductFeedbackCategory ?? null
  };
}
