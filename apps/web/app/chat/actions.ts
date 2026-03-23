"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  canTransitionMemoryStatus,
  getMemoryStatus,
  isSupportedSingleSlotPath,
  normalizeSingleSlotValue
} from "@/lib/chat/memory-v2";
import { buildRuntimeTurnInput } from "@/lib/chat/runtime-input";
import { getDefaultModelProfile, runAgentTurn } from "@/lib/chat/runtime";
import {
  executeMemoryWriteRequests
} from "@/lib/chat/memory-write";
import { executeFollowUpRequests } from "@/lib/chat/follow-up-executor";
import { enqueueAcceptedFollowUps } from "@/lib/chat/follow-up-repository";
import { createAdminFollowUpRepository } from "@/lib/chat/follow-up-admin-repository";
import {
  buildRuntimeFollowUpExecutionMetadata,
  buildRuntimeFollowUpRequestMetadata,
  buildRuntimeMemoryWriteOutcomeMetadata,
  buildRuntimeMemoryWriteRequestMetadata
} from "@/lib/chat/runtime-preview-metadata";
import { LiteLLMError, LiteLLMTimeoutError } from "@/lib/litellm/client";
import {
  CHAT_UI_LANGUAGE_COOKIE,
  resolveChatLocale
} from "@/lib/i18n/chat-ui";

export type SendMessageResult =
  | { ok: true; threadId: string }
  | { ok: false; threadId: string | null; message: string };

export type RetryAssistantReplyResult =
  | { ok: true; threadId: string }
  | { ok: false; threadId: string | null; message: string };

export type RenameThreadResult =
  | { ok: true; threadId: string; title: string }
  | { ok: false; threadId: string | null; message: string };

export type CreateAgentResult =
  | { ok: true; agentId: string; agentName: string }
  | { ok: false; agentId: null; message: string };

export type RenameAgentResult =
  | { ok: true; agentId: string; agentName: string }
  | { ok: false; agentId: string | null; message: string };

type AssistantErrorType = "timeout" | "provider_error" | "generation_failed";
type ChatFeedbackTone = "success" | "error";

function summarizeThreadTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= 48) {
    return normalized;
  }

  return `${normalized.slice(0, 45).trimEnd()}...`;
}

function normalizeThreadTitle(title: string) {
  const normalized = title.replace(/\s+/g, " ").trim();

  if (normalized.length === 0) {
    return "";
  }

  if (normalized.length <= 80) {
    return normalized;
  }

  return normalized.slice(0, 80).trimEnd();
}

function normalizeAgentName(name: string, fallbackName: string) {
  const normalized = name.replace(/\s+/g, " ").trim();
  const candidate = normalized.length > 0 ? normalized : fallbackName;

  if (candidate.length <= 80) {
    return candidate;
  }

  return candidate.slice(0, 80).trimEnd();
}

function normalizeAgentIdentityText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength).trimEnd();
}

function normalizeAvatarEmoji(value: string) {
  const normalized = value.trim();

  if (normalized.length === 0) {
    return "";
  }

  if (normalized.length <= 8) {
    return normalized;
  }

  return normalized.slice(0, 8).trim();
}

function classifyAssistantError(error: unknown): {
  errorType: AssistantErrorType;
  message: string;
} {
  if (error instanceof LiteLLMTimeoutError) {
    return {
      errorType: "timeout",
      message:
        "Assistant reply timed out. You can retry this turn without resending your message."
    };
  }

  if (error instanceof LiteLLMError) {
    return {
      errorType: "provider_error",
      message: `Provider error: ${error.message}`
    };
  }

  if (error instanceof Error) {
    return {
      errorType: "generation_failed",
      message: error.message
    };
  }

  return {
    errorType: "generation_failed",
    message: "Failed to generate an assistant reply."
  };
}

function buildChatRedirectTarget(threadId: FormDataEntryValue | null) {
  return typeof threadId === "string" && threadId.trim().length > 0
    ? `/chat?thread=${encodeURIComponent(threadId)}`
    : "/chat";
}

function appendChatFeedback(
  target: string,
  feedback: {
    type: ChatFeedbackTone;
    message: string;
  }
) {
  const [pathname, query = ""] = target.split("?");
  const nextParams = new URLSearchParams(query);
  nextParams.delete("error");
  nextParams.set("feedback", feedback.message);
  nextParams.set("feedback_type", feedback.type);

  const nextQuery = nextParams.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

export async function setChatUiLanguage(formData: FormData) {
  const languageValue = formData.get("language");
  const redirectPathValue = formData.get("redirect_path");
  const nextLocale = resolveChatLocale(
    typeof languageValue === "string" ? languageValue : undefined
  );
  const redirectPath =
    typeof redirectPathValue === "string" && redirectPathValue.startsWith("/")
      ? redirectPathValue
      : "/chat";

  const cookieStore = await cookies();
  cookieStore.set(CHAT_UI_LANGUAGE_COOKIE, nextLocale, {
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  redirect(redirectPath);
}

export async function createAgentFromPersonaPack(
  formData: FormData
): Promise<CreateAgentResult> {
  const personaPackId = formData.get("persona_pack_id");
  const requestedName = formData.get("agent_name");

  if (typeof personaPackId !== "string" || personaPackId.trim().length === 0) {
    return {
      ok: false,
      agentId: null,
      message: "Choose a persona pack before creating an agent."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      agentId: null,
      message: "Your session expired. Sign in again to continue."
    };
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    return {
      ok: false,
      agentId: null,
      message: "No workspace is available for this account."
    };
  }

  const { data: personaPack } = await supabase
    .from("persona_packs")
    .select(
      "id, slug, name, description, persona_summary, style_prompt, system_prompt"
    )
    .eq("id", personaPackId)
    .eq("is_active", true)
    .maybeSingle();

  if (!personaPack) {
    return {
      ok: false,
      agentId: null,
      message: "The selected persona pack is unavailable."
    };
  }

  const defaultModelProfile = await getDefaultModelProfile();
  const agentName = normalizeAgentName(
    typeof requestedName === "string" ? requestedName : "",
    personaPack.name
  );

  const { data: createdAgent, error } = await supabase
    .from("agents")
    .insert({
      workspace_id: workspace.id,
      owner_user_id: user.id,
      source_persona_pack_id: personaPack.id,
      name: agentName,
      persona_summary: personaPack.persona_summary,
      style_prompt: personaPack.style_prompt,
      system_prompt: personaPack.system_prompt,
      default_model_profile_id: defaultModelProfile.id,
      is_custom: false,
      metadata: {
        created_from_chat: true,
        source_slug: personaPack.slug,
        source_description: personaPack.description
      }
    })
    .select("id, name")
    .single();

  if (error || !createdAgent) {
    return {
      ok: false,
      agentId: null,
      message: error?.message ?? "Failed to create the new agent."
    };
  }

  revalidatePath("/chat");

  return {
    ok: true,
    agentId: createdAgent.id,
    agentName: createdAgent.name
  };
}

export async function renameAgent(
  formData: FormData
): Promise<RenameAgentResult> {
  const agentId = formData.get("agent_id");
  const agentName = formData.get("agent_name");
  const modelProfileId = formData.get("model_profile_id");
  const personaSummary = formData.get("persona_summary");
  const backgroundSummary = formData.get("background_summary");
  const avatarEmoji = formData.get("avatar_emoji");

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    return {
      ok: false,
      agentId: null,
      message: "The agent to rename could not be determined."
    };
  }

  if (typeof agentName !== "string") {
    return {
      ok: false,
      agentId,
      message: "Type an agent name before saving."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      agentId,
      message: "Your session expired. Sign in again to continue."
    };
  }

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, workspace_id, default_model_profile_id, persona_summary, metadata")
    .eq("id", agentId)
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!agent) {
    return {
      ok: false,
      agentId,
      message: "The selected agent is unavailable."
    };
  }

  const normalizedName = normalizeAgentName(agentName, agent.name);
  const normalizedPersonaSummary =
    typeof personaSummary === "string"
      ? normalizeAgentIdentityText(personaSummary, 280)
      : agent.persona_summary;
  const normalizedBackgroundSummary =
    typeof backgroundSummary === "string"
      ? normalizeAgentIdentityText(backgroundSummary, 280)
      : typeof agent.metadata?.background_summary === "string"
        ? agent.metadata.background_summary
        : "";
  const normalizedAvatarEmoji =
    typeof avatarEmoji === "string"
      ? normalizeAvatarEmoji(avatarEmoji)
      : typeof agent.metadata?.avatar_emoji === "string"
        ? agent.metadata.avatar_emoji
        : "";
  let nextModelProfileId = agent.default_model_profile_id ?? null;

  if (typeof modelProfileId === "string" && modelProfileId.trim().length > 0) {
    const { data: modelProfile } = await supabase
      .from("model_profiles")
      .select("id")
      .eq("id", modelProfileId)
      .eq("is_active", true)
      .maybeSingle();

    if (!modelProfile) {
      return {
        ok: false,
        agentId,
        message: "The selected model profile is unavailable."
      };
    }

    nextModelProfileId = modelProfile.id;
  }

  const nextMetadata = {
    ...(agent.metadata ?? {}),
    background_summary: normalizedBackgroundSummary || null,
    avatar_emoji: normalizedAvatarEmoji || null
  };

  const { data: updatedAgent, error } = await supabase
    .from("agents")
    .update({
      name: normalizedName,
      persona_summary: normalizedPersonaSummary,
      default_model_profile_id: nextModelProfileId,
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    })
    .eq("id", agent.id)
    .eq("workspace_id", agent.workspace_id)
    .eq("owner_user_id", user.id)
    .select("id, name")
    .single();

  if (error || !updatedAgent) {
    return {
      ok: false,
      agentId,
      message: error?.message ?? "Failed to rename the agent."
    };
  }

  revalidatePath("/chat");

  return {
    ok: true,
    agentId: updatedAgent.id,
    agentName: updatedAgent.name
  };
}

export async function createThread(formData: FormData) {
  const agentId = formData.get("agent_id");

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    redirect(
      appendChatFeedback("/chat", {
        type: "error",
        message: "Choose an agent before creating a new thread."
      })
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, kind")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    redirect("/workspace");
  }

  const { data: agent } = await supabase
    .from("agents")
    .select("id, name")
    .eq("id", agentId)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!agent) {
    redirect(
      appendChatFeedback("/chat", {
        type: "error",
        message: "The selected agent is unavailable for this workspace."
      })
    );
  }

  const { data: createdThread, error } = await supabase
    .from("threads")
    .insert({
      workspace_id: workspace.id,
      owner_user_id: user.id,
      agent_id: agent.id,
      title: "New chat"
    })
    .select("id")
    .single();

  if (error || !createdThread) {
    redirect(
      appendChatFeedback("/chat", {
        type: "error",
        message: error?.message ?? "Failed to create the new thread."
      })
    );
  }

  revalidatePath("/chat");
  redirect(
    appendChatFeedback(`/chat?thread=${encodeURIComponent(createdThread.id)}`, {
      type: "success",
      message: "New chat is ready. Send the first message when you are ready."
    })
  );
}

export async function setDefaultAgent(formData: FormData) {
  const agentId = formData.get("agent_id");
  const redirectThreadId = formData.get("redirect_thread_id");
  const redirectTarget = buildChatRedirectTarget(redirectThreadId);

  if (typeof agentId !== "string" || agentId.trim().length === 0) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "Choose an active agent before setting a default."
      })
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    redirect("/workspace");
  }

  const { data: activeAgents, error: activeAgentsError } = await supabase
    .from("agents")
    .select("id, metadata")
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (activeAgentsError || !activeAgents) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: activeAgentsError?.message ?? "Failed to load active agents."
      })
    );
  }

  if (!activeAgents.some((agent) => agent.id === agentId)) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "The selected default agent is unavailable."
      })
    );
  }

  for (const activeAgent of activeAgents) {
    const nextMetadata = { ...(activeAgent.metadata ?? {}) } as Record<string, unknown>;

    if (activeAgent.id === agentId) {
      nextMetadata.is_default_for_workspace = true;
    } else {
      delete nextMetadata.is_default_for_workspace;
    }

    const { error } = await supabase
      .from("agents")
      .update({
        metadata: nextMetadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", activeAgent.id)
      .eq("workspace_id", workspace.id)
      .eq("owner_user_id", user.id);

    if (error) {
      redirect(
        appendChatFeedback(redirectTarget, {
          type: "error",
          message: error.message
        })
      );
    }
  }

  revalidatePath("/chat");
  redirect(
    appendChatFeedback(redirectTarget, {
      type: "success",
      message: "Workspace default agent updated."
    })
  );
}

export async function hideMemory(formData: FormData) {
  const memoryId = formData.get("memory_id");
  const redirectTarget = buildChatRedirectTarget(formData.get("redirect_thread_id"));

  if (typeof memoryId !== "string" || memoryId.trim().length === 0) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "The memory to hide could not be determined."
      })
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memoryItem } = await supabase
    .from("memory_items")
    .select("id, metadata, status")
    .eq("id", memoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!memoryItem) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "The selected memory is unavailable."
      })
    );
  }

  if (!canTransitionMemoryStatus(getMemoryStatus(memoryItem), "hidden")) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "This memory cannot be hidden from its current state."
      })
    );
  }

  const nextMetadata = { ...(memoryItem.metadata ?? {}) } as Record<string, unknown>;
  nextMetadata.is_hidden = true;
  nextMetadata.hidden_at = new Date().toISOString();

  const { error } = await supabase
    .from("memory_items")
    .update({
      status: "hidden",
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    })
    .eq("id", memoryItem.id)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: error.message
      })
    );
  }

  revalidatePath("/chat");
  redirect(
    appendChatFeedback(redirectTarget, {
      type: "success",
      message: "Memory hidden from recall."
    })
  );
}

export async function restoreMemory(formData: FormData) {
  const memoryId = formData.get("memory_id");
  const redirectTarget = buildChatRedirectTarget(formData.get("redirect_thread_id"));

  if (typeof memoryId !== "string" || memoryId.trim().length === 0) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "The memory to restore could not be determined."
      })
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memoryItem } = await supabase
    .from("memory_items")
    .select(
      "id, workspace_id, category, key, value, content, scope, target_agent_id, target_thread_id, metadata, status"
    )
    .eq("id", memoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!memoryItem) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "The selected hidden memory is unavailable."
      })
    );
  }

  if (!canTransitionMemoryStatus(getMemoryStatus(memoryItem), "active")) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "This memory cannot be restored from its current state."
      })
    );
  }

  const memoryPath =
    typeof memoryItem.category === "string" && typeof memoryItem.key === "string"
      ? `${memoryItem.category}.${memoryItem.key}`
      : null;
  const scope = typeof memoryItem.scope === "string" ? memoryItem.scope : null;
  const isRestoringSingleSlot =
    memoryPath !== null &&
    isSupportedSingleSlotPath(memoryPath) &&
    (scope === "user_global" || scope === "user_agent" || scope === "thread_local");

  if (isRestoringSingleSlot) {
    let conflictingQuery = supabase
      .from("memory_items")
      .select("id, metadata")
      .eq("workspace_id", memoryItem.workspace_id)
      .eq("user_id", user.id)
      .eq("category", memoryItem.category)
      .eq("key", memoryItem.key)
      .eq("scope", scope)
      .eq("status", "active")
      .neq("id", memoryItem.id);

    if (scope === "user_agent") {
      conflictingQuery = conflictingQuery.eq(
        "target_agent_id",
        memoryItem.target_agent_id
      );
    } else {
      conflictingQuery = conflictingQuery.is("target_agent_id", null);
    }

    if (scope === "thread_local") {
      conflictingQuery = conflictingQuery.eq(
        "target_thread_id",
        memoryItem.target_thread_id
      );
    } else {
      conflictingQuery = conflictingQuery.is("target_thread_id", null);
    }

    const { data: conflictingActiveRows, error: conflictingRowsError } =
      await conflictingQuery;

    if (conflictingRowsError) {
      redirect(
        appendChatFeedback(redirectTarget, {
          type: "error",
          message: conflictingRowsError.message
        })
      );
    }

    for (const row of conflictingActiveRows ?? []) {
      const nextSupersededMetadata = {
        ...((row.metadata ?? {}) as Record<string, unknown>),
        superseded_at: new Date().toISOString(),
        superseded_by_restore_memory_id: memoryItem.id
      };

      const { error: supersedeError } = await supabase
        .from("memory_items")
        .update({
          status: "superseded",
          metadata: nextSupersededMetadata,
          updated_at: new Date().toISOString()
        })
        .eq("id", row.id)
        .eq("user_id", user.id);

      if (supersedeError) {
        redirect(
          appendChatFeedback(redirectTarget, {
            type: "error",
            message: supersedeError.message
          })
        );
      }
    }
  }

  const nextMetadata = { ...(memoryItem.metadata ?? {}) } as Record<string, unknown>;
  delete nextMetadata.is_hidden;
  delete nextMetadata.hidden_at;
  delete nextMetadata.is_incorrect;
  delete nextMetadata.incorrect_at;
  delete nextMetadata.superseded_at;
  delete nextMetadata.superseded_by_source_message_id;
  delete nextMetadata.superseded_by_restore_memory_id;
  const normalizedValueSource =
    typeof memoryItem.value === "string"
      ? memoryItem.value
      : typeof memoryItem.content === "string"
        ? memoryItem.content
        : "";
  nextMetadata.normalization = normalizeSingleSlotValue(normalizedValueSource);
  nextMetadata.restored_at = new Date().toISOString();

  const { error } = await supabase
    .from("memory_items")
    .update({
      status: "active",
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    })
    .eq("id", memoryItem.id)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: error.message
      })
    );
  }

  revalidatePath("/chat");
  redirect(
    appendChatFeedback(redirectTarget, {
      type: "success",
      message: "Memory restored to recall."
    })
  );
}

export async function markMemoryIncorrect(formData: FormData) {
  const memoryId = formData.get("memory_id");
  const redirectTarget = buildChatRedirectTarget(formData.get("redirect_thread_id"));

  if (typeof memoryId !== "string" || memoryId.trim().length === 0) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "The memory to correct could not be determined."
      })
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memoryItem } = await supabase
    .from("memory_items")
    .select("id, metadata, status")
    .eq("id", memoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!memoryItem) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "The selected memory is unavailable."
      })
    );
  }

  if (!canTransitionMemoryStatus(getMemoryStatus(memoryItem), "incorrect")) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "This memory cannot be marked incorrect from its current state."
      })
    );
  }

  const nextMetadata = { ...(memoryItem.metadata ?? {}) } as Record<string, unknown>;
  delete nextMetadata.is_hidden;
  delete nextMetadata.hidden_at;
  nextMetadata.is_incorrect = true;
  nextMetadata.incorrect_at = new Date().toISOString();

  const { error } = await supabase
    .from("memory_items")
    .update({
      status: "incorrect",
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    })
    .eq("id", memoryItem.id)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: error.message
      })
    );
  }

  revalidatePath("/chat");
  redirect(
    appendChatFeedback(redirectTarget, {
      type: "success",
      message: "Memory marked as incorrect and removed from recall."
    })
  );
}

export async function sendMessage(
  formData: FormData
): Promise<SendMessageResult> {
  const content = formData.get("content");
  const threadId = formData.get("thread_id");

  if (typeof content !== "string" || content.trim().length === 0) {
    return {
      ok: false,
      threadId: typeof threadId === "string" ? threadId : null,
      message: "Type a message before sending."
    };
  }

  if (typeof threadId !== "string" || threadId.trim().length === 0) {
    return {
      ok: false,
      threadId: null,
      message: "The active thread could not be determined."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      threadId,
      message: "Your session expired. Sign in again to continue."
    };
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
      ok: false,
      threadId,
      message: "No workspace is available for this account."
    };
  }

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, status, agent_id, created_at, updated_at")
    .eq("id", threadId)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!thread) {
    return {
      ok: false,
      threadId: null,
      message: "The requested thread could not be loaded."
    };
  }

  if (!thread.agent_id) {
    return {
      ok: false,
      threadId: thread.id,
      message: "This thread is not bound to an agent yet."
    };
  }

  const { data: agent } = await supabase
    .from("agents")
    .select(
      "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata"
    )
    .eq("id", thread.agent_id)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!agent) {
    return {
      ok: false,
      threadId: thread.id,
      message: "The bound agent for this thread could not be loaded."
    };
  }

  const trimmedContent = content.trim();

  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      thread_id: thread.id,
      workspace_id: workspace.id,
      user_id: user.id,
      role: "user",
      content: trimmedContent
    })
    .select("id")
    .single();

  if (insertError || !insertedMessage) {
    return {
      ok: false,
      threadId: thread.id,
      message: insertError?.message ?? "Failed to store the user message."
    };
  }

  const threadPatch: {
    updated_at: string;
    title?: string;
  } = {
    updated_at: new Date().toISOString()
  };

  if (thread.title === "New chat") {
    threadPatch.title = summarizeThreadTitle(trimmedContent);
  }

  await supabase
    .from("threads")
    .update(threadPatch)
    .eq("id", thread.id)
    .eq("owner_user_id", user.id);

  const { data: persistedMessages, error: persistedMessagesError } = await supabase
    .from("messages")
    .select("id, role, content, status, metadata, created_at")
    .eq("thread_id", thread.id)
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (persistedMessagesError) {
    return {
      ok: false,
      threadId: thread.id,
      message: persistedMessagesError.message
    };
  }

  const updatedMessages = [
    ...((persistedMessages ?? []) as Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      status: string;
      metadata: Record<string, unknown>;
      created_at: string;
    }>)
  ];

  const { data: assistantPlaceholder, error: assistantPlaceholderError } =
    await supabase
      .from("messages")
      .insert({
        thread_id: thread.id,
        workspace_id: workspace.id,
        user_id: user.id,
        role: "assistant",
        content: "",
        status: "pending",
        metadata: {
          agent_id: thread.agent_id,
          user_message_id: insertedMessage.id
        }
      })
      .select("id")
      .single();

  if (assistantPlaceholderError || !assistantPlaceholder) {
    return {
      ok: false,
      threadId: thread.id,
      message:
        assistantPlaceholderError?.message ??
        "Failed to initialize the assistant reply."
    };
  }

  try {
    const runtimeTurnInput = buildRuntimeTurnInput({
      userId: user.id,
      agentId: thread.agent_id,
      threadId: thread.id,
      workspaceId: workspace.id,
      content: trimmedContent,
      source: "web",
      messageId: insertedMessage.id,
      metadata: {
        trigger: "chat_send"
      },
      context: {
        source_platform: "web"
      }
    });

    const runtimeTurnResult = await runAgentTurn({
      input: runtimeTurnInput,
      workspace: workspace as { id: string; name: string; kind: string },
      thread: {
        id: thread.id,
        title: threadPatch.title ?? thread.title,
        status: thread.status,
        created_at: thread.created_at,
        updated_at: threadPatch.updated_at,
        agent_id: thread.agent_id
      },
      agent: agent as {
        id: string;
        name: string;
        persona_summary: string;
        style_prompt: string;
        system_prompt: string;
        default_model_profile_id: string | null;
        metadata: Record<string, unknown>;
      },
      messages: updatedMessages,
      assistantMessageId: assistantPlaceholder.id
    });

    if (!runtimeTurnResult.assistant_message) {
      throw new Error("Runtime completed without an assistant message.");
    }

    if (runtimeTurnResult.memory_write_requests.length > 0) {
      const { data: assistantMessage } = await supabase
        .from("messages")
        .select("metadata")
        .eq("id", assistantPlaceholder.id)
        .eq("thread_id", thread.id)
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id)
        .maybeSingle();

      await supabase
        .from("messages")
        .update({
          metadata: {
            ...(assistantMessage?.metadata ?? {}),
            ...buildRuntimeMemoryWriteRequestMetadata(
              runtimeTurnResult.memory_write_requests
            )
          },
          updated_at: new Date().toISOString()
        })
        .eq("id", assistantPlaceholder.id)
        .eq("thread_id", thread.id)
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id);
    }

    if (runtimeTurnResult.follow_up_requests.length > 0) {
      const { data: assistantMessage } = await supabase
        .from("messages")
        .select("metadata")
        .eq("id", assistantPlaceholder.id)
        .eq("thread_id", thread.id)
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id)
        .maybeSingle();

      await supabase
        .from("messages")
        .update({
          metadata: {
            ...(assistantMessage?.metadata ?? {}),
            ...buildRuntimeFollowUpRequestMetadata(
              runtimeTurnResult.follow_up_requests
            )
          },
          updated_at: new Date().toISOString()
        })
        .eq("id", assistantPlaceholder.id)
        .eq("thread_id", thread.id)
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id);
    }

    try {
      const [memoryWriteOutcome, followUpExecutionResults] = await Promise.all([
        executeMemoryWriteRequests({
          workspaceId: workspace.id,
          userId: user.id,
          agentId: thread.agent_id,
          requests: runtimeTurnResult.memory_write_requests
        }),
        executeFollowUpRequests({
          requests: runtimeTurnResult.follow_up_requests
        })
      ]);
      const followUpEnqueueResult = await enqueueAcceptedFollowUps({
        workspace_id: workspace.id,
        user_id: user.id,
        agent_id: thread.agent_id,
        thread_id: thread.id,
        source_message_id: insertedMessage.id,
        execution_results: followUpExecutionResults,
        repository: createAdminFollowUpRepository()
      });

      if (
        memoryWriteOutcome.createdCount > 0 ||
        memoryWriteOutcome.updatedCount > 0
      ) {
        const { data: assistantMessage } = await supabase
          .from("messages")
          .select("metadata")
          .eq("id", assistantPlaceholder.id)
          .eq("thread_id", thread.id)
          .eq("workspace_id", workspace.id)
          .eq("user_id", user.id)
          .maybeSingle();

        const nextMetadata = {
          ...(assistantMessage?.metadata ?? {}),
          ...buildRuntimeMemoryWriteOutcomeMetadata(
            memoryWriteOutcome,
            assistantMessage?.metadata?.runtime_memory_writes &&
              typeof assistantMessage.metadata.runtime_memory_writes === "object" &&
              !Array.isArray(assistantMessage.metadata.runtime_memory_writes)
              ? (assistantMessage.metadata.runtime_memory_writes as Record<
                  string,
                  unknown
                >)
              : null
          )
        };

        await supabase
          .from("messages")
          .update({
            metadata: nextMetadata,
            updated_at: new Date().toISOString()
          })
          .eq("id", assistantPlaceholder.id)
          .eq("thread_id", thread.id)
          .eq("workspace_id", workspace.id)
          .eq("user_id", user.id);
      }

      if (followUpExecutionResults.length > 0) {
        const { data: assistantMessage } = await supabase
          .from("messages")
          .select("metadata")
          .eq("id", assistantPlaceholder.id)
          .eq("thread_id", thread.id)
          .eq("workspace_id", workspace.id)
          .eq("user_id", user.id)
          .maybeSingle();

        await supabase
          .from("messages")
          .update({
            metadata: {
              ...(assistantMessage?.metadata ?? {}),
              ...buildRuntimeFollowUpExecutionMetadata({
                followUpExecutionResults,
                followUpEnqueueInsertedCount: followUpEnqueueResult.inserted_count,
                followUpEnqueueRecords: followUpEnqueueResult.records
              })
            },
            updated_at: new Date().toISOString()
          })
          .eq("id", assistantPlaceholder.id)
          .eq("thread_id", thread.id)
          .eq("workspace_id", workspace.id)
          .eq("user_id", user.id);
      }
    } catch (memoryError) {
      console.error("Post-processing failed:", memoryError);
    }
  } catch (error) {
    const assistantFailure = classifyAssistantError(error);

    await supabase
      .from("messages")
      .update({
        status: "failed",
        content: "",
        metadata: {
          agent_id: thread.agent_id,
          user_message_id: insertedMessage.id,
          error_type: assistantFailure.errorType,
          error_message: assistantFailure.message
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", assistantPlaceholder.id)
      .eq("thread_id", thread.id)
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id);

    return {
      ok: false,
      threadId: thread.id,
      message: assistantFailure.message
    };
  }

  revalidatePath("/chat");
  return {
    ok: true,
    threadId: thread.id
  };
}

export async function retryAssistantReply(
  formData: FormData
): Promise<RetryAssistantReplyResult> {
  const failedMessageId = formData.get("failed_message_id");
  const threadId = formData.get("thread_id");

  if (
    typeof failedMessageId !== "string" ||
    failedMessageId.trim().length === 0 ||
    typeof threadId !== "string" ||
    threadId.trim().length === 0
  ) {
    return {
      ok: false,
      threadId: typeof threadId === "string" ? threadId : null,
      message: "The failed assistant turn could not be located."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      threadId,
      message: "Your session expired. Sign in again to continue."
    };
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
      ok: false,
      threadId,
      message: "No workspace is available for this account."
    };
  }

  const { data: thread } = await supabase
    .from("threads")
    .select("id, title, status, agent_id, created_at, updated_at")
    .eq("id", threadId)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!thread || !thread.agent_id) {
    return {
      ok: false,
      threadId,
      message: "The active thread or its agent could not be resolved."
    };
  }

  const { data: agent } = await supabase
    .from("agents")
    .select(
      "id, name, persona_summary, style_prompt, system_prompt, default_model_profile_id, metadata"
    )
    .eq("id", thread.agent_id)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!agent) {
    return {
      ok: false,
      threadId,
      message: "The bound agent for this thread could not be loaded."
    };
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, role, content, status, metadata, created_at")
    .eq("thread_id", thread.id)
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (messagesError || !messages) {
    return {
      ok: false,
      threadId,
      message: messagesError?.message ?? "Failed to load thread messages."
    };
  }

  const failedIndex = messages.findIndex(
    (message) => message.id === failedMessageId && message.status === "failed"
  );

  if (failedIndex === -1) {
    return {
      ok: false,
      threadId,
      message: "The selected failed assistant turn is no longer available."
    };
  }

  const failedMessage = messages[failedIndex] as {
    id: string;
    role: "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
    created_at: string;
  };

  const sourceUserMessageId =
    typeof failedMessage.metadata?.user_message_id === "string"
      ? failedMessage.metadata.user_message_id
      : null;

  const promptMessages = messages
    .slice(0, failedIndex)
    .filter((message) => {
      if (message.status === "failed" || message.status === "pending") {
        return false;
      }

      if (message.role === "user" || message.role === "assistant") {
        return true;
      }

      return false;
    })
    .map((message) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      status: message.status,
      metadata: (message.metadata ?? {}) as Record<string, unknown>,
      created_at: message.created_at
    }));

  const latestUserMessage = [...promptMessages]
    .reverse()
    .find((message) =>
      sourceUserMessageId ? message.id === sourceUserMessageId : message.role === "user"
    );

  if (!latestUserMessage) {
    return {
      ok: false,
      threadId,
      message: "The user message for this failed reply could not be recovered."
    };
  }

  await supabase
    .from("messages")
    .update({
      status: "pending",
      metadata: {
        ...failedMessage.metadata,
        retried_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq("id", failedMessage.id)
    .eq("thread_id", thread.id)
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id);

  try {
    const runtimeTurnInput = buildRuntimeTurnInput({
      userId: user.id,
      agentId: thread.agent_id,
      threadId: thread.id,
      workspaceId: workspace.id,
      content: latestUserMessage.content,
      source: "web",
      timestamp: latestUserMessage.created_at,
      messageId: latestUserMessage.id,
      metadata: {
        ...(latestUserMessage.metadata ?? {}),
        trigger: "retry_assistant_reply"
      },
      context: {
        source_platform: "web",
        trigger_kind: "retry"
      }
    });

    const runtimeTurnResult = await runAgentTurn({
      input: runtimeTurnInput,
      workspace: workspace as { id: string; name: string; kind: string },
      thread: {
        id: thread.id,
        title: thread.title,
        status: thread.status,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        agent_id: thread.agent_id
      },
      agent: agent as {
        id: string;
        name: string;
        persona_summary: string;
        style_prompt: string;
        system_prompt: string;
        default_model_profile_id: string | null;
        metadata: Record<string, unknown>;
      },
      messages: promptMessages,
      assistantMessageId: failedMessage.id
    });

    if (!runtimeTurnResult.assistant_message) {
      throw new Error("Runtime retry completed without an assistant message.");
    }

    if (runtimeTurnResult.memory_write_requests.length > 0) {
      await supabase
        .from("messages")
        .update({
          metadata: {
            ...failedMessage.metadata,
            runtime_memory_writes: {
              request_count: runtimeTurnResult.memory_write_requests.length,
              preview: runtimeTurnResult.memory_write_requests.map((request) => ({
                kind: request.kind,
                memory_type: request.memory_type,
                relationship_key:
                  request.kind === "relationship_memory"
                    ? request.relationship_key
                    : null,
                confidence: request.confidence,
                source_turn_id: request.source_turn_id,
                dedupe_key: request.dedupe_key
              }))
            },
            runtime_memory_write_request_count:
              runtimeTurnResult.memory_write_requests.length,
            runtime_memory_write_requests_preview:
              runtimeTurnResult.memory_write_requests.map((request) => ({
                kind: request.kind,
                memory_type: request.memory_type,
                relationship_key:
                  request.kind === "relationship_memory"
                    ? request.relationship_key
                    : null,
                confidence: request.confidence,
                source_turn_id: request.source_turn_id,
                dedupe_key: request.dedupe_key
              }))
          },
          updated_at: new Date().toISOString()
        })
        .eq("id", failedMessage.id)
        .eq("thread_id", thread.id)
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id);
    }

    if (runtimeTurnResult.follow_up_requests.length > 0) {
      await supabase
        .from("messages")
        .update({
          metadata: {
            ...failedMessage.metadata,
            runtime_follow_up: {
              request_count: runtimeTurnResult.follow_up_requests.length,
              preview: runtimeTurnResult.follow_up_requests.map((request) => ({
                kind: request.kind,
                trigger_at: request.trigger_at,
                reason: request.reason
              }))
            },
            runtime_follow_up_request_count:
              runtimeTurnResult.follow_up_requests.length,
            runtime_follow_up_requests_preview:
              runtimeTurnResult.follow_up_requests.map((request) => ({
                kind: request.kind,
                trigger_at: request.trigger_at,
                reason: request.reason
              }))
          },
          updated_at: new Date().toISOString()
        })
        .eq("id", failedMessage.id)
        .eq("thread_id", thread.id)
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id);
    }
  } catch (error) {
    const assistantFailure = classifyAssistantError(error);

    await supabase
      .from("messages")
      .update({
        status: "failed",
        content: "",
        metadata: {
          ...failedMessage.metadata,
          error_type: assistantFailure.errorType,
          error_message: assistantFailure.message
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", failedMessage.id)
      .eq("thread_id", thread.id)
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id);

    return {
      ok: false,
      threadId,
      message: assistantFailure.message
    };
  }

  revalidatePath("/chat");
  return {
    ok: true,
    threadId
  };
}

export async function renameThread(
  formData: FormData
): Promise<RenameThreadResult> {
  const threadId = formData.get("thread_id");
  const title = formData.get("title");

  if (typeof threadId !== "string" || threadId.trim().length === 0) {
    return {
      ok: false,
      threadId: null,
      message: "The thread to rename could not be determined."
    };
  }

  if (typeof title !== "string") {
    return {
      ok: false,
      threadId,
      message: "Type a title before saving."
    };
  }

  const normalizedTitle = normalizeThreadTitle(title);

  if (!normalizedTitle) {
    return {
      ok: false,
      threadId,
      message: "Type a title before saving."
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      threadId,
      message: "Your session expired. Sign in again to continue."
    };
  }

  const { data: thread, error } = await supabase
    .from("threads")
    .update({
      title: normalizedTitle,
      updated_at: new Date().toISOString()
    })
    .eq("id", threadId)
    .eq("owner_user_id", user.id)
    .select("id, title")
    .single();

  if (error || !thread) {
    return {
      ok: false,
      threadId,
      message: error?.message ?? "Failed to rename the thread."
    };
  }

  revalidatePath("/chat");
  return {
    ok: true,
    threadId: thread.id,
    title: thread.title
  };
}
