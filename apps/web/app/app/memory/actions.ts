"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSiteLanguageState } from "@/lib/i18n/site";
import { createClient } from "@/lib/supabase/server";
import { classifyStoredMemorySemanticTarget } from "@/lib/chat/memory-records";
import {
  canTransitionMemoryStatus,
  getMemoryStatus,
  normalizeSingleSlotValue,
  resolveSupportedSingleSlotTarget
} from "@/lib/chat/memory-v2";
import {
  loadActiveSingleSlotMemoryRows,
  loadOwnedMemoryItemById
} from "@/lib/chat/memory-item-read";
import { updateMemoryItem } from "@/lib/chat/memory-item-persistence";

function resolveRedirectPath(formData: FormData, fallbackPath: string) {
  const redirectTarget = formData.get("redirect_to");

  if (typeof redirectTarget !== "string" || redirectTarget.length === 0) {
    return fallbackPath;
  }

  if (!redirectTarget.startsWith("/") || redirectTarget.includes("://")) {
    return fallbackPath;
  }

  return redirectTarget;
}

function redirectWithMessage(
  redirectPath: string,
  message: string,
  type: "error" | "success"
): never {
  const separator = redirectPath.includes("?") ? "&" : "?";
  redirect(
    `${redirectPath}${separator}feedback=${encodeURIComponent(message)}&feedback_type=${type}`
  );
}

async function getMemoryActionCopy() {
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";
  return {
    missingHide: isZh ? "无法确定要隐藏的记忆。" : "The memory to hide could not be determined.",
    unavailable: isZh ? "所选记忆不可用。" : "The selected memory is unavailable.",
    cannotHide: isZh ? "当前状态下无法隐藏这条记忆。" : "This memory cannot be hidden from its current state.",
    hidden: isZh ? "记忆已从召回中隐藏。" : "Memory hidden from recall.",
    missingCorrect: isZh ? "无法确定要纠正的记忆。" : "The memory to correct could not be determined.",
    cannotIncorrect: isZh ? "当前状态下无法把这条记忆标记为错误。" : "This memory cannot be marked incorrect from its current state.",
    incorrect: isZh ? "记忆已标记为错误，并从召回中移除。" : "Memory marked incorrect and removed from recall.",
    missingRestore: isZh ? "无法确定要恢复的记忆。" : "The memory to restore could not be determined.",
    cannotRestore: isZh ? "当前状态下无法恢复这条记忆。" : "This memory cannot be restored from its current state.",
    restored: isZh ? "记忆已恢复到召回中。" : "Memory restored to recall.",
  };
}

export async function hideProductMemory(formData: FormData) {
  const copy = await getMemoryActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/memory");
  const memoryId = formData.get("memory_id");

  if (typeof memoryId !== "string" || memoryId.trim().length === 0) {
    redirectWithMessage(redirectPath, copy.missingHide, "error");
  }
  const memoryItemId = memoryId;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectPath)}`);
  }

  const { data: memoryItem } = await loadOwnedMemoryItemById({
    supabase,
    memoryItemId,
    userId: user.id,
    select: "id, memory_type, category, scope, metadata, status"
  });

  if (!memoryItem) {
    redirectWithMessage(redirectPath, copy.unavailable, "error");
  }

  if (!canTransitionMemoryStatus(getMemoryStatus(memoryItem), "hidden")) {
    redirectWithMessage(
      redirectPath,
      copy.cannotHide,
      "error"
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
    redirectWithMessage(redirectPath, error.message, "error");
  }

  revalidatePath("/app");
  revalidatePath("/app/memory");
  revalidatePath("/app/role");
  revalidatePath("/app/settings");
  revalidatePath("/chat");
  redirectWithMessage(redirectPath, copy.hidden, "success");
}

export async function markProductMemoryIncorrect(formData: FormData) {
  const copy = await getMemoryActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/memory");
  const memoryId = formData.get("memory_id");

  if (typeof memoryId !== "string" || memoryId.trim().length === 0) {
    redirectWithMessage(
      redirectPath,
      copy.missingCorrect,
      "error"
    );
  }
  const memoryItemId = memoryId;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectPath)}`);
  }

  const { data: memoryItem } = await loadOwnedMemoryItemById({
    supabase,
    memoryItemId,
    userId: user.id,
    select: "id, memory_type, category, scope, metadata, status"
  });

  if (!memoryItem) {
    redirectWithMessage(redirectPath, copy.unavailable, "error");
  }

  if (!canTransitionMemoryStatus(getMemoryStatus(memoryItem), "incorrect")) {
    redirectWithMessage(
      redirectPath,
      copy.cannotIncorrect,
      "error"
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
    redirectWithMessage(redirectPath, error.message, "error");
  }

  revalidatePath("/app");
  revalidatePath("/app/memory");
  revalidatePath("/app/role");
  revalidatePath("/app/settings");
  revalidatePath("/chat");
  redirectWithMessage(
    redirectPath,
    copy.incorrect,
    "success"
  );
}

export async function restoreProductMemory(formData: FormData) {
  const copy = await getMemoryActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/memory");
  const memoryId = formData.get("memory_id");

  if (typeof memoryId !== "string" || memoryId.trim().length === 0) {
    redirectWithMessage(
      redirectPath,
      copy.missingRestore,
      "error"
    );
  }
  const memoryItemId = memoryId;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectPath)}`);
  }

  const { data: memoryItem } = await loadOwnedMemoryItemById({
    supabase,
    memoryItemId,
    userId: user.id,
    select:
      "id, workspace_id, memory_type, category, key, value, content, scope, target_agent_id, target_thread_id, metadata, status"
  });

  if (!memoryItem) {
    redirectWithMessage(redirectPath, copy.unavailable, "error");
  }

  if (!canTransitionMemoryStatus(getMemoryStatus(memoryItem), "active")) {
    redirectWithMessage(
      redirectPath,
      copy.cannotRestore,
      "error"
    );
  }

  const singleSlotTarget = resolveSupportedSingleSlotTarget(memoryItem);

  if (singleSlotTarget) {
    const { data: conflictingActiveRows, error: conflictingRowsError } =
      await loadActiveSingleSlotMemoryRows({
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

    if (conflictingRowsError) {
      redirectWithMessage(redirectPath, conflictingRowsError.message, "error");
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
        redirectWithMessage(redirectPath, supersedeError.message, "error");
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
      last_confirmed_at: new Date().toISOString(),
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    }
  }).eq("user_id", user.id);

  if (error) {
    redirectWithMessage(redirectPath, error.message, "error");
  }

  revalidatePath("/app");
  revalidatePath("/app/memory");
  revalidatePath("/app/role");
  revalidatePath("/app/settings");
  revalidatePath("/chat");
  redirectWithMessage(redirectPath, copy.restored, "success");
}
