import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { HumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-contracts";

export function buildHumanizedDeliveryPromptSection(args: {
  packet: HumanizedDeliveryPacket | null;
  replyLanguage: RuntimeReplyLanguage;
}) {
  if (!args.packet) {
    return "";
  }

  const isZh = args.replyLanguage === "zh-Hans";
  const packet = args.packet;
  if (isZh) {
    const sceneDirectives: string[] = [];
    if (packet.userState.intent === "greeting") {
      sceneDirectives.push(
        "如果用户只是轻招呼，就短短回应一下。优先一句，最多两句，不要泛问近况，不要转成安抚段落。"
      );
    }
    if (packet.userState.intent === "advice" || packet.userState.intent === "co_working") {
      sceneDirectives.push(
        "如果用户在要建议或一起推进，先直接进入并肩支持。必要时只问一个聚焦澄清问题，但不要先绕回情绪总结、关系确认或安抚模板，也不要默认整理成两个备选方案，更不要默认写成“你可以对朋友说”这种示范台词。"
      );
      sceneDirectives.push(
        "只要这一轮仍然是在求助或要建议，最终回复里必须触达这个问题本身，至少给出一个直接相关的判断、方向或切入口，不能只停在陪伴句。"
      );
    }
    if (
      packet.userState.intent === "companionship" &&
      (packet.userState.emotion === "low" || packet.userState.emotion === "anxious")
    ) {
      sceneDirectives.push(
        "如果用户只是有点烦、低落或心里堵着，就顺着他刚刚那句话自然回应，先别放大成大段安抚、鸡汤或心理解释，也不要默认用“我在”“我接住你了”这类固定承接句。"
      );
      if (packet.deliveryStrategy.companionshipActionMode === "plain_observation") {
        sceneDirectives.push(
          "这轮更适合用一句平实观察来贴住他现在这股状态，少一点陪伴宣言或安抚口头禅。"
        );
      } else if (
        packet.deliveryStrategy.companionshipActionMode === "quiet_acknowledgment"
      ) {
        sceneDirectives.push(
          "这轮更适合短短确认一下眼前这一下，不要把回复写成照护宣言，也不要扩成解释。"
        );
      } else {
        sceneDirectives.push(
          "这轮可以是很短的陪在旁边式回应，但仍然不要落回固定的“我在”“接住你了”套话。"
        );
      }
    }
    if (packet.userState.intent === "advice" || packet.userState.intent === "co_working") {
      if (packet.deliveryStrategy.adviceActionMode === "single_focus") {
        sceneDirectives.push(
          "建议动作先只给一个最贴题的切入口，不要平衡展开，也不要直接写成示范说法。重点是先回答用户眼前这个问题，而不是只做陪伴承接。"
        );
      } else if (
        packet.deliveryStrategy.adviceActionMode === "example_phrase_optional"
      ) {
        sceneDirectives.push(
          "只有当用户明显在要一句可直接复述的话时，才可以给一句示范说法；否则优先自然建议，而且不要把整条回复都写成示范台词。"
        );
      } else {
        sceneDirectives.push(
          "建议动作优先直接给最贴题的方向或判断，不必先搭一个示范台词框架，也不要被前面的情绪背景带回纯陪伴回应。"
        );
      }
    }
    if (
      packet.deliveryStrategy.avoidRecentReplyShape ||
      packet.deliveryStrategy.avoidRecentOpeningPhrase
    ) {
      sceneDirectives.push(
        "如果这轮和最近一轮用户表达得很像，尽量不要重复刚刚那种开头或回答形状；只是在保持同一目标和关系温度的前提下，稍微换一种自然说法即可，不要为了求变而硬拗。"
      );
    }
    if (packet.deliveryStrategy.emotionalRecurrenceLevel !== "none") {
      sceneDirectives.push(
        "如果这是同类情绪又回来的状态，要让用户感觉到你注意到了这种回返，但不要机械点名“你又这样了”。这种变化幅度要符合当前关系温度和角色姿态。"
      );
      if (
        packet.userState.intent === "advice" ||
        packet.userState.intent === "co_working"
      ) {
        sceneDirectives.push(
          "如果用户是在重复低落状态里顺手问建议，要带着这股状态去回答当前问题，但不要让这股状态吞掉问题本身。可以先短短贴一下再答，也可以直接答；一条或两条都可以，但不要默认退回纯陪伴句、标准建议卡、双选项路线或均衡罗列。"
        );
      }
    }
    if (packet.patternSignals.recurrentTheme === "movement_escape") {
      sceneDirectives.push(
        "如果用户最近已经反复提到想出去、想抽身或想旅游，可以自然点出“这念头像是这几轮都在往上冒”，不要每次都装作第一次听到。"
      );
    }
    if (packet.patternSignals.inputConflict && packet.patternSignals.conflictHint) {
      sceneDirectives.push(
        `如果用户同一句里把对象说混了（例如 ${packet.patternSignals.conflictHint}），先用一句轻量校准，不要直接顺滑生成。`
      );
    }
    if (packet.patternSignals.negativeProductFeedback) {
      sceneDirectives.push(
        `如果用户对产品效果表达了负面评价（${packet.patternSignals.negativeProductFeedbackCategory ?? "negative_product_feedback"}），先正面接住问题，不要装作没看见，也不要立刻自我辩护。`
      );
    }
    if (
      packet.deliveryStrategy.confidence.intent === "low" ||
      packet.deliveryStrategy.confidence.emotion === "low"
    ) {
      sceneDirectives.push(
        "如果当前判断置信度不高，先贴着用户原话接一下，再用一句很短的确认把方向对齐，不要贸然展开，也不要套用固定澄清句。"
      );
    }
    return [
      "真人感输出策略（紧凑版）",
      `当前时刻：${packet.temporalContext.temporalMode}，${packet.temporalContext.partOfDay}。`,
      `用户状态：情绪=${packet.userState.emotion}/${packet.userState.emotionIntensity}；意图=${packet.userState.intent}${packet.userState.deepIntent ? `→${packet.userState.deepIntent}` : ""}；阶段=${packet.userState.interactionStage}。`,
      `对话状态：话题=${packet.dialogState.topicState}；关系=${packet.dialogState.relationshipState}；关系温度=${packet.userState.relationshipTemperature}。`,
      packet.patternSignals.recurrentTheme || packet.patternSignals.inputConflict
        ? `补充信号：重复主题=${packet.patternSignals.recurrentTheme ?? "none"}；重复情绪=${packet.patternSignals.repeatedEmotion ?? "none"}；输入冲突=${packet.patternSignals.inputConflict ? packet.patternSignals.conflictHint ?? "true" : "none"}。`
        : "",
      `表达策略：目标=${packet.deliveryStrategy.responseObjective}；主姿态=${packet.deliveryStrategy.primaryPosture}${packet.deliveryStrategy.secondaryPosture ? `；次姿态=${packet.deliveryStrategy.secondaryPosture}` : ""}${packet.deliveryStrategy.forbiddenPosture ? `；禁止姿态=${packet.deliveryStrategy.forbiddenPosture}` : ""}；长度=${packet.deliveryStrategy.responseLength}；开口=${packet.deliveryStrategy.openingStyle}；语气=${packet.deliveryStrategy.toneTension}。`,
      `措辞边界：直接度=${packet.deliveryStrategy.directnessLevel}；安抚强度=${packet.deliveryStrategy.soothingIntensity}；情绪回返=${packet.deliveryStrategy.emotionalRecurrenceLevel}；熟悉度=${packet.deliveryStrategy.responseFamiliarityMode}；陪伴动作=${packet.deliveryStrategy.companionshipActionMode}；建议动作=${packet.deliveryStrategy.adviceActionMode}；避免近似回复形状=${packet.deliveryStrategy.avoidRecentReplyShape ? "yes" : "no"}；避免近似开头=${packet.deliveryStrategy.avoidRecentOpeningPhrase ? "yes" : "no"}；贴原话=${packet.deliveryStrategy.stayCloseToUserWording ? "yes" : "no"}；避免套话=${packet.deliveryStrategy.avoidStockSoothing ? "yes" : "no"}。`,
      `文本渲染：模式=${packet.deliveryStrategy.textRenderMode}；策略=${packet.deliveryStrategy.textFollowUpPolicy}；深度=${packet.deliveryStrategy.textFollowUpDepth}；句数=${packet.deliveryStrategy.textSentenceCount}；第二句职责=${packet.deliveryStrategy.textSecondSentenceRole}；节奏=${packet.deliveryStrategy.textRhythmVariant}；清洗=${JSON.stringify(packet.deliveryStrategy.textCleanupPolicy)}；主题模式=${packet.deliveryStrategy.movementImpulseMode ?? "none"}；重复=${packet.deliveryStrategy.movementImpulseRepeated ? "yes" : "no"}；变体=${packet.deliveryStrategy.textVariantIndex}。`,
      `图片文案：策略=${packet.deliveryStrategy.captionPolicy}；句数=${packet.deliveryStrategy.captionSentenceCount}；节奏=${packet.deliveryStrategy.captionRhythmVariant}；场景=${packet.deliveryStrategy.captionScene}；变体=${packet.deliveryStrategy.captionVariantIndex}。`,
      `多模态动作：artifact=${packet.deliveryStrategy.artifactAction}；image=${packet.deliveryStrategy.imageArtifactAction}；audio=${packet.deliveryStrategy.audioArtifactAction}。`,
      ...sceneDirectives,
      packet.deliveryStrategy.avoidances.length > 0
        ? `避免：${packet.deliveryStrategy.avoidances.join("；")}。`
        : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  const sceneDirectives: string[] = [];
  if (packet.userState.intent === "greeting") {
    sceneDirectives.push(
      "If the user is only greeting lightly, answer with one short line, at most two. Do not expand into a check-in or a soothing paragraph."
    );
  }
  if (packet.userState.intent === "advice" || packet.userState.intent === "co_working") {
    sceneDirectives.push(
      "If the user is asking for advice or to work through something together, move into side-by-side help immediately. If clarification is needed, ask only one focused question instead of circling back through reassurance, do not default to two balanced option cards, and do not default to 'you can say...' script framing."
    );
    sceneDirectives.push(
      "As long as this turn is still a help-seeking or advice turn, the final reply must contain at least one concrete answer element that touches the user's actual problem. Do not stop at companionship alone."
    );
  }
  if (
    packet.userState.intent === "companionship" &&
    (packet.userState.emotion === "low" || packet.userState.emotion === "anxious")
  ) {
    sceneDirectives.push(
      "If the user only sounds a little low or bothered, respond naturally to the exact line they just gave you. Do not inflate it into a soothing block, and do not default to stock lines like 'I'm here' or 'I've got you.'"
    );
    if (packet.deliveryStrategy.companionshipActionMode === "plain_observation") {
      sceneDirectives.push(
        "This turn should land more like a plain observation of the state they are in, with less soothing ceremony."
      );
    } else if (
      packet.deliveryStrategy.companionshipActionMode === "quiet_acknowledgment"
    ) {
      sceneDirectives.push(
        "This turn should work like a brief acknowledgment of this exact moment, not a caregiving declaration and not an explanation."
      );
    } else {
      sceneDirectives.push(
        "This turn can be a very short staying-with-you line, while still avoiding stock soothing phrases."
      );
    }
  }
  if (packet.userState.intent === "advice" || packet.userState.intent === "co_working") {
    if (packet.deliveryStrategy.adviceActionMode === "single_focus") {
      sceneDirectives.push(
        "Give one most-fitting angle first instead of balancing multiple options or turning it into a script the user should repeat. The key is to answer the user's actual question instead of stopping at companionship."
      );
    } else if (packet.deliveryStrategy.adviceActionMode === "example_phrase_optional") {
      sceneDirectives.push(
        "Only offer a sample line when the user is clearly asking for wording they can reuse; otherwise prefer natural guidance, and do not let the whole reply collapse into script framing."
      );
    } else {
      sceneDirectives.push(
        "Prefer a direct answer or direction first instead of framing the reply as a sample line to say to someone else, and do not let the emotional backdrop pull the reply back into pure companionship."
      );
    }
  }
  if (
    packet.deliveryStrategy.avoidRecentReplyShape ||
    packet.deliveryStrategy.avoidRecentOpeningPhrase
  ) {
    sceneDirectives.push(
      "If this user turn is very similar to a recent one, avoid repeating the same opening phrase or the same reply shape. Keep the same goal and relationship tone, and only vary it slightly instead of forcing novelty."
    );
  }
  if (packet.deliveryStrategy.emotionalRecurrenceLevel !== "none") {
    sceneDirectives.push(
      "If this is the return of the same emotional state, let the reply feel like you noticed that return without mechanically pointing it out. The shift in warmth or familiarity should still match the current relationship tone and posture."
    );
    if (packet.userState.intent === "advice" || packet.userState.intent === "co_working") {
      sceneDirectives.push(
        "If the advice request is riding on top of that repeated low state, answer the current question with awareness of that state instead of letting the state replace the answer. You may briefly acknowledge the state first or answer directly; one or two lines are both fine, but do not default to a pure companionship line, a two-option helper card, or a balanced list."
      );
    }
  }
  if (
    packet.deliveryStrategy.confidence.intent === "low" ||
    packet.deliveryStrategy.confidence.emotion === "low"
  ) {
    sceneDirectives.push(
      "If intent or emotion confidence is low, stay close to the user's wording first and use one short clarifying question instead of committing to a strong interpretation or falling back to canned calibration phrasing."
    );
  }

  return [
    "Humanized delivery strategy (compact)",
    `Temporal mode: ${packet.temporalContext.temporalMode}; part of day: ${packet.temporalContext.partOfDay}.`,
    `User state: emotion=${packet.userState.emotion}/${packet.userState.emotionIntensity}; intent=${packet.userState.intent}${packet.userState.deepIntent ? `→${packet.userState.deepIntent}` : ""}; stage=${packet.userState.interactionStage}.`,
    `Dialog state: topic=${packet.dialogState.topicState}; relationship=${packet.dialogState.relationshipState}; warmth=${packet.userState.relationshipTemperature}.`,
    packet.patternSignals.negativeProductFeedback
      ? `Product feedback signal: ${packet.patternSignals.negativeProductFeedbackCategory ?? "negative_product_feedback"}.`
      : "",
    `Delivery: objective=${packet.deliveryStrategy.responseObjective}; primary=${packet.deliveryStrategy.primaryPosture}${packet.deliveryStrategy.secondaryPosture ? `; secondary=${packet.deliveryStrategy.secondaryPosture}` : ""}${packet.deliveryStrategy.forbiddenPosture ? `; forbidden=${packet.deliveryStrategy.forbiddenPosture}` : ""}; length=${packet.deliveryStrategy.responseLength}; opening=${packet.deliveryStrategy.openingStyle}; tone=${packet.deliveryStrategy.toneTension}.`,
    `Wording boundaries: directness=${packet.deliveryStrategy.directnessLevel}; soothing=${packet.deliveryStrategy.soothingIntensity}; emotional_recurrence=${packet.deliveryStrategy.emotionalRecurrenceLevel}; familiarity=${packet.deliveryStrategy.responseFamiliarityMode}; companionship_action=${packet.deliveryStrategy.companionshipActionMode}; advice_action=${packet.deliveryStrategy.adviceActionMode}; avoid_recent_reply_shape=${packet.deliveryStrategy.avoidRecentReplyShape ? "yes" : "no"}; avoid_recent_opening_phrase=${packet.deliveryStrategy.avoidRecentOpeningPhrase ? "yes" : "no"}; stay_close_to_user_wording=${packet.deliveryStrategy.stayCloseToUserWording ? "yes" : "no"}; avoid_stock_soothing=${packet.deliveryStrategy.avoidStockSoothing ? "yes" : "no"}.`,
    `Text rendering: mode=${packet.deliveryStrategy.textRenderMode}; policy=${packet.deliveryStrategy.textFollowUpPolicy}; depth=${packet.deliveryStrategy.textFollowUpDepth}; sentences=${packet.deliveryStrategy.textSentenceCount}; second_sentence_role=${packet.deliveryStrategy.textSecondSentenceRole}; rhythm=${packet.deliveryStrategy.textRhythmVariant}; cleanup=${JSON.stringify(packet.deliveryStrategy.textCleanupPolicy)}; movement_mode=${packet.deliveryStrategy.movementImpulseMode ?? "none"}; repeated=${packet.deliveryStrategy.movementImpulseRepeated ? "yes" : "no"}; variant=${packet.deliveryStrategy.textVariantIndex}.`,
    `Image caption: policy=${packet.deliveryStrategy.captionPolicy}; sentences=${packet.deliveryStrategy.captionSentenceCount}; rhythm=${packet.deliveryStrategy.captionRhythmVariant}; scene=${packet.deliveryStrategy.captionScene}; variant=${packet.deliveryStrategy.captionVariantIndex}.`,
    `Artifact action: overall=${packet.deliveryStrategy.artifactAction}; image=${packet.deliveryStrategy.imageArtifactAction}; audio=${packet.deliveryStrategy.audioArtifactAction}.`,
    ...sceneDirectives,
    packet.deliveryStrategy.avoidances.length > 0
      ? `Avoid: ${packet.deliveryStrategy.avoidances.join("; ")}.`
      : ""
  ]
    .filter(Boolean)
    .join("\n");
}
