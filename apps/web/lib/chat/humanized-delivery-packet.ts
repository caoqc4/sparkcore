import type { AnswerCompositionSpec } from "@/lib/chat/runtime-composition-contracts";
import {
  areVerySimilarUserTurnsZh,
  countTurnsSince,
  detectBehaviorRhythm,
  detectCaptionScene,
  detectDeepIntent,
  detectEmotionConfidence,
  detectEmotionIntensity,
  detectExplicitAudioIntent,
  detectHumanizedInteractionStage,
  detectHumanizedUserEmotion,
  detectHumanizedUserIntent,
  detectInputConflictSignal,
  detectIntentConfidence,
  detectLightGreetingPrompt,
  detectMessageShape,
  detectMovementImpulse,
  detectMovementImpulseMode,
  detectRecurrentThemeSignal,
  detectRelationshipProbeSignal,
  detectRepeatedEmotionSignal,
  normalizeComparableUserText
} from "@/lib/chat/humanized-delivery-detectors";
import {
  buildHumanizedDeliveryStrategy,
  type HumanizedTemporalMode
} from "@/lib/chat/humanized-delivery-strategy";
import type {
  HumanizedDeliveryPacket,
  HumanizedProductFeedbackCategory
} from "@/lib/chat/humanized-delivery-contracts";
import type { RecentRawTurn } from "@/lib/chat/session-context";

export function buildHumanizedDeliveryPacket(args: {
  spec: AnswerCompositionSpec;
  detectNegativeProductFeedbackSignal: (latestUserMessage: string) => {
    detected: boolean;
    category: HumanizedProductFeedbackCategory | null;
  };
  hashString: (input: string) => number;
}): HumanizedDeliveryPacket {
  const latestUserMessage = args.spec.latestUserMessage ?? "";
  const userEmotion = detectHumanizedUserEmotion(latestUserMessage);
  const emotionIntensity = detectEmotionIntensity(latestUserMessage, userEmotion);
  const emotionConfidence = detectEmotionConfidence(latestUserMessage, userEmotion);
  const userIntent = detectHumanizedUserIntent(latestUserMessage);
  const deepIntent = detectDeepIntent({
    latestUserMessage,
    surfaceIntent: userIntent,
    emotion: userEmotion
  });
  const effectiveIntent = deepIntent ?? userIntent;
  const intentConfidence = detectIntentConfidence(latestUserMessage, userIntent);
  const interactionStage = detectHumanizedInteractionStage({
    latestUserMessage,
    temporalHints: args.spec.temporalHints
  });
  const recentUserMessages = args.spec.recentRawTurns
    .filter((turn) => turn.role === "user" && typeof turn.content === "string")
    .map((turn) => turn.content as string)
    .slice(-6);
  const temporalMode: HumanizedTemporalMode = args.spec.temporalHints.recentSameSession
    ? "same_session"
    : args.spec.temporalHints.sameDayContinuation
      ? "same_day_continuation"
      : "reconnect";
  const recurrentTheme = detectRecurrentThemeSignal({
    latestUserMessage,
    recentUserMessages
  });
  const repeatedEmotion = detectRepeatedEmotionSignal({
    recentUserMessages,
    latestEmotion: userEmotion
  });
  const inputConflict = detectInputConflictSignal(latestUserMessage);
  const negativeProductFeedback = args.detectNegativeProductFeedbackSignal(
    latestUserMessage
  );
  const repeatedSameMessage = recentUserMessages.some((message) => {
    if (message === latestUserMessage) {
      return false;
    }
    return (
      normalizeComparableUserText(message) ===
      normalizeComparableUserText(latestUserMessage)
    );
  });
  const topicLoopSignal =
    recurrentTheme === "movement_escape" || repeatedEmotion !== null;
  const relationshipProbe = detectRelationshipProbeSignal(latestUserMessage);
  const messageShape = detectMessageShape(latestUserMessage);
  const behaviorRhythm = detectBehaviorRhythm({
    temporalHints: args.spec.temporalHints,
    recentRawTurns: args.spec.recentRawTurns
  });
  const turnCounts = countTurnsSince({
    recentRawTurns: args.spec.recentRawTurns,
    localDate: args.spec.temporalContext.localDate,
    nowMs: Date.now()
  });
  const latestTurn = args.spec.recentRawTurns[
    args.spec.recentRawTurns.length - 1
  ] as RecentRawTurn | undefined;
  const previousTurn = args.spec.recentRawTurns.length >= 2
    ? (args.spec.recentRawTurns[args.spec.recentRawTurns.length - 2] as RecentRawTurn)
    : null;
  const recentUserTurns = args.spec.recentRawTurns.filter(
    (turn) => turn.role === "user"
  );
  const previousUserTurn =
    recentUserTurns.length >= 2
      ? (recentUserTurns[recentUserTurns.length - 2] as RecentRawTurn)
      : null;
  const lightGreetingPrompt = detectLightGreetingPrompt(latestUserMessage);
  const movementImpulse = detectMovementImpulse(latestUserMessage);
  const rolePresenceQuestionType =
    args.spec.answer.questionType === "role-self-introduction" ||
    args.spec.answer.questionType === "role-capability" ||
    args.spec.answer.questionType === "role-background" ||
    args.spec.answer.questionType === "role-boundary"
      ? args.spec.answer.questionType
      : null;
  const repeatedSameUserMessage =
    typeof previousUserTurn?.content === "string"
      ? areVerySimilarUserTurnsZh(latestUserMessage, previousUserTurn.content)
      : false;

  const needsCalibration = inputConflict.inputConflict;
  const explicitAudioIntent = detectExplicitAudioIntent(latestUserMessage);
  const captionSource = `${latestUserMessage}\n${previousUserTurn?.content ?? ""}`;
  const captionScene = detectCaptionScene(captionSource);
  const captionVariantIndex = (args.hashString(captionSource) % 3) as 0 | 1 | 2;
  const movementVariantSeed = (
    args.hashString(
      `${latestUserMessage}\n${previousUserTurn?.content ?? ""}\n${recurrentTheme ?? ""}`
    ) % 3
  ) as 0 | 1 | 2;
  const deliveryVariantSeed = (
    (turnCounts.recentHourTurnCount ??
      turnCounts.todayTurnCount ??
      args.spec.recentRawTurns.length) +
    args.spec.temporalHints.consecutiveUserMessages
  ) % 3 as 0 | 1 | 2;
  const strategy = buildHumanizedDeliveryStrategy({
    temporalMode,
    interactionStage,
    userEmotion,
    effectiveIntent,
    intentConfidence,
    emotionConfidence,
    needsCalibration,
    rolePresenceQuestionType,
    repeatedSameUserMessage,
    recurrentTheme,
    repeatedEmotion,
    repeatedSameMessage,
    topicLoopSignal,
    sameDayContinuation: args.spec.temporalHints.sameDayContinuation,
    recentSameSession: args.spec.temporalHints.recentSameSession,
    consecutiveUserMessages: args.spec.temporalHints.consecutiveUserMessages,
    lightGreetingPrompt,
    movementImpulse,
    movementImpulseMode: detectMovementImpulseMode(latestUserMessage),
    explicitAudioIntent,
    captionScene,
    captionVariantIndex,
    movementVariantSeed,
    deliveryVariantSeed,
    inputConflict
  });

  return {
    temporalContext: {
      ...args.spec.temporalContext,
      temporalMode,
      minutesSinceLastAssistant: args.spec.temporalHints.minutesSinceLastAssistant
    },
    sessionActivityContext: {
      todayTurnCount: turnCounts.todayTurnCount,
      recentHourTurnCount: turnCounts.recentHourTurnCount,
      consecutiveUserMessages: args.spec.temporalHints.consecutiveUserMessages,
      openConversationActive:
        args.spec.temporalHints.recentSameSession ||
        args.spec.temporalHints.sameDayContinuation
    },
    threadFreshness: {
      isNewThread: args.spec.recentRawTurns.length <= 1,
      isDirectReplyToLastAssistant:
        latestTurn?.role === "user" && previousTurn?.role === "assistant",
      threadDepth:
        args.spec.recentRawTurns.length >= 12
          ? "deep"
          : args.spec.recentRawTurns.length >= 5
            ? "medium"
            : "shallow"
    },
    signalRecognition: {
      contentSignals: {
        semanticBrief:
          latestUserMessage.length <= 80
            ? latestUserMessage
            : `${latestUserMessage.slice(0, 77).trimEnd()}...`,
        hasSemanticGap: needsCalibration,
        hasMemoryConflict: false,
        executableWithoutClarification: !needsCalibration,
        confidence: needsCalibration ? "high" : "medium"
      },
      emotionSignals: {
        emotionCandidates:
          deepIntent === "companionship" && userEmotion === "calm"
            ? [userEmotion, "low"]
            : [userEmotion],
        intensity: emotionIntensity,
        repeatedEmotionSignal: repeatedEmotion !== null,
        confidence: emotionConfidence
      },
      intentSignals: {
        surfaceIntent: userIntent,
        deepIntent,
        relationshipProbe,
        negativeProductFeedback: negativeProductFeedback.detected,
        negativeProductFeedbackCategory: negativeProductFeedback.category,
        confidence: intentConfidence
      },
      behaviorSignals: {
        repeatedSameMessage,
        messageShape,
        rhythm: behaviorRhythm,
        topicLoopSignal,
        confidence: repeatedSameMessage || topicLoopSignal ? "high" : "medium"
      }
    },
    userState: {
      emotion: userEmotion,
      emotionIntensity,
      emotionConfidence,
      intent: userIntent,
      deepIntent,
      intentConfidence,
      interactionStage,
      relationshipTemperature:
        args.spec.temporalHints.sameDayContinuation &&
        args.spec.temporalHints.consecutiveUserMessages >= 2
          ? "warmer"
          : "baseline",
      anomaly: {
        needsCalibration,
        repetitionSignal: topicLoopSignal || repeatedSameMessage,
        crossMemoryConflict: false
      }
    },
    dialogState: {
      topicState: topicLoopSignal
        ? "repeated_topic"
        : interactionStage === "transition"
          ? "new_topic"
          : interactionStage === "deepening"
            ? "subtext_topic"
            : "continuing_topic",
      relationshipState: relationshipProbe
        ? "confirming"
        : args.spec.temporalHints.sameDayContinuation &&
            args.spec.temporalHints.consecutiveUserMessages >= 2
          ? "warming"
          : "stable",
      confidence:
        intentConfidence === "low" && emotionConfidence === "low" ? "low" : "medium"
    },
    patternSignals: {
      recurrentTheme,
      repeatedEmotion,
      inputConflict: inputConflict.inputConflict,
      conflictHint: inputConflict.conflictHint,
      negativeProductFeedback: negativeProductFeedback.detected,
      negativeProductFeedbackCategory: negativeProductFeedback.category
    },
    deliveryStrategy: {
      ...strategy
    },
    execution: {
      memoryWriteBack: {
        shouldWrite: false,
        targetMemoryLayers: [],
        writeBrief: undefined
      },
      multimodalActions: {
        generateImage: strategy.imageArtifactAction === "allow",
        generateAudio: strategy.audioArtifactAction === "allow"
      }
    }
  };
}
