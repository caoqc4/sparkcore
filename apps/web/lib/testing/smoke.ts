import { createServerClient } from "@supabase/ssr";
import {
  createClient as createSupabaseClient,
  type SupabaseClient
} from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";
import {
  buildMemoryV2Fields,
  inferLegacyMemoryStability,
  LEGACY_MEMORY_KEY
} from "@/lib/chat/memory-v2";

const DEV_SMOKE_SECRET = "sparkcore-smoke-local";
const DEV_SMOKE_EMAIL = "smoke@example.com";
const DEV_SMOKE_PASSWORD = "SparkcoreSmoke123!";

const SMOKE_MODEL_PROFILES = [
  {
    slug: "spark-default",
    name: "Spark Default",
    provider: "replicate",
    model: "replicate-llama-3-8b",
    temperature: 0.7,
    max_output_tokens: null,
    metadata: {
      seed: true,
      default: true,
      smoke_seed: true,
      tier: "stable-conversation",
      tier_label: "Stable conversation",
      usage_note:
        "Balanced baseline for everyday chat and stage-1 comparison runs."
    }
  },
  {
    slug: "smoke-alt",
    name: "Smoke Alt",
    provider: "replicate",
    model: "replicate-llama-3-8b",
    temperature: 0.3,
    max_output_tokens: null,
    metadata: {
      seed: true,
      smoke_seed: true,
      tier: "low-cost-testing",
      tier_label: "Low-cost testing",
      usage_note:
        "Lighter comparison profile for smoke checks and quick runtime verification."
    }
  }
] as const;

type SmokeConfig = {
  secret: string;
  email: string;
  password: string;
  serviceRoleKey: string;
  url: string;
  anonKey: string;
};

type SmokeUser = {
  id: string;
  email: string;
  workspaceId: string;
};

type SmokeThread = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  agent_id: string | null;
  title: string;
};

type SmokeReplyLanguage = "zh-Hans" | "en" | "unknown";

function getFallbackValue(envKey: "secret" | "email" | "password") {
  if (process.env.NODE_ENV !== "development") {
    return undefined;
  }

  switch (envKey) {
    case "secret":
      return DEV_SMOKE_SECRET;
    case "email":
      return DEV_SMOKE_EMAIL;
    case "password":
      return DEV_SMOKE_PASSWORD;
  }
}

export function getSmokeConfig() {
  const { url, anonKey } = getSupabaseEnv();
  const secret =
    process.env.PLAYWRIGHT_SMOKE_SECRET ?? getFallbackValue("secret");
  const email =
    process.env.PLAYWRIGHT_SMOKE_EMAIL ?? getFallbackValue("email");
  const password =
    process.env.PLAYWRIGHT_SMOKE_PASSWORD ?? getFallbackValue("password");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !email || !password || !serviceRoleKey) {
    return null;
  }

  return {
    secret,
    email,
    password,
    serviceRoleKey,
    url,
    anonKey
  } satisfies SmokeConfig;
}

export function isAuthorizedSmokeRequest(
  request: NextRequest,
  config: SmokeConfig | null
) {
  if (!config) {
    return false;
  }

  const headerSecret = request.headers.get("x-smoke-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return headerSecret === config.secret || querySecret === config.secret;
}

function getAdminClient(config: SmokeConfig) {
  return createSupabaseClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function ensureSmokeUser(
  admin: SupabaseClient,
  config: SmokeConfig,
  options?: {
    resetPassword?: boolean;
  }
): Promise<SmokeUser> {
  const { data: listedUsersData, error: listError } =
    await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200
    });

  if (listError) {
    throw new Error(`Failed to list auth users: ${listError.message}`);
  }

  const existingUser =
    listedUsersData.users.find((user) => user.email === config.email) ?? null;

  let ensuredUser = existingUser;

  if (!ensuredUser) {
    const { data: createdUserData, error: createUserError } =
      await admin.auth.admin.createUser({
        email: config.email,
        password: config.password,
        email_confirm: true,
        user_metadata: {
          smoke_seed: true
        }
      });

    if (createUserError) {
      throw new Error(`Failed to create the smoke user: ${createUserError.message}`);
    }

    ensuredUser = createdUserData.user;
  }

  if (!ensuredUser?.id) {
    throw new Error("Failed to create the smoke test user.");
  }

  if (existingUser && options?.resetPassword) {
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existingUser.id,
      {
        password: config.password,
        email_confirm: true,
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          smoke_seed: true
        }
      }
    );

    if (updateError) {
      throw new Error(`Failed to update the smoke user: ${updateError.message}`);
    }
  }

  const workspaceSlug = `personal-${ensuredUser.id.replaceAll("-", "")}`;
  const workspaceName = `${
    config.email.split("@")[0] || "sparkcore"
  } workspace`;

  const { error: userUpsertError } = await admin.from("users").upsert(
    {
      id: ensuredUser.id,
      email: config.email
    },
    {
      onConflict: "id"
    }
  );

  if (userUpsertError) {
    throw new Error(`Failed to upsert the smoke profile: ${userUpsertError.message}`);
  }

  const { error: workspaceUpsertError } = await admin.from("workspaces").upsert(
    {
      owner_user_id: ensuredUser.id,
      name: workspaceName,
      slug: workspaceSlug,
      kind: "personal"
    },
    {
      onConflict: "slug"
    }
  );

  if (workspaceUpsertError) {
    throw new Error(
      `Failed to upsert the smoke workspace: ${workspaceUpsertError.message}`
    );
  }

  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", ensuredUser.id)
    .eq("slug", workspaceSlug)
    .maybeSingle();

  if (workspaceError || !workspace) {
    throw new Error(
      workspaceError?.message ?? "Failed to resolve the smoke workspace."
    );
  }

  return {
    id: ensuredUser.id,
    email: config.email,
    workspaceId: workspace.id
  };
}

async function ensureSmokeModelProfiles(admin: SupabaseClient) {
  const { error: upsertError } = await admin
    .from("model_profiles")
    .upsert([...SMOKE_MODEL_PROFILES], {
      onConflict: "slug"
    });

  if (upsertError) {
    throw new Error(
      `Failed to seed smoke model profiles: ${upsertError.message}`
    );
  }

  const { data: profiles, error: profilesError } = await admin
    .from("model_profiles")
    .select("id, slug, name")
    .in(
      "slug",
      SMOKE_MODEL_PROFILES.map((profile) => profile.slug)
    )
    .eq("is_active", true);

  if (profilesError || !profiles) {
    throw new Error(
      profilesError?.message ?? "Failed to load smoke model profiles."
    );
  }

  return profiles;
}

async function resetSmokeWorkspaceState(
  admin: SupabaseClient,
  user: SmokeUser
) {
  const { error: deleteThreadsError } = await admin
    .from("threads")
    .delete()
    .eq("owner_user_id", user.id);

  if (deleteThreadsError) {
    throw new Error(
      `Failed to clear smoke threads: ${deleteThreadsError.message}`
    );
  }

  const { error: deleteMemoryError } = await admin
    .from("memory_items")
    .delete()
    .eq("user_id", user.id);

  if (deleteMemoryError) {
    throw new Error(
      `Failed to clear smoke memory: ${deleteMemoryError.message}`
    );
  }

  const { error: deleteAgentsError } = await admin
    .from("agents")
    .delete()
    .eq("owner_user_id", user.id);

  if (deleteAgentsError) {
    throw new Error(
      `Failed to clear smoke agents: ${deleteAgentsError.message}`
    );
  }
}

async function seedSmokeAgents(
  admin: SupabaseClient,
  user: SmokeUser,
  modelProfiles: Array<{ id: string; slug: string; name: string }>
) {
  const { data: personaPacks, error: personaPacksError } = await admin
    .from("persona_packs")
    .select(
      "id, slug, name, persona_summary, style_prompt, system_prompt, description"
    )
    .in("slug", ["spark-guide", "memory-coach"])
    .eq("is_active", true);

  if (personaPacksError || !personaPacks || personaPacks.length < 2) {
    throw new Error(
      personaPacksError?.message ??
        "Expected seeded persona packs for the smoke workspace."
    );
  }

  const sparkGuidePack = personaPacks.find((pack) => pack.slug === "spark-guide");
  const memoryCoachPack = personaPacks.find(
    (pack) => pack.slug === "memory-coach"
  );
  const defaultProfile = modelProfiles.find((profile) => profile.slug === "spark-default");
  const altProfile = modelProfiles.find((profile) => profile.slug === "smoke-alt");

  if (!sparkGuidePack || !memoryCoachPack || !defaultProfile || !altProfile) {
    throw new Error("Smoke seed dependencies are incomplete.");
  }

  const { error: insertAgentsError } = await admin.from("agents").insert([
    {
      workspace_id: user.workspaceId,
      owner_user_id: user.id,
      source_persona_pack_id: sparkGuidePack.id,
      name: "Smoke Guide",
      persona_summary: sparkGuidePack.persona_summary,
      style_prompt: sparkGuidePack.style_prompt,
      system_prompt: sparkGuidePack.system_prompt,
      default_model_profile_id: defaultProfile.id,
      is_custom: false,
      status: "active",
      metadata: {
        smoke_seed: true,
        source_slug: sparkGuidePack.slug,
        source_description: sparkGuidePack.description,
        is_default_for_workspace: true
      }
    },
    {
      workspace_id: user.workspaceId,
      owner_user_id: user.id,
      source_persona_pack_id: memoryCoachPack.id,
      name: "Smoke Memory Coach",
      persona_summary: memoryCoachPack.persona_summary,
      style_prompt: memoryCoachPack.style_prompt,
      system_prompt: memoryCoachPack.system_prompt,
      default_model_profile_id: altProfile.id,
      is_custom: false,
      status: "active",
      metadata: {
        smoke_seed: true,
        source_slug: memoryCoachPack.slug,
        source_description: memoryCoachPack.description
      }
    }
  ]);

  if (insertAgentsError) {
    throw new Error(`Failed to seed smoke agents: ${insertAgentsError.message}`);
  }
}

export async function resetSmokeState() {
  const config = getSmokeConfig();

  if (!config) {
    throw new Error(
      "Smoke test helpers require NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PLAYWRIGHT_SMOKE_SECRET, PLAYWRIGHT_SMOKE_EMAIL, and PLAYWRIGHT_SMOKE_PASSWORD."
    );
  }

  const admin = getAdminClient(config);
  const smokeUser = await ensureSmokeUser(admin, config, {
    resetPassword: true
  });
  const modelProfiles = await ensureSmokeModelProfiles(admin);

  await resetSmokeWorkspaceState(admin, smokeUser);
  await seedSmokeAgents(admin, smokeUser, modelProfiles);

  return {
    workspaceId: smokeUser.workspaceId,
    smokeEmail: smokeUser.email
  };
}

export async function createSmokeThread({
  agentName
}: {
  agentName: string;
}) {
  const config = getSmokeConfig();

  if (!config) {
    throw new Error(
      "Smoke thread creation requires the smoke env vars and service role key."
    );
  }

  const admin = getAdminClient(config);
  const smokeUser = await ensureSmokeUser(admin, config);

  const { data: agent, error: agentError } = await admin
    .from("agents")
    .select("id")
    .eq("workspace_id", smokeUser.workspaceId)
    .eq("owner_user_id", smokeUser.id)
    .eq("status", "active")
    .eq("name", agentName)
    .maybeSingle();

  if (agentError || !agent) {
    throw new Error(
      agentError?.message ?? `Smoke agent "${agentName}" is unavailable.`
    );
  }

  const { data: thread, error: threadError } = await admin
    .from("threads")
    .insert({
      workspace_id: smokeUser.workspaceId,
      owner_user_id: smokeUser.id,
      agent_id: agent.id,
      title: "New chat"
    })
    .select("id")
    .single();

  if (threadError || !thread) {
    throw new Error(
      threadError?.message ?? "Failed to create the smoke test thread."
    );
  }

  return {
    threadId: thread.id
  };
}

function summarizeThreadTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 48) {
    return normalized;
  }

  return `${normalized.slice(0, 45).trimEnd()}...`;
}

function detectSmokeReplyLanguage(content: string): SmokeReplyLanguage {
  const hanMatches = content.match(/[\u3400-\u9fff]/g) ?? [];
  const latinMatches = content.match(/[A-Za-z]/g) ?? [];

  if (hanMatches.length === 0 && latinMatches.length === 0) {
    return "unknown";
  }

  if (hanMatches.length > latinMatches.length) {
    return "zh-Hans";
  }

  if (latinMatches.length > hanMatches.length) {
    return "en";
  }

  return hanMatches.length > 0 ? "zh-Hans" : "en";
}

function buildSmokeAssistantReply({
  content,
  modelProfileName,
  recalledMemories
}: {
  content: string;
  modelProfileName: string;
  recalledMemories: Array<{
    memory_type: "profile" | "preference";
    content: string;
    confidence: number;
  }>;
}) {
  const normalized = content.toLowerCase();
  const replyLanguage = detectSmokeReplyLanguage(content);
  const rememberedProfession = recalledMemories.find(
    (memory) =>
      memory.memory_type === "profile" &&
      memory.content.toLowerCase().includes("product designer")
  );

  if (normalized.includes("reply in one sentence with a quick hello")) {
    return replyLanguage === "zh-Hans"
      ? `你好，我是通过 ${modelProfileName} 回复的 SparkCore。`
      : `Hello from SparkCore via ${modelProfileName}.`;
  }

  if (
    normalized.includes("product designer") &&
    normalized.includes("concise weekly planning")
  ) {
    return replyLanguage === "zh-Hans"
      ? "谢谢，我知道你是一名产品设计师，并且偏好简洁的每周规划方式。"
      : "Thanks. I understand that you work as a product designer and prefer concise weekly planning.";
  }

  if (normalized.includes("what profession do you remember")) {
    if (!rememberedProfession) {
      return replyLanguage === "zh-Hans" ? "我不知道。" : "I don't know.";
    }

    return replyLanguage === "zh-Hans"
      ? "我记得你是一名产品设计师。"
      : "I remember that you work as a product designer.";
  }

  if (
    content.includes("请用两句话介绍你自己") ||
    content.includes("你能如何帮助我")
  ) {
    return "我是 SparkCore，可以用中文帮助你梳理计划、整理记忆，并继续当前线程里的对话。";
  }

  if (
    normalized.includes("please introduce yourself in two short sentences") ||
    normalized.includes("explain how you can help me")
  ) {
    return "I am SparkCore, and I can help you organize plans, reuse memory, and continue conversations across threads.";
  }

  return replyLanguage === "zh-Hans"
    ? "好的，我已经记下来了，接下来可以继续帮你。"
    : "Thanks, I noted that and I am ready to help with the next step.";
}

export async function createSmokeTurn({
  threadId,
  content
}: {
  threadId: string;
  content: string;
}) {
  const config = getSmokeConfig();

  if (!config) {
    throw new Error(
      "Smoke message creation requires the smoke env vars and service role key."
    );
  }

  const admin = getAdminClient(config);
  const smokeUser = await ensureSmokeUser(admin, config);
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Smoke turn content is required.");
  }

  const { data: thread, error: threadError } = await admin
    .from("threads")
    .select("id, workspace_id, owner_user_id, agent_id, title")
    .eq("id", threadId)
    .eq("workspace_id", smokeUser.workspaceId)
    .eq("owner_user_id", smokeUser.id)
    .maybeSingle();

  if (threadError || !thread) {
    throw new Error(
      threadError?.message ?? "The requested smoke thread is unavailable."
    );
  }

  if (!thread.agent_id) {
    throw new Error("The smoke thread is not bound to an agent.");
  }

  const { data: agent, error: agentError } = await admin
    .from("agents")
    .select("id, name, default_model_profile_id")
    .eq("id", thread.agent_id)
    .eq("workspace_id", smokeUser.workspaceId)
    .eq("owner_user_id", smokeUser.id)
    .eq("status", "active")
    .maybeSingle();

  if (agentError || !agent) {
    throw new Error(
      agentError?.message ?? "The bound smoke agent is unavailable."
    );
  }

  const ensuredAgent = agent;

  const { data: modelProfile, error: modelProfileError } = await admin
    .from("model_profiles")
    .select("id, name, model")
    .eq("id", ensuredAgent.default_model_profile_id)
    .eq("is_active", true)
    .maybeSingle();

  if (modelProfileError || !modelProfile) {
    throw new Error(
      modelProfileError?.message ??
        "The bound smoke model profile is unavailable."
    );
  }

  const hiddenMemoryCountResponse = await admin
    .from("memory_items")
    .select("id, metadata", { count: "exact" })
    .eq("workspace_id", smokeUser.workspaceId)
    .eq("user_id", smokeUser.id)
    .eq("memory_type", "profile");
  const incorrectMemoryCountResponse = await admin
    .from("memory_items")
    .select("id, metadata", { count: "exact" })
    .eq("workspace_id", smokeUser.workspaceId)
    .eq("user_id", smokeUser.id)
    .eq("memory_type", "profile");

  const { data: existingMemories, error: memoriesError } = await admin
    .from("memory_items")
    .select("id, memory_type, content, confidence, metadata")
    .eq("workspace_id", smokeUser.workspaceId)
    .eq("user_id", smokeUser.id)
    .order("created_at", { ascending: false });

  if (memoriesError) {
    throw new Error(`Failed to load smoke memories: ${memoriesError.message}`);
  }

  const activeMemories =
    existingMemories?.filter((memory) => {
      const metadata = (memory.metadata ?? {}) as Record<string, unknown>;
      return metadata.is_hidden !== true && metadata.is_incorrect !== true;
    }) ?? [];
  const hiddenExclusionCount =
    hiddenMemoryCountResponse.data?.filter(
      (memory) => ((memory.metadata ?? {}) as Record<string, unknown>).is_hidden === true
    ).length ?? 0;
  const incorrectExclusionCount =
    incorrectMemoryCountResponse.data?.filter(
      (memory) =>
        ((memory.metadata ?? {}) as Record<string, unknown>).is_incorrect === true
    ).length ?? 0;

  const recalledMemories = activeMemories.filter((memory) => {
    const normalizedContent = memory.content.toLowerCase();
    return (
      (trimmedContent.toLowerCase().includes("profession") &&
        normalizedContent.includes("product designer")) ||
      (trimmedContent.toLowerCase().includes("weekly planning") &&
        normalizedContent.includes("concise weekly planning"))
    );
  });

  const usedMemoryTypes = Array.from(
    new Set(recalledMemories.map((memory) => memory.memory_type))
  );

  const { data: insertedUserMessage, error: insertedUserMessageError } =
    await admin
      .from("messages")
      .insert({
        thread_id: thread.id,
        workspace_id: smokeUser.workspaceId,
        user_id: smokeUser.id,
        role: "user",
        content: trimmedContent
      })
      .select("id")
      .single();

  if (insertedUserMessageError || !insertedUserMessage) {
    throw new Error(
      insertedUserMessageError?.message ?? "Failed to insert the smoke user message."
    );
  }

  const ensuredUserMessage = insertedUserMessage;

  const threadPatch: { updated_at: string; title?: string } = {
    updated_at: new Date().toISOString()
  };

  if (thread.title === "New chat") {
    threadPatch.title = summarizeThreadTitle(trimmedContent);
  }

  const { error: threadUpdateError } = await admin
    .from("threads")
    .update(threadPatch)
    .eq("id", thread.id)
    .eq("owner_user_id", smokeUser.id);

  if (threadUpdateError) {
    throw new Error(
      `Failed to update the smoke thread: ${threadUpdateError.message}`
    );
  }

  const createdTypes: Array<"profile" | "preference"> = [];
  const loweredContent = trimmedContent.toLowerCase();

  async function upsertMemory(memoryType: "profile" | "preference", value: string, confidence: number) {
    const { data: existingMemory } = await admin
      .from("memory_items")
      .select("id, metadata")
      .eq("workspace_id", smokeUser.workspaceId)
      .eq("user_id", smokeUser.id)
      .eq("memory_type", memoryType)
      .eq("content", value)
      .maybeSingle();

    if (existingMemory) {
      await admin
        .from("memory_items")
        .update({
          status: "active",
          metadata: {
            ...((existingMemory.metadata ?? {}) as Record<string, unknown>),
            smoke_seed: true
          },
          updated_at: new Date().toISOString()
        })
        .eq("id", existingMemory.id)
        .eq("user_id", smokeUser.id);
      return;
    }

    const { error } = await admin.from("memory_items").insert({
      workspace_id: smokeUser.workspaceId,
      user_id: smokeUser.id,
      agent_id: ensuredAgent.id,
      memory_type: memoryType,
      content: value,
      confidence,
      source_message_id: ensuredUserMessage.id,
      ...buildMemoryV2Fields({
        category: memoryType,
        key: LEGACY_MEMORY_KEY,
        value,
        scope: "user_global",
        subjectUserId: smokeUser.id,
        stability: inferLegacyMemoryStability(memoryType),
        status: "active",
        sourceRefs: [
          {
            kind: "message",
            source_message_id: ensuredUserMessage.id
          }
        ]
      }),
      metadata: {
        smoke_seed: true
      }
    });

    if (error) {
      throw new Error(`Failed to seed smoke memory: ${error.message}`);
    }

    createdTypes.push(memoryType);
  }

  if (loweredContent.includes("product designer")) {
    await upsertMemory("profile", "product designer", 0.95);
  }

  if (loweredContent.includes("concise weekly planning")) {
    await upsertMemory("preference", "concise weekly planning", 0.93);
  }

  const assistantContent = buildSmokeAssistantReply({
    content: trimmedContent,
    modelProfileName: modelProfile.name,
    recalledMemories
  });

  const { data: insertedAssistantMessage, error: insertedAssistantMessageError } =
    await admin
      .from("messages")
      .insert({
        thread_id: thread.id,
        workspace_id: smokeUser.workspaceId,
        user_id: smokeUser.id,
        role: "assistant",
        content: assistantContent,
        status: "completed",
        metadata: {
      agent_id: ensuredAgent.id,
          agent_name: ensuredAgent.name,
          model: modelProfile.model,
          model_profile_id: modelProfile.id,
          model_profile_name: modelProfile.name,
          reply_language_target: detectSmokeReplyLanguage(trimmedContent),
          reply_language_detected: detectSmokeReplyLanguage(assistantContent),
          memory_hit_count: recalledMemories.length,
          memory_used: recalledMemories.length > 0,
          memory_types_used: usedMemoryTypes,
          hidden_memory_exclusion_count: hiddenExclusionCount,
          incorrect_memory_exclusion_count: incorrectExclusionCount,
          recalled_memories: recalledMemories.map((memory) => ({
            memory_type: memory.memory_type,
            content: memory.content,
            confidence: memory.confidence
          })),
          memory_write_count: createdTypes.length,
          memory_write_types: createdTypes,
          new_memory_count: createdTypes.length,
          updated_memory_count: 0
        }
      })
      .select("id")
      .single();

  if (insertedAssistantMessageError || !insertedAssistantMessage) {
    throw new Error(
      insertedAssistantMessageError?.message ??
        "Failed to insert the smoke assistant reply."
    );
  }

  return {
    userMessageId: ensuredUserMessage.id,
    assistantMessageId: insertedAssistantMessage.id
  };
}

export async function createSmokeLoginResponse(
  request: NextRequest,
  redirectPath: string
) {
  const config = getSmokeConfig();

  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Smoke login is not configured. Add the smoke env vars and service role key first."
      },
      { status: 503 }
    );
  }

  const admin = getAdminClient(config);
  await ensureSmokeUser(admin, config, {
    resetPassword: true
  });

  let response = NextResponse.redirect(new URL(redirectPath, request.url));
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: config.email,
    password: config.password
  });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message
      },
      { status: 500 }
    );
  }

  return response;
}
