import { generateText } from "@/lib/litellm/client";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_MODEL = "replicate-llama-3-8b";
const DEFAULT_PERSONA_SLUGS = ["companion_default", "spark-guide"];

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
  metadata: Record<string, unknown>;
};

type MessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function buildAgentSystemPrompt(agent: AgentRecord) {
  const sections = [
    `You are ${agent.name}.`,
    agent.persona_summary ? `Persona summary: ${agent.persona_summary}` : "",
    agent.style_prompt ? `Style guidance: ${agent.style_prompt}` : "",
    agent.system_prompt
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
    .select("id, name, persona_summary, style_prompt, system_prompt, metadata")
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
      is_custom: false,
      metadata: {
        auto_created: true,
        source_slug: personaPack.slug,
        default_model: DEFAULT_MODEL
      }
    })
    .select("id, name, persona_summary, style_prompt, system_prompt, metadata")
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
      .select("id, name, persona_summary, style_prompt, system_prompt, metadata")
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

export async function generateAgentReply({
  userId,
  workspace,
  thread,
  agent,
  messages
}: {
  userId: string;
  workspace: WorkspaceRecord;
  thread: ThreadRecord;
  agent: AgentRecord;
  messages: MessageRecord[];
}) {
  const supabase = await createClient();
  const promptMessages = [
    {
      role: "system" as const,
      content: buildAgentSystemPrompt(agent)
    },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content
    }))
  ];

  const result = await generateText({
    model: DEFAULT_MODEL,
    messages: promptMessages
  });

  const { error } = await supabase.from("messages").insert({
    thread_id: thread.id,
    workspace_id: workspace.id,
    user_id: userId,
    role: "assistant",
    content: result.content,
    metadata: {
      agent_id: agent.id,
      model: result.model
    }
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
