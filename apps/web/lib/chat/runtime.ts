import { generateText } from "@/lib/litellm/client";
import { recallRelevantMemories } from "@/lib/chat/memory";
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
};

type AvailableAgentRecord = {
  id: string;
  name: string;
  is_custom: boolean;
  source_persona_pack_id: string | null;
  default_model_profile_id: string | null;
  source_persona_pack_name: string | null;
  default_model_profile_name: string | null;
  is_default_for_workspace: boolean;
};

type AvailablePersonaPackRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  persona_summary: string;
};

type VisibleMemoryRecord = {
  id: string;
  memory_type: "profile" | "preference";
  content: string;
  confidence: number;
  created_at: string;
  updated_at: string;
};

type RequestedThreadFallback = {
  requestedThreadId: string;
  reasonCode: "invalid_or_unauthorized";
};

function buildMemoryRecallPrompt(
  recalledMemories: Array<{
    memory_type: "profile" | "preference";
    content: string;
    confidence: number;
  }>
) {
  if (recalledMemories.length === 0) {
    return "";
  }

  return [
    "Relevant long-term memory for this reply:",
    ...recalledMemories.map(
      (memory, index) =>
        `${index + 1}. [${memory.memory_type}] ${memory.content} (confidence ${memory.confidence.toFixed(2)})`
    ),
    "Use these memories only when they are genuinely relevant to the current user message. Do not force them into the reply."
  ].join("\n");
}

function buildAgentSystemPrompt(
  agent: AgentRecord,
  recalledMemories: Array<{
    memory_type: "profile" | "preference";
    content: string;
    confidence: number;
  }> = []
) {
  const sections = [
    `You are ${agent.name}.`,
    agent.persona_summary ? `Persona summary: ${agent.persona_summary}` : "",
    agent.style_prompt ? `Style guidance: ${agent.style_prompt}` : "",
    agent.system_prompt,
    buildMemoryRecallPrompt(recalledMemories)
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
      availableAgents: [],
      defaultAgentId: null,
      visibleMemories: [],
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
      "id, name, is_custom, source_persona_pack_id, default_model_profile_id, metadata"
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

  const { data: visibleMemoriesData, error: visibleMemoriesError } = await supabase
    .from("memory_items")
    .select("id, memory_type, content, confidence, created_at, updated_at")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .in("memory_type", ["profile", "preference"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (visibleMemoriesError) {
    throw new Error(
      `Failed to load visible memories: ${visibleMemoriesError.message}`
    );
  }

  const rawAvailableAgents = (availableAgentsData ?? []) as Array<{
    id: string;
    name: string;
    is_custom: boolean;
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
  let personaPackNameById = new Map<string, string>();
  let modelProfileNameById = new Map<string, string>();

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
      .select("id, name")
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
  }

  const availableAgents = rawAvailableAgents.map((agent) => ({
    ...agent,
    source_persona_pack_name: agent.source_persona_pack_id
      ? personaPackNameById.get(agent.source_persona_pack_id) ?? null
      : null,
    default_model_profile_name: agent.default_model_profile_id
      ? modelProfileNameById.get(agent.default_model_profile_id) ?? null
      : null,
    is_default_for_workspace:
      agent.metadata?.is_default_for_workspace === true
  })) as AvailableAgentRecord[];
  const defaultAgentId =
    availableAgents.find((agent) => agent.is_default_for_workspace)?.id ??
    availableAgents[0]?.id ??
    null;
  const availablePersonaPacks = (personaPacksData ?? []) as AvailablePersonaPackRecord[];
  const visibleMemories = (visibleMemoriesData ?? []) as VisibleMemoryRecord[];
  const threads = (rawThreads ?? []) as ThreadRecord[];

  if (threads.length === 0) {
    return {
      user,
      workspace: workspace as WorkspaceRecord,
      availablePersonaPacks,
      availableAgents,
      defaultAgentId,
      visibleMemories,
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

  const threadItems: ThreadListItem[] = threads.map((thread) => ({
    ...thread,
    agent_name: thread.agent_id ? agentById.get(thread.agent_id)?.name ?? null : null
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
    availableAgents,
    defaultAgentId,
    visibleMemories,
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
  const recalledMemories = latestUserMessage
    ? await recallRelevantMemories({
        workspaceId: workspace.id,
        userId,
        latestUserMessage: latestUserMessage.content
      })
    : [];
  const modelProfile = await resolveModelProfileForAgent({
    agent,
    workspaceId: workspace.id,
    userId
  });
  const promptMessages = [
    {
      role: "system" as const,
      content: buildAgentSystemPrompt(agent, recalledMemories)
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
      model: result.model,
      model_profile_id: modelProfile.id,
      recalled_memories: recalledMemories.map((memory) => ({
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
