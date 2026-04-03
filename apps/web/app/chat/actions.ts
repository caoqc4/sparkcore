"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { classifyAssistantError } from "@/lib/chat/assistant-error";
import {
  extractExplicitAudioContent,
  maybeGenerateAssistantArtifacts,
  prepareExplicitArtifactContext,
} from "@/lib/chat/multimodal-artifacts";
import { classifyStoredMemorySemanticTarget } from "@/lib/chat/memory-records";
import type { ActiveRuntimeMemoryNamespace } from "@/lib/chat/memory-namespace";
import {
  canTransitionMemoryStatus,
  getMemoryStatus,
  normalizeSingleSlotValue,
  resolveSupportedSingleSlotTarget
} from "@/lib/chat/memory-v2";
import { buildAgentSourceMetadata } from "@/lib/chat/agent-metadata";
import { readHumanizedArtifactAction } from "@/lib/chat/humanized-delivery-consumption";
import {
  loadActiveSingleSlotMemoryRows,
  loadOwnedMemoryItemById
} from "@/lib/chat/memory-item-read";
import { updateMemoryItem } from "@/lib/chat/memory-item-persistence";
import { buildWebRuntimeTurnInput } from "@/lib/chat/runtime-input";
import {
  insertAndPersistRuntimeUserMessage
} from "@/lib/chat/runtime-user-message-persistence";
import { prepareWebMediaInput } from "@/lib/chat/web-media-processing";
import { getDefaultModelProfile, runAgentTurn } from "@/lib/chat/runtime";
import {
  loadActiveModelProfileById,
  loadActivePersonaPackById,
  createOwnedAgent,
  createOwnedThread,
  loadOwnedActiveAgent,
  loadOwnedAvailableAgents,
  loadOwnedThread,
  loadPrimaryWorkspace,
  updateOwnedAgent,
  updateOwnedThread
} from "@/lib/chat/runtime-turn-context";
import { loadThreadMessages } from "@/lib/chat/message-read";
import { recoverRetryRuntimeTurn } from "@/lib/chat/runtime-turn-retry";
import {
  insertPendingAssistantMessage,
  markAssistantMessageFailed,
  markAssistantMessageRetried
} from "@/lib/chat/assistant-message-state-persistence";
import { bootstrapRuntimeAssistantTurn } from "@/lib/chat/runtime-turn-bootstrap";
import { updateAssistantPreviewMetadata } from "@/lib/chat/assistant-preview-metadata";
import {
  persistAssistantRequestPreviews,
  processAssistantRuntimePostProcessing
} from "@/lib/chat/runtime-turn-post-processing";
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

type ChatFeedbackTone = "success" | "error";

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

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return {
      ok: false,
      agentId: null,
      message: "No workspace is available for this account."
    };
  }

  const { data: personaPack } = await loadActivePersonaPackById({
    supabase,
    personaPackId
  });

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

  const { data: createdAgent, error } = await createOwnedAgent({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    sourcePersonaPackId: personaPack.id,
    name: agentName,
    personaSummary: personaPack.persona_summary,
    stylePrompt: personaPack.style_prompt,
    systemPrompt: personaPack.system_prompt,
    defaultModelProfileId: defaultModelProfile.id,
    isCustom: false,
    metadata: buildAgentSourceMetadata({
      createdFromChat: true,
      sourceSlug: personaPack.slug,
      sourceDescription: personaPack.description
    }),
    select: "id, name"
  });

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

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return {
      ok: false,
      agentId,
      message: "No workspace is available for this account."
    };
  }

  const { data: agent } = await loadOwnedActiveAgent({
    supabase,
    agentId,
    workspaceId: workspace.id,
    userId: user.id
  });

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
    const { data: modelProfile } = await loadActiveModelProfileById({
      supabase,
      modelProfileId
    });

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

  const { data: updatedAgent, error } = await updateOwnedAgent({
    supabase,
    agentId: agent.id,
    workspaceId: workspace.id,
    userId: user.id,
    patch: {
      name: normalizedName,
      persona_summary: normalizedPersonaSummary,
      default_model_profile_id: nextModelProfileId,
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    },
    select: "id, name"
  }).single();

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

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    redirect("/workspace");
  }

  const { data: agent } = await loadOwnedActiveAgent({
    supabase,
    agentId,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (!agent) {
    redirect(
      appendChatFeedback("/chat", {
        type: "error",
        message: "The selected agent is unavailable for this workspace."
      })
    );
  }

  const { data: createdThread, error } = await createOwnedThread({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    agentId: agent.id
  });

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

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    redirect("/workspace");
  }

  const { data: activeAgents, error: activeAgentsError } = await loadOwnedAvailableAgents({
    supabase,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (activeAgentsError || !activeAgents) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: activeAgentsError?.message ?? "Failed to load active agents."
      })
    );
  }

  const activeAgentList = activeAgents as Array<{
    id: string;
    metadata: Record<string, unknown> | null;
  }>;

  if (!activeAgentList.some((agent) => agent.id === agentId)) {
    redirect(
      appendChatFeedback(redirectTarget, {
        type: "error",
        message: "The selected default agent is unavailable."
      })
    );
  }

  for (const activeAgent of activeAgentList) {
    const nextMetadata = { ...(activeAgent.metadata ?? {}) } as Record<string, unknown>;

    if (activeAgent.id === agentId) {
      nextMetadata.is_default_for_workspace = true;
    } else {
      delete nextMetadata.is_default_for_workspace;
    }

    const { error } = await updateOwnedAgent({
      supabase,
      agentId: activeAgent.id,
      workspaceId: workspace.id,
      userId: user.id,
      patch: {
        metadata: nextMetadata,
        updated_at: new Date().toISOString()
      }
    });

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

  const { data: memoryItem } = await loadOwnedMemoryItemById({
    supabase,
    memoryItemId: memoryId,
    userId: user.id,
    select: "id, memory_type, category, scope, metadata, status"
  });

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
  nextMetadata.semantic_target = classifyStoredMemorySemanticTarget(memoryItem);

  const { error } = await updateMemoryItem({
    supabase,
    memoryItemId: memoryItem.id,
    patch: {
      status: "hidden",
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    }
  }).eq("user_id", user.id);

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

  const { data: memoryItem } = await loadOwnedMemoryItemById({
    supabase,
    memoryItemId: memoryId,
    userId: user.id,
    select:
      "id, workspace_id, memory_type, category, key, value, content, scope, target_agent_id, target_thread_id, metadata, status"
  });

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

  const singleSlotTarget = resolveSupportedSingleSlotTarget(memoryItem);

  if (singleSlotTarget) {
    const conflictingQuery = loadActiveSingleSlotMemoryRows({
      supabase,
      workspaceId: memoryItem.workspace_id,
      userId: user.id,
      category: singleSlotTarget.category,
      key: singleSlotTarget.key,
      scope: singleSlotTarget.scope,
      excludedMemoryItemId: memoryItem.id,
      targetAgentId: singleSlotTarget.targetAgentId,
      targetThreadId: singleSlotTarget.targetThreadId,
      select: "id, memory_type, category, scope, metadata"
    });

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
        superseded_by_restore_memory_id: memoryItem.id,
        semantic_target: classifyStoredMemorySemanticTarget(row)
      };

      const { error: supersedeError } = await updateMemoryItem({
        supabase,
        memoryItemId: row.id,
        patch: {
          status: "superseded",
          metadata: nextSupersededMetadata,
          updated_at: new Date().toISOString()
        }
      }).eq("user_id", user.id);

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
  nextMetadata.semantic_target = classifyStoredMemorySemanticTarget(memoryItem);

  const { error } = await updateMemoryItem({
    supabase,
    memoryItemId: memoryItem.id,
    patch: {
      status: "active",
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    }
  }).eq("user_id", user.id);

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

  const { data: memoryItem } = await loadOwnedMemoryItemById({
    supabase,
    memoryItemId: memoryId,
    userId: user.id,
    select: "id, memory_type, category, scope, metadata, status"
  });

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
  nextMetadata.semantic_target = classifyStoredMemorySemanticTarget(memoryItem);

  const { error } = await updateMemoryItem({
    supabase,
    memoryItemId: memoryItem.id,
    patch: {
      status: "incorrect",
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    }
  }).eq("user_id", user.id);

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
  const imageFileEntries = formData.getAll("image_file");
  const audioFileEntry = formData.get("audio_file");
  const imageFiles = imageFileEntries.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  );
  const audioFile =
    audioFileEntry instanceof File && audioFileEntry.size > 0 ? audioFileEntry : null;

  if (
    typeof content !== "string" ||
    (content.trim().length === 0 && imageFiles.length === 0 && !audioFile)
  ) {
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

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return {
      ok: false,
      threadId,
      message: "No workspace is available for this account."
    };
  }

  const { data: thread } = await loadOwnedThread({
    supabase,
    threadId,
    workspaceId: workspace.id,
    userId: user.id
  });

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

  const { data: agent } = await loadOwnedActiveAgent({
    supabase,
    agentId: thread.agent_id,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (!agent) {
    return {
      ok: false,
      threadId: thread.id,
      message: "The bound agent for this thread could not be loaded."
    };
  }

  let preparedInput: Awaited<ReturnType<typeof prepareWebMediaInput>>;

  try {
    preparedInput = await prepareWebMediaInput({
      content,
      imageFiles,
      audioFile
    });
  } catch (error) {
    return {
      ok: false,
      threadId: thread.id,
      message:
        error instanceof Error
          ? error.message
          : "Failed to prepare the uploaded media."
    };
  }

  const fallbackDisplayContent = imageFiles.length > 0
    ? imageFiles.length === 1
      ? "Image"
      : `${imageFiles.length} images`
    : audioFile
      ? "Voice input"
      : "";
  const displayContent =
    preparedInput.displayContent.trim() || content.trim() || fallbackDisplayContent;
  const runtimeContent =
    preparedInput.runtimeContent.trim() || displayContent;

  const {
    data: insertedMessage,
    error: insertError,
    runtimeTurnInput,
    metadataError
  } = await insertAndPersistRuntimeUserMessage({
    supabase,
    threadId: thread.id,
    workspaceId: workspace.id,
    userId: user.id,
    content: displayContent,
    buildRuntimeTurnInput: (messageId) =>
      buildWebRuntimeTurnInput({
        userId: user.id,
        agentId: thread.agent_id,
        threadId: thread.id,
        workspaceId: workspace.id,
        content: runtimeContent,
        messageId,
        baseMetadata: preparedInput.metadata,
        trigger: "chat_send"
      })
  });

  if (insertError || !insertedMessage) {
    return {
      ok: false,
      threadId: thread.id,
      message: insertError?.message ?? "Failed to store the user message."
    };
  }

  if (metadataError) {
    console.warn("Failed to persist runtime user message metadata:", metadataError);
  }

  let threadPatch: { updated_at: string; title?: string };
  let updatedMessages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    status: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  let assistantPlaceholder: { id: string };

  try {
    const bootstrap = await bootstrapRuntimeAssistantTurn({
      supabase,
      thread: {
        id: thread.id,
        title: thread.title,
        agent_id: thread.agent_id,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        status: thread.status
      },
      workspaceId: workspace.id,
      userId: user.id,
      content: displayContent,
      userMessageId: insertedMessage.id
    });
    threadPatch = bootstrap.threadPatch;
    updatedMessages = bootstrap.persistedMessages;
    assistantPlaceholder = bootstrap.assistantPlaceholder;
  } catch (bootstrapError) {
    return {
      ok: false,
      threadId: thread.id,
      message:
        bootstrapError instanceof Error
          ? bootstrapError.message
          : "Failed to initialize the assistant reply."
    };
  }

  let preparedArtifactContext: Awaited<
    ReturnType<typeof prepareExplicitArtifactContext>
  > | null = null;

  try {
    preparedArtifactContext = await prepareExplicitArtifactContext({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      agentId: thread.agent_id,
      userMessage: runtimeContent,
      agentName: agent.name,
      personaSummary: agent.persona_summary,
      agentMetadata:
        agent.metadata && typeof agent.metadata === "object" && !Array.isArray(agent.metadata)
          ? (agent.metadata as Record<string, unknown>)
          : null,
    });
  } catch (artifactPreparationError) {
    console.error("Explicit artifact preparation failed:", artifactPreparationError);
  }

  if (runtimeTurnInput?.message?.metadata && preparedArtifactContext) {
    const imageArtifact = preparedArtifactContext.imageResult?.artifact ?? null;
    const imageReady = imageArtifact?.status === "ready";
    const imageFailed =
      preparedArtifactContext.intent.imageRequested && imageArtifact?.status === "failed";
    const audioRequested = preparedArtifactContext.intent.audioRequested;
    const clarifyBeforeAction =
      preparedArtifactContext.deliveryGate?.clarifyBeforeAction === true;
    const audioColonContent = audioRequested
      ? extractExplicitAudioContent(runtimeTurnInput.message.content)
      : null;
    const generationHints = [
      clarifyBeforeAction
        ? `The user's current request is not aligned yet${preparedArtifactContext.deliveryGate?.conflictHint ? ` (${preparedArtifactContext.deliveryGate.conflictHint})` : ""}. Ask one short clarifying question first. Do not continue with image delivery, advice expansion, or action-taking in this turn.`
        : "",
      imageReady
        ? "The user explicitly requested an image. An image has already been prepared and will be delivered shortly after your text reply. Let the image lead. Keep your text to 1-3 short sentences. Open from the scene, atmosphere, or feeling of seeing it, not from agent-led delivery phrasing. For companion-style delivery, structure it like shared viewing: sentence one notices the scene, sentence two stays in quiet resonance or co-feeling, and an optional third sentence gently invites the user back into the moment. Let the cadence vary naturally by moment: sometimes one short line is enough, sometimes two beats, and only occasionally a third. Avoid turning the image copy into a polished takeaway, emotional summary, user-serving benefit statement, or image-review paragraph. Do not sound like a museum caption, travel brochure, curated mood board, or aesthetic commentary. Use one or two concrete visual details and keep the wording colloquial, as if speaking while looking at it together. Favor short spoken sentences, simple phrasing, and slight natural looseness over polished prose. Avoid stacked modifiers, balanced parallel phrases, abstract summary nouns, or neat concluding lines. Briefly acknowledge it naturally and do not say you cannot generate images."
        : "",
      imageFailed
        ? `The user explicitly requested an image, but image generation failed before your reply was written${imageArtifact?.error ? ` (${imageArtifact.error})` : ""}. Briefly acknowledge the failed attempt and avoid promising that an image is attached.`
        : "",
      audioRequested && audioColonContent
        ? `The user wants you to speak exactly this text as your audio reply: "${audioColonContent}". Your written reply should be that exact text verbatim, nothing more.`
        : audioRequested
        ? "The user explicitly requested an audio reply. Write a concise reply that works well when spoken aloud, and do not claim that you cannot send audio. Let the cadence feel like live speech rather than a neatly composed note."
        : "",
    ]
      .filter((line) => line.length > 0)
      .join("\n");

    if (generationHints.length > 0) {
      runtimeTurnInput.message.metadata = {
        ...runtimeTurnInput.message.metadata,
        assistant_generation_hint: generationHints,
      };
    }
  }

  try {
    const runtimeTurnResult = await runAgentTurn({
      input: runtimeTurnInput!,
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

    await persistAssistantRequestPreviews({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      activeNamespace:
        ((runtimeTurnResult.debug_metadata as {
          memory_namespace?: ActiveRuntimeMemoryNamespace | null;
        } | undefined)?.memory_namespace ?? null),
      runtimeTurnResult
    });

    try {
      await processAssistantRuntimePostProcessing({
        supabase,
        assistantMessageId: assistantPlaceholder.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: user.id,
        agentId: thread.agent_id,
        sourceMessageId: insertedMessage.id,
        activeMemoryNamespace:
          ((runtimeTurnResult.debug_metadata as {
            memory_namespace?: ActiveRuntimeMemoryNamespace | null;
          } | undefined)?.memory_namespace ?? null),
        runtimeTurnResult
      });
    } catch (memoryError) {
      console.error("Post-processing failed:", memoryError);
    }

    try {
      const artifactAction = readHumanizedArtifactAction(
        runtimeTurnResult.debug_metadata,
        "artifact_action"
      );
      const imageArtifactAction = readHumanizedArtifactAction(
        runtimeTurnResult.debug_metadata,
        "image_artifact_action"
      );
      const audioArtifactAction = readHumanizedArtifactAction(
        runtimeTurnResult.debug_metadata,
        "audio_artifact_action"
      );

      const allowImageDelivery = imageArtifactAction !== "block";
      const allowAudioDelivery = audioArtifactAction !== "block";
      const deliverableImageRequested =
        Boolean(preparedArtifactContext?.intent.imageRequested) && allowImageDelivery;
      const deliverableAudioRequested =
        Boolean(preparedArtifactContext?.intent.audioRequested) && allowAudioDelivery;
      const billingRetryEvents = preparedArtifactContext?.billingRetryEvents ?? [];

      if (
        preparedArtifactContext &&
        artifactAction !== "block" &&
        (deliverableImageRequested || deliverableAudioRequested)
      ) {
        await updateAssistantPreviewMetadata({
          supabase,
          assistantMessageId: assistantPlaceholder.id,
          threadId: thread.id,
          workspaceId: workspace.id,
          userId: user.id,
          updates: (currentMetadata) => ({
            web_delivery: {
              ...(currentMetadata?.web_delivery &&
              typeof currentMetadata.web_delivery === "object" &&
              !Array.isArray(currentMetadata.web_delivery)
                ? (currentMetadata.web_delivery as Record<string, unknown>)
                : {}),
              artifact_generation_started_at: new Date().toISOString(),
              artifact_generation_status: "running",
              explicit_media_delivery_mode: "artifact_first",
              explicit_audio_requested: deliverableAudioRequested,
              explicit_image_requested: deliverableImageRequested,
              billing_retry_events: billingRetryEvents,
            }
          })
        });

        await maybeGenerateAssistantArtifacts({
          supabase,
          assistantMessageId: assistantPlaceholder.id,
          threadId: thread.id,
          workspaceId: workspace.id,
          userId: user.id,
          agentId: thread.agent_id,
          userMessage: runtimeContent,
          assistantReply: runtimeTurnResult.assistant_message.content,
          agentName: agent.name,
          personaSummary: agent.persona_summary,
          agentMetadata:
            agent.metadata && typeof agent.metadata === "object" && !Array.isArray(agent.metadata)
              ? (agent.metadata as Record<string, unknown>)
              : null,
          preparedContext: {
            ...preparedArtifactContext,
            intent: {
              ...preparedArtifactContext.intent,
              imageRequested: deliverableImageRequested,
              audioRequested: deliverableAudioRequested,
            },
          },
          audioTranscriptOverride:
            preparedArtifactContext?.audioTranscriptOverride ?? null,
        });

        await updateAssistantPreviewMetadata({
          supabase,
          assistantMessageId: assistantPlaceholder.id,
          threadId: thread.id,
          workspaceId: workspace.id,
          userId: user.id,
          updates: (currentMetadata) => ({
            web_delivery: {
              ...(currentMetadata?.web_delivery &&
              typeof currentMetadata.web_delivery === "object" &&
              !Array.isArray(currentMetadata.web_delivery)
                ? (currentMetadata.web_delivery as Record<string, unknown>)
                : {}),
              artifact_generation_completed_at: new Date().toISOString(),
              artifact_generation_status: "completed",
              explicit_media_delivery_mode: "artifact_first",
              explicit_audio_requested: deliverableAudioRequested,
              explicit_image_requested: deliverableImageRequested,
            }
          })
        });
      }
    } catch (artifactError) {
      console.error("Assistant artifact generation failed:", artifactError);

      await updateAssistantPreviewMetadata({
        supabase,
        assistantMessageId: assistantPlaceholder.id,
        threadId: thread.id,
        workspaceId: workspace.id,
        userId: user.id,
        updates: (currentMetadata) => ({
          web_delivery: {
            ...(currentMetadata?.web_delivery &&
            typeof currentMetadata.web_delivery === "object" &&
            !Array.isArray(currentMetadata.web_delivery)
              ? (currentMetadata.web_delivery as Record<string, unknown>)
              : {}),
            artifact_generation_completed_at: new Date().toISOString(),
            artifact_generation_status: "scheduled",
            artifact_generation_error:
              artifactError instanceof Error
                ? artifactError.message
                : "web_artifact_generation_failed",
          }
        })
      });
    }
  } catch (error) {
    const assistantFailure = classifyAssistantError(error);

    await markAssistantMessageFailed({
      supabase,
      assistantMessageId: assistantPlaceholder.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      agentId: thread.agent_id,
      userMessageId: insertedMessage.id,
      errorType: assistantFailure.errorType,
      errorMessage: assistantFailure.message
    });

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

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    return {
      ok: false,
      threadId,
      message: "No workspace is available for this account."
    };
  }

  const { data: thread } = await loadOwnedThread({
    supabase,
    threadId,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (!thread || !thread.agent_id) {
    return {
      ok: false,
      threadId,
      message: "The active thread or its agent could not be resolved."
    };
  }

  const { data: agent } = await loadOwnedActiveAgent({
    supabase,
    agentId: thread.agent_id,
    workspaceId: workspace.id,
    userId: user.id
  });

  if (!agent) {
    return {
      ok: false,
      threadId,
      message: "The bound agent for this thread could not be loaded."
    };
  }

  const { data: messages, error: messagesError } = await loadThreadMessages({
    supabase,
    threadId: thread.id,
    workspaceId: workspace.id
  });

  if (messagesError || !messages) {
    return {
      ok: false,
      threadId,
      message: messagesError?.message ?? "Failed to load thread messages."
    };
  }

  const retryTurn = recoverRetryRuntimeTurn({
    messages: messages as Array<{
      id: string;
      role: string;
      content: string;
      status: string;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>,
    failedMessageId
  });

  if (retryTurn.status === "failed_message_not_found") {
    return {
      ok: false,
      threadId,
      message: "The selected failed assistant turn is no longer available."
    };
  }

  if (retryTurn.status === "source_user_message_not_found") {
    return {
      ok: false,
      threadId,
      message: "The user message for this failed reply could not be recovered."
    };
  }

  const { failedMessage, promptMessages, latestUserMessage } = retryTurn;

  await markAssistantMessageRetried({
    supabase,
    assistantMessageId: failedMessage.id,
    threadId: thread.id,
    workspaceId: workspace.id,
    userId: user.id,
    baseMetadata: failedMessage.metadata
  });

  try {
    const runtimeTurnInput = buildWebRuntimeTurnInput({
      userId: user.id,
      agentId: thread.agent_id,
      threadId: thread.id,
      workspaceId: workspace.id,
      content: latestUserMessage.content,
      timestamp: latestUserMessage.created_at,
      messageId: latestUserMessage.id,
      baseMetadata: latestUserMessage.metadata,
      trigger: "retry_assistant_reply",
      triggerKind: "retry"
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

    await persistAssistantRequestPreviews({
      supabase,
      assistantMessageId: failedMessage.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      activeNamespace:
        ((runtimeTurnResult.debug_metadata as {
          memory_namespace?: ActiveRuntimeMemoryNamespace | null;
        } | undefined)?.memory_namespace ?? null),
      runtimeTurnResult
    });
  } catch (error) {
    const assistantFailure = classifyAssistantError(error);

    await markAssistantMessageFailed({
      supabase,
      assistantMessageId: failedMessage.id,
      threadId: thread.id,
      workspaceId: workspace.id,
      userId: user.id,
      baseMetadata: failedMessage.metadata,
      errorType: assistantFailure.errorType,
      errorMessage: assistantFailure.message
    });

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

  const { data: thread, error } = await updateOwnedThread({
    supabase,
    threadId,
    userId: user.id,
    patch: {
      title: normalizedTitle,
      updated_at: new Date().toISOString()
    },
    select: "id, title"
  }).single();

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
