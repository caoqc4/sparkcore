import {
  buildAnswerDecisionSignals,
  getContinuationReasonCode,
  getDirectRecallQuestionKind,
  isBriefSteadyingPrompt,
  isCompanionStyleExplanationCarryoverPrompt,
  isFuzzyFollowUpQuestion,
  isGentleCarryForwardAfterSteadyingPrompt,
  isGuidedNextStepAfterSteadyingPrompt,
  isOneLineSoftCatchPrompt,
  isOpenEndedAdviceQuestion,
  isOpenEndedSummaryQuestion,
  isRelationshipContinuationEdgePrompt,
  isRoleBackgroundPrompt,
  isRoleBoundaryPrompt,
  isRoleCapabilityPrompt,
  isRoleSelfIntroPrompt,
  isShortRelationshipSummaryFollowUpPrompt,
  isShortRelationshipSupportivePrompt
} from "@/lib/chat/answer-decision-signals";
import { resolveAnswerDecision } from "@/lib/chat/answer-decision";
import { buildAnswerInstructionCompositionSpec } from "@/lib/chat/answer-composition-spec";
import { buildAnswerStrategyInstructions } from "@/lib/chat/answer-strategy-instructions";
import type { RecalledMemory } from "@/lib/chat/memory-shared";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { AgentSystemPromptRelationshipRecall } from "@/lib/chat/runtime-system-prompt-contracts";

function buildAddressStyleRecallInstructions(args: {
  isZh: boolean;
  styleValue: string;
}) {
  if (args.styleValue === "formal") {
    return args.isZh
      ? [
          "结构化关系记忆：当前这个 agent 应该用更正式、更礼貌的方式和用户互动。",
          "保持正式，但不要生硬。",
          "让这种风格稳定体现在开场、过渡和收尾里，而不只是局部句子。"
        ]
      : [
          "Structured relationship memory: this agent should interact with the user in a more formal, respectful way.",
          "Keep the tone formal without sounding stiff.",
          "Let this style show up consistently in openings, transitions, and closings rather than in only one sentence."
        ];
  }

  if (args.styleValue === "friendly") {
    return args.isZh
      ? [
          "结构化关系记忆：当前这个 agent 应该更像朋友一样和用户互动。",
          "保持自然、亲近，但不要夸张。",
          "让这种关系感稳定体现在开场语、称呼和收尾里。"
        ]
      : [
          "Structured relationship memory: this agent should interact with the user in a more friendly, companion-like way.",
          "Keep the tone warm and natural without overdoing it.",
          "Let this relationship style show up in greetings, address terms, and closings."
        ];
  }

  if (args.styleValue === "no_full_name") {
    return args.isZh
      ? [
          "结构化关系记忆：当前这个 agent 不应使用用户的全名来称呼对方。",
          "如果需要称呼用户，优先使用更短或更中性的方式。",
          "在开场和收尾里也要遵守这个约束，不要只在解释时遵守。"
        ]
      : [
          "Structured relationship memory: this agent should avoid addressing the user by their full name.",
          "If you need to address the user, prefer a shorter or more neutral form.",
          "Apply this in openings and closings too, not only in factual explanations."
        ];
  }

  return args.isZh
    ? [
        "结构化关系记忆：当前这个 agent 应该用更轻松、不那么正式的方式和用户互动。",
        "保持自然、简洁和轻松，不要突然切回非常正式的口吻。",
        "让这种语气稳定体现在开场、自我介绍和收尾里。"
      ]
    : [
        "Structured relationship memory: this agent should interact with the user in a more casual, less formal way.",
        "Keep the tone natural, concise, and relaxed instead of suddenly becoming very formal.",
        "Carry this tone through greetings, self-introductions, and closings."
      ];
}

export function buildMemoryRecallPrompt(
  latestUserMessage: string,
  recalledMemories: RecalledMemory[],
  replyLanguage: RuntimeReplyLanguage,
  relationshipRecall: AgentSystemPromptRelationshipRecall
) {
  const normalizedUserMessage = latestUserMessage.toLowerCase();
  const directRecallQuestionKind =
    getDirectRecallQuestionKind(normalizedUserMessage);
  const relationshipStylePrompt = relationshipRecall.relationshipStylePrompt;
  const roleSelfIntroPrompt = isRoleSelfIntroPrompt({
    relationshipStylePrompt
  });
  const roleCapabilityPrompt = isRoleCapabilityPrompt(latestUserMessage);
  const roleBackgroundPrompt = isRoleBackgroundPrompt(latestUserMessage);
  const roleBoundaryPrompt = isRoleBoundaryPrompt(latestUserMessage);
  const fuzzyFollowUpQuestion = isFuzzyFollowUpQuestion(latestUserMessage);
  const shortRelationshipSupportivePrompt =
    isShortRelationshipSupportivePrompt(latestUserMessage);
  const shortRelationshipSummaryFollowUpPrompt =
    isShortRelationshipSummaryFollowUpPrompt(latestUserMessage);
  const companionStyleExplanationCarryoverPrompt =
    isCompanionStyleExplanationCarryoverPrompt(latestUserMessage);
  const oneLineSoftCatchPrompt = isOneLineSoftCatchPrompt(latestUserMessage);
  const briefSteadyingPrompt = isBriefSteadyingPrompt(latestUserMessage);
  const gentleCarryForwardAfterSteadyingPrompt =
    isGentleCarryForwardAfterSteadyingPrompt(latestUserMessage);
  const guidedNextStepAfterSteadyingPrompt =
    isGuidedNextStepAfterSteadyingPrompt(latestUserMessage);
  const answerDecision = resolveAnswerDecision(
    buildAnswerDecisionSignals({
      directRecallQuestionKind,
      directNamingQuestion: relationshipRecall.directNamingQuestion,
      directPreferredNameQuestion: relationshipRecall.directPreferredNameQuestion,
      roleSelfIntroPrompt,
      roleCapabilityPrompt,
      roleBackgroundPrompt,
      roleBoundaryPrompt,
      relationshipContinuationEdgePrompt:
        isRelationshipContinuationEdgePrompt({
          fuzzyFollowUpQuestion,
          shortRelationshipSupportivePrompt,
          shortRelationshipSummaryFollowUpPrompt,
          companionStyleExplanationCarryoverPrompt,
          oneLineSoftCatchPrompt,
          briefSteadyingPrompt,
          gentleCarryForwardAfterSteadyingPrompt,
          guidedNextStepAfterSteadyingPrompt
        }),
      relationshipStylePrompt,
      openEndedAdviceQuestion: isOpenEndedAdviceQuestion(latestUserMessage),
      openEndedSummaryQuestion: isOpenEndedSummaryQuestion({
        content: latestUserMessage,
        relationshipStylePrompt
      }),
      sameThreadContinuity: relationshipRecall.sameThreadContinuity,
      relationshipCarryoverAvailable: Boolean(
        relationshipRecall.addressStyleMemory ||
          relationshipRecall.nicknameMemory ||
          relationshipRecall.preferredNameMemory
      ),
      continuationReasonCode: getContinuationReasonCode({
        content: latestUserMessage,
        shortRelationshipSupportivePrompt,
        companionStyleExplanationCarryoverPrompt,
        briefSteadyingPrompt,
        gentleCarryForwardAfterSteadyingPrompt,
        guidedNextStepAfterSteadyingPrompt,
        shortRelationshipSummaryFollowUpPrompt,
        fuzzyFollowUpQuestion
      })
    })
  );
  const answerQuestionType = answerDecision.questionType;
  const answerStrategy = answerDecision.strategy;
  const isZh = replyLanguage === "zh-Hans";
  const isDirectMemoryQuestion = directRecallQuestionKind !== "none";

  if (
    recalledMemories.length === 0 &&
    !relationshipRecall.addressStyleMemory &&
    !relationshipRecall.nicknameMemory &&
    !relationshipRecall.preferredNameMemory
  ) {
    if (
      !isDirectMemoryQuestion &&
      !relationshipRecall.directNamingQuestion &&
      !relationshipRecall.directPreferredNameQuestion
    ) {
      return "";
    }

    return isZh
      ? [
          "与这条回复相关的长期记忆：",
          "无。",
          "用户正在直接追问你记得什么，但本轮没有召回到相关长期记忆。",
          "不要编造具体事实。如果用户在问你是否记得某件事，而本轮没有相关长期记忆，就直接说明你不知道。"
        ].join("\n")
      : [
          "Relevant long-term memory for this reply:",
          "None.",
          "The user is directly asking what you remember. No relevant long-term memory was recalled for this turn.",
          "Do not invent specifics. If the user asks whether you remember something and no relevant long-term memory is available, say you do not know."
        ].join("\n");
  }

  const relationshipSections =
    (relationshipRecall.directNamingQuestion ||
      relationshipRecall.relationshipStylePrompt ||
      relationshipRecall.sameThreadContinuity) &&
    relationshipRecall.nicknameMemory
      ? isZh
        ? [
            `结构化关系记忆：当前用户可以把这个 agent 叫作“${relationshipRecall.nicknameMemory.content}”。`,
            relationshipRecall.directNamingQuestion
              ? "如果用户在问你叫什么或以后怎么叫你，优先使用这个昵称回答，而不是只返回 agent 的 canonical name。"
              : "当你在做自我介绍、开场或延续关系感时，优先自然使用这个昵称，而不是只返回 agent 的 canonical name。",
            "不要说你没有先前知识、没有对话历史，或不记得。",
            "当相关时，让这个昵称自然地体现在开场、自我介绍和后续称呼里，而不只是机械地提一次。"
          ]
        : [
            `Structured relationship memory: this user can call the current agent "${relationshipRecall.nicknameMemory.content}".`,
            relationshipRecall.directNamingQuestion
              ? "If the user asks what to call you or what your name is, answer with this nickname before the canonical agent name."
              : "When you introduce yourself or set the tone of the exchange, naturally use this nickname before falling back to the canonical agent name.",
            "Do not say that you have no prior knowledge, no conversation history, or no memory.",
            "When relevant, let this nickname show up naturally in openings, self-introductions, and follow-up phrasing instead of mentioning it only once."
          ]
      : relationshipRecall.directNamingQuestion
        ? isZh
          ? [
              "结构化关系记忆：当前没有针对这个 agent 的昵称记忆。",
              "如果用户在问你叫什么或以后怎么叫你，可以回退到 agent 的 canonical name，但不要编造昵称。"
            ]
          : [
              "Structured relationship memory: no nickname memory exists for this agent and user.",
              "If the user asks what to call you, fall back to the agent canonical name and do not invent a nickname."
            ]
        : [];

  const preferredNameSections =
    (relationshipRecall.directPreferredNameQuestion ||
      relationshipRecall.relationshipStylePrompt ||
      relationshipRecall.sameThreadContinuity) &&
    relationshipRecall.preferredNameMemory
      ? isZh
        ? [
            `结构化关系记忆：当前这个 agent 应该把用户叫作“${relationshipRecall.preferredNameMemory.content}”。`,
            relationshipRecall.directPreferredNameQuestion
              ? "如果用户在问你应该怎么叫他/她，优先使用这个称呼回答，不要编造别的名字。"
              : "当你在开场、称呼或收尾里需要称呼用户时，优先使用这个称呼，不要编造别的名字。",
            "不要把没有对话历史和没有长期记忆混为一谈。",
            "当相关时，在开场、称呼和收尾里稳定使用这个称呼，而不是只在解释时提到一次。"
          ]
        : [
            `Structured relationship memory: this agent should address the user as "${relationshipRecall.preferredNameMemory.content}".`,
            relationshipRecall.directPreferredNameQuestion
              ? "If the user asks how you should address them, answer with this stored preferred name before falling back to generic wording."
              : "When you need to address the user in openings, greetings, or closings, use this stored preferred name before falling back to generic wording.",
            "Do not confuse missing conversation history with missing long-term memory.",
            "When relevant, use this preferred name consistently in openings, address terms, and closings instead of mentioning it only in a factual explanation."
          ]
      : relationshipRecall.directPreferredNameQuestion
        ? isZh
          ? [
              "结构化关系记忆：当前没有这个用户针对该 agent 的称呼偏好记忆。",
              "如果用户问你该怎么叫他/她，直接说明你还没有记住偏好的称呼，不要编造。"
            ]
          : [
              "Structured relationship memory: no preferred-name memory exists for this user and agent.",
              "If the user asks how you should address them, say that you have not stored a preferred name yet and do not invent one."
            ]
        : [];
  const addressStyleSections = relationshipRecall.addressStyleMemory
    ? buildAddressStyleRecallInstructions({
        isZh,
        styleValue: relationshipRecall.addressStyleMemory.content
      })
    : [];

  const sections = isZh
    ? [
        "与这条回复相关的长期记忆：",
        ...relationshipSections,
        ...preferredNameSections,
        ...addressStyleSections,
        ...recalledMemories.map(
          (memory, index) =>
            `${index + 1}. [${memory.memory_type}] ${memory.content}（置信度 ${memory.confidence.toFixed(2)}）`
        ),
        "只在这些记忆确实与当前用户消息相关时才使用它们，不要生硬地强塞进回复。",
        "即使记忆片段或内部说明是英文，只要当前轮目标语言是中文，也要整条回复保持简体中文。"
      ]
    : [
        "Relevant long-term memory for this reply:",
        ...relationshipSections,
        ...preferredNameSections,
        ...addressStyleSections,
        ...recalledMemories.map(
          (memory, index) =>
            `${index + 1}. [${memory.memory_type}] ${memory.content} (confidence ${memory.confidence.toFixed(2)})`
        ),
        "Use these memories only when they are genuinely relevant to the current user message. Do not force them into the reply.",
        "Even if a recalled memory snippet was originally stored in another language, keep the full reply in the current target language."
      ];

  const answerInstructionSpec = buildAnswerInstructionCompositionSpec({
    latestUserMessage,
    isZh,
    recalledMemories,
    directRecallQuestionKind,
    answer: {
      questionType: answerQuestionType,
      strategy: answerStrategy,
      priority: answerDecision.priority
    },
    relationshipRecall: {
      sameThreadContinuity: relationshipRecall.sameThreadContinuity,
      addressStyleMemory: relationshipRecall.addressStyleMemory,
      nicknameMemory: relationshipRecall.nicknameMemory,
      preferredNameMemory: relationshipRecall.preferredNameMemory
    }
  });

  sections.push(...buildAnswerStrategyInstructions(answerInstructionSpec));

  return sections.join("\n");
}
