import type {
  HumanizedArtifactAction,
  BuildHumanizedDeliveryStrategyArgs,
  HumanizedCaptionScene,
  HumanizedCaptionPolicy,
  HumanizedDeliveryPacket,
  HumanizedDirectnessLevel,
  HumanizedAdviceActionMode,
  HumanizedCompanionshipActionMode,
  HumanizedDeliveryStrategy,
  HumanizedEmotionalRecurrenceLevel,
  HumanizedInteractionStage,
  HumanizedMovementImpulseMode,
  HumanizedOpeningStyle,
  HumanizedPrimaryPosture,
  HumanizedProductFeedbackCategory,
  HumanizedResponseLength,
  HumanizedResponseFamiliarityMode,
  HumanizedResponseObjective,
  HumanizedRhythmVariant,
  HumanizedSecondSentenceRole,
  HumanizedTemporalMode,
  HumanizedSoothingIntensity,
  HumanizedTextCleanupPolicy,
  HumanizedTextFollowUpDepth,
  HumanizedTextFollowUpPolicy,
  HumanizedTextLeadRewriteMode,
  HumanizedTextRenderMode,
  HumanizedToneTension,
  HumanizedUserEmotion,
  HumanizedUserIntent
} from "@/lib/chat/humanized-delivery-contracts";

export type {
  BuildHumanizedDeliveryStrategyArgs,
  HumanizedTemporalMode,
  HumanizedInteractionStage,
  HumanizedUserEmotion,
  HumanizedUserIntent,
  HumanizedPrimaryPosture,
  HumanizedResponseObjective,
  HumanizedResponseLength,
  HumanizedOpeningStyle,
  HumanizedToneTension,
  HumanizedDirectnessLevel,
  HumanizedSoothingIntensity,
  HumanizedTextFollowUpPolicy,
  HumanizedTextFollowUpDepth,
  HumanizedCaptionPolicy,
  HumanizedArtifactAction,
  HumanizedRhythmVariant,
  HumanizedTextRenderMode,
  HumanizedMovementImpulseMode,
  HumanizedSecondSentenceRole,
  HumanizedTextLeadRewriteMode,
  HumanizedTextCleanupPolicy,
  HumanizedCaptionScene,
  HumanizedProductFeedbackCategory,
  HumanizedDeliveryStrategy,
  HumanizedDeliveryPacket
} from "@/lib/chat/humanized-delivery-contracts";

export function buildHumanizedDeliveryStrategy(
  args: BuildHumanizedDeliveryStrategyArgs
): HumanizedDeliveryStrategy {
  let primaryPosture: HumanizedPrimaryPosture = "everyday_companion";
  let secondaryPosture: HumanizedPrimaryPosture | null = null;

  if (args.userEmotion === "distressed" || args.effectiveIntent === "comfort") {
    primaryPosture = "soothing_support";
    secondaryPosture = "resonant_companion";
  } else if (args.effectiveIntent === "advice" || args.effectiveIntent === "co_working") {
    primaryPosture = "side_by_side_support";
    secondaryPosture =
      args.userEmotion === "low" || args.userEmotion === "anxious"
        ? "resonant_companion"
        : "everyday_companion";
  } else if (args.effectiveIntent === "playful" || args.userEmotion === "energized") {
    primaryPosture = "active_interaction";
    secondaryPosture = "everyday_companion";
  } else if (
    args.effectiveIntent === "companionship" ||
    args.userEmotion === "low" ||
    args.userEmotion === "anxious"
  ) {
    primaryPosture = "resonant_companion";
    secondaryPosture = "everyday_companion";
  }

  const responseObjective: HumanizedResponseObjective = args.needsCalibration
    ? "calibrate"
    : args.rolePresenceQuestionType !== null
      ? "answer"
    : args.effectiveIntent === "greeting" || args.effectiveIntent === "understanding"
      ? "maintain_connection"
    : args.effectiveIntent === "sharing"
      ? "share"
    : args.effectiveIntent === "advice"
      ? "answer"
    : args.effectiveIntent === "co_working"
      ? "advance"
    : args.effectiveIntent === "companionship" || args.effectiveIntent === "comfort"
      ? "receive"
      : "maintain_connection";

  const forbiddenPosture =
    args.rolePresenceQuestionType === "role-capability" ||
    args.rolePresenceQuestionType === "role-background" ||
    args.rolePresenceQuestionType === "role-boundary"
      ? "same_thread_carryover_answer_shape"
      : args.effectiveIntent === "greeting" || args.effectiveIntent === "playful"
        ? "soothing_support"
        : args.effectiveIntent === "advice" || args.effectiveIntent === "co_working"
          ? "pure_soothing_without_problem_engagement"
          : args.userEmotion === "distressed"
            ? "overly_active_or_joking"
            : null;

  let responseLength: HumanizedResponseLength = "two_lines";
  if (
    args.rolePresenceQuestionType === "role-background" ||
    args.rolePresenceQuestionType === "role-boundary"
  ) {
    responseLength = "short_paragraph";
  } else if (
    args.rolePresenceQuestionType === "role-self-introduction" ||
    args.rolePresenceQuestionType === "role-capability"
  ) {
    responseLength = "two_lines";
  } else if (args.effectiveIntent === "greeting") {
    responseLength = "one_line";
  } else if (args.effectiveIntent === "advice" || args.effectiveIntent === "co_working") {
    responseLength =
      args.repeatedEmotion || args.repeatedSameMessage ? "two_lines" : "short_paragraph";
  } else if (primaryPosture === "soothing_support") {
    responseLength = "two_lines";
  }

  let openingStyle: HumanizedOpeningStyle = "direct_carryover";
  if (args.rolePresenceQuestionType !== null) {
    openingStyle = "direct_carryover";
  } else if (args.effectiveIntent === "greeting") {
    openingStyle = "light_greeting";
  } else if (
    primaryPosture === "soothing_support" ||
    args.userEmotion === "distressed" ||
    args.userEmotion === "anxious"
  ) {
    openingStyle = "emotion_first";
  } else if (args.effectiveIntent === "advice" && !args.repeatedEmotion) {
    openingStyle = "question_first";
  } else if (args.effectiveIntent === "co_working" && !args.repeatedEmotion) {
    openingStyle = "problem_first";
  }

  const toneTension: HumanizedToneTension =
    primaryPosture === "active_interaction"
      ? "active"
      : primaryPosture === "soothing_support"
        ? "warm"
        : primaryPosture === "side_by_side_support"
          ? "steady"
          : "loose";
  let directnessLevel: HumanizedDirectnessLevel = "plain";
  let soothingIntensity: HumanizedSoothingIntensity = "low";
  let emotionalRecurrenceLevel: HumanizedEmotionalRecurrenceLevel = "none";
  let responseFamiliarityMode: HumanizedResponseFamiliarityMode = "fresh";
  let companionshipActionMode: HumanizedCompanionshipActionMode = "brief_presence";
  let adviceActionMode: HumanizedAdviceActionMode = "direct_suggestion";
  let avoidRecentReplyShape = false;
  let avoidRecentOpeningPhrase = false;
  let stayCloseToUserWording = false;
  let avoidStockSoothing = false;

  let textFollowUpPolicy: HumanizedTextFollowUpPolicy = "none";
  let textFollowUpDepth: HumanizedTextFollowUpDepth = "none";
  let shouldIncludeSecondSentence = false;
  let textSentenceCount: 1 | 2 = 1;
  let textSecondSentenceRole: HumanizedSecondSentenceRole = "none";
  let textRhythmVariant: HumanizedRhythmVariant = "single_breath";
  let textRenderMode: HumanizedTextRenderMode = "default";
  let textLeadRewriteMode: HumanizedTextLeadRewriteMode = "none";
  let textCleanupPolicy: HumanizedTextCleanupPolicy = {
    stripResettingGreetingLead: false,
    stripTemplateFollowUpLead: false,
    stripGenericSoothingLead: false
  };
  let movementImpulseMode: HumanizedMovementImpulseMode | null = null;
  let movementImpulseRepeated = false;
  let textVariantIndex: 0 | 1 | 2 = 0;
  let captionPolicy: HumanizedCaptionPolicy = "shared_viewing";
  let captionSentenceCount: 1 | 2 | 3 = 2;
  let captionRhythmVariant: HumanizedRhythmVariant = "soft_pause";
  let artifactAction: HumanizedArtifactAction = "defer";
  let imageArtifactAction: HumanizedArtifactAction = "defer";
  let audioArtifactAction: HumanizedArtifactAction = "defer";

  if (!args.needsCalibration && args.effectiveIntent !== "greeting") {
    if (
      args.rolePresenceQuestionType === "role-capability" ||
      args.rolePresenceQuestionType === "role-background" ||
      args.rolePresenceQuestionType === "role-boundary" ||
      args.rolePresenceQuestionType === "role-self-introduction"
    ) {
      textFollowUpPolicy = "none";
      textFollowUpDepth = "none";
      shouldIncludeSecondSentence = true;
      textSentenceCount = 2;
      textSecondSentenceRole = "none";
      textRhythmVariant = "soft_pause";
      textLeadRewriteMode = "none";
    } else if (args.effectiveIntent === "advice" || args.effectiveIntent === "co_working") {
      textFollowUpPolicy = "none";
      textFollowUpDepth = "light";
      shouldIncludeSecondSentence =
        !args.repeatedEmotion && !args.repeatedSameMessage && !args.topicLoopSignal;
      textSentenceCount = shouldIncludeSecondSentence ? 2 : 1;
      textSecondSentenceRole = "none";
      textRhythmVariant = shouldIncludeSecondSentence ? "soft_pause" : "single_breath";
      textLeadRewriteMode = "none";
    } else if (
      args.effectiveIntent === "companionship" &&
      primaryPosture === "resonant_companion" &&
      args.recurrentTheme === "movement_escape"
    ) {
      movementImpulseMode = args.movementImpulseMode;
      movementImpulseRepeated = args.repeatedSameMessage || args.topicLoopSignal;
      textFollowUpPolicy = movementImpulseRepeated ? "reflective_ack" : "gentle_question";
      textFollowUpDepth = "light";
      shouldIncludeSecondSentence = textFollowUpPolicy !== "reflective_ack";
      textSentenceCount = shouldIncludeSecondSentence ? 2 : 1;
      textSecondSentenceRole = shouldIncludeSecondSentence ? textFollowUpPolicy : "none";
      textRhythmVariant = shouldIncludeSecondSentence ? "soft_pause" : "single_breath";
      textRenderMode = "movement_escape";
      textVariantIndex = args.movementVariantSeed;
    } else if (
      args.effectiveIntent === "companionship" &&
      (args.userEmotion === "low" || args.userEmotion === "anxious")
    ) {
      textFollowUpPolicy = "reflective_ack";
      textFollowUpDepth = "light";
      shouldIncludeSecondSentence = false;
      textSentenceCount = 1;
      textSecondSentenceRole = "none";
      textRhythmVariant = "single_breath";
      textLeadRewriteMode = "none";
      directnessLevel = "plain";
      soothingIntensity = "low";
      companionshipActionMode = "plain_observation";
      stayCloseToUserWording = true;
      avoidStockSoothing = true;
    } else if (args.effectiveIntent === "sharing") {
      textFollowUpPolicy = "gentle_question";
      textFollowUpDepth = "light";
      shouldIncludeSecondSentence = true;
      textSentenceCount = 2;
      textSecondSentenceRole = "gentle_question";
      textRhythmVariant = "soft_pause";
    }
  }

  if (args.userEmotion === "distressed" || args.effectiveIntent === "comfort") {
    directnessLevel = "supportive";
    soothingIntensity = "medium";
    companionshipActionMode = "brief_presence";
    avoidStockSoothing = true;
  } else if (args.effectiveIntent === "advice" || args.effectiveIntent === "co_working") {
    directnessLevel = "plain";
    soothingIntensity = "low";
    adviceActionMode =
      args.repeatedEmotion || args.repeatedSameMessage || args.topicLoopSignal
        ? "single_focus"
        : "direct_suggestion";
  } else if (args.effectiveIntent === "sharing") {
    directnessLevel = "plain";
    soothingIntensity = "low";
    stayCloseToUserWording = true;
  } else if (args.effectiveIntent === "greeting") {
    directnessLevel = "plain";
    soothingIntensity = "low";
    avoidStockSoothing = true;
  }

  if (args.needsCalibration) {
    directnessLevel = "plain";
    soothingIntensity = "low";
    stayCloseToUserWording = true;
    avoidStockSoothing = true;
  }

  if (args.repeatedSameMessage || args.repeatedSameUserMessage) {
    avoidRecentReplyShape = true;
    avoidRecentOpeningPhrase = true;
  }

  if (args.repeatedEmotion) {
    emotionalRecurrenceLevel =
      args.consecutiveUserMessages >= 3 || args.topicLoopSignal ? "persistent" : "repeated_once";
    responseFamiliarityMode =
      emotionalRecurrenceLevel === "persistent" ? "steady_presence" : "noticed_return";
    stayCloseToUserWording = true;
    avoidStockSoothing = true;

    if (
      primaryPosture === "resonant_companion" ||
      primaryPosture === "soothing_support" ||
      primaryPosture === "side_by_side_support"
    ) {
      directnessLevel = "supportive";
    }

    if (
      args.effectiveIntent === "companionship" ||
      args.effectiveIntent === "sharing" ||
      args.effectiveIntent === "comfort"
    ) {
      companionshipActionMode =
        args.deliveryVariantSeed === 0
          ? "plain_observation"
          : args.deliveryVariantSeed === 1
            ? "quiet_acknowledgment"
            : "brief_presence";
    }

    if (args.effectiveIntent === "advice" || args.effectiveIntent === "co_working") {
      openingStyle = "emotion_first";
      adviceActionMode =
        args.deliveryVariantSeed === 0
          ? "single_focus"
          : args.deliveryVariantSeed === 1
            ? "direct_suggestion"
            : "example_phrase_optional";
      stayCloseToUserWording = true;
    }
  }

  if (
    primaryPosture === "resonant_companion" ||
    primaryPosture === "soothing_support" ||
    args.sameDayContinuation
  ) {
    captionPolicy = "intimate_share";
  }

  if (captionPolicy === "intimate_share") {
    captionSentenceCount = 2;
    captionRhythmVariant = "soft_pause";
  } else {
    captionSentenceCount = 1;
    captionRhythmVariant = "single_breath";
  }

  if (responseLength === "one_line") {
    shouldIncludeSecondSentence = false;
    textSentenceCount = 1;
    textSecondSentenceRole = "none";
    textRhythmVariant = "single_breath";
  }

  textCleanupPolicy = {
    stripResettingGreetingLead: args.recentSameSession,
    stripTemplateFollowUpLead: args.recentSameSession && args.consecutiveUserMessages >= 2,
    stripGenericSoothingLead:
      args.effectiveIntent !== "comfort" &&
      args.effectiveIntent !== "companionship" &&
      primaryPosture !== "soothing_support" &&
      forbiddenPosture !== "soothing_support"
  };

  if (args.lightGreetingPrompt) {
    textCleanupPolicy.stripGenericSoothingLead = true;
  }

  if (args.rolePresenceQuestionType !== null) {
    textCleanupPolicy.stripGenericSoothingLead = true;
    textCleanupPolicy.stripTemplateFollowUpLead = true;
  }

  if (args.needsCalibration) {
    textRenderMode = "input_conflict_clarifier";
  } else if (
    responseObjective === "calibrate" &&
    (args.intentConfidence === "low" || args.emotionConfidence === "low")
  ) {
    textRenderMode = "low_confidence_calibrator";
  } else if (
    args.rolePresenceQuestionType === null &&
    (args.recentSameSession || args.sameDayContinuation) &&
    args.lightGreetingPrompt
  ) {
    textRenderMode = args.recentSameSession ? "same_session_greeting" : "same_day_greeting";
  } else if (
    args.rolePresenceQuestionType === null &&
    responseObjective === "maintain_connection" &&
    responseLength === "one_line"
  ) {
    textRenderMode = "maintain_connection";
  } else if (
    args.rolePresenceQuestionType === null &&
    args.effectiveIntent === "companionship" &&
    primaryPosture === "resonant_companion" &&
    args.movementImpulse
  ) {
    textRenderMode = "movement_escape";
  }

  if (args.needsCalibration) {
    artifactAction = "block";
    imageArtifactAction = "block";
    audioArtifactAction = "block";
  } else {
    if (args.effectiveIntent === "sharing" || args.effectiveIntent === "advice") {
      imageArtifactAction = "allow";
    }

    if (args.explicitAudioIntent) {
      audioArtifactAction = "allow";
    }

    artifactAction =
      imageArtifactAction === "allow" || audioArtifactAction === "allow" ? "allow" : "defer";
  }

  const avoidances: string[] = [];
  if (args.rolePresenceQuestionType === "role-capability") {
    avoidances.push("do_not_turn_role_capability_into_same_thread_emotional_follow_up");
  }
  if (args.rolePresenceQuestionType === "role-background") {
    avoidances.push("do_not_repeat_the_self_introduction_template_when_answering_background");
  }
  if (args.rolePresenceQuestionType === "role-boundary") {
    avoidances.push("do_not_avoid_clear_limits_when_answering_boundaries");
  }
  if (args.effectiveIntent === "greeting") {
    avoidances.push("do_not_turn_a_light_greeting_into_a_soothing_block");
  }
  if (args.effectiveIntent === "advice" || args.effectiveIntent === "co_working") {
    avoidances.push("do_not_default_to_reassurance_before_engaging_the_actual_problem");
    avoidances.push("do_not_answer_with_companionship_only_when_user_explicitly_asked_for_help");
  }
  if (args.inputConflict.inputConflict) {
    avoidances.push("do_not_smooth_over_conflicting_places_or_targets_without_clarifying_first");
  }
  if (args.temporalMode !== "reconnect") {
    avoidances.push("do_not_reopen_the_conversation_like_a_fresh_start");
  }

  return {
    temporalMode: args.temporalMode,
    interactionStage: args.interactionStage,
    userEmotion: args.userEmotion,
    userIntent: args.effectiveIntent,
    responseObjective,
    primaryPosture,
    secondaryPosture,
    forbiddenPosture,
    responseLength,
    openingStyle,
    toneTension,
    directnessLevel,
    soothingIntensity,
    emotionalRecurrenceLevel,
    responseFamiliarityMode,
    companionshipActionMode,
    adviceActionMode,
    avoidRecentReplyShape,
    avoidRecentOpeningPhrase,
    stayCloseToUserWording,
    avoidStockSoothing,
    textRenderMode,
    textFollowUpPolicy,
    textFollowUpDepth,
    shouldIncludeSecondSentence,
    textSentenceCount,
    textSecondSentenceRole,
    textRhythmVariant,
    textLeadRewriteMode,
    textCleanupPolicy,
    movementImpulseMode,
    movementImpulseRepeated,
    textVariantIndex,
    captionPolicy,
    captionSentenceCount,
    captionRhythmVariant,
    captionScene: args.captionScene,
    captionVariantIndex: args.captionVariantIndex,
    artifactAction,
    imageArtifactAction,
    audioArtifactAction,
    avoidances,
    confidence: {
      emotion: args.emotionConfidence,
      intent: args.intentConfidence,
      fallbackObjective:
        args.emotionConfidence === "low" || args.intentConfidence === "low"
          ? "calibrate"
          : undefined
    }
  };
}
