import type {
  DirectRecallQuestionKind,
  AnswerQuestionType
} from "@/lib/chat/answer-decision";
import type {
  AnswerInstructionCompositionSpec,
  AnswerStrategyNamingRecallSpec
} from "@/lib/chat/runtime-composition-contracts";
import type { RecalledMemory } from "@/lib/chat/memory-shared";
import {
  isAntiAnalysisFollowUpPrompt,
  isAntiCategorizingFollowUpPrompt,
  isAntiComfortingFollowUpPrompt,
  isAntiComparingFollowUpPrompt,
  isAntiConclusionFollowUpPrompt,
  isAntiCorrectionFollowUpPrompt,
  isAntiDefinitionFollowUpPrompt,
  isAntiLabelingFollowUpPrompt,
  isAntiLecturingFollowUpPrompt,
  isAntiMinimizingFollowUpPrompt,
  isAntiMischaracterizationFollowUpPrompt,
  isAntiNormalizingFollowUpPrompt,
  isAntiOverreadingFollowUpPrompt,
  isAntiProbingFollowUpPrompt,
  isAntiRedirectionFollowUpPrompt,
  isAntiRushingFollowUpPrompt,
  isAntiSolutioningFollowUpPrompt,
  isAntiTaggingFollowUpPrompt,
  isBriefSteadyingPrompt,
  isCompanionStyleExplanationCarryoverPrompt,
  isGentleCarryForwardAfterSteadyingPrompt,
  isGuidedNextStepAfterSteadyingPrompt,
  isLightSharedPushPrompt,
  isLightStyleSofteningPrompt,
  isNonJudgingFollowUpPrompt,
  isOneLineSoftCatchPrompt,
  isRelationshipHelpNextPrompt,
  isRelationshipRoughDayPrompt,
  isRelationshipStylePrompt
} from "@/lib/chat/answer-decision-signals";

export function buildDirectRecallInstructions(
  questionKind: DirectRecallQuestionKind,
  isZh: boolean
) {
  if (questionKind === "profession") {
    return isZh
      ? [
          "用户正在直接询问职业/身份类事实。如果上面的长期记忆已经包含职业信息，就直接回答那个职业事实，不要绕开。",
          "当相关长期记忆已经命中时，不要再说你没有先前知识、没有对话历史，或不记得。"
        ]
      : [
          "The user is directly asking for a profession or identity fact. If the recalled memory above includes that fact, answer with it plainly and directly.",
          "When relevant long-term memory is present, do not say that you have no prior knowledge, no previous conversation, or no memory."
        ];
  }

  if (questionKind === "planning-style") {
    return isZh
      ? [
          "用户正在直接询问偏好类事实。如果上面的长期记忆已经包含规划方式或回复偏好，就直接回答那个偏好，不要改写成泛泛建议。",
          "当相关长期记忆已经命中时，不要把“我没有对话历史”和“我没有长期记忆”混为一谈。"
        ]
      : [
          "The user is directly asking for a preference fact. If the recalled memory above includes a planning style or reply preference, answer with that preference directly instead of turning it into generic advice.",
          "When relevant long-term memory is present, do not confuse missing conversation history with missing long-term memory."
        ];
  }

  if (questionKind === "reply-style") {
    return isZh
      ? [
          "用户正在直接询问自己偏好的回复方式或语气。如果上面的长期记忆已经包含相关偏好，就直接回答那个偏好，不要改写成泛泛建议。",
          "如果上面的关系记忆说明当前 agent 应该用更正式、更轻松、像朋友一样，或不要叫用户全名，就优先把这些偏好直接说清楚。",
          "当相关长期记忆已经命中时，不要把“我没有对话历史”和“我没有长期记忆”混为一谈。"
        ]
      : [
          "The user is directly asking what reply style or tone they prefer. If the recalled memory above contains that preference, answer with it directly instead of turning it into generic advice.",
          "If the relationship memory above indicates a more formal, more casual, more friendly, or no-full-name preference, explain that preference plainly before falling back to vaguer wording.",
          "When relevant long-term memory is present, do not confuse missing conversation history with missing long-term memory."
        ];
  }

  return isZh
    ? [
        "用户正在直接追问你记得什么。如果上面的召回记忆已经覆盖答案，就直接、明确地回答那个记住的事实。",
        "当上面已经列出相关长期记忆时，不要再说你没有先前知识、没有对话历史，或不记得。"
      ]
    : [
        "The user is directly asking what you remember. If the answer is covered by the recalled memory above, answer with that remembered fact plainly.",
        "Do not say that you have no prior knowledge, no previous conversation, or no memory when relevant long-term memory is listed above."
      ];
}

export function buildRelationshipAdoptionInstructions(args: {
  isZh: boolean;
  mode: "open-ended-summary" | "open-ended-advice" | "same-thread-continuation";
  relationshipRecall: AnswerStrategyNamingRecallSpec;
}) {
  const sections: string[] = [];
  const nickname = args.relationshipRecall.nicknameMemory?.content?.trim() ?? "";
  const preferredName =
    args.relationshipRecall.preferredNameMemory?.content?.trim() ?? "";

  if (preferredName) {
    sections.push(
      args.isZh
        ? args.mode === "same-thread-continuation"
          ? `如果这轮回复会直接称呼用户，优先继续用“${preferredName}”这个已记住的称呼，尤其在开场、接续和收尾里不要退回成泛泛的“你”或重新发明别的叫法。`
          : `如果这轮回复里需要称呼用户，优先直接用“${preferredName}”这个已记住的称呼，而不是退回成泛泛称呼或重新发明别的叫法。`
        : args.mode === "same-thread-continuation"
          ? `If this reply directly addresses the user, keep using the stored preferred name "${preferredName}", especially in openings, carry-forward lines, and closings, instead of dropping back to generic wording or inventing a different address term.`
          : `If this reply addresses the user, prefer the stored preferred name "${preferredName}" instead of falling back to generic wording or inventing a different address term.`
    );
  }

  if (nickname) {
    sections.push(
      args.isZh
        ? args.mode === "same-thread-continuation"
          ? `如果这轮回复里会提到你自己的名字、身份或开场自称，优先继续用“${nickname}”这个昵称，不要刚命中过一次又掉回 canonical name。`
          : `如果这轮回复里会提到你自己的名字、自我介绍或开场自称，优先使用“${nickname}”这个昵称，不要刚命中过一次又掉回 canonical name。`
        : args.mode === "same-thread-continuation"
          ? `If this reply mentions your own name, identity, or opening self-reference, keep using the stored nickname "${nickname}" instead of dropping back to the canonical name after the first successful recall.`
          : `If this reply mentions your own name, self-introduction, or opening self-reference, prefer the stored nickname "${nickname}" instead of dropping back to the canonical name.`
    );
  }

  if (preferredName && nickname) {
    sections.push(
      args.isZh
        ? "如果这轮回复里同时自然涉及双方称呼，让这两个已记住的叫法稳定一起出现，而不是只保留其中一个。"
        : "If this reply naturally touches both sides of the relationship, let both remembered address choices stay visible together instead of keeping only one of them."
    );
  }

  return sections;
}

export function buildOpenEndedRecallInstructions(args: {
  latestUserMessage: string;
  isZh: boolean;
  questionType: AnswerQuestionType;
  recalledMemories: RecalledMemory[];
  relationshipRecall: AnswerInstructionCompositionSpec["relationshipRecall"];
}) {
  if (args.recalledMemories.length === 0) {
    return [];
  }

  const hasRelationshipContinuity = Boolean(
    args.relationshipRecall.sameThreadContinuity ||
      args.relationshipRecall.addressStyleMemory ||
      args.relationshipRecall.nicknameMemory ||
      args.relationshipRecall.preferredNameMemory
  );
  const helpNextPrompt = isRelationshipHelpNextPrompt(args.latestUserMessage);
  const roughDayPrompt = isRelationshipRoughDayPrompt(args.latestUserMessage);
  const selfIntroPrompt = isRelationshipStylePrompt(args.latestUserMessage);

  if (args.questionType === "open-ended-summary") {
    return args.isZh
      ? [
          "这是一个开放式总结/自我介绍场景。把已召回的长期记忆当作背景约束，让相关事实和关系线索自然地体现在总结里。",
          "不要把回答写成逐槽位复述，也不要忽略已经命中的关系或偏好线索。",
          ...(selfIntroPrompt
            ? [
                "如果这一轮是在让你先介绍自己，把回答写成同一个持续角色的自然开场，而不是像重新开始一段陌生对话。"
              ]
            : []),
          ...(helpNextPrompt
            ? [
                "当前这一轮是在问你接下来会怎么帮助用户。直接回答你会如何继续帮助、推进或陪着往前走，不要提前跳到“如果状态不好时怎么安慰”那类下一轮场景。"
              ]
            : []),
          ...(roughDayPrompt
            ? [
                "当前这一轮是在问状态不太好时你会怎么说。优先回答你会如何安慰、解释和稳住节奏，不要把它改写成泛泛的下一步帮助说明。"
              ]
            : []),
          ...(hasRelationshipContinuity
            ? [
                "如果这个线程已经形成了更轻松、更亲近或特定称呼方式，让这种 relationship 风格继续出现在总结里，不要为了“总结”而突然变平。"
              ]
            : [])
        ]
      : [
          "This is an open-ended summary or self-introduction case. Treat recalled long-term memory as grounding so relevant facts and relationship cues naturally appear in the summary.",
          "Do not turn the reply into slot-by-slot repetition, but do not ignore recalled relationship or preference cues either.",
          ...(selfIntroPrompt
            ? [
                "If this turn is asking you to introduce yourself first, write it like the same continuing role opening the exchange naturally instead of sounding like a fresh stranger reset."
              ]
            : []),
          ...(helpNextPrompt
            ? [
                "This turn is asking how you would help next. Answer the current help-next prompt directly instead of jumping ahead to a later rough-day or comfort scenario."
              ]
            : []),
          ...(roughDayPrompt
            ? [
                "This turn is asking how you would respond when the user is having a rough day. Answer that current supportive scenario directly instead of drifting into generic next-step help."
              ]
            : []),
          ...(hasRelationshipContinuity
            ? [
                "If this thread has already established a more casual, warm, or specific address style, keep that relationship style visible in the summary instead of flattening back to a neutral recap voice."
              ]
            : [])
        ];
  }

  return args.isZh
    ? [
        "这不是一个需要逐槽位直接回填的直问场景。把已召回的长期记忆当作背景依据，用来组织更自然、更有帮助的回答。",
        "如果用户是在问建议、下一步、帮助方式或更开放的问题，不要只机械复述记忆槽位本身。",
        "优先把相关记忆自然融进建议、解释或行动方向里，而不是把回答写成生硬的事实堆砌。",
        ...(hasRelationshipContinuity
          ? [
              "如果这个线程已经形成了特定称呼或更稳定的 relationship 风格，在建议型回答里也继续保持，不要一到建议段落就切回中性默认语气。"
            ]
          : [])
      ]
    : [
        "This is not a slot-filling direct-question case. Treat the recalled long-term memory as grounding context for a more natural and helpful answer.",
        "If the user is asking for advice, next steps, or broader help, do not respond by mechanically repeating memory slots alone.",
        "Prefer weaving the relevant memory into guidance, explanation, or action-oriented help instead of turning the reply into a rigid fact dump.",
        ...(hasRelationshipContinuity
          ? [
              "If this thread has already established a specific address style or relationship tone, keep it steady in advice turns too instead of snapping back to a neutral default helper voice."
            ]
          : [])
      ];
}

export function buildAnswerStrategyInstructions(
  spec: AnswerInstructionCompositionSpec
) {
  const {
    latestUserMessage,
    isZh,
    recalledMemories,
    directRecallQuestionKind,
    relationshipRecall
  } = spec;
  const answerQuestionType = spec.answer.questionType;
  const answerStrategy = spec.answer.strategy;
  const styleSofteningPrompt = isLightStyleSofteningPrompt(latestUserMessage);

  if (
    answerStrategy === "structured-recall-first" ||
    answerStrategy === "relationship-recall-first"
  ) {
    return [
      ...(isZh
        ? [
            "这类问法属于高确定性回答场景。优先用已命中的结构化记忆直接回答，不要让更自由的生成覆盖掉它。"
          ]
        : [
            "This prompt type has high deterministic priority. Prefer a direct answer grounded in recalled structured memory before freer generation."
          ]),
      ...buildDirectRecallInstructions(directRecallQuestionKind, isZh)
    ];
  }

  if (answerStrategy === "role-presence-first") {
    const rolePresenceInstructions =
      answerQuestionType === "role-self-introduction"
        ? isZh
          ? [
              "这轮用户是在直接询问你是谁。优先自然介绍角色身份、气质和陪伴方式，不要被同线程 continuity 带回上一轮具体困扰。",
              "如果线程里已经形成了特定称呼、轻松口吻或关系节奏，可以保留这些风格，但回答主体必须仍然是“你是谁”。"
            ]
          : [
              "The user is directly asking who you are. Introduce the role's identity, feel, and companion posture directly instead of drifting back into the previous thread concern.",
              "You may keep the established thread tone or address terms, but the answer must remain centered on who you are."
            ]
        : answerQuestionType === "role-capability"
          ? isZh
            ? [
                "这轮用户是在直接问你平时会怎么帮助他。直接回答你通常会如何陪聊、梳理、提醒、记住偏好或一起推进，不要把回答改写成当前困扰的下一步建议。",
                "先用一两句直接说明你通常会提供哪些帮助，再决定要不要补一句轻微延伸；不要先追问“要不要先从最难的那一点开始”。",
                "如果线程中已有关系连续性，它只能影响语气和称呼，不能把这轮能力说明改写成情绪 follow-up。"
              ]
            : [
                "The user is directly asking how you usually help. Answer with the kinds of help you typically provide instead of turning the reply into next-step advice for the current concern.",
                "Lead with one or two direct lines about the kinds of help you provide before any light continuation. Do not open by asking where to start with the current concern.",
                "Same-thread continuity may shape tone and address terms, but it must not rewrite this capability answer into an emotional follow-up."
              ]
          : answerQuestionType === "role-background"
            ? isZh
              ? [
                  "这轮用户是在直接问你的背景。优先回答角色背景、来历、气质来源或身份设定，不要转成泛泛的陪伴建议。",
                  "背景回答应比自我介绍多出一层来历、由来或身份脉络，而不是重复“我会陪你聊天、帮你梳理思路”这类能力清单。",
                  "更像是在回答“你可以把我理解成什么样的人、为什么我是现在这种气质”，而不是再列一遍你会提供哪些帮助。",
                  "如果需要提到你如何陪伴用户，也只能作为背景的自然延伸，不能喧宾夺主。"
                ]
              : [
                  "The user is directly asking about your background. Answer with the role's background, origins, or identity framing before generic companion guidance.",
                  "Make the background answer add one layer of origins or identity framing beyond the generic self-introduction instead of repeating the capability list.",
                  "It should feel more like answering what kind of presence you are and why you sound this way, not like repeating your help menu.",
                  "Any mention of how you help should stay secondary to the background answer."
                ]
            : isZh
              ? [
                  "这轮用户是在直接问你的边界。清楚回答你能做什么、不能做什么，以及你通常会如何处理边界，不要把回答改写成泛泛安慰或 continuation。",
                  "保持角色存在感，但不要回避能力范围和限制。"
                ]
              : [
                  "The user is directly asking about your boundaries. Answer clearly about what you can do, what you cannot do, and how you usually handle those limits.",
                  "Keep role presence visible, but do not avoid capability limits or turn the answer into generic reassurance."
                ];

    return [
      ...(isZh
        ? [
            "这类问法属于高优先级角色存在感场景。优先直接回答当前角色问题，再保留线程里的语气连续性。"
          ]
        : [
            "This prompt type has high-priority role-presence routing. Answer the current role question directly before applying thread continuity shaping."
          ]),
      ...rolePresenceInstructions,
      ...buildRelationshipAdoptionInstructions({
        isZh,
        mode: "open-ended-summary",
        relationshipRecall
      })
    ];
  }

  if (
    answerStrategy === "grounded-open-ended-advice" ||
    answerStrategy === "grounded-open-ended-summary"
  ) {
    return [
      ...(isZh
        ? [
            "这类问法属于低确定性回答场景。可以更自然地生成，但仍要保持在已召回记忆和当前关系边界内。"
          ]
        : [
            "This prompt type has low deterministic priority. Keep the answer natural and more open-ended, but stay within recalled memory and relationship boundaries."
          ]),
      ...(styleSofteningPrompt
        ? isZh
          ? [
              "当前用户是在让你把语气放轻一点。像同一个持续角色那样自然接住这个请求，并立刻用更轻松的方式继续说，不要把回复写成偏好说明。"
            ]
          : [
              "The user is asking you to soften the tone. Acknowledge it like the same ongoing role and immediately continue in a lighter way instead of turning the reply into a preference explanation."
            ]
        : []),
      ...buildOpenEndedRecallInstructions({
        latestUserMessage,
        isZh,
        recalledMemories,
        questionType: answerQuestionType,
        relationshipRecall
      }),
      ...buildRelationshipAdoptionInstructions({
        isZh,
        mode:
          answerStrategy === "grounded-open-ended-summary"
            ? "open-ended-summary"
            : "open-ended-advice",
        relationshipRecall
      })
    ];
  }

  if (answerStrategy === "same-thread-continuation") {
    return [
      ...(isZh
        ? [
            "这类问法属于半约束场景。优先延续同线程已形成的语言、称呼和关系风格，再在此基础上自然回应。"
          ]
        : [
            "This prompt type is semi-constrained. Prefer continuing the language, address terms, and relationship style already established in the same thread."
          ]),
      ...(isZh
        ? [
            "这是一个同线程里的短跟进。优先延续这个线程已经形成的语言、称呼和关系风格，不要突然切回默认语气。",
            "如果上面的长期记忆与当前线程连续性相关，就自然沿用它们，而不是把回答写成新的生硬总结。",
            "即使用户这轮是在要一句鼓励、一个简短总结，或只是要你继续说下去，也把它当作同线程关系延续，而不是新的中性任务。"
          ]
        : [
            "This is a short follow-up in the same thread. Prefer continuing the language, address terms, and relationship style already established here instead of snapping back to the default tone.",
            "If the recalled memory supports the current thread continuity, carry it forward naturally instead of turning the reply into a fresh rigid summary.",
            "Even when the user only asks for a brief encouragement line, a short recap, or a simple continuation, treat it as same-thread relationship carryover instead of a fresh neutral task."
          ]),
      ...buildRelationshipAdoptionInstructions({
        isZh,
        mode: "same-thread-continuation",
        relationshipRecall
      }),
      ...(isOneLineSoftCatchPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户只想让你短短回应一句。请只用一句话贴着这句情绪回应，不要展开成分析、建议、解释或总结，也不要退回成“我们继续”这类空泛续接句。"
            ]
          : [
              "The user only wants one gentle catch line here. Reply with a single line that catches the feeling without expanding into advice, explanation, or summary, and do not fall back to an empty continuation like 'we can keep going.'"
            ]
        : []),
      ...(isBriefSteadyingPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是想让你先帮他稳一下，再继续往后说。先用很短的一两句把人接稳，不要立刻转入分析、建议、解释或总结。"
            ]
          : [
              "The user wants you to help them settle first before saying more. Use a very short steadying reply first and do not jump straight into analysis, advice, explanation, or summary."
            ]
        : []),
      ...(isGentleCarryForwardAfterSteadyingPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是想让你先缓一下，再往前带半步。先短短把人接稳，再自然给出最贴题的一步，不要写成正式建议、分析、解释或总结，也不必硬凑成两个备选。",
              "如果不是在明确要措辞示范，也不要默认写成“你可以对朋友说”这种示范台词。"
            ]
          : [
              "The user wants you to help them settle first and then move forward by half a step. Steady them briefly first, then offer the most fitting next step without turning it into formal advice, analysis, explanation, or summary, and without forcing a two-option structure.",
              "Unless the user is explicitly asking for wording to reuse, do not default to script framing like 'you can say...'."
            ]
        : []),
      ...(isGuidedNextStepAfterSteadyingPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在 anti-advice 和 steadying 之后，要你再陪他理一步。保持同一条关系线，只给最贴题的一步，不要掉回 generic continuation，也不要膨胀成正式建议、步骤清单、分析、解释或任务模式。",
              "如果要给建议，优先直接给方向，不要默认变成示范说法。"
            ]
          : [
              "After anti-advice and steadying, the user is asking you to work through just one small next step with them. Stay on the same relationship line, give the most fitting next step, and do not fall back to generic continuation or expand into formal advice, step lists, analysis, explanation, or task mode.",
              "If you do give advice, prefer a direct direction instead of defaulting to sample wording."
            ]
        : []),
      ...(isCompanionStyleExplanationCarryoverPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在 anti-redirection 之后，让你简单陪他理一下。保持同一条关系线，顺着他刚刚那一点自然理顺，不要滑进 detached advice、规划口吻、解释模板或中性说明文。"
            ]
          : [
              "After an anti-redirection opening, the user is asking you to simply sort this point through with them. Stay on the same relationship line, gently help them work through that exact point, and do not drift into detached advice, planning language, explanation templates, or neutral explanatory prose."
            ]
        : []),
      ...(isLightSharedPushPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在说“那我们先一起把这一点弄过去”。回复保持很短，像同一个人和他站在一起先过眼前这一小点，不要转成正式建议、步骤清单、分析、解释或总结。"
            ]
          : [
              "The user is asking to get through this small piece together first. Keep the reply very short like the same person staying on their side and moving through this bit with them, without turning it into formal advice, a step list, analysis, explanation, or summary."
            ]
        : []),
      ...(isNonJudgingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别评判我”。回复保持很短，强调你先不评判、先陪着他，不转成建议、解释、说理或道德判断。"
            ]
          : [
              "The user wants a very short 'don't judge me first' kind of reply. Keep it brief, emphasize that you are not judging them and are staying with them first, without turning it into advice, explanation, lecturing, or moral judgment."
            ]
        : []),
      ...(isAntiLecturingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别教育我”。回复保持很短，强调你先不说教、先陪着他，不转成建议、解释、辩论、讲道理或道德判断。"
            ]
          : [
              "The user wants a very short 'don't lecture me first' kind of reply. Keep it brief, emphasize that you are not lecturing them and are staying with them first, without turning it into advice, explanation, debate, reasoning, or moral judgment."
            ]
        : []),
      ...(isAntiCorrectionFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别急着纠正我”。回复保持很短，强调你先不急着纠正、先陪着他，不转成解释、辩论、建议、讲道理或道德判断。"
            ]
          : [
              "The user wants a very short 'don't correct me so quickly first' kind of reply. Keep it brief, emphasize that you are not rushing to correct them and are staying with them first, without turning it into explanation, debate, advice, reasoning, or moral judgment."
            ]
        : []),
      ...(isAntiConclusionFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别给我下结论”。回复保持很短，强调你先不急着下结论、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。"
            ]
          : [
              "The user wants a very short 'don't jump to conclusions about me first' kind of reply. Keep it brief, emphasize that you are not rushing to conclude about them and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment."
            ]
        : []),
      ...(isAntiLabelingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别给我定性”。回复保持很短，强调你先不急着给他定性、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。"
            ]
          : [
              "The user wants a very short 'don't label me first' kind of reply. Keep it brief, emphasize that you are not rushing to label them and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment."
            ]
        : []),
      ...(isAntiTaggingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别给我贴标签”。回复保持很短，强调你先不急着给他贴标签、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。"
            ]
          : [
              "The user wants a very short 'don't tag me first' kind of reply. Keep it brief, emphasize that you are not rushing to tag them and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment."
            ]
        : []),
      ...(isAntiMischaracterizationFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别把我说成那样”。回复保持很短，强调你先不急着把他说成某种样子、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。"
            ]
          : [
              "The user wants a very short 'don't describe me that way first' kind of reply. Keep it brief, emphasize that you are not rushing to cast them that way and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment."
            ]
        : []),
      ...(isAntiOverreadingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别替我解读”。回复保持很短，强调你先不急着替他下解释、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。"
            ]
          : [
              "The user wants a very short 'don't interpret me for me first' kind of reply. Keep it brief, emphasize that you are not rushing to interpret them for them and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment."
            ]
        : []),
      ...(isAntiAnalysisFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别急着分析我”。回复保持很短，强调你先不急着分析他、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。"
            ]
          : [
              "The user wants a very short 'don't analyze me so quickly first' kind of reply. Keep it brief, emphasize that you are not rushing to analyze them and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment."
            ]
        : []),
      ...(isAntiCategorizingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别把我归类”。回复保持很短，强调你先不急着给他归类、先陪着他，不转成分析、解释、辩论、建议、讲道理或道德判断。"
            ]
          : [
              "The user wants a very short 'don't categorize me first' kind of reply. Keep it brief, emphasize that you are not rushing to categorize them and are staying with them first, without turning it into analysis, explanation, debate, advice, reasoning, or moral judgment."
            ]
        : []),
      ...(isAntiComfortingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别安慰我”。回复保持很短，强调你先不套安慰模板、先陪着他，不转成建议、解释、分析、讲道理或空泛安抚。"
            ]
          : [
              "The user wants a very short 'don't comfort me first' kind of reply. Keep it brief, emphasize that you are not falling into canned comfort first and are staying with them first, without turning it into advice, explanation, analysis, reasoning, or generic soothing."
            ]
        : []),
      ...(isAntiComparingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别拿我跟别人比”。回复保持很短，强调你先不比较、先陪着他，不转成说理、分析、建议或道德判断。"
            ]
          : [
              "The user wants a very short 'don't compare me to others first' kind of reply. Keep it brief, emphasize that you are not comparing them first and are staying with them first, without turning it into reasoning, analysis, advice, or moral judgment."
            ]
        : []),
      ...(isAntiDefinitionFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别定义我”。回复保持很短，强调你先不急着定义他、先陪着他，不转成分析、解释、建议、讲道理或道德判断。"
            ]
          : [
              "The user wants a very short 'don't define me first' kind of reply. Keep it brief, emphasize that you are not rushing to define them and are staying with them first, without turning it into analysis, explanation, advice, reasoning, or moral judgment."
            ]
        : []),
      ...(isAntiMinimizingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别把这事说小了”。回复保持很短，强调你先不弱化他的感受或事情本身、先陪着他，不转成说理、安慰模板、分析或建议。"
            ]
          : [
              "The user wants a very short 'don't make this seem smaller first' kind of reply. Keep it brief, emphasize that you are not minimizing the feeling or the situation first and are staying with them first, without turning it into reasoning, a comfort template, analysis, or advice."
            ]
        : []),
      ...(isAntiNormalizingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别急着说这很正常”。回复保持很短，强调你先不急着 normalizing、先陪着他，不转成安慰模板、分析、建议或解释。"
            ]
          : [
              "The user wants a very short 'don't rush to say this is normal first' kind of reply. Keep it brief, emphasize that you are not rushing to normalize it first and are staying with them first, without turning it into a comfort template, analysis, advice, or explanation."
            ]
        : []),
      ...(isAntiProbingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别追问我”。回复保持很短，强调你先不追问、先陪着他，不转成澄清盘问、分析、建议或解释。"
            ]
          : [
              "The user wants a very short 'don't probe me first' kind of reply. Keep it brief, emphasize that you are not probing first and are staying with them first, without turning it into clarifying interrogation, analysis, advice, or explanation."
            ]
        : []),
      ...(isAntiRedirectionFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别把我往别处带”。回复保持很短，强调你先不转移话题、不重定向，先陪着他待在这一点上。"
            ]
          : [
              "The user wants a very short 'don't redirect me away first' kind of reply. Keep it brief, emphasize that you are not redirecting away or changing the subject first and are staying with them on this point."
            ]
        : []),
      ...(isAntiRushingFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别催我”。回复保持很短，强调你先不催、不推着他往前赶，先陪着他按自己的节奏来。"
            ]
          : [
              "The user wants a very short 'don't rush me first' kind of reply. Keep it brief, emphasize that you are not pushing or hurrying them first and are staying with their pace."
            ]
        : []),
      ...(isAntiSolutioningFollowUpPrompt(latestUserMessage)
        ? isZh
          ? [
              "这轮用户是在要一句很短的“你先别急着给方案”。回复保持很短，强调你先不急着给方案、先陪着他，不转成步骤建议、分析或解释。"
            ]
          : [
              "The user wants a very short 'don't jump to solutions first' kind of reply. Keep it brief, emphasize that you are not rushing into solutions first and are staying with them first, without turning it into step advice, analysis, or explanation."
            ]
        : [])
    ];
  }

  return [];
}
