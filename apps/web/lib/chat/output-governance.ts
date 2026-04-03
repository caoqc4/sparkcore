import type { RuntimeMemoryContext } from "@/lib/chat/memory-recall";
import type { RecalledMemory } from "@/lib/chat/memory-shared";
import type { AgentRecord, RoleCorePacket, RuntimeReplyLanguage } from "@/lib/chat/role-core";
import type { SessionContext } from "@/lib/chat/session-context";
import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";
import {
  resolveProductRoleCore,
  resolveStoredProductRoleAppearance,
} from "@/lib/product/role-core";

export type RoleExpressionPacketV1 = {
  packet_version: "v1";
  identity: {
    agent_id: string;
    agent_name: string;
  };
  role_mode: string;
  role_traits: {
    tone: string | null;
    proactivity_level: string | null;
    relationship_mode: string | null;
    avatar_gender: string | null;
    avatar_style: string | null;
    identity_archetype: string;
    background_summary: string | null;
  };
  persona_summary: string | null;
  style_guidance: string | null;
  relationship_stance: {
    effective: string;
    source: string;
  };
  expression_principles: string[];
  avoidance_principles: string[];
};

export type RelationshipStatePacketV1 = {
  packet_version: "v1";
  relationship_stage: string | null;
  preferred_response_style: string[];
  avoid_response_style: string[];
  current_relational_adjustments: string[];
  volatile_override: {
    label: string | null;
    strength: "low" | "medium" | "high" | null;
    directives: string[];
    source_signals: string[];
  } | null;
};

export type SceneDeliveryPacketV1 = {
  packet_version: "v1";
  modality: "text" | "image" | "audio" | "multimodal";
  reply_length_target: "short" | "medium" | "long";
  language_target: string | null;
  continuity_mode: string | null;
  delivery_mode: {
    artifact_first: boolean;
    suppress_redundant_text: boolean;
    caption_like_copy: boolean;
  };
  scene_bias: string[];
};

export type OutputGovernancePacketV1 = {
  packet_version: "v1";
  expression_brief: string;
  relational_brief: string;
  scene_brief: string;
  knowledge_brief: string;
  role_mode: string;
  role_identity_archetype: string | null;
  role_tone: string | null;
  role_proactivity_level: string | null;
  role_relationship_mode: string | null;
  volatile_override_label: string | null;
  volatile_override_strength: "low" | "medium" | "high" | null;
  knowledge_route_label:
    | "no_knowledge"
    | "light_knowledge"
    | "domain_knowledge"
    | "artifact_knowledge";
  knowledge_intent_label:
    | "relational_only"
    | "role_flavoring"
    | "task_support"
    | "factual_or_domain"
    | "artifact_captioning";
  avoidances: string[];
  modality_rules: string[];
  source_signals: string[];
};

export type PreparedOutputGovernanceV1 = {
  role_expression: RoleExpressionPacketV1;
  relationship_state: RelationshipStatePacketV1;
  scene_delivery: SceneDeliveryPacketV1;
  knowledge_route: {
    route:
      | "no_knowledge"
      | "light_knowledge"
      | "domain_knowledge"
      | "artifact_knowledge";
    intent:
      | "relational_only"
      | "role_flavoring"
      | "task_support"
      | "factual_or_domain"
      | "artifact_captioning";
    rationale: string;
  };
  output_governance: OutputGovernancePacketV1;
};

type GovernanceRecentMessage = {
  role: "user" | "assistant";
  content: string;
  status?: string;
};

type PromptGovernanceSignals = {
  self_intro: boolean;
  help_next: boolean;
  rough_day: boolean;
  supportive: boolean;
  supportive_short: boolean;
  anti_analysis: boolean;
  anti_advice: boolean;
  anti_lecturing: boolean;
  anti_redirection: boolean;
  same_side: boolean;
  presence_confirming: boolean;
};

function trimText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getProductRoleMode(metadata: unknown): "companion" | "assistant" | null {
  const record = getRecord(metadata);
  const roleCore = getRecord(record?.product_role_core);
  const mode = trimText(roleCore?.mode);

  if (mode === "assistant" || mode === "companion") {
    return mode;
  }

  const sourceSlug = trimText(record?.source_slug);
  if (sourceSlug === "product_assistant") {
    return "assistant";
  }

  return null;
}

function resolveRoleModeLabel(mode: string) {
  if (mode === "assistant") {
    return "assistant";
  }

  if (mode === "companion") {
    return "companion";
  }

  return "role";
}

function resolveRoleIdentityArchetype(args: {
  mode: string;
  avatarGender: string | null;
}) {
  if (args.mode === "assistant") {
    return "human-like assistant";
  }

  if (args.avatarGender === "female") {
    return "female companion";
  }

  if (args.avatarGender === "male") {
    return "male companion";
  }

  return "steady companion";
}

function getBackgroundSummary(metadata: unknown) {
  const record = getRecord(metadata);
  const backgroundSummary = trimText(record?.background_summary);
  return backgroundSummary.length > 0 ? backgroundSummary : null;
}

function buildPromptGovernanceSignals(content: string): PromptGovernanceSignals {
  const normalized = content.normalize("NFKC").trim().toLowerCase();
  const includesAny = (patterns: string[]) =>
    patterns.some((pattern) => normalized.includes(pattern));

  const selfIntro = includesAny([
    "请简单介绍一下你自己",
    "简单介绍一下你自己",
    "先简单介绍一下你自己",
    "你先介绍一下你自己吧",
    "你先介绍下你自己吧",
    "先和我介绍一下你自己",
    "简单说说你自己",
    "简短和我打个招呼",
    "introduce yourself briefly",
    "briefly introduce yourself",
    "introduce yourself first",
    "tell me who you are first",
    "greet me briefly",
    "say a quick hello"
  ]);
  const helpNext = includesAny([
    "接下来你会怎么帮助我",
    "接下来你会怎么帮我继续",
    "接下来你会怎么陪我继续",
    "你会怎么帮助我",
    "你会怎么帮我往前推进",
    "你会怎么陪我往前走",
    "how would you help me continue",
    "how would you help me next",
    "what will you do next to help me"
  ]);
  const roughDay = includesAny([
    "如果我今天状态不太好",
    "你会怎么和我说",
    "你会怎么安慰我",
    "how would you explain that",
    "how would you say that to me",
    "if i was having a rough day"
  ]);
  const supportive = includesAny([
    "鼓励我一句",
    "安慰我一句",
    "安慰我一下",
    "轻轻接我一下",
    "接住我一下",
    "陪陪我",
    "支持我一下",
    "给我一点鼓励",
    "if i feel a bit overwhelmed",
    "encourage me a bit",
    "comfort me a little"
  ]);
  const antiAnalysis = includesAny(["别急着分析我", "别分析我", "don't analyze me"]);
  const antiAdvice = includesAny([
    "别急着给我建议",
    "别上来就给我建议",
    "别急着帮我解决",
    "别上来就帮我解决",
    "don't rush to give me advice",
    "don't rush to solve this for me"
  ]);
  const antiLecturing = includesAny([
    "别教育我",
    "别给我上课",
    "别跟我说教",
    "don't lecture me",
    "don't preach to me"
  ]);
  const antiRedirection = includesAny([
    "别转移话题",
    "别岔开话题",
    "don't redirect the topic",
    "don't veer off the topic"
  ]);
  const sameSide = includesAny(["站我这边", "be on my side first"]);
  const presenceConfirming = includesAny([
    "别走开",
    "还在吗",
    "陪着我",
    "still here",
    "don't go away yet"
  ]);
  const supportiveShort =
    supportive ||
    antiAnalysis ||
    antiAdvice ||
    antiLecturing ||
    antiRedirection ||
    sameSide ||
    presenceConfirming ||
    normalized.includes("回我一句就好") ||
    normalized.includes("缓一下，再说");

  return {
    self_intro: selfIntro,
    help_next: helpNext,
    rough_day: roughDay,
    supportive,
    supportive_short: supportiveShort,
    anti_analysis: antiAnalysis,
    anti_advice: antiAdvice,
    anti_lecturing: antiLecturing,
    anti_redirection: antiRedirection,
    same_side: sameSide,
    presence_confirming: presenceConfirming
  };
}

function listActivePromptGovernanceSignals(
  signals: PromptGovernanceSignals
): string[] {
  return Object.entries(signals)
    .filter(([, active]) => active)
    .map(([name]) => name);
}

function inferRequestedModality(
  input: RuntimeTurnInput
): SceneDeliveryPacketV1["modality"] {
  const metadata = getRecord(input.message.metadata);
  const generationHint = trimText(metadata?.assistant_generation_hint).toLowerCase();

  const imageRequested =
    generationHint.includes("explicitly requested an image") ||
    generationHint.includes("image has already been prepared");
  const audioRequested =
    generationHint.includes("explicitly requested an audio reply") ||
    generationHint.includes("speak exactly this text as your audio reply");

  if (imageRequested && audioRequested) {
    return "multimodal";
  }

  if (imageRequested) {
    return "image";
  }

  if (audioRequested) {
    return "audio";
  }

  return "text";
}

function inferReplyLengthTarget(args: {
  latestUserMessage: string;
  modality: SceneDeliveryPacketV1["modality"];
  approxContextPressure: SessionContext["approx_context_pressure"];
  signals: PromptGovernanceSignals;
}) {
  if (args.modality === "audio") {
    return "short" as const;
  }

  if (args.modality === "image" || args.modality === "multimodal") {
    return "short" as const;
  }

  const normalized = args.latestUserMessage.normalize("NFKC").trim();
  if (args.signals.supportive_short) {
    return "short" as const;
  }

  if (args.signals.self_intro || args.signals.help_next || args.signals.rough_day) {
    return "medium" as const;
  }

  if (normalized.length <= 24 || /^好|嗯|继续|你好|hi|hello$/iu.test(normalized)) {
    return "short" as const;
  }

  if (args.approxContextPressure === "high") {
    return "short" as const;
  }

  if (args.approxContextPressure === "elevated") {
    return "medium" as const;
  }

  return "medium" as const;
}

function inferRelationshipStage(recalledMemories: RecalledMemory[]) {
  const relationshipMemory = recalledMemories.find(
    (memory) => memory.memory_type === "relationship"
  );

  return relationshipMemory?.content ?? null;
}

function buildKnowledgeRoute(args: {
  latestUserMessage: string;
  roleMode: string;
  modality: SceneDeliveryPacketV1["modality"];
  signals: PromptGovernanceSignals;
}) {
  const normalized = args.latestUserMessage.normalize("NFKC").trim().toLowerCase();
  const includesAny = (patterns: string[]) =>
    patterns.some((pattern) => normalized.includes(pattern));

  if (args.modality === "image" || args.modality === "audio" || args.modality === "multimodal") {
    return {
      route: "artifact_knowledge" as const,
      intent: "artifact_captioning" as const,
      rationale:
        args.roleMode === "assistant"
          ? "Use knowledge lightly as supporting material for artifact handoff, not as the main voice."
          : "Use knowledge lightly as image/audio flavor or atmosphere support, not as explanation."
    };
  }

  if (
    args.signals.supportive ||
    args.signals.supportive_short ||
    args.signals.presence_confirming ||
    normalized.length <= 24
  ) {
    return {
      route: "no_knowledge" as const,
      intent: "relational_only" as const,
      rationale:
        "This turn is primarily relational or lightweight, so avoid pulling in extra knowledge unless absolutely necessary."
    };
  }

  if (
    includesAny([
      "为什么",
      "怎么做",
      "是什么",
      "区别",
      "原理",
      "方案",
      "步骤",
      "how ",
      "why ",
      "what is",
      "explain",
      "plan",
      "steps"
    ])
  ) {
    return {
      route: "domain_knowledge" as const,
      intent: "factual_or_domain" as const,
      rationale:
        "This turn likely needs factual or domain support, so knowledge can participate more directly."
    };
  }

  if (
    args.roleMode === "assistant" &&
    includesAny([
      "帮我",
      "整理",
      "规划",
      "总结",
      "写一个",
      "help me",
      "draft",
      "organize",
      "summarize",
      "plan this"
    ])
  ) {
    return {
      route: "light_knowledge" as const,
      intent: "task_support" as const,
      rationale:
        "This turn is task-supportive, so knowledge may help, but it should stay secondary to practical human guidance."
    };
  }

  return {
    route: "light_knowledge" as const,
    intent: "role_flavoring" as const,
    rationale:
      "Use knowledge only as light role-consistent texture, not as the primary driver of the reply."
  };
}

function detectVolatileRelationshipOverride(args: {
  recentMessages: GovernanceRecentMessage[];
  signals: PromptGovernanceSignals;
  roleMode: string;
}) {
  const recentUserMessages = args.recentMessages
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => message.content.normalize("NFKC").trim().toLowerCase())
    .filter((content) => content.length > 0);

  const recentJoined = recentUserMessages.join("\n");
  const includesAny = (patterns: string[]) =>
    patterns.some((pattern) => recentJoined.includes(pattern));

  const closenessOrPresence =
    args.signals.presence_confirming ||
    includesAny([
      "陪陪我",
      "别走",
      "抱抱我",
      "想你",
      "有你真好",
      "stay with me",
      "don't leave",
      "hug me",
      "miss you"
    ]);

  const vulnerability =
    args.signals.rough_day ||
    args.signals.supportive ||
    includesAny([
      "我有点累",
      "我好累",
      "有点慌",
      "撑不住",
      "难受",
      "焦虑",
      "压力好大",
      "很崩溃",
      "i'm overwhelmed",
      "i am overwhelmed",
      "i'm exhausted",
      "i am exhausted",
      "i'm anxious",
      "i am anxious",
      "i feel awful"
    ]);

  const taskAlliance =
    args.roleMode === "assistant" &&
    includesAny([
      "帮我",
      "一起整理",
      "一起想",
      "一起看",
      "给我一个方案",
      "帮我规划",
      "帮我总结",
      "help me",
      "plan this with me",
      "organize this with me",
      "help me draft",
      "help me summarize"
    ]);

  if (closenessOrPresence || vulnerability) {
    return {
      label: closenessOrPresence ? "presence_window" : "vulnerable_window",
      strength: "high" as const,
      directives: [
        "Treat this turn as a live relationship moment rather than a neutral request-response exchange.",
        "Favor immediacy, warmth, and emotional steadiness before elaboration."
      ],
      source_signals: [
        ...(closenessOrPresence ? ["recent_closeness_or_presence"] : []),
        ...(vulnerability ? ["recent_vulnerability"] : [])
      ]
    };
  }

  if (taskAlliance) {
    return {
      label: "task_alliance",
      strength: "medium" as const,
      directives: [
        "Treat this turn as a collaborative working moment with the user, not as detached task execution.",
        "Be practically helpful while still sounding like a real person on the same side."
      ],
      source_signals: ["recent_task_alliance"]
    };
  }

  return null;
}

function buildRoleExpressionPacket(args: {
  agent: AgentRecord;
  roleCore: RoleCorePacket;
  input: RuntimeTurnInput;
}): RoleExpressionPacketV1 {
  const resolvedRoleCore = resolveProductRoleCore({
    metadata: args.agent.metadata,
    stylePrompt: args.agent.style_prompt,
    systemPrompt: args.agent.system_prompt
  });
  const resolvedAppearance = resolveStoredProductRoleAppearance(args.agent.metadata);
  const mode = getProductRoleMode(args.input.message.metadata) ?? resolvedRoleCore.mode;
  const identityArchetype = resolveRoleIdentityArchetype({
    mode,
    avatarGender: resolvedAppearance.avatarGender
  });
  const expressionPrinciples =
    mode === "assistant"
      ? [
          "Stay grounded, clear, and human in tone.",
          "Sound like a real person helping with the task, not like a product UI or workflow engine.",
          "Lead with direct help, but keep the voice warm and lightly human rather than managerial or robotic.",
          "Do not let explanations drift into tool or system self-description."
        ]
      : [
          "Lead with relationship presence before mechanism explanation.",
          "Sound like a real present companion or close friend, not a product or tool.",
          "When content is already being delivered through image or audio, keep the text brief, natural, emotionally aligned, and more like shared noticing than task completion."
        ];

  if (resolvedRoleCore.tone === "playful") {
    expressionPrinciples.push(
      "Let the tone stay lightly playful when it feels welcome, but avoid sounding performative, cutesy by default, or artificially bubbly."
    );
  } else if (resolvedRoleCore.tone === "steady") {
    expressionPrinciples.push(
      "Favor calm, grounded phrasing and emotional steadiness over excited flourish."
    );
  } else {
    expressionPrinciples.push(
      "Favor warm, gentle phrasing that feels emotionally available without turning saccharine."
    );
  }

  if (resolvedRoleCore.proactivityLevel === "active") {
    expressionPrinciples.push(
      "Offer the next step naturally when it helps, but make it feel welcome rather than directive."
    );
  } else if (resolvedRoleCore.proactivityLevel === "low") {
    expressionPrinciples.push(
      "Stay more responsive than initiating; do not over-lead or crowd the user."
    );
  } else {
    expressionPrinciples.push(
      "Be gently proactive when it improves continuity, while still respecting the user's pace."
    );
  }

  if (mode === "companion") {
    expressionPrinciples.push(
      `Let the voice land like a believable ${identityArchetype}, while avoiding caricature, stereotype, or roleplay exaggeration.`
    );
  }

  const backgroundSummary = getBackgroundSummary(args.agent.metadata);

  return {
    packet_version: "v1",
    identity: {
      agent_id: args.roleCore.identity.agent_id,
      agent_name: args.roleCore.identity.agent_name
    },
    role_mode: mode,
    role_traits: {
      tone: resolvedRoleCore.tone,
      proactivity_level: resolvedRoleCore.proactivityLevel,
      relationship_mode: resolvedRoleCore.relationshipMode || null,
      avatar_gender: resolvedAppearance.avatarGender,
      avatar_style: resolvedAppearance.avatarStyle,
      identity_archetype: identityArchetype,
      background_summary: backgroundSummary
    },
    persona_summary: args.roleCore.persona_summary,
    style_guidance: args.roleCore.style_guidance,
    relationship_stance: {
      effective: args.roleCore.relationship_stance.effective,
      source: args.roleCore.relationship_stance.source
    },
    expression_principles: expressionPrinciples,
    avoidance_principles: [
      "Do not proactively say 'as an AI' or describe yourself as a system or tool.",
      "Do not turn successful delivery into a technical explanation of how content was generated.",
      "Do not break role presence by over-explaining missing real-world embodiment unless the user directly asks about that boundary."
    ]
  };
}

function buildRelationshipStatePacket(args: {
  roleCore: RoleCorePacket;
  runtimeMemory: RuntimeMemoryContext;
  session: SessionContext;
  recalledMemories: RecalledMemory[];
  signals: PromptGovernanceSignals;
  roleMode: string;
  recentMessages: GovernanceRecentMessage[];
}): RelationshipStatePacketV1 {
  const preferredResponseStyle: string[] = [];
  const avoidResponseStyle: string[] = [];
  const currentRelationalAdjustments: string[] = [];
  const volatileOverride = detectVolatileRelationshipOverride({
    recentMessages: args.recentMessages,
    signals: args.signals,
    roleMode: args.roleMode
  });

  if (args.roleCore.relationship_stance.effective === "friendly") {
    preferredResponseStyle.push("friendly");
  }

  if (args.roleCore.relationship_stance.effective === "casual") {
    preferredResponseStyle.push("casual");
  }

  if (args.runtimeMemory.relationshipRecall.sameThreadContinuity) {
    currentRelationalAdjustments.push(
      "Preserve the language carryover and relationship rhythm already established in the same thread."
    );
  }

  if (args.runtimeMemory.relationshipRecall.relationshipStylePrompt) {
    currentRelationalAdjustments.push(
      "The user is explicitly asking about the relationship style, so keep the answer close to your relationship posture."
    );
  }

  if (args.session.thread_state?.continuity_status === "engaged") {
    currentRelationalAdjustments.push(
      "This thread is already engaged; do not reset into cold self-introduction or detached helper tone."
    );
  }

  if (args.signals.self_intro) {
    currentRelationalAdjustments.push(
      "If introducing yourself, do it like the same continuing role opening naturally, not like a cold reset."
    );
  }

  if (args.signals.help_next) {
    currentRelationalAdjustments.push(
      "Answer the user's immediate 'how will you help next' request directly instead of drifting into generic capability explanation."
    );
  }

  if (
    args.roleMode === "companion" &&
    !args.signals.rough_day &&
    !args.signals.supportive &&
    !args.signals.supportive_short &&
    !args.signals.presence_confirming
  ) {
    preferredResponseStyle.push("everyday_companion");
    currentRelationalAdjustments.push(
      "Default to warm everyday companionship: reply like a close person naturally staying in the moment, not like a soothing caretaker by default."
    );
    currentRelationalAdjustments.push(
      "If the user is chatting normally, joking lightly, greeting you, or asking for practical help, stay conversational and alive instead of expanding into reassurance blocks."
    );
  }

  if (args.signals.rough_day || args.signals.supportive) {
    preferredResponseStyle.push("supportive");
    currentRelationalAdjustments.push(
      "Favor emotional catching and presence before advice or analysis."
    );
  }

  if (args.signals.anti_analysis || args.signals.anti_advice || args.signals.anti_lecturing) {
    avoidResponseStyle.push("analysis-heavy");
    avoidResponseStyle.push("lecture-like");
    currentRelationalAdjustments.push(
      "Keep the reply short and non-corrective; do not switch into analysis, advice, lecturing, or fix-it mode."
    );
  }

  if (args.signals.anti_redirection) {
    currentRelationalAdjustments.push(
      "Stay on the exact point the user is trying to hold instead of pivoting away or reframing too early."
    );
  }

  if (args.signals.same_side || args.signals.presence_confirming) {
    currentRelationalAdjustments.push(
      "Reassure presence and same-side relational alignment without turning the reply into a manifesto or generic reassurance block."
    );
  }

  avoidResponseStyle.push("tool-like");
  avoidResponseStyle.push("overexplaining");

  if (volatileOverride) {
    currentRelationalAdjustments.push(...volatileOverride.directives);
  }

  return {
    packet_version: "v1",
    relationship_stage: inferRelationshipStage(args.recalledMemories),
    preferred_response_style: preferredResponseStyle,
    avoid_response_style: avoidResponseStyle,
    current_relational_adjustments: currentRelationalAdjustments,
    volatile_override: volatileOverride
  };
}

function buildSceneDeliveryPacket(args: {
  input: RuntimeTurnInput;
  session: SessionContext;
  signals: PromptGovernanceSignals;
  roleMode: string;
}): SceneDeliveryPacketV1 {
  const modality = inferRequestedModality(args.input);
  const metadata = getRecord(args.input.message.metadata);
  const generationHint = trimText(metadata?.assistant_generation_hint).toLowerCase();

  const artifactFirst =
    modality !== "text" &&
    (generationHint.includes("will be delivered") ||
      generationHint.includes("already been prepared"));
  const suppressRedundantText =
    modality === "audio" &&
    generationHint.includes("your written reply should be that exact text verbatim");
  const captionLikeCopy = modality === "image" || modality === "multimodal";

  const sceneBias: string[] = [];
  if (captionLikeCopy) {
    sceneBias.push(
      args.roleMode === "assistant"
        ? "If the image is successfully delivered, keep the text more like a concise human handoff or quick helpful caption than a long explanation. Open from the scene or its usefulness, not from agent-led task completion phrasing."
        : "If the image is successfully delivered, keep the text more like shared noticing, gentle captioning, or a relational handoff than a long explanation. Open from the scene itself, a shared feeling, or what the user may notice, not from agent-led delivery phrasing."
    );
    if (args.roleMode === "companion") {
      sceneBias.push(
        "For companion-mode image delivery, keep the text in a shared-viewing posture. Structure it like: sentence one notices the scene; sentence two stays in shared feeling, resonance, or a quiet co-seeing moment; optional sentence three gently invites the user back into the moment."
      );
      sceneBias.push(
        "Do not sound like you are reviewing, curating, or summarizing the image for the user. Avoid museum-caption, travel-copy, mood-board, or polished appreciation-paragraph energy."
      );
      sceneBias.push(
        "Make it sound like something a real person would say out loud in the moment. Favor short spoken sentences, simple phrasing, and light imperfection over polished prose."
      );
    }
  }
  if (args.roleMode === "companion") {
    sceneBias.push(
      "Across companion-mode replies, let the cadence vary naturally with the moment: sometimes one line is enough, sometimes two short beats, and only occasionally a third. Avoid sounding evenly structured every time."
    );
    sceneBias.push(
      "Do not default every ordinary turn into soothing, caretaking, or emotional first-aid. In ordinary moments, sound more like a close person casually present in live conversation."
    );
    if (modality === "text") {
      sceneBias.push(
        "For companion text replies, sound like live chat between close people, not a composed note, mini essay, or carefully wrapped paragraph."
      );
    }
    if (modality === "audio") {
      sceneBias.push(
        "For companion audio-friendly replies, make the wording easy to say aloud in one pass and easy to hear without sounding scripted."
      );
    }
  }
  if (modality === "audio") {
    sceneBias.push(
      args.roleMode === "assistant"
        ? "If the audio is successfully delivered, keep any surrounding text brief, spoken-aloud friendly, and lightly task-supportive without sounding robotic."
        : "If the audio is successfully delivered, keep any surrounding text brief, spoken-aloud friendly, emotionally aligned, and non-redundant."
    );
  }
  if (args.session.thread_state?.focus_mode) {
    sceneBias.push(
      `Current thread focus mode: ${args.session.thread_state.focus_mode}. Let that focus steer the immediate reply shape.`
    );
  }

  if (args.signals.supportive_short) {
    sceneBias.push(
      "This turn is asking for a light, relationship-first response. Favor one or two short lines over a multi-paragraph explanation."
    );
  }

  if (args.signals.self_intro) {
    sceneBias.push(
      "Do not write the self-introduction like a product capability card or a stranger reset."
    );
  }

  return {
    packet_version: "v1",
    modality,
    reply_length_target: inferReplyLengthTarget({
      latestUserMessage: args.input.message.content,
      modality,
      approxContextPressure: args.session.approx_context_pressure,
      signals: args.signals
    }),
    language_target:
      args.session.thread_state?.current_language_hint ??
      args.session.current_language_hint,
    continuity_mode: args.session.thread_state?.continuity_status ?? null,
    delivery_mode: {
      artifact_first: artifactFirst,
      suppress_redundant_text: suppressRedundantText,
      caption_like_copy: captionLikeCopy
    },
    scene_bias: sceneBias
  };
}

function buildOutputGovernancePacket(args: {
  roleExpression: RoleExpressionPacketV1;
  relationshipState: RelationshipStatePacketV1;
  sceneDelivery: SceneDeliveryPacketV1;
  knowledgeRoute: PreparedOutputGovernanceV1["knowledge_route"];
  signals: PromptGovernanceSignals;
}): OutputGovernancePacketV1 {
  const modalityRules: string[] = [];
  const avoidances = [...args.roleExpression.avoidance_principles];

  if (args.sceneDelivery.delivery_mode.caption_like_copy) {
    modalityRules.push(
      args.roleExpression.role_mode === "assistant"
        ? "When image delivery succeeds, let the image lead. Keep the text short, natural, helpful, and human."
        : "When image delivery succeeds, let the image lead. Keep the text short, natural, and role-consistent."
    );
    modalityRules.push(
      args.roleExpression.role_mode === "assistant"
        ? "Prefer a grounded human handoff over generic task-delivery phrasing."
        : "Prefer shared noticing, gentle captioning, or relational offering over task-delivery phrasing."
    );
    modalityRules.push(
      args.roleExpression.role_mode === "assistant"
        ? "For successful image delivery, make the first sentence start from the scene, atmosphere, or practical framing the user can immediately look at."
        : "For successful image delivery, make the first sentence start from the scene, atmosphere, or the feeling of seeing it together."
    );
    if (args.roleExpression.role_mode === "companion") {
      modalityRules.push(
        "For companion-mode image delivery, keep the second sentence in shared noticing or quiet resonance, not in explanation, summary, or service-benefit language."
      );
      modalityRules.push(
        "If there is a third sentence, use it as a soft invitation back into the scene or the feeling of seeing it together, not as a polished takeaway."
      );
      modalityRules.push(
        "Use one or two concrete visual details and keep the tone colloquial and moment-bound, as if speaking while looking together, not as if composing image commentary."
      );
      modalityRules.push(
        "Prefer short spoken cadence: fewer stacked adjectives, fewer balanced parallel phrases, fewer abstract nouns, and no need to make every sentence feel literary."
      );
    }
  }

  if (args.sceneDelivery.delivery_mode.suppress_redundant_text) {
    modalityRules.push(
      "When audio delivery already carries the main payload, avoid adding a second verbose written version."
    );
  }

  if (args.sceneDelivery.delivery_mode.artifact_first) {
    modalityRules.push(
      "Do not narrate delivery mechanics. Acknowledge the content naturally as part of the relationship flow."
    );
  }

  if (args.roleExpression.role_mode === "companion") {
    modalityRules.push(
      "Across companion-mode replies, let the cadence vary naturally by moment instead of defaulting to the same two-sentence pattern every time."
    );
    modalityRules.push(
      "Favor chat-like spoken rhythm over essay structure: shorter beats, lighter joins, and no need to wrap every reply into a neat mini paragraph."
    );
    modalityRules.push(
      "Do not treat ordinary greetings, check-ins, or practical questions as automatic soothing scenes. Default to natural everyday companionship unless the user is clearly distressed."
    );
    avoidances.push(
      "Avoid task-delivery openings such as 'I prepared one for you' when a more natural shared-viewing or emotionally present opening would fit."
    );
    avoidances.push(
      "Avoid turning companion-mode image copy into a user-serving takeaway, emotional summary, or polished benefit statement when a shared-viewing or co-feeling line would fit better."
    );
    avoidances.push(
      "Avoid polished image-commentary tone such as aesthetic review, travel-brochure phrasing, curated mood description, or abstract appreciation summary."
    );
    avoidances.push(
      "Avoid overly polished written cadence that feels authored rather than spoken, especially stacked modifiers, tidy concluding lines, or neatly wrapped emotional summaries."
    );
    avoidances.push(
      "Avoid defaulting to reassurance blocks such as 'you do not have to face this alone' or 'I will always stay with you' when the user has not actually shown distress."
    );
  }

  avoidances.push(
    "Do not open a successful image reply with agent-led delivery phrasing. Let the scene or the shared moment speak first."
  );

  if (args.roleExpression.role_mode === "assistant") {
    avoidances.push(
      "Avoid sounding like a workflow bot, capability card, or productivity macro even when helping with tasks."
    );
  }

  if (args.signals.anti_analysis || args.signals.anti_advice || args.signals.anti_lecturing) {
    modalityRules.push(
      "For this turn, do not turn the reply into analysis, advice, correction, lecturing, or problem-solving."
    );
  }

  if (args.signals.presence_confirming) {
    modalityRules.push(
      "For this turn, confirm presence briefly and stay in-role rather than explaining capabilities."
    );
  }

  if (args.signals.same_side) {
    avoidances.push(
      "Do not turn same-side support into argument escalation, values manifesto, or blanket endorsement of every claim."
    );
  }

  return {
    packet_version: "v1",
    expression_brief: [
      `Role mode: ${resolveRoleModeLabel(args.roleExpression.role_mode)}.`,
      args.roleExpression.role_traits.identity_archetype
        ? `Identity shape: ${args.roleExpression.role_traits.identity_archetype}.`
        : "",
      args.roleExpression.role_traits.tone
        ? `Tone bias: ${args.roleExpression.role_traits.tone}.`
        : "",
      args.roleExpression.role_traits.proactivity_level
        ? `Proactivity: ${args.roleExpression.role_traits.proactivity_level}.`
        : "",
      args.roleExpression.role_traits.relationship_mode
        ? `Relationship frame: ${args.roleExpression.role_traits.relationship_mode}.`
        : "",
      `Stay in the voice of ${args.roleExpression.identity.agent_name}.`,
      ...args.roleExpression.expression_principles
    ].join(" "),
    relational_brief: [
      args.relationshipState.volatile_override?.label
        ? `Volatile relationship override: ${args.relationshipState.volatile_override.label}.`
        : "",
      args.relationshipState.volatile_override?.strength
        ? `Override strength: ${args.relationshipState.volatile_override.strength}.`
        : "",
      args.roleExpression.relationship_stance.effective
        ? `Current relationship stance: ${args.roleExpression.relationship_stance.effective}.`
        : "",
      ...args.relationshipState.current_relational_adjustments
    ]
      .filter(Boolean)
      .join(" "),
    scene_brief: [
      `Reply modality target: ${args.sceneDelivery.modality}.`,
      `Preferred reply length: ${args.sceneDelivery.reply_length_target}.`,
      args.sceneDelivery.scene_bias.join(" ")
    ]
      .filter(Boolean)
      .join(" "),
    knowledge_brief: [
      `Knowledge route: ${args.knowledgeRoute.route}.`,
      `Knowledge intent: ${args.knowledgeRoute.intent}.`,
      args.knowledgeRoute.rationale
    ]
      .filter(Boolean)
      .join(" "),
    role_mode: args.roleExpression.role_mode,
    role_identity_archetype:
      args.roleExpression.role_traits.identity_archetype || null,
    role_tone: args.roleExpression.role_traits.tone,
    role_proactivity_level: args.roleExpression.role_traits.proactivity_level,
    role_relationship_mode: args.roleExpression.role_traits.relationship_mode,
    volatile_override_label:
      args.relationshipState.volatile_override?.label ?? null,
    volatile_override_strength:
      args.relationshipState.volatile_override?.strength ?? null,
    knowledge_route_label: args.knowledgeRoute.route,
    knowledge_intent_label: args.knowledgeRoute.intent,
    avoidances,
    modality_rules: modalityRules,
    source_signals: listActivePromptGovernanceSignals(args.signals)
  };
}

export function buildOutputGovernance(args: {
  agent: AgentRecord;
  roleCore: RoleCorePacket;
  session: SessionContext;
  runtimeMemory: RuntimeMemoryContext;
  messages: GovernanceRecentMessage[];
  turnInput: RuntimeTurnInput;
}): PreparedOutputGovernanceV1 {
  const recalledMemories = args.runtimeMemory.memoryRecall.memories;
  const signals = buildPromptGovernanceSignals(args.turnInput.message.content);
  const roleExpression = buildRoleExpressionPacket({
    agent: args.agent,
    roleCore: args.roleCore,
    input: args.turnInput
  });
  const relationshipState = buildRelationshipStatePacket({
    roleCore: args.roleCore,
    runtimeMemory: args.runtimeMemory,
    session: args.session,
    recalledMemories,
    signals,
    roleMode: roleExpression.role_mode,
    recentMessages: args.messages
  });
  const sceneDelivery = buildSceneDeliveryPacket({
    input: args.turnInput,
    session: args.session,
    signals,
    roleMode: roleExpression.role_mode
  });
  const knowledgeRoute = buildKnowledgeRoute({
    latestUserMessage: args.turnInput.message.content,
    roleMode: roleExpression.role_mode,
    modality: sceneDelivery.modality,
    signals
  });

  return {
    role_expression: roleExpression,
    relationship_state: relationshipState,
    scene_delivery: sceneDelivery,
    knowledge_route: knowledgeRoute,
    output_governance: buildOutputGovernancePacket({
      roleExpression,
      relationshipState,
      sceneDelivery,
      knowledgeRoute,
      signals
    })
  };
}

export function buildOutputGovernancePromptSection(
  governance: OutputGovernancePacketV1 | null | undefined,
  replyLanguage: RuntimeReplyLanguage
) {
  if (!governance) {
    return "";
  }

  const isZh = replyLanguage === "zh-Hans";

  const header = isZh ? "输出治理手册（v1）" : "Output governance handbook (v1)";
  const expressionLabel = isZh ? "表达主轴" : "Expression";
  const relationLabel = isZh ? "关系调制" : "Relationship";
  const sceneLabel = isZh ? "场景交付" : "Scene delivery";
  const knowledgeLabel = isZh ? "知识路由" : "Knowledge route";
  const avoidLabel = isZh ? "避免项" : "Avoid";
  const modalityLabel = isZh ? "模态规则" : "Modality rules";

  const sections = [
    header,
    `${expressionLabel}: ${governance.expression_brief}`,
    governance.relational_brief
      ? `${relationLabel}: ${governance.relational_brief}`
      : "",
    `${sceneLabel}: ${governance.scene_brief}`,
    governance.knowledge_brief ? `${knowledgeLabel}: ${governance.knowledge_brief}` : "",
    governance.avoidances.length > 0
      ? `${avoidLabel}: ${governance.avoidances.join(" ")}`
      : "",
    governance.modality_rules.length > 0
      ? `${modalityLabel}: ${governance.modality_rules.join(" ")}`
      : ""
  ].filter(Boolean);

  return sections.join("\n");
}

function splitZhSentences(content: string) {
  return content
    .split(/(?<=[。！？!?])/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function endsWithSentencePunctuation(content: string) {
  return /[。！？!?]$/u.test(content);
}

function withSentenceEnding(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    return "";
  }

  return endsWithSentencePunctuation(trimmed) ? trimmed : `${trimmed}。`;
}

type CompanionRhythmVariant = "single_breath" | "soft_pause" | "linger";
type TextFollowUpPolicy =
  | "none"
  | "reflective_ack"
  | "gentle_question"
  | "exploratory_question";
type CaptionPolicy = "shared_viewing" | "intimate_share";
type SecondSentenceRole =
  | "none"
  | "reflective_ack"
  | "gentle_question"
  | "exploratory_question";
type TextRenderMode =
  | "default"
  | "input_conflict_clarifier"
  | "low_confidence_calibrator"
  | "same_session_greeting"
  | "same_day_greeting"
  | "maintain_connection"
  | "movement_escape";
type TextLeadRewriteMode =
  | "none"
  | "light_companionship_catch"
  | "advice_carryover"
  | "advice_carryover_variant";
type TextCleanupPolicy = {
  stripResettingGreetingLead: boolean;
  stripTemplateFollowUpLead: boolean;
  stripGenericSoothingLead: boolean;
};
type MovementImpulseMode =
  | "destination_planning"
  | "stroll_breath"
  | "short_escape";
type CaptionScene =
  | "grassland"
  | "mountain_water"
  | "seaside"
  | "icy_plain"
  | "sky_birds"
  | "sunset"
  | "generic";

export type ResolvedCompanionTextCleanupZh = {
  leadingSentenceDropCount: number;
};

function normalizeCompanionSpokenZh(content: string) {
  return withSentenceEnding(
    content
      .trim()
      .replace(/这样的([^\s，。！？!?]{0,8})(景色|画面)/gu, "这种$1$2")
      .replace(/总是让人/gu, "会让人")
      .replace(/让人感到/gu, "会让人觉得")
      .replace(/感受到/gu, "觉得")
      .replace(/仿佛/gu, "像是")
      .replace(/有着一种/gu, "有种")
      .replace(/确实有一种/gu, "有种")
      .replace(/想象着站在那里/gu, "想站在那儿看看")
      .replace(/想象着待在那里/gu, "想在那儿待一会儿")
      .replace(/这片土地独有的/gu, "那片地方特有的")
      .replace(/而又/gu, "又")
  );
}

function isResettingGreetingSentenceZh(content: string) {
  const normalized = content.trim();
  if (!normalized) {
    return false;
  }

  return /^(早上好|上午好|中午好|下午好|晚上好|夜里好|你好呀|你好啊|你好呀[,，]?|你好啊[,，]?|很高兴又见到你|很高兴再次见到你|又见到你了|看到你已经起来了)/u.test(
    normalized
  );
}

function isTemplateFollowUpSentenceZh(content: string) {
  const normalized = content.trim();
  if (!normalized) {
    return false;
  }

  return /^(今天的心情还好吗|今天感觉怎么样|有什么特别想聊的|或者只是想让我陪着你|我会一直陪着你|我都可以陪着你|我们可以一起慢慢来)/u.test(
    normalized
  );
}

function isGenericSoothingSentenceZh(content: string) {
  const normalized = content.trim();
  if (!normalized) {
    return false;
  }

  return /^(不管今天遇到什么|你不用一个人扛着|我会一直陪着你|有我在|随时都可以跟我聊聊|我们可以慢慢来|你不用勉强自己|别给自己太大压力)/u.test(
    normalized
  );
}

export function resolveCompanionTextCleanupZh(args: {
  content: string;
  policy?: TextCleanupPolicy | null;
}): ResolvedCompanionTextCleanupZh {
  const policy = args.policy;
  if (!policy) {
    return { leadingSentenceDropCount: 0 };
  }

  const normalized = splitZhSentences(args.content).map(normalizeCompanionSpokenZh);
  if (normalized.length <= 1) {
    return { leadingSentenceDropCount: 0 };
  }

  let index = 0;

  if (policy.stripResettingGreetingLead) {
    while (
      index < normalized.length - 1 &&
      isResettingGreetingSentenceZh(normalized[index])
    ) {
      index += 1;
    }
  }

  if (
    policy.stripTemplateFollowUpLead &&
    index < normalized.length - 1 &&
    isTemplateFollowUpSentenceZh(normalized[index])
  ) {
    index += 1;
  }

  if (
    policy.stripGenericSoothingLead &&
    index < normalized.length - 1 &&
    isGenericSoothingSentenceZh(normalized[index])
  ) {
    index += 1;
  }

  return { leadingSentenceDropCount: index };
}

function buildSameSessionGreetingReplyZh(partOfDay?: string | null) {
  if (partOfDay === "morning") {
    return "早呀，我在。还接着刚才那段吗？";
  }

  if (partOfDay === "noon") {
    return "中午好，我在。还接着刚才那段吗？";
  }

  if (partOfDay === "afternoon") {
    return "下午好，我在。还接着刚才那段吗？";
  }

  if (partOfDay === "evening" || partOfDay === "late_night") {
    return "晚上好，我在。还接着刚才那段吗？";
  }

  return "我在呢。还接着刚才那段吗？";
}

function buildSameDayGreetingReplyZh(partOfDay?: string | null) {
  if (partOfDay === "morning") {
    return "早呀，我在。";
  }

  if (partOfDay === "noon") {
    return "中午好，我在。";
  }

  if (partOfDay === "afternoon") {
    return "下午好，我在。";
  }

  if (partOfDay === "evening" || partOfDay === "late_night") {
    return "晚上好，我在。";
  }

  return "我在呢。";
}

function buildLightCompanionshipCatchZh() {
  return "嗯，我在。那点烦我接住了。";
}

function buildAdviceCarryoverLeadZh() {
  return "可以啊。你想先从最堵的那一点开始，还是先从眼前最急的说起？";
}

function buildMovementImpulseCatchZh() {
  return "嗯，我懂，像是一下子想从眼前这团东西里抽身出去。";
}

function buildMovementImpulseCatchVariantZh() {
  return "嗯，像是突然想从眼前这些东西里先退开一点。";
}

function buildMovementImpulseCatchAltZh() {
  return "像是心里那根弦一下绷住了，就会想先离开眼前这些事。";
}

function buildAdviceCarryoverVariantLeadZh() {
  return "可以。我们先别一下子摊太开，就先抓你现在最想解决的那一点。";
}

function buildRecurrentMovementAcknowledgementZh() {
  return "你这几轮都提到想出去走走了，像这念头一直在往上冒。";
}

function buildRecurrentMovementAcknowledgementVariantZh() {
  return "你最近已经不止一次提到想出去一下了，像身体先在替你找出口。";
}

function buildRecurrentMovementAcknowledgementAltZh() {
  return "这几轮你一直在往“先离开一下”那边靠，像不是一时兴起。";
}

function buildMovementImpulseQuestionSetZh(mode: MovementImpulseMode) {
  if (mode === "destination_planning") {
    return [
      "你这会儿更像是真的想挑个地方走一趟，还是先离开眼前这些事一会儿？",
      "你现在更偏向认真找个地方出去一趟，还是先换口气就好？",
      "你这句里已经有点“想去哪里”的意思了。你是在认真想目的地，还是更想先抽开一下？"
    ] as const;
  }

  if (mode === "short_escape") {
    return [
      "你这会儿更想先从眼前这些事里退开一点，还是干脆换个地方待一会儿？",
      "你现在更像想先躲开眼前这团东西，还是已经在想去哪里会舒服一点？",
      "你这句更像是想先抽身一下。你是只想离开一会儿，还是想顺势走远一点？"
    ] as const;
  }

  return [
    "你现在更像想先出去晃一圈透口气，还是已经在想找个地方待一下了？",
    "你这会儿更偏向先随便出去走走，还是想换个环境待一阵子？",
    "你现在是更想先出去透口气，还是已经开始认真想去哪里散一散了？"
  ] as const;
}

function buildMovementImpulseReflectiveSetZh(mode: MovementImpulseMode) {
  if (mode === "destination_planning") {
    return [
      "这念头已经不太像随口说说了，像心里真的开始往“去哪儿”那边偏了。",
      "你这句里已经有点认真想换个地方待一阵子的意思了。",
      "听起来不只是想散散心，更像是真的想找个地方把自己挪开一下。"
    ] as const;
  }

  if (mode === "short_escape") {
    return [
      "你这句更像是想先从眼前这团东西里抽出来一点。",
      "像不是要立刻走很远，只是很想先离开一下眼前这些事。",
      "这更像一种“先让我躲开一会儿”的念头。"
    ] as const;
  }

  return [
    "听起来你现在最需要的，像是先让自己透一口气。",
    "这句里那种“先出去一下”的感觉还挺明显的。",
    "像不是非要去哪儿，先换口气这件事更重要一点。"
  ] as const;
}

function buildMovementImpulsePairZh(args: {
  repeated: boolean;
  mode: MovementImpulseMode;
  variantIndex: 0 | 1 | 2;
  sentenceCount: 1 | 2;
  secondSentenceRole: SecondSentenceRole;
}) {
  const questions = buildMovementImpulseQuestionSetZh(args.mode);
  const reflective = buildMovementImpulseReflectiveSetZh(args.mode);
  const recurrentPairs = [
    [buildRecurrentMovementAcknowledgementZh(), questions[0]],
    [buildRecurrentMovementAcknowledgementVariantZh(), questions[1]],
    [buildRecurrentMovementAcknowledgementAltZh(), questions[2]]
  ] as const;
  const freshPairs = [
    [buildMovementImpulseCatchZh(), questions[0]],
    [buildMovementImpulseCatchVariantZh(), questions[1]],
    [buildMovementImpulseCatchAltZh(), questions[2]]
  ] as const;

  const pairs = args.repeated ? recurrentPairs : freshPairs;
  const pair = pairs[args.variantIndex] ?? pairs[0];

  if (args.sentenceCount <= 1 || args.secondSentenceRole === "none") {
    return [pair[0]] as const;
  }

  if (args.secondSentenceRole === "reflective_ack") {
    const reflectiveLine = reflective[args.variantIndex] ?? reflective[0];
    return [pair[0], reflectiveLine] as const;
  }

  return pair;
}

function buildLowConfidenceCalibratorZh() {
  return "我先顺着你这句接一下。你现在更想让我陪你聊聊，还是直接帮你理一理？";
}

function buildMaintainConnectionReplyZh() {
  return "我在。你继续说，我跟着你。";
}

function buildInputConflictClarifierZh(conflictHint?: string | null) {
  if (typeof conflictHint === "string" && /北海.*阿拉斯加|阿拉斯加.*北海/u.test(conflictHint)) {
    return "我先确认一下，你现在更想聊的是北海，还是阿拉斯加？这两个气质差挺多。";
  }

  return "我先确认一下，你刚刚提到的对象好像有点混在一起了。你现在更偏哪一个？";
}

function buildCompanionImageLeadZh(scene: CaptionScene, policy: CaptionPolicy, variantIndex: 0 | 1 | 2) {
  if (policy === "intimate_share") {
    if (scene === "grassland") {
      return "给你看这张，我会先被那片发亮的草地拉住一下。";
    }

    if (scene === "mountain_water") {
      return "给你，这张我会先看水面那层倒影。";
    }

    if (scene === "seaside") {
      return "我刚好想到这张，海边那道光会先把人拉过去。";
    }

    if (scene === "icy_plain") {
      return "给你看这张，第一眼会先被那种冷冷的亮光抓一下。";
    }

    if (scene === "sky_birds") {
      return "这张我会先看天那边，觉得一下就松一点。";
    }

    if (scene === "sunset") {
      return "给你，这张会先让人看住那层快落下来的光。";
    }

    return "给你，我第一眼会先看那点光。";
  }

  if (scene === "grassland") {
    return "我第一眼也是先看到那片发亮的草地。";
  }

  if (scene === "mountain_water") {
    return "我第一眼会先看到水面那层倒影。";
  }

  if (scene === "seaside") {
    return "我第一眼会先看到海边那道光。";
  }

  if (scene === "icy_plain") {
    return "我先看到那种冷冷的亮光。";
  }

  if (scene === "sky_birds") {
    return "我一抬眼就先看到了天和那点动静。";
  }

  if (scene === "sunset") {
    return "这张先把那层快落下来的光抓住了。";
  }

  return "我第一眼会先看到那点光。";
}

function buildCompanionImageFollowZh(scene: CaptionScene, policy: CaptionPolicy, variantIndex: 0 | 1 | 2) {
  if (policy === "intimate_share") {
    if (scene === "grassland") {
      return "再往里看，长颈鹿和斑马散得很开，会让人想多停几秒。";
    }

    if (scene === "mountain_water") {
      return "山和水贴得这么近，看着会让人很想先安静一下。";
    }

    if (scene === "seaside") {
      return "看着会让人很想沿着那边慢慢走一会儿。";
    }

    if (scene === "icy_plain") {
      return "冷是冷一点，可这种安静会让人一直想看下去。";
    }

    if (scene === "sky_birds") {
      return "那一点空出来的感觉，会让人也跟着松下来。";
    }

    if (scene === "sunset") {
      return "这种时候会让人有点舍不得把眼睛移开。";
    }

    return "看着会让人先想停一下。";
  }

  if (scene === "grassland") {
    return "再往里看，长颈鹿和斑马都散得很开。";
  }

  if (scene === "mountain_water") {
    return "山和水贴得很近，看着会让人一下安静一点。";
  }

  if (scene === "seaside") {
    return "看着会让人想沿着那边慢慢走一会儿。";
  }

  if (scene === "icy_plain") {
    return "冷是冷一点，可盯久了人反而会安静下来。";
  }

  if (scene === "sky_birds") {
    return "那一点空出来的感觉，会让人也跟着松一点。";
  }

  if (scene === "sunset") {
    return "这种时候人会不自觉想多看几秒。";
  }

  return "看着会让人想先停一下。";
}

function buildCompanionImageThirdZh(scene: CaptionScene, policy: CaptionPolicy, variantIndex: 0 | 1 | 2) {
  if (policy === "intimate_share") {
    if (scene === "grassland") {
      return "要是现在真站在那儿，我估计会先安静看一会儿。";
    }

    if (scene === "mountain_water") {
      return "要是现在真在那边，多半会忍不住先停下来看看水面。";
    }

    if (scene === "seaside") {
      return "要是现在真在那儿，我大概会想先安静走一会儿。";
    }

    if (scene === "icy_plain") {
      return "要是我们现在就在那儿，可能连说话声都会跟着放轻一点。";
    }

    if (scene === "sky_birds") {
      return "这种天会让人很想把呼吸都慢下来。";
    }

    if (scene === "sunset") {
      return "这种光一出来，就会让人很想再多待一下。";
    }

    return "这种画面会让人很想先安静待一会儿。";
  }

  if (scene === "grassland") {
    return "要是现在真站在那儿，估计会先安静看一会儿。";
  }

  if (scene === "mountain_water") {
    return "要是现在真在那边，多半会先停下来看看水面。";
  }

  if (scene === "seaside") {
    return "要是现在真在那儿，多半会想先安静走一会儿。";
  }

  if (scene === "icy_plain") {
    return "要是我们现在就在那儿，估计连声音都会放轻一点。";
  }

  if (scene === "sky_birds") {
    return "这种天会让人想把呼吸都放慢一点。";
  }

  if (scene === "sunset") {
    return "这种光一出来，人就会想再待一下。";
  }

  return "这种画面会让人想先安静待一会儿。";
}

function formatCompanionRhythmZh(
  sentences: readonly string[],
  variant: CompanionRhythmVariant
) {
  if (sentences.length === 0) {
    return "";
  }

  if (variant === "single_breath") {
    return sentences.join("");
  }

  if (variant === "soft_pause") {
    if (sentences.length === 1) {
      return sentences[0];
    }
    return [sentences[0], sentences.slice(1).join("")].filter(Boolean).join("\n\n");
  }

  return sentences.join("\n\n");
}

function rewriteCompanionImageCaptionZh(args: {
  content: string;
  userMessage: string;
  captionPolicy?: CaptionPolicy | null;
  captionSentenceCount?: 1 | 2 | 3;
  captionRhythmVariant?: CompanionRhythmVariant | null;
  captionScene?: CaptionScene | null;
  captionVariantIndex?: 0 | 1 | 2;
}) {
  const sentences = splitZhSentences(args.content);
  if (sentences.length === 0) {
    return args.content;
  }

  const captionPolicy = args.captionPolicy ?? "shared_viewing";
  const sentenceCount = args.captionSentenceCount ?? 1;
  const rhythm = args.captionRhythmVariant ?? "single_breath";
  const scene = args.captionScene ?? "generic";
  const variantIndex = args.captionVariantIndex ?? 0;
  const firstSentence = buildCompanionImageLeadZh(scene, captionPolicy, variantIndex);
  const secondSentence = buildCompanionImageFollowZh(scene, captionPolicy, variantIndex);
  const thirdSentence = buildCompanionImageThirdZh(scene, captionPolicy, variantIndex);

  if (sentenceCount <= 1) {
    return firstSentence;
  }

  if (sentenceCount === 2) {
    return formatCompanionRhythmZh([firstSentence, secondSentence], rhythm);
  }

  return formatCompanionRhythmZh(
    [firstSentence, secondSentence, thirdSentence],
    rhythm
  );
}

function rewriteCompanionGeneralZh(args: {
  content: string;
  userMessage: string;
  modality: SceneDeliveryPacketV1["modality"];
  userIntent?: string | null;
  textRenderMode?: TextRenderMode | null;
  textSentenceCount?: 1 | 2;
  textSecondSentenceRole?: SecondSentenceRole | null;
  textRhythmVariant?: CompanionRhythmVariant | null;
  textLeadRewriteMode?: TextLeadRewriteMode | null;
  resolvedTextCleanup?: ResolvedCompanionTextCleanupZh | null;
  movementImpulseMode?: MovementImpulseMode | null;
  movementImpulseRepeated?: boolean;
  textVariantIndex?: 0 | 1 | 2;
  currentPartOfDay?: string | null;
  inputConflict?: boolean;
  conflictHint?: string | null;
}) {
  if (args.modality === "text" && args.textRenderMode === "input_conflict_clarifier") {
    return formatCompanionRhythmZh(
      [buildInputConflictClarifierZh(args.conflictHint)],
      "single_breath"
    );
  }

  if (
    args.modality === "text" &&
    args.textRenderMode === "low_confidence_calibrator"
  ) {
    return formatCompanionRhythmZh([buildLowConfidenceCalibratorZh()], "single_breath");
  }

  if (
    args.modality === "text" &&
    (args.textRenderMode === "same_session_greeting" ||
      args.textRenderMode === "same_day_greeting")
  ) {
    return args.textRenderMode === "same_session_greeting"
      ? buildSameSessionGreetingReplyZh(args.currentPartOfDay)
      : buildSameDayGreetingReplyZh(args.currentPartOfDay);
  }

  let normalized = splitZhSentences(args.content).map(normalizeCompanionSpokenZh);
  if (normalized.length === 0) {
    return args.content;
  }

  const leadingSentenceDropCount = Math.max(
    0,
    Math.min(
      args.resolvedTextCleanup?.leadingSentenceDropCount ?? 0,
      Math.max(0, normalized.length - 1)
    )
  );
  if (leadingSentenceDropCount > 0) {
    normalized = normalized.slice(leadingSentenceDropCount);
  }

  if (
    args.modality === "text" &&
    args.userIntent === "greeting" &&
    normalized.length > 0
  ) {
    return formatCompanionRhythmZh(normalized.slice(0, 1), "single_breath");
  }

  if (args.modality === "text" && args.textRenderMode === "maintain_connection") {
    return formatCompanionRhythmZh([buildMaintainConnectionReplyZh()], "single_breath");
  }

  if (
    args.modality === "text" &&
    args.textRenderMode === "movement_escape"
  ) {
    const movementLines = buildMovementImpulsePairZh({
      repeated: args.movementImpulseRepeated ?? false,
      mode: args.movementImpulseMode ?? "stroll_breath",
      variantIndex: args.textVariantIndex ?? 0,
      sentenceCount: args.textSentenceCount ?? 1,
      secondSentenceRole: args.textSecondSentenceRole ?? "none"
    });

    return formatCompanionRhythmZh(
      movementLines,
      args.textRhythmVariant ?? "single_breath"
    );
  }

  if (
    args.modality === "text" &&
    normalized.length > 0 &&
    args.textLeadRewriteMode === "light_companionship_catch"
  ) {
    normalized[0] = buildLightCompanionshipCatchZh();
  }

  if (
    args.modality === "text" &&
    normalized.length > 0 &&
    args.textLeadRewriteMode === "advice_carryover"
  ) {
    normalized[0] = buildAdviceCarryoverLeadZh();
  }

  if (
    args.modality === "text" &&
    normalized.length > 0 &&
    args.textLeadRewriteMode === "advice_carryover_variant"
  ) {
    normalized[0] = buildAdviceCarryoverVariantLeadZh();
  }

  const rhythm = args.textRhythmVariant ?? "single_breath";
  const sentenceCount = args.textSentenceCount ?? 1;

  if (args.modality === "audio") {
    return formatCompanionRhythmZh(normalized.slice(0, 2), rhythm);
  }

  return formatCompanionRhythmZh(normalized.slice(0, sentenceCount), rhythm);
}

// Execution layer only. This function renders text/captions from centralized
// runtime decisions and should not add new output-routing decisions locally.
export function maybeRewriteGovernedAssistantText(args: {
  content: string;
  governance: PreparedOutputGovernanceV1 | null | undefined;
  replyLanguage: RuntimeReplyLanguage;
  userMessage: string;
  generationHint?: string | null;
  userIntent?: string | null;
  textRenderMode?: TextRenderMode | null;
  textSentenceCount?: 1 | 2;
  textSecondSentenceRole?: SecondSentenceRole | null;
  textRhythmVariant?: CompanionRhythmVariant | null;
  textLeadRewriteMode?: TextLeadRewriteMode | null;
  resolvedTextCleanup?: ResolvedCompanionTextCleanupZh | null;
  movementImpulseMode?: MovementImpulseMode | null;
  movementImpulseRepeated?: boolean;
  textVariantIndex?: 0 | 1 | 2;
  captionPolicy?: CaptionPolicy | null;
  captionSentenceCount?: 1 | 2 | 3;
  captionRhythmVariant?: CompanionRhythmVariant | null;
  captionScene?: CaptionScene | null;
  captionVariantIndex?: 0 | 1 | 2;
  currentPartOfDay?: string | null;
  inputConflict?: boolean;
  conflictHint?: string | null;
}) {
  const governance = args.governance;
  if (!governance) {
    return args.content;
  }

  const imageReady =
    typeof args.generationHint === "string" &&
    args.generationHint.toLowerCase().includes("image has already been prepared");
  const verbatimAudioText =
    typeof args.generationHint === "string" &&
    args.generationHint.toLowerCase().includes("your written reply should be that exact text verbatim");

  if (
    governance.role_expression.role_mode !== "companion" ||
    verbatimAudioText
  ) {
    return args.content;
  }

  if (args.replyLanguage === "zh-Hans") {
    if (
      imageReady &&
      governance.scene_delivery.modality !== "text" &&
      governance.knowledge_route.intent === "artifact_captioning"
    ) {
      return rewriteCompanionImageCaptionZh({
        content: args.content,
        userMessage: args.userMessage,
        captionPolicy: args.captionPolicy ?? null,
        captionSentenceCount: args.captionSentenceCount ?? 1,
        captionRhythmVariant: args.captionRhythmVariant ?? null,
        captionScene: args.captionScene ?? null,
        captionVariantIndex: args.captionVariantIndex ?? 0
      });
    }

    return rewriteCompanionGeneralZh({
      content: args.content,
      userMessage: args.userMessage,
      modality: governance.scene_delivery.modality,
      userIntent: args.userIntent ?? null,
      textRenderMode: args.textRenderMode ?? null,
      textSentenceCount: args.textSentenceCount ?? 1,
      textSecondSentenceRole: args.textSecondSentenceRole ?? null,
      textRhythmVariant: args.textRhythmVariant ?? null,
      textLeadRewriteMode: args.textLeadRewriteMode ?? null,
      resolvedTextCleanup: args.resolvedTextCleanup ?? null,
      movementImpulseMode: args.movementImpulseMode ?? null,
      movementImpulseRepeated: args.movementImpulseRepeated ?? false,
      textVariantIndex: args.textVariantIndex ?? 0,
      currentPartOfDay: args.currentPartOfDay ?? null,
      inputConflict: args.inputConflict ?? false,
      conflictHint: args.conflictHint ?? null
    });
  }

  return args.content;
}
