"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSiteLanguageState } from "@/lib/i18n/site";
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

async function getKnowledgeActionCopy() {
  const { effectiveSystemLanguage } = await getSiteLanguageState();
  const isZh = effectiveSystemLanguage === "zh-CN";
  return {
    noWorkspace: isZh ? "当前账户没有可用工作区。" : "No workspace is available for this account.",
    noteRequired: isZh ? "知识笔记需要标题和正文内容。" : "Knowledge notes require a title and note content.",
    noteCreateFailed: isZh ? "创建知识笔记失败。" : "Failed to create the knowledge note.",
    noteProcessFailed: isZh ? "处理知识笔记失败。" : "Failed to process the knowledge note.",
    noteSaved: isZh ? "知识笔记已保存。" : "Knowledge note saved.",
    urlRequired: isZh ? "知识链接需要标题和 URL。" : "Knowledge URLs require a title and URL.",
    urlCreateFailed: isZh ? "创建链接来源失败。" : "Failed to create the URL source.",
    urlProcessFailed: isZh ? "处理链接来源失败。" : "Failed to process the URL source.",
    urlQueued: isZh ? "知识链接已加入处理队列。" : "Knowledge URL queued for processing.",
    documentRequired: isZh ? "知识文档需要标题和文件。" : "Knowledge documents require a title and file.",
    documentCreateFailed: isZh ? "创建文档来源失败。" : "Failed to create the document source.",
    documentUploadFailed: isZh ? "上传文档失败。" : "Failed to upload the document.",
    documentQueued: isZh ? "知识文档已上传并加入处理队列。" : "Knowledge document uploaded and queued.",
    retryMissing: isZh ? "无法确定要重试的知识来源。" : "The knowledge source to retry could not be determined.",
    retryFailed: isZh ? "重试知识来源失败。" : "Failed to retry the knowledge source.",
    retried: isZh ? "知识来源已重试。" : "Knowledge source retried.",
    archiveMissing: isZh ? "无法确定要归档的知识来源。" : "The knowledge source to archive could not be determined.",
    archiveFailed: isZh ? "归档知识来源失败。" : "Failed to archive the knowledge source.",
    archived: isZh ? "知识来源已归档。" : "Knowledge source archived.",
    deleteMissing: isZh ? "无法确定要删除的知识来源。" : "The knowledge source to delete could not be determined.",
    deleteFailed: isZh ? "删除知识来源失败。" : "Failed to delete the knowledge source.",
    deleted: isZh ? "知识来源已删除。" : "Knowledge source deleted.",
  };
}

async function requireWorkspaceAndUser(redirectPath: string) {
  const copy = await getKnowledgeActionCopy();
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
    redirectWithMessage(redirectPath, copy.noWorkspace, "error");
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
  const copy = await getKnowledgeActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const roleId = normalizeText(formData.get("role_id")) || null;
  const title = normalizeText(formData.get("title"));
  const noteContent = normalizeText(formData.get("note_content"));

  if (!title || !noteContent) {
    redirectWithMessage(redirectPath, copy.noteRequired, "error");
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
      result.error?.message ?? copy.noteCreateFailed,
      "error"
    );
  }

  try {
    await processKnowledgeSourceById(result.data.id);
  } catch (error) {
    redirectWithMessage(
      redirectPath,
      error instanceof Error ? error.message : copy.noteProcessFailed,
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, copy.noteSaved, "success");
}

export async function createKnowledgeUrl(formData: FormData) {
  const copy = await getKnowledgeActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const roleId = normalizeText(formData.get("role_id")) || null;
  const title = normalizeText(formData.get("title"));
  const url = normalizeText(formData.get("source_url"));

  if (!title || !url) {
    redirectWithMessage(redirectPath, copy.urlRequired, "error");
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
    redirectWithMessage(redirectPath, result.error?.message ?? copy.urlCreateFailed, "error");
  }

  try {
    await processKnowledgeSourceById(result.data.id);
  } catch (error) {
    redirectWithMessage(
      redirectPath,
      error instanceof Error ? error.message : copy.urlProcessFailed,
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, copy.urlQueued, "success");
}

export async function createKnowledgeDocument(formData: FormData) {
  const copy = await getKnowledgeActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const roleId = normalizeText(formData.get("role_id")) || null;
  const title = normalizeText(formData.get("title"));
  const fileEntry = formData.get("file");

  if (!title || !(fileEntry instanceof File) || fileEntry.size === 0) {
    redirectWithMessage(redirectPath, copy.documentRequired, "error");
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
        result.error?.message ?? copy.documentCreateFailed,
        "error"
      );
    }

    await processKnowledgeSourceById(result.data.id);
  } catch (error) {
    redirectWithMessage(
      redirectPath,
      error instanceof Error ? error.message : copy.documentUploadFailed,
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, copy.documentQueued, "success");
}

export async function retryKnowledgeSource(formData: FormData) {
  const copy = await getKnowledgeActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const sourceId = normalizeText(formData.get("source_id"));

  if (!sourceId) {
    redirectWithMessage(redirectPath, copy.retryMissing, "error");
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
      error instanceof Error ? error.message : copy.retryFailed,
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, copy.retried, "success");
}

export async function archiveKnowledgeSource(formData: FormData) {
  const copy = await getKnowledgeActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const sourceId = normalizeText(formData.get("source_id"));

  if (!sourceId) {
    redirectWithMessage(redirectPath, copy.archiveMissing, "error");
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
      error instanceof Error ? error.message : copy.archiveFailed,
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, copy.archived, "success");
}

export async function deleteKnowledgeSource(formData: FormData) {
  const copy = await getKnowledgeActionCopy();
  const redirectPath = resolveRedirectPath(formData, "/app/knowledge");
  const sourceId = normalizeText(formData.get("source_id"));

  if (!sourceId) {
    redirectWithMessage(redirectPath, copy.deleteMissing, "error");
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
      error instanceof Error ? error.message : copy.deleteFailed,
      "error"
    );
  }

  revalidateKnowledgeSurfaces();
  redirectWithMessage(redirectPath, copy.deleted, "success");
}
