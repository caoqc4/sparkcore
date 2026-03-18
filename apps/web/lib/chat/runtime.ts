import { generateText } from "@/lib/litellm/client";
import {
  getMemoryCategory,
  getMemoryKey,
  getMemoryScope,
  getMemorySourceRefs,
  getMemoryStability,
  getMemoryStatus,
  isMemoryHidden,
  isMemoryIncorrect,
  isMemoryScopeValid
} from "@/lib/chat/memory-v2";
import {
  isDirectAgentNamingQuestion,
  isDirectUserPreferredNameQuestion,
  recallAgentNickname,
  recallUserPreferredName,
  recallRelevantMemories
} from "@/lib/chat/memory";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_PERSONA_SLUGS = ["companion_default", "spark-guide"];
const DEFAULT_MODEL_PROFILE_SLUG = "spark-default";

type WorkspaceRecord = {
  id: string;
  name: string;
  kind: string;
};

type ThreadRecord = {
  id: string;
  title: string;
  status: string;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
};

type AgentRecord = {
  id: string;
  name: string;
  persona_summary: string;
  style_prompt: string;
  system_prompt: string;
  default_model_profile_id: string | null;
  metadata: Record<string, unknown>;
};

type ModelProfileRecord = {
  id: string;
  slug: string;
  name: string;
  provider: string;
  model: string;
  temperature: number;
  max_output_tokens: number | null;
  metadata: Record<string, unknown>;
};

type MessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type ThreadListItem = ThreadRecord & {
  agent_name: string | null;
  latest_message_preview: string | null;
  latest_message_created_at: string | null;
};

type AvailableAgentRecord = {
  id: string;
  name: string;
  is_custom: boolean;
  persona_summary: string;
  background_summary: string | null;
  avatar_emoji: string | null;
  system_prompt_summary: string;
  source_persona_pack_id: string | null;
  default_model_profile_id: string | null;
  source_persona_pack_name: string | null;
  default_model_profile_name: string | null;
  default_model_profile_tier_label: string | null;
  is_default_for_workspace: boolean;
};

type AvailablePersonaPackRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  persona_summary: string;
};

type AvailableModelProfileRecord = {
  id: string;
  name: string;
  provider: string;
  model: string;
  metadata: Record<string, unknown>;
  tier_label: string | null;
  usage_note: string | null;
  underlying_model: string | null;
};

type VisibleMemoryRecord = {
  id: string;
  memory_type: string | null;
  category: string;
  key: string;
  value: unknown;
  scope: string;
  stability: string;
  status: string;
  source_refs: unknown[];
  content: string;
  confidence: number;
  metadata: Record<string, unknown>;
  source_message_id: string | null;
  source_thread_id: string | null;
  source_thread_title: string | null;
  source_timestamp: string | null;
  created_at: string;
  updated_at: string;
};

type HiddenMemoryRecord = VisibleMemoryRecord;
type IncorrectMemoryRecord = VisibleMemoryRecord;

type RequestedThreadFallback = {
  requestedThreadId: string;
  reasonCode: "invalid_or_unauthorized";
};

type RuntimeReplyLanguage = "zh-Hans" | "en" | "unknown";
type DirectRecallQuestionKind =
  | "none"
  | "generic-memory"
  | "profession"
  | "planning-style";

function detectExplicitLanguageOverride(content: string): RuntimeReplyLanguage {
  const normalized = content.normalize("NFKC").toLowerCase();

  const englishHints = [
    "reply in english",
    "respond in english",
    "answer in english",
    "please use english",
    "请用英文",
    "请用英语",
    "用英文回答",
    "用英语回答"
  ];
  const chineseHints = [
    "reply in chinese",
    "respond in chinese",
    "answer in chinese",
    "please use chinese",
    "请用中文",
    "用中文回答",
    "请用简体中文",
    "用简体中文回答"
  ];

  if (englishHints.some((hint) => normalized.includes(hint))) {
    return "en";
  }

  if (chineseHints.some((hint) => normalized.includes(hint))) {
    return "zh-Hans";
  }

  return "unknown";
}

function summarizeAgentPrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 177).trimEnd()}...`;
}

function getUnderlyingModelFromMetadata(metadata: Record<string, unknown> | null | undefined) {
  return typeof metadata?.underlying_model === "string" &&
    metadata.underlying_model.trim().length > 0
    ? metadata.underlying_model
    : null;
}

function buildMessagePreview(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= 88) {
    return normalized;
  }

  return `${normalized.slice(0, 85).trimEnd()}...`;
}

function buildMemoryRecallPrompt(
  latestUserMessage: string,
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }>,
  replyLanguage: RuntimeReplyLanguage,
  relationshipRecall: {
    directNamingQuestion: boolean;
    directPreferredNameQuestion: boolean;
    nicknameMemory: {
      memory_type: "relationship";
      content: string;
      confidence: number;
    } | null;
    preferredNameMemory: {
      memory_type: "relationship";
      content: string;
      confidence: number;
    } | null;
  }
) {
  const normalizedUserMessage = latestUserMessage.toLowerCase();
  const directRecallQuestionKind = getDirectRecallQuestionKind(normalizedUserMessage);
  const isZh = replyLanguage === "zh-Hans";
  const isDirectMemoryQuestion = directRecallQuestionKind !== "none";

  if (
    recalledMemories.length === 0 &&
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
    relationshipRecall.directNamingQuestion && relationshipRecall.nicknameMemory
      ? isZh
        ? [
            `结构化关系记忆：当前用户可以把这个 agent 叫作“${relationshipRecall.nicknameMemory.content}”。`,
            "如果用户在问你叫什么或以后怎么叫你，优先使用这个昵称回答，而不是只返回 agent 的 canonical name。",
            "不要说你没有先前知识、没有对话历史，或不记得。"
          ]
        : [
            `Structured relationship memory: this user can call the current agent "${relationshipRecall.nicknameMemory.content}".`,
            "If the user asks what to call you or what your name is, answer with this nickname before the canonical agent name.",
            "Do not say that you have no prior knowledge, no conversation history, or no memory."
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
    relationshipRecall.directPreferredNameQuestion &&
    relationshipRecall.preferredNameMemory
      ? isZh
        ? [
            `结构化关系记忆：当前这个 agent 应该把用户叫作“${relationshipRecall.preferredNameMemory.content}”。`,
            "如果用户在问你应该怎么叫他/她，优先使用这个称呼回答，不要编造别的名字。",
            "不要把没有对话历史和没有长期记忆混为一谈。"
          ]
        : [
            `Structured relationship memory: this agent should address the user as "${relationshipRecall.preferredNameMemory.content}".`,
            "If the user asks how you should address them, answer with this stored preferred name before falling back to generic wording.",
            "Do not confuse missing conversation history with missing long-term memory."
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

  const sections = isZh
    ? [
        "与这条回复相关的长期记忆：",
        ...relationshipSections,
        ...preferredNameSections,
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
        ...recalledMemories.map(
          (memory, index) =>
            `${index + 1}. [${memory.memory_type}] ${memory.content} (confidence ${memory.confidence.toFixed(2)})`
        ),
        "Use these memories only when they are genuinely relevant to the current user message. Do not force them into the reply.",
        "Even if a recalled memory snippet was originally stored in another language, keep the full reply in the current target language."
      ];

  if (isDirectMemoryQuestion) {
    sections.push(...buildDirectRecallInstructions(directRecallQuestionKind, isZh));
  }

  return sections.join("\n");
}

function getDirectRecallQuestionKind(
  normalizedUserMessage: string
): DirectRecallQuestionKind {
  if (
    normalizedUserMessage.includes("what profession do you remember") ||
    normalizedUserMessage.includes("what work do you remember") ||
    normalizedUserMessage.includes("你记得我做什么") ||
    normalizedUserMessage.includes("你记得我的职业") ||
    normalizedUserMessage.includes("你记得我从事什么")
  ) {
    return "profession";
  }

  if (
    normalizedUserMessage.includes("what kind of weekly planning style would fit me best") ||
    normalizedUserMessage.includes("what planning style do i prefer") ||
    normalizedUserMessage.includes("what kind of planning style do i prefer") ||
    normalizedUserMessage.includes("我喜欢什么样的规划方式") ||
    normalizedUserMessage.includes("我偏好什么样的规划方式") ||
    normalizedUserMessage.includes("我喜欢什么样的回复方式")
  ) {
    return "planning-style";
  }

  if (
    normalizedUserMessage.includes("what do you remember") ||
    normalizedUserMessage.includes("if you do not know, say you do not know") ||
    normalizedUserMessage.includes("如果你不知道") ||
    normalizedUserMessage.includes("你记得") ||
    normalizedUserMessage.includes("你还记得")
  ) {
    return "generic-memory";
  }

  return "none";
}

function buildDirectRecallInstructions(
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

function detectReplyLanguageFromText(content: string): RuntimeReplyLanguage {
  const explicitOverride = detectExplicitLanguageOverride(content);

  if (explicitOverride !== "unknown") {
    return explicitOverride;
  }

  const hanMatches = content.match(/[\u3400-\u9fff]/g) ?? [];
  const latinMatches = content.match(/[A-Za-z]/g) ?? [];
  const cjkPunctuationMatches = content.match(/[，。！？；：“”‘’（）]/g) ?? [];
  const latinWordMatches = content.match(/\b[A-Za-z]{2,}\b/g) ?? [];

  if (
    hanMatches.length === 0 &&
    latinMatches.length === 0 &&
    cjkPunctuationMatches.length === 0
  ) {
    return "unknown";
  }

  const zhWeight = hanMatches.length + cjkPunctuationMatches.length * 0.5;
  const enWeight =
    latinMatches.length * 0.6 + latinWordMatches.length * 1.4;

  if (hanMatches.length >= 2 && zhWeight >= enWeight * 0.8) {
    return "zh-Hans";
  }

  if (latinWordMatches.length >= 2 && enWeight > zhWeight * 1.15) {
    return "en";
  }

  if (hanMatches.length > latinMatches.length) {
    return "zh-Hans";
  }

  if (latinMatches.length > hanMatches.length) {
    return "en";
  }

  return hanMatches.length > 0 ? "zh-Hans" : "en";
}

function getReplyLanguageInstruction(language: RuntimeReplyLanguage) {
  switch (language) {
    case "zh-Hans":
      return [
        "Runtime language target: reply in Simplified Chinese for this turn unless the user explicitly asks to switch languages.",
        "Do not drift into English just because recalled memory, model labels, or internal notes contain English text."
      ].join(" ");
    case "en":
      return [
        "Runtime language target: reply in English for this turn unless the user explicitly asks to switch languages.",
        "Do not switch to another language just because recalled memory, model labels, or internal notes contain that language."
      ].join(" ");
    default:
      return "Runtime language target: follow the latest user message language and avoid unnecessary language switching within the same reply.";
  }
}

function buildAgentSystemPrompt(
  agent: AgentRecord,
  latestUserMessage: string,
  recalledMemories: Array<{
    memory_type: "profile" | "preference" | "relationship";
    content: string;
    confidence: number;
  }> = [],
  replyLanguage: RuntimeReplyLanguage = "unknown",
  relationshipRecall: {
    directNamingQuestion: boolean;
    directPreferredNameQuestion: boolean;
    nicknameMemory: {
      memory_type: "relationship";
      content: string;
      confidence: number;
    } | null;
    preferredNameMemory: {
      memory_type: "relationship";
      content: string;
      confidence: number;
    } | null;
  } = {
    directNamingQuestion: false,
    directPreferredNameQuestion: false,
    nicknameMemory: null,
    preferredNameMemory: null
  }
) {
  const sections = [
    `You are ${agent.name}.`,
    agent.persona_summary ? `Persona summary: ${agent.persona_summary}` : "",
    agent.style_prompt ? `Style guidance: ${agent.style_prompt}` : "",
    getReplyLanguageInstruction(replyLanguage),
    agent.system_prompt,
    buildMemoryRecallPrompt(
      latestUserMessage,
      recalledMemories,
      replyLanguage,
      relationshipRecall
    )
  ].filter(Boolean);

  return sections.join("\n\n");
}

async function getDefaultPersonaPack() {
  const supabase = await createClient();

  for (const slug of DEFAULT_PERSONA_SLUGS) {
    const { data: personaPack } = await supabase
      .from("persona_packs")
      .select(
        "id, slug, name, persona_summary, style_prompt, system_prompt, metadata"
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (personaPack) {
      return personaPack;
    }
  }

  const { data: personaPack } = await supabase
    .from("persona_packs")
    .select(
      "id, slug, name, persona_summary, style_prompt, system_prompt, metadata"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!personaPack) {
    throw new Error(
      "No active persona pack is available. Apply the persona pack migration first."
    );
  }

  return personaPack;
}

export async function getDefaultModelProfile() {
  const supabase = await createClient();

  const { data: defaultProfile } = await supabase
    .from("model_profiles")
    .select("id, slug, name, provider, model, temperature, max_output_tokens, metadata")
    .eq("slug", DEFAULT_MODEL_PROFILE_SLUG)
    .eq("is_active", true)
    .maybeSingle();

  if (defaultProfile) {
    return defaultProfile as ModelProfileRecord;
  }

  const { data: fallbackProfile } = await supabase
    .from("model_profiles")
    .select("id, slug, name, provider, model, temperature, max_output_tokens, metadata")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!fallbackProfile) {
    throw new Error(
      "No active model profile is available. Apply the model profile migration first."
    );
  }

  return fallbackProfile as ModelProfileRecord;
}

async function resolveModelProfileForAgent({
  agent,
  workspaceId,
  userId
}: {
  agent: AgentRecord;
  workspaceId: string;
  userId: string;
}) {
  const supabase = await createClient();

  if (agent.default_model_profile_id) {
    const { data: boundProfile } = await supabase
      .from("model_profiles")
      .select("id, slug, name, provider, model, temperature, max_output_tokens, metadata")
      .eq("id", agent.default_model_profile_id)
      .eq("is_active", true)
      .maybeSingle();

    if (boundProfile) {
      return boundProfile as ModelProfileRecord;
    }
  }

  const defaultProfile = await getDefaultModelProfile();

  const { error } = await supabase
    .from("agents")
    .update({
      default_model_profile_id: defaultProfile.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", agent.id)
    .eq("workspace_id", workspaceId)
    .eq("owner_user_id", userId);

  if (error) {
    throw new Error(
      `Failed to bind a default model profile to the active agent: ${error.message}`
    );
  }

  agent.default_model_profile_id = defaultProfile.id;

  return defaultProfile;
}

export async function resolveAgentForWorkspace({
  workspaceId,
  userId
}: {
  workspaceId: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { data: existingAgent } = await supabase
    .from("agents")
    .select(
      "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata"
    )
    .eq("workspace_id", workspaceId)
    .eq("owner_user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingAgent) {
    return existingAgent as AgentRecord;
  }

  const personaPack = await getDefaultPersonaPack();
  const defaultModelProfile = await getDefaultModelProfile();

  const { data: createdAgent, error } = await supabase
    .from("agents")
    .insert({
      workspace_id: workspaceId,
      owner_user_id: userId,
      source_persona_pack_id: personaPack.id,
      name: personaPack.name,
      persona_summary: personaPack.persona_summary,
      style_prompt: personaPack.style_prompt,
      system_prompt: personaPack.system_prompt,
      default_model_profile_id: defaultModelProfile.id,
      is_custom: false,
      metadata: {
        auto_created: true,
        source_slug: personaPack.slug
      }
    })
    .select(
      "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata"
    )
    .single();

  if (error || !createdAgent) {
    throw new Error(
      `Failed to create a default agent for this workspace: ${error?.message ?? "unknown error"}`
    );
  }

  return createdAgent as AgentRecord;
}

export async function getChatState() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, kind")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    return {
      user,
      workspace: null,
      thread: null,
      agent: null,
      messages: []
    };
  }

  let { data: thread } = await supabase
    .from("threads")
    .select("id, title, status, agent_id, created_at, updated_at")
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let agent: AgentRecord | null = null;

  if (thread?.agent_id) {
    const { data: boundAgent } = await supabase
      .from("agents")
      .select(
        "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata"
      )
      .eq("id", thread.agent_id)
      .eq("workspace_id", workspace.id)
      .eq("owner_user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (boundAgent) {
      agent = boundAgent as AgentRecord;
    }
  }

  if (!agent) {
    agent = await resolveAgentForWorkspace({
      workspaceId: workspace.id,
      userId: user.id
    });

    if (!thread) {
      const { data: createdThread, error } = await supabase
        .from("threads")
        .insert({
          workspace_id: workspace.id,
          owner_user_id: user.id,
          agent_id: agent.id,
          title: "New chat"
        })
        .select("id, title, status, agent_id, created_at, updated_at")
        .single();

      if (error || !createdThread) {
        throw new Error(
          `Failed to create default chat thread: ${error?.message ?? "unknown error"}`
        );
      }

      thread = createdThread;
    } else {
      const { data: updatedThread, error } = await supabase
        .from("threads")
        .update({
          agent_id: agent.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", thread.id)
        .eq("owner_user_id", user.id)
        .select("id, title, status, agent_id, created_at, updated_at")
        .single();

      if (error || !updatedThread) {
        throw new Error(
          `Failed to bind thread to the default agent: ${error?.message ?? "unknown error"}`
        );
      }

      thread = updatedThread;
    }
  }

  if (!thread) {
    throw new Error("Thread resolution failed for the current workspace.");
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("thread_id", thread.id)
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new Error(`Failed to load messages: ${messagesError.message}`);
  }

  return {
    user,
    workspace: workspace as WorkspaceRecord,
    thread: thread as ThreadRecord,
    agent,
    messages: (messages ?? []) as MessageRecord[]
  };
}

export async function getChatPageState({
  requestedThreadId
}: {
  requestedThreadId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, kind")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    return {
      user,
      workspace: null,
      availablePersonaPacks: [],
      availableModelProfiles: [],
      availableAgents: [],
      defaultAgentId: null,
      visibleMemories: [],
      hiddenMemories: [],
      threads: [],
      thread: null,
      agent: null,
      messages: [],
      canonicalThreadId: null,
      shouldReplaceUrl: false,
      requestedThreadFallback: null as RequestedThreadFallback | null
    };
  }

  const { data: rawThreads, error: threadsError } = await supabase
    .from("threads")
    .select("id, title, status, agent_id, created_at, updated_at")
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .order("updated_at", { ascending: false });

  if (threadsError) {
    throw new Error(`Failed to load threads: ${threadsError.message}`);
  }

  const { data: personaPacksData, error: personaPacksError } = await supabase
    .from("persona_packs")
    .select("id, slug, name, description, persona_summary")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (personaPacksError) {
    throw new Error(
      `Failed to load available persona packs: ${personaPacksError.message}`
    );
  }

  const { data: availableAgentsData, error: availableAgentsError } = await supabase
    .from("agents")
    .select(
      "id, name, is_custom, persona_summary, system_prompt, source_persona_pack_id, default_model_profile_id, metadata"
    )
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (availableAgentsError) {
    throw new Error(
      `Failed to load available agents: ${availableAgentsError.message}`
    );
  }

  const { data: availableModelProfilesData, error: availableModelProfilesError } =
    await supabase
      .from("model_profiles")
      .select("id, name, provider, model, metadata")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

  if (availableModelProfilesError) {
    throw new Error(
      `Failed to load available model profiles: ${availableModelProfilesError.message}`
    );
  }

  const { data: visibleMemoriesData, error: visibleMemoriesError } = await supabase
    .from("memory_items")
    .select(
      "id, memory_type, content, confidence, category, key, value, scope, subject_user_id, target_agent_id, target_thread_id, stability, status, source_refs, metadata, source_message_id, created_at, updated_at"
    )
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  if (visibleMemoriesError) {
    throw new Error(
      `Failed to load visible memories: ${visibleMemoriesError.message}`
    );
  }

  const rawAvailableAgents = (availableAgentsData ?? []) as Array<{
    id: string;
    name: string;
    is_custom: boolean;
    persona_summary: string;
    system_prompt: string;
    source_persona_pack_id: string | null;
    default_model_profile_id: string | null;
    metadata: Record<string, unknown>;
  }>;
  const personaPackIds = [
    ...new Set(
      rawAvailableAgents
        .map((agent) => agent.source_persona_pack_id)
        .filter((id): id is string => Boolean(id))
    )
  ];
  const modelProfileIds = [
    ...new Set(
      rawAvailableAgents
        .map((agent) => agent.default_model_profile_id)
        .filter((id): id is string => Boolean(id))
    )
  ];
  const rawVisibleMemories = (visibleMemoriesData ?? []) as Array<{
    id: string;
    memory_type: string | null;
    category?: string | null;
    key?: string | null;
    value?: unknown;
    scope?: string | null;
    subject_user_id?: string | null;
    target_agent_id?: string | null;
    target_thread_id?: string | null;
    stability?: string | null;
    status?: string | null;
    source_refs?: unknown;
    content: string;
    confidence: number;
    metadata: Record<string, unknown>;
    source_message_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  const validVisibleMemories = rawVisibleMemories.filter((memory) =>
    isMemoryScopeValid(memory)
  );
  const filteredVisibleMemories = validVisibleMemories
    .filter(
      (memory) => !isMemoryHidden(memory) && !isMemoryIncorrect(memory)
    )
    .slice(0, 20);
  const filteredHiddenMemories = validVisibleMemories
    .filter(
      (memory) => isMemoryHidden(memory) && !isMemoryIncorrect(memory)
    )
    .slice(0, 20);
  const filteredIncorrectMemories = validVisibleMemories
    .filter((memory) => isMemoryIncorrect(memory))
    .slice(0, 20);
  const sourceMessageIds = [
    ...new Set(
      [
        ...filteredVisibleMemories,
        ...filteredHiddenMemories,
        ...filteredIncorrectMemories
      ]
        .map((memory) => memory.source_message_id)
        .filter((id): id is string => Boolean(id))
    )
  ];
  let personaPackNameById = new Map<string, string>();
  let modelProfileNameById = new Map<string, string>();
  let modelProfileTierLabelById = new Map<string, string>();
  let sourceMessageById = new Map<
    string,
    { thread_id: string; created_at: string }
  >();
  let sourceThreadTitleById = new Map<string, string>();

  if (personaPackIds.length > 0) {
    const { data: personaPacks, error: personaPacksError } = await supabase
      .from("persona_packs")
      .select("id, name")
      .in("id", personaPackIds);

    if (personaPacksError) {
      throw new Error(
        `Failed to load agent persona packs: ${personaPacksError.message}`
      );
    }

    personaPackNameById = new Map(
      (personaPacks ?? []).map((personaPack) => [personaPack.id, personaPack.name])
    );
  }

  if (modelProfileIds.length > 0) {
    const { data: modelProfiles, error: modelProfilesError } = await supabase
      .from("model_profiles")
      .select("id, name, metadata")
      .in("id", modelProfileIds)
      .eq("is_active", true);

    if (modelProfilesError) {
      throw new Error(
        `Failed to load agent model profiles: ${modelProfilesError.message}`
      );
    }

    modelProfileNameById = new Map(
      (modelProfiles ?? []).map((modelProfile) => [modelProfile.id, modelProfile.name])
    );
    modelProfileTierLabelById = new Map();

    for (const modelProfile of modelProfiles ?? []) {
      if (typeof modelProfile.metadata?.tier_label === "string") {
        modelProfileTierLabelById.set(
          modelProfile.id,
          modelProfile.metadata.tier_label
        );
      }
    }
  }

  if (sourceMessageIds.length > 0) {
    const { data: sourceMessages, error: sourceMessagesError } = await supabase
      .from("messages")
      .select("id, thread_id, created_at")
      .in("id", sourceMessageIds)
      .eq("workspace_id", workspace.id);

    if (sourceMessagesError) {
      throw new Error(
        `Failed to load memory source messages: ${sourceMessagesError.message}`
      );
    }

    sourceMessageById = new Map(
      (sourceMessages ?? []).map((message) => [
        message.id,
        {
          thread_id: message.thread_id,
          created_at: message.created_at
        }
      ])
    );

    const sourceThreadIds = [
      ...new Set((sourceMessages ?? []).map((message) => message.thread_id))
    ];

    if (sourceThreadIds.length > 0) {
      const { data: sourceThreads, error: sourceThreadsError } = await supabase
        .from("threads")
        .select("id, title")
        .in("id", sourceThreadIds)
        .eq("workspace_id", workspace.id)
        .eq("owner_user_id", user.id);

      if (sourceThreadsError) {
        throw new Error(
          `Failed to load memory source threads: ${sourceThreadsError.message}`
        );
      }

      sourceThreadTitleById = new Map(
        (sourceThreads ?? []).map((thread) => [thread.id, thread.title])
      );
    }
  }

  const availableAgents = rawAvailableAgents.map((agent) => ({
    ...agent,
    persona_summary: agent.persona_summary,
    background_summary:
      typeof agent.metadata?.background_summary === "string" &&
      agent.metadata.background_summary.trim().length > 0
        ? agent.metadata.background_summary
        : null,
    avatar_emoji:
      typeof agent.metadata?.avatar_emoji === "string" &&
      agent.metadata.avatar_emoji.trim().length > 0
        ? agent.metadata.avatar_emoji
        : null,
    system_prompt_summary: summarizeAgentPrompt(agent.system_prompt),
    source_persona_pack_name: agent.source_persona_pack_id
      ? personaPackNameById.get(agent.source_persona_pack_id) ?? null
      : null,
    default_model_profile_name: agent.default_model_profile_id
      ? modelProfileNameById.get(agent.default_model_profile_id) ?? null
      : null,
    default_model_profile_tier_label: agent.default_model_profile_id
      ? modelProfileTierLabelById.get(agent.default_model_profile_id) ?? null
      : null,
    is_default_for_workspace:
      agent.metadata?.is_default_for_workspace === true
  })) as AvailableAgentRecord[];
  const defaultAgentId =
    availableAgents.find((agent) => agent.is_default_for_workspace)?.id ??
    availableAgents[0]?.id ??
    null;
  const availablePersonaPacks = (personaPacksData ?? []) as AvailablePersonaPackRecord[];
  const availableModelProfiles = ((availableModelProfilesData ?? []) as Array<{
    id: string;
    name: string;
    provider: string;
    model: string;
    metadata: Record<string, unknown> | null;
  }>).map((modelProfile) => ({
    ...modelProfile,
    metadata: modelProfile.metadata ?? {},
    tier_label:
      typeof modelProfile.metadata?.tier_label === "string"
        ? modelProfile.metadata.tier_label
        : null,
    usage_note:
      typeof modelProfile.metadata?.usage_note === "string"
        ? modelProfile.metadata.usage_note
        : null,
    underlying_model: getUnderlyingModelFromMetadata(modelProfile.metadata)
  })) as AvailableModelProfileRecord[];
  const visibleMemories = filteredVisibleMemories.map((memory) => {
    const sourceMessage = memory.source_message_id
      ? sourceMessageById.get(memory.source_message_id) ?? null
      : null;

    return {
      ...memory,
      category: getMemoryCategory(memory),
      key: getMemoryKey(memory),
      value: memory.value ?? memory.content,
      scope: getMemoryScope(memory),
      stability: getMemoryStability(memory),
      status: getMemoryStatus(memory),
      source_refs: getMemorySourceRefs(memory),
      source_thread_id: sourceMessage?.thread_id ?? null,
      source_thread_title: sourceMessage?.thread_id
        ? sourceThreadTitleById.get(sourceMessage.thread_id) ?? null
        : null,
      source_timestamp: sourceMessage?.created_at ?? null
    };
  }) as VisibleMemoryRecord[];
  const hiddenMemories = filteredHiddenMemories.map((memory) => {
    const sourceMessage = memory.source_message_id
      ? sourceMessageById.get(memory.source_message_id) ?? null
      : null;

    return {
      ...memory,
      category: getMemoryCategory(memory),
      key: getMemoryKey(memory),
      value: memory.value ?? memory.content,
      scope: getMemoryScope(memory),
      stability: getMemoryStability(memory),
      status: getMemoryStatus(memory),
      source_refs: getMemorySourceRefs(memory),
      source_thread_id: sourceMessage?.thread_id ?? null,
      source_thread_title: sourceMessage?.thread_id
        ? sourceThreadTitleById.get(sourceMessage.thread_id) ?? null
        : null,
      source_timestamp: sourceMessage?.created_at ?? null
    };
  }) as HiddenMemoryRecord[];
  const incorrectMemories = filteredIncorrectMemories.map((memory) => {
    const sourceMessage = memory.source_message_id
      ? sourceMessageById.get(memory.source_message_id) ?? null
      : null;

    return {
      ...memory,
      category: getMemoryCategory(memory),
      key: getMemoryKey(memory),
      value: memory.value ?? memory.content,
      scope: getMemoryScope(memory),
      stability: getMemoryStability(memory),
      status: getMemoryStatus(memory),
      source_refs: getMemorySourceRefs(memory),
      source_thread_id: sourceMessage?.thread_id ?? null,
      source_thread_title: sourceMessage?.thread_id
        ? sourceThreadTitleById.get(sourceMessage.thread_id) ?? null
        : null,
      source_timestamp: sourceMessage?.created_at ?? null
    };
  }) as IncorrectMemoryRecord[];
  const threads = (rawThreads ?? []) as ThreadRecord[];

  if (threads.length === 0) {
    return {
      user,
      workspace: workspace as WorkspaceRecord,
      availablePersonaPacks,
      availableModelProfiles,
      availableAgents,
      defaultAgentId,
      visibleMemories,
      hiddenMemories,
      incorrectMemories,
      threads: [],
      thread: null,
      agent: null,
      messages: [],
      canonicalThreadId: null,
      shouldReplaceUrl: false,
      requestedThreadFallback: requestedThreadId
        ? ({
            requestedThreadId,
            reasonCode: "invalid_or_unauthorized"
          } satisfies RequestedThreadFallback)
        : null
    };
  }

  const agentIds = [...new Set(threads.map((thread) => thread.agent_id).filter(Boolean))];
  let agentById = new Map<string, AgentRecord>();
  let latestMessageByThreadId = new Map<
    string,
    { content: string; created_at: string }
  >();

  if (agentIds.length > 0) {
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select(
        "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata"
      )
      .in("id", agentIds)
      .eq("workspace_id", workspace.id)
      .eq("owner_user_id", user.id)
      .eq("status", "active");

    if (agentsError) {
      throw new Error(`Failed to load thread agents: ${agentsError.message}`);
    }

    agentById = new Map(
      ((agents ?? []) as AgentRecord[]).map((agent) => [agent.id, agent])
    );
  }

  if (threads.length > 0) {
    const threadIds = threads.map((thread) => thread.id);
    const { data: latestMessages, error: latestMessagesError } = await supabase
      .from("messages")
      .select("thread_id, content, created_at, status")
      .in("thread_id", threadIds)
      .eq("workspace_id", workspace.id)
      .in("status", ["completed"])
      .order("created_at", { ascending: false });

    if (latestMessagesError) {
      throw new Error(
        `Failed to load thread previews: ${latestMessagesError.message}`
      );
    }

    latestMessageByThreadId = new Map();

    for (const message of latestMessages ?? []) {
      if (!latestMessageByThreadId.has(message.thread_id)) {
        latestMessageByThreadId.set(message.thread_id, {
          content: message.content,
          created_at: message.created_at
        });
      }
    }
  }

  const threadItems: ThreadListItem[] = threads.map((thread) => ({
    ...thread,
    agent_name: thread.agent_id ? agentById.get(thread.agent_id)?.name ?? null : null,
    latest_message_preview: latestMessageByThreadId.get(thread.id)
      ? buildMessagePreview(latestMessageByThreadId.get(thread.id)!.content)
      : null,
    latest_message_created_at:
      latestMessageByThreadId.get(thread.id)?.created_at ?? null
  }));

  const matchedThread = requestedThreadId
    ? threadItems.find((thread) => thread.id === requestedThreadId) ?? null
    : null;
  const activeThread = matchedThread ?? threadItems[0];
  const requestedThreadFallback =
    requestedThreadId && !matchedThread
      ? ({
          requestedThreadId,
          reasonCode: "invalid_or_unauthorized"
        } satisfies RequestedThreadFallback)
      : null;
  const shouldReplaceUrl =
    Boolean(activeThread) && activeThread.id !== (requestedThreadId ?? null);
  const activeAgent =
    activeThread?.agent_id ? agentById.get(activeThread.agent_id) ?? null : null;

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, role, content, status, metadata, created_at")
    .eq("thread_id", activeThread.id)
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new Error(`Failed to load messages: ${messagesError.message}`);
  }

  return {
    user,
    workspace: workspace as WorkspaceRecord,
    availablePersonaPacks,
    availableModelProfiles,
    availableAgents,
    defaultAgentId,
    visibleMemories,
    hiddenMemories,
    incorrectMemories,
    threads: threadItems,
    thread: activeThread,
    agent: activeAgent,
    messages: (messages ?? []) as MessageRecord[],
    canonicalThreadId: activeThread.id,
    shouldReplaceUrl,
    requestedThreadFallback
  };
}

export async function generateAgentReply({
  userId,
  workspace,
  thread,
  agent,
  messages,
  assistantMessageId
}: {
  userId: string;
  workspace: WorkspaceRecord;
  thread: ThreadRecord;
  agent: AgentRecord;
  messages: MessageRecord[];
  assistantMessageId?: string;
}) {
  const supabase = await createClient();
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const replyLanguage = latestUserMessage
    ? detectReplyLanguageFromText(latestUserMessage.content)
    : "unknown";
  const memoryRecall = latestUserMessage
    ? await recallRelevantMemories({
        workspaceId: workspace.id,
        userId,
        latestUserMessage: latestUserMessage.content
      })
    : {
        memories: [],
        usedMemoryTypes: [],
        hiddenExclusionCount: 0,
        incorrectExclusionCount: 0
      };
  let relationshipRecall: {
    directNamingQuestion: boolean;
    directPreferredNameQuestion: boolean;
    nicknameMemory: {
      memory_type: "relationship";
      content: string;
      confidence: number;
    } | null;
    preferredNameMemory: {
      memory_type: "relationship";
      content: string;
      confidence: number;
    } | null;
  } = {
    directNamingQuestion: false,
    directPreferredNameQuestion: false,
    nicknameMemory: null,
    preferredNameMemory: null
  };

  if (
    latestUserMessage &&
    (isDirectAgentNamingQuestion(latestUserMessage.content) ||
      isDirectUserPreferredNameQuestion(latestUserMessage.content))
  ) {
    const nicknameRecall = isDirectAgentNamingQuestion(latestUserMessage.content)
      ? await recallAgentNickname({
          workspaceId: workspace.id,
          userId,
          agentId: agent.id,
          latestUserMessage: latestUserMessage.content
        })
      : {
          directNamingQuestion: false,
          nicknameMemory: null
        };

    const preferredNameRecall = isDirectUserPreferredNameQuestion(
      latestUserMessage.content
    )
      ? await recallUserPreferredName({
          workspaceId: workspace.id,
          userId,
          agentId: agent.id,
          latestUserMessage: latestUserMessage.content
        })
      : {
          directPreferredNameQuestion: false,
          preferredNameMemory: null
        };

    relationshipRecall = {
      ...relationshipRecall,
      ...nicknameRecall,
      ...preferredNameRecall
    };
  }
  const recalledMemories = memoryRecall.memories;
  const relationshipMemories = [
    relationshipRecall.nicknameMemory,
    relationshipRecall.preferredNameMemory
  ].filter(Boolean) as Array<{
    memory_type: "relationship";
    content: string;
    confidence: number;
  }>;
  const allRecalledMemories =
    relationshipMemories.length > 0
      ? [...recalledMemories, ...relationshipMemories]
      : recalledMemories;
  const modelProfile = await resolveModelProfileForAgent({
    agent,
    workspaceId: workspace.id,
    userId
  });
  const promptMessages = [
    {
      role: "system" as const,
      content: buildAgentSystemPrompt(
        agent,
        latestUserMessage?.content ?? "",
        allRecalledMemories,
        replyLanguage,
        relationshipRecall
      )
    },
    ...messages
      .filter((message) => message.status !== "failed" && message.status !== "pending")
      .map((message) => ({
        role: message.role,
        content: message.content
      }))
  ];

  const result = await generateText({
    model: modelProfile.model,
    messages: promptMessages,
    temperature: modelProfile.temperature,
    maxOutputTokens: modelProfile.max_output_tokens
  });

  const assistantPayload = {
    role: "assistant",
    content: result.content,
    status: "completed",
    metadata: {
      agent_id: agent.id,
      agent_name: agent.name,
      model: result.model,
      model_provider: modelProfile.provider,
      model_requested: modelProfile.model,
      underlying_model_label:
        getUnderlyingModelFromMetadata(modelProfile.metadata) ??
        `${modelProfile.provider}/${result.model ?? modelProfile.model}`,
      model_profile_id: modelProfile.id,
      model_profile_name: modelProfile.name,
      reply_language_target: replyLanguage,
      reply_language_detected: detectReplyLanguageFromText(result.content),
      memory_hit_count: allRecalledMemories.length,
      memory_used: allRecalledMemories.length > 0,
      memory_types_used: relationshipMemories.length > 0
        ? Array.from(
            new Set([...memoryRecall.usedMemoryTypes, "relationship" as const])
          )
        : memoryRecall.usedMemoryTypes,
      hidden_memory_exclusion_count: memoryRecall.hiddenExclusionCount,
      incorrect_memory_exclusion_count: memoryRecall.incorrectExclusionCount,
      recalled_memories: allRecalledMemories.map((memory) => ({
        memory_type: memory.memory_type,
        content: memory.content,
        confidence: memory.confidence
      }))
    }
  };

  const { error } = assistantMessageId
    ? await supabase
        .from("messages")
        .update({
          ...assistantPayload,
          updated_at: new Date().toISOString()
        })
        .eq("id", assistantMessageId)
        .eq("thread_id", thread.id)
        .eq("workspace_id", workspace.id)
        .eq("user_id", userId)
    : await supabase.from("messages").insert({
        thread_id: thread.id,
        workspace_id: workspace.id,
        user_id: userId,
        ...assistantPayload
      });

  if (error) {
    throw new Error(`Failed to store assistant reply: ${error.message}`);
  }

  await supabase
    .from("threads")
    .update({
      agent_id: agent.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", thread.id)
    .eq("owner_user_id", userId);
}
