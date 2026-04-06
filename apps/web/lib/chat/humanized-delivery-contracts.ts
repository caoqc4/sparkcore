import type { AnswerCompositionTemporalContext } from "@/lib/chat/runtime-composition-contracts";

export type HumanizedTemporalMode = "same_session" | "same_day_continuation" | "reconnect";
export type HumanizedInteractionStage =
  | "opening"
  | "continuation"
  | "deepening"
  | "transition"
  | "closing";
export type HumanizedUserEmotion =
  | "calm"
  | "sharing"
  | "low"
  | "distressed"
  | "anxious"
  | "energized"
  | "unclear";
export type HumanizedUserIntent =
  | "greeting"
  | "continue"
  | "sharing"
  | "companionship"
  | "understanding"
  | "comfort"
  | "advice"
  | "co_working"
  | "playful";
export type HumanizedPrimaryPosture =
  | "everyday_companion"
  | "resonant_companion"
  | "soothing_support"
  | "side_by_side_support"
  | "active_interaction";
export type HumanizedResponseObjective =
  | "calibrate"
  | "receive"
  | "advance"
  | "answer"
  | "share"
  | "maintain_connection";
export type HumanizedResponseLength =
  | "one_line"
  | "two_lines"
  | "short_paragraph"
  | "expandable";
export type HumanizedOpeningStyle =
  | "light_greeting"
  | "direct_carryover"
  | "emotion_first"
  | "question_first"
  | "problem_first";
export type HumanizedToneTension = "loose" | "steady" | "warm" | "light" | "active";
export type HumanizedDirectnessLevel = "plain" | "softened" | "supportive";
export type HumanizedSoothingIntensity = "low" | "medium" | "high";
export type HumanizedEmotionalRecurrenceLevel = "none" | "repeated_once" | "persistent";
export type HumanizedResponseFamiliarityMode = "fresh" | "noticed_return" | "steady_presence";
export type HumanizedCompanionshipActionMode =
  | "brief_presence"
  | "plain_observation"
  | "quiet_acknowledgment";
export type HumanizedAdviceActionMode =
  | "direct_suggestion"
  | "single_focus"
  | "example_phrase_optional";
export type HumanizedTextFollowUpPolicy =
  | "none"
  | "reflective_ack"
  | "gentle_question"
  | "exploratory_question";
export type HumanizedTextFollowUpDepth = "none" | "light" | "medium";
export type HumanizedCaptionPolicy = "shared_viewing" | "intimate_share";
export type HumanizedArtifactAction = "allow" | "defer" | "block";
export type HumanizedRhythmVariant = "single_breath" | "soft_pause" | "linger";
export type HumanizedTextRenderMode =
  | "default"
  | "input_conflict_clarifier"
  | "low_confidence_calibrator"
  | "same_session_greeting"
  | "same_day_greeting"
  | "maintain_connection"
  | "movement_escape";
export type HumanizedMovementImpulseMode =
  | "destination_planning"
  | "stroll_breath"
  | "short_escape";
export type HumanizedSecondSentenceRole =
  | "none"
  | "reflective_ack"
  | "gentle_question"
  | "exploratory_question";
export type HumanizedTextLeadRewriteMode =
  | "none"
  | "light_companionship_catch"
  | "advice_carryover"
  | "advice_carryover_variant";
export type HumanizedTextCleanupPolicy = {
  stripResettingGreetingLead: boolean;
  stripTemplateFollowUpLead: boolean;
  stripGenericSoothingLead: boolean;
};
export type HumanizedCaptionScene =
  | "grassland"
  | "mountain_water"
  | "seaside"
  | "icy_plain"
  | "sky_birds"
  | "sunset"
  | "generic";
export type HumanizedProductFeedbackCategory =
  | "memory_capability_mocking"
  | "image_mismatch"
  | "general_quality_complaint";

export type HumanizedRolePresenceQuestionType =
  | "role-self-introduction"
  | "role-capability"
  | "role-background"
  | "role-boundary"
  | null;

export type BuildHumanizedDeliveryStrategyArgs = {
  temporalMode: HumanizedTemporalMode;
  interactionStage: HumanizedInteractionStage;
  userEmotion: HumanizedUserEmotion;
  effectiveIntent: HumanizedUserIntent;
  intentConfidence: "high" | "medium" | "low";
  emotionConfidence: "high" | "medium" | "low";
  needsCalibration: boolean;
  rolePresenceQuestionType: HumanizedRolePresenceQuestionType;
  repeatedSameUserMessage: boolean;
  recurrentTheme: "movement_escape" | null;
  repeatedEmotion: HumanizedUserEmotion | null;
  repeatedSameMessage: boolean;
  topicLoopSignal: boolean;
  sameDayContinuation: boolean;
  recentSameSession: boolean;
  consecutiveUserMessages: number;
  lightGreetingPrompt: boolean;
  movementImpulse: boolean;
  movementImpulseMode: HumanizedMovementImpulseMode | null;
  explicitAudioIntent: boolean;
  captionScene: HumanizedCaptionScene;
  captionVariantIndex: 0 | 1 | 2;
  movementVariantSeed: 0 | 1 | 2;
  deliveryVariantSeed: 0 | 1 | 2;
  inputConflict: {
    inputConflict: boolean;
  };
};

export type HumanizedDeliveryStrategy = {
  temporalMode: HumanizedTemporalMode;
  interactionStage: HumanizedInteractionStage;
  userEmotion: HumanizedUserEmotion;
  userIntent: HumanizedUserIntent;
  responseObjective: HumanizedResponseObjective;
  primaryPosture: HumanizedPrimaryPosture;
  secondaryPosture: HumanizedPrimaryPosture | null;
  forbiddenPosture: string | null;
  responseLength: HumanizedResponseLength;
  openingStyle: HumanizedOpeningStyle;
  toneTension: HumanizedToneTension;
  directnessLevel: HumanizedDirectnessLevel;
  soothingIntensity: HumanizedSoothingIntensity;
  emotionalRecurrenceLevel: HumanizedEmotionalRecurrenceLevel;
  responseFamiliarityMode: HumanizedResponseFamiliarityMode;
  companionshipActionMode: HumanizedCompanionshipActionMode;
  adviceActionMode: HumanizedAdviceActionMode;
  avoidRecentReplyShape: boolean;
  avoidRecentOpeningPhrase: boolean;
  stayCloseToUserWording: boolean;
  avoidStockSoothing: boolean;
  textRenderMode: HumanizedTextRenderMode;
  textFollowUpPolicy: HumanizedTextFollowUpPolicy;
  textFollowUpDepth: HumanizedTextFollowUpDepth;
  shouldIncludeSecondSentence: boolean;
  textSentenceCount: 1 | 2;
  textSecondSentenceRole: HumanizedSecondSentenceRole;
  textRhythmVariant: HumanizedRhythmVariant;
  textLeadRewriteMode: HumanizedTextLeadRewriteMode;
  textCleanupPolicy: HumanizedTextCleanupPolicy;
  movementImpulseMode: HumanizedMovementImpulseMode | null;
  movementImpulseRepeated: boolean;
  textVariantIndex: 0 | 1 | 2;
  captionPolicy: HumanizedCaptionPolicy;
  captionSentenceCount: 1 | 2 | 3;
  captionRhythmVariant: HumanizedRhythmVariant;
  captionScene: HumanizedCaptionScene;
  captionVariantIndex: 0 | 1 | 2;
  artifactAction: HumanizedArtifactAction;
  imageArtifactAction: HumanizedArtifactAction;
  audioArtifactAction: HumanizedArtifactAction;
  avoidances: string[];
  confidence: {
    emotion: "high" | "medium" | "low";
    intent: "high" | "medium" | "low";
    fallbackObjective?: "calibrate" | "maintain_connection";
  };
};

export type HumanizedDeliveryPacket = {
  temporalContext: AnswerCompositionTemporalContext & {
    temporalMode: HumanizedTemporalMode;
    minutesSinceLastAssistant: number | null;
  };
  sessionActivityContext: {
    todayTurnCount: number | null;
    recentHourTurnCount: number | null;
    consecutiveUserMessages: number;
    openConversationActive: boolean;
  };
  threadFreshness: {
    isNewThread: boolean;
    isDirectReplyToLastAssistant: boolean;
    threadDepth: "shallow" | "medium" | "deep";
  };
  signalRecognition: {
    contentSignals: {
      semanticBrief: string;
      hasSemanticGap: boolean;
      hasMemoryConflict: boolean;
      executableWithoutClarification: boolean;
      confidence: "high" | "medium" | "low";
    };
    emotionSignals: {
      emotionCandidates: HumanizedUserEmotion[];
      intensity: "light" | "medium" | "high" | "unclear";
      repeatedEmotionSignal: boolean;
      confidence: "high" | "medium" | "low";
    };
    intentSignals: {
      surfaceIntent: HumanizedUserIntent;
      deepIntent: HumanizedUserIntent | null;
      relationshipProbe: boolean;
      negativeProductFeedback: boolean;
      negativeProductFeedbackCategory: HumanizedProductFeedbackCategory | null;
      confidence: "high" | "medium" | "low";
    };
    behaviorSignals: {
      repeatedSameMessage: boolean;
      messageShape: "single_token" | "short_sentence" | "long_paragraph" | "emoji_or_symbol";
      rhythm: "rapid_fire" | "normal" | "slow_return";
      topicLoopSignal: boolean;
      confidence: "high" | "medium" | "low";
    };
  };
  userState: {
    emotion: HumanizedUserEmotion;
    emotionIntensity: "light" | "medium" | "high" | "unclear";
    emotionConfidence: "high" | "medium" | "low";
    intent: HumanizedUserIntent;
    deepIntent: HumanizedUserIntent | null;
    intentConfidence: "high" | "medium" | "low";
    interactionStage: HumanizedInteractionStage;
    relationshipTemperature: "warmer" | "baseline" | "cooler";
    anomaly: {
      needsCalibration: boolean;
      repetitionSignal: boolean;
      crossMemoryConflict: boolean;
    };
  };
  dialogState: {
    topicState: "new_topic" | "continuing_topic" | "repeated_topic" | "subtext_topic";
    relationshipState: "confirming" | "stable" | "warming" | "cooling";
    confidence: "high" | "medium" | "low";
  };
  patternSignals: {
    recurrentTheme: "movement_escape" | null;
    repeatedEmotion: HumanizedUserEmotion | null;
    inputConflict: boolean;
    conflictHint: string | null;
    negativeProductFeedback: boolean;
    negativeProductFeedbackCategory: HumanizedProductFeedbackCategory | null;
  };
  deliveryStrategy: HumanizedDeliveryStrategy;
  execution: {
    memoryWriteBack: {
      shouldWrite: boolean;
      targetMemoryLayers: Array<
        | "role_layer"
        | "structured_long_term_memory"
        | "knowledge_layer"
        | "thread_state_layer"
        | "recent_raw_turns_layer"
      >;
      writeBrief?: string;
    };
    multimodalActions: {
      generateImage: boolean;
      imagePromptBrief?: string;
      generateAudio: boolean;
      audioStyleBrief?: string;
      otherActions?: string[];
    };
  };
};
