"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadPrimaryWorkspace } from "@/lib/chat/runtime-turn-context";
import {
  archiveKnowledgeSourceRecord,
  createKnowledgeDocumentSource,
  createKnowledgeNoteSource,
  createKnowledgeUrlSource,
  deleteKnowledgeSourceRecord,
  retryKnowledgeSourceRecord
} from "@/lib/product/knowledge-sources";
import { processKnowledgeSourceById } from "@/lib/product/knowledge-processing";

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

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

async function requireWorkspaceAndUser(redirectPath: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectPath)}`);
  }

  const { data: workspace } = await loadPrimaryWorkspace({
    supabase,
    userId: user.id
  });

  if (!workspace) {
    redirectWithMessage(redirectPath, "No workspace is available for this account.", "error");
  }

  return { supabase, user, workspace };
}

function revalidateKnowledgeSurfaces() {
  revalidatePath("/app");
  revalidatePath("/app/knowledge");
  revalidatePath("/app/role");
  revalidatePath("/app/settings");
}

export async function createKnowledgeNote(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const roleId = normalizeText(formData.get("role_id")) || null;
  const title = normalizeText(formData.get("title"));
  const noteContent = normalizeText(formData.get("note_content"));

  if (!title || !noteContent) {
    redirectWithMessage(redirectPath, "Knowledge notes require a title and note content.", "error");
  }

  const { supabase, user, workspace } = await requireWorkspaceAndUser(redirectPath);
  const result = await createKnowledgeNoteSource({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    roleId,
    title,
    noteContent
  });

  if (result.error || !result.data?.id) {
    redirectWithMessage(
      redirectPath,
      result.error?.message ?? "Failed to create the knowledge note.",
      "error"
    );
  }

  try {
    await processKnowledgeSourceById(result.data.id);
  } catch (error) {
    redirectWithMessage(
      redirectPath,
      error instanceof Error ? error.message : "Failed to process the knowledge note.",
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, "Knowledge note saved.", "success");
}

export async function createKnowledgeUrl(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const roleId = normalizeText(formData.get("role_id")) || null;
  const title = normalizeText(formData.get("title"));
  const url = normalizeText(formData.get("source_url"));

  if (!title || !url) {
    redirectWithMessage(redirectPath, "Knowledge URLs require a title and URL.", "error");
  }

  const { supabase, user, workspace } = await requireWorkspaceAndUser(redirectPath);
  const result = await createKnowledgeUrlSource({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    roleId,
    title,
    url
  });

  if (result.error || !result.data?.id) {
    redirectWithMessage(redirectPath, result.error?.message ?? "Failed to create the URL source.", "error");
  }

  try {
    await processKnowledgeSourceById(result.data.id);
  } catch (error) {
    redirectWithMessage(
      redirectPath,
      error instanceof Error ? error.message : "Failed to process the URL source.",
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, "Knowledge URL queued for processing.", "success");
}

export async function createKnowledgeDocument(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const roleId = normalizeText(formData.get("role_id")) || null;
  const title = normalizeText(formData.get("title"));
  const fileEntry = formData.get("file");

  if (!title || !(fileEntry instanceof File) || fileEntry.size === 0) {
    redirectWithMessage(redirectPath, "Knowledge documents require a title and file.", "error");
  }

  const { supabase, user, workspace } = await requireWorkspaceAndUser(redirectPath);

  try {
    const result = await createKnowledgeDocumentSource({
      supabase,
      workspaceId: workspace.id,
      userId: user.id,
      roleId,
      title,
      file: fileEntry
    });

    if (result.error || !result.data?.id) {
      redirectWithMessage(
        redirectPath,
        result.error?.message ?? "Failed to create the document source.",
        "error"
      );
    }

    await processKnowledgeSourceById(result.data.id);
  } catch (error) {
    redirectWithMessage(
      redirectPath,
      error instanceof Error ? error.message : "Failed to upload the document.",
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, "Knowledge document uploaded and queued.", "success");
}

export async function retryKnowledgeSource(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const sourceId = normalizeText(formData.get("source_id"));

  if (!sourceId) {
    redirectWithMessage(redirectPath, "The knowledge source to retry could not be determined.", "error");
  }

  const { supabase, user } = await requireWorkspaceAndUser(redirectPath);

  try {
    await retryKnowledgeSourceRecord({
      supabase,
      sourceId,
      userId: user.id
    });

    await processKnowledgeSourceById(sourceId);
  } catch (error) {
    redirectWithMessage(
      redirectPath,
      error instanceof Error ? error.message : "Failed to retry the knowledge source.",
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, "Knowledge source retried.", "success");
}

export async function archiveKnowledgeSource(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const sourceId = normalizeText(formData.get("source_id"));

  if (!sourceId) {
    redirectWithMessage(redirectPath, "The knowledge source to archive could not be determined.", "error");
  }

  const { supabase, user } = await requireWorkspaceAndUser(redirectPath);

  try {
    await archiveKnowledgeSourceRecord({
      supabase,
      sourceId,
      userId: user.id
    });
  } catch (error) {
    redirectWithMessage(
      redirectPath,
      error instanceof Error ? error.message : "Failed to archive the knowledge source.",
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, "Knowledge source archived.", "success");
}

export async function deleteKnowledgeSource(formData: FormData) {
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const sourceId = normalizeText(formData.get("source_id"));

  if (!sourceId) {
    redirectWithMessage(redirectPath, "The knowledge source to delete could not be determined.", "error");
  }

  const { supabase, user } = await requireWorkspaceAndUser(redirectPath);

  try {
    await deleteKnowledgeSourceRecord({
      supabase,
      sourceId,
      userId: user.id
    });
  } catch (error) {
    redirectWithMessage(
      redirectPath,
      error instanceof Error ? error.message : "Failed to delete the knowledge source.",
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, "Knowledge source deleted.", "success");
}
