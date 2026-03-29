import { createAdminClient } from "@/lib/supabase/admin";

export type ProductKnowledgeSourceType = "document" | "url" | "note" | "pack";
export type ProductKnowledgeSourceStatus =
  | "draft"
  | "processing"
  | "active"
  | "failed"
  | "archived";
export type ProductKnowledgeProcessingStatus =
  | "queued"
  | "parsing"
  | "indexed"
  | "failed";

const KNOWLEDGE_STORAGE_BUCKET = "knowledge-sources";

function normalizeText(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function getSafeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function isProcessingStatus(value: unknown): value is ProductKnowledgeProcessingStatus {
  return (
    value === "queued" ||
    value === "parsing" ||
    value === "indexed" ||
    value === "failed"
  );
}

export async function loadOwnedKnowledgeSourceById(args: {
  supabase: any;
  sourceId: string;
  userId: string;
}) {
  const { data, error } = await args.supabase
    .from("knowledge_sources")
    .select(
      "id, owner_user_id, target_role_id, title, source_type, status, processing_status, storage_path, content_excerpt, error_message, metadata, last_processing_started_at, last_processed_at"
    )
    .eq("id", args.sourceId)
    .eq("owner_user_id", args.userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load knowledge source: ${error.message}`);
  }

  return data;
}

function isStuckProcessingSource(source: {
  status: string;
  processing_status: string;
  last_processing_started_at?: string | null;
  last_processed_at?: string | null;
}) {
  if (source.status !== "processing" || source.processing_status === "failed") {
    return false;
  }

  if (source.last_processed_at) {
    return false;
  }

  const startedAt =
    typeof source.last_processing_started_at === "string"
      ? source.last_processing_started_at
      : null;

  if (!startedAt) {
    return false;
  }

  const startedMs = Date.parse(startedAt);
  if (Number.isNaN(startedMs)) {
    return false;
  }

  const STALE_MS = 10 * 60 * 1000;
  return Date.now() - startedMs > STALE_MS;
}

export async function createKnowledgeSourceRecord(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
  roleId?: string | null;
  title: string;
  sourceType: ProductKnowledgeSourceType;
  status?: ProductKnowledgeSourceStatus;
  processingStatus?: ProductKnowledgeProcessingStatus;
  storagePath?: string | null;
  mimeType?: string | null;
  originalFileName?: string | null;
  contentExcerpt?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return args.supabase
    .from("knowledge_sources")
    .insert({
      workspace_id: args.workspaceId,
      owner_user_id: args.userId,
      target_role_id: args.roleId ?? null,
      title: args.title,
      source_type: args.sourceType,
      status: args.status ?? "draft",
      processing_status: args.processingStatus ?? "queued",
      storage_path: args.storagePath ?? null,
      mime_type: args.mimeType ?? null,
      original_file_name: args.originalFileName ?? null,
      content_excerpt: args.contentExcerpt ?? null,
      error_message: args.errorMessage ?? null,
      metadata: args.metadata ?? {}
    })
    .select("id")
    .single();
}

export async function createKnowledgeNoteSource(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
  roleId?: string | null;
  title: string;
  noteContent: string;
}) {
  const excerpt = normalizeText(args.noteContent).slice(0, 280);

  return createKnowledgeSourceRecord({
    supabase: args.supabase,
    workspaceId: args.workspaceId,
    userId: args.userId,
    roleId: args.roleId,
    title: args.title,
    sourceType: "note",
    status: "active",
    processingStatus: "indexed",
    contentExcerpt: excerpt || null,
    metadata: {
      note_content: args.noteContent
    }
  });
}

export async function createKnowledgeUrlSource(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
  roleId?: string | null;
  title: string;
  url: string;
}) {
  return createKnowledgeSourceRecord({
    supabase: args.supabase,
    workspaceId: args.workspaceId,
    userId: args.userId,
    roleId: args.roleId,
    title: args.title,
    sourceType: "url",
    status: "processing",
    processingStatus: "queued",
    contentExcerpt: args.url,
    metadata: {
      source_url: args.url
    }
  });
}

export async function createKnowledgeDocumentSource(args: {
  supabase: any;
  workspaceId: string;
  userId: string;
  roleId?: string | null;
  title: string;
  file: File;
}) {
  const admin = createAdminClient();
  const safeName = getSafeFileName(args.file.name || "upload.bin");
  const storagePath = `${args.userId}/${args.roleId ?? "workspace"}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await admin.storage
    .from(KNOWLEDGE_STORAGE_BUCKET)
    .upload(storagePath, args.file, {
      upsert: false,
      contentType: args.file.type || "application/octet-stream"
    });

  if (uploadError) {
    throw new Error(`Failed to upload knowledge file: ${uploadError.message}`);
  }

  return createKnowledgeSourceRecord({
    supabase: args.supabase,
    workspaceId: args.workspaceId,
    userId: args.userId,
    roleId: args.roleId,
    title: args.title,
    sourceType: "document",
    status: "processing",
    processingStatus: "queued",
    storagePath,
    mimeType: args.file.type || null,
    originalFileName: args.file.name || null,
    metadata: {
      storage_bucket: KNOWLEDGE_STORAGE_BUCKET
    }
  });
}

export async function updateKnowledgeSourceStatus(args: {
  supabase: any;
  sourceId: string;
  userId: string;
  status: ProductKnowledgeSourceStatus;
  processingStatus: ProductKnowledgeProcessingStatus;
  contentExcerpt?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  incrementAttemptCount?: boolean;
  processingStartedAt?: string | null;
  processedAt?: string | null;
  metadataPatch?: Record<string, unknown>;
}) {
  const patch: Record<string, unknown> = {
    status: args.status,
    processing_status: args.processingStatus,
    content_excerpt: args.contentExcerpt ?? null,
    error_message: args.errorMessage ?? null,
    last_error_code: args.errorCode ?? null,
    updated_at: new Date().toISOString()
  };

  if (args.incrementAttemptCount) {
    const { data: existing, error } = await args.supabase
      .from("knowledge_sources")
      .select("processing_attempt_count, metadata")
      .eq("id", args.sourceId)
      .eq("owner_user_id", args.userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load knowledge source before update: ${error.message}`);
    }

    const existingAttempts =
      typeof existing?.processing_attempt_count === "number"
        ? existing.processing_attempt_count
        : 0;
    patch.processing_attempt_count = existingAttempts + 1;

    const existingMetadata =
      existing?.metadata &&
      typeof existing.metadata === "object" &&
      !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {};

    if (args.metadataPatch) {
      patch.metadata = {
        ...existingMetadata,
        ...args.metadataPatch
      };
    }
  } else if (args.metadataPatch) {
    const { data: existing, error } = await args.supabase
      .from("knowledge_sources")
      .select("metadata")
      .eq("id", args.sourceId)
      .eq("owner_user_id", args.userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load knowledge source metadata before update: ${error.message}`);
    }

    const existingMetadata =
      existing?.metadata &&
      typeof existing.metadata === "object" &&
      !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {};

    patch.metadata = {
      ...existingMetadata,
      ...args.metadataPatch
    };
  }

  if (args.processingStartedAt !== undefined) {
    patch.last_processing_started_at = args.processingStartedAt;
  }

  if (args.processedAt !== undefined) {
    patch.last_processed_at = args.processedAt;
  }

  return args.supabase
    .from("knowledge_sources")
    .update(patch)
    .eq("id", args.sourceId)
    .eq("owner_user_id", args.userId);
}

export async function insertKnowledgeSourceProcessingRun(args: {
  supabase: any;
  sourceId: string;
  userId: string;
  stage: "queued" | "parsing" | "downloading" | "extracting" | "indexing" | "completed" | "failed";
  status: "started" | "completed" | "failed" | "info";
  message?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return args.supabase.from("knowledge_source_processing_runs").insert({
    source_id: args.sourceId,
    owner_user_id: args.userId,
    stage: args.stage,
    status: args.status,
    message: args.message ?? null,
    metadata: args.metadata ?? {}
  });
}

export async function retryKnowledgeSourceRecord(args: {
  supabase: any;
  sourceId: string;
  userId: string;
}) {
  const source = await loadOwnedKnowledgeSourceById(args);

  if (!source) {
    throw new Error("Knowledge source not found.");
  }

  if (
    source.status === "processing" &&
    source.processing_status !== "failed" &&
    !isStuckProcessingSource(source)
  ) {
    throw new Error("This knowledge source is already being processed.");
  }

  const metadata =
    source.metadata && typeof source.metadata === "object" && !Array.isArray(source.metadata)
      ? (source.metadata as Record<string, unknown>)
      : {};
  const retryRequestedAt = new Date().toISOString();

  const { error } = await args.supabase
    .from("knowledge_sources")
    .update({
      status: "processing",
      processing_status: "queued",
      error_message: null,
      last_error_code: null,
      metadata: {
        ...metadata,
        retry_requested_at: retryRequestedAt
      },
      updated_at: retryRequestedAt
    })
    .eq("id", args.sourceId)
    .eq("owner_user_id", args.userId);

  if (error) {
    throw new Error(`Failed to queue knowledge source for retry: ${error.message}`);
  }

  await insertKnowledgeSourceProcessingRun({
    supabase: args.supabase,
    sourceId: args.sourceId,
    userId: args.userId,
    stage: "queued",
    status: "info",
    message: "Knowledge source queued for retry.",
    metadata: {
      retry_requested_at: retryRequestedAt
    }
  });

  return source;
}

export async function archiveKnowledgeSourceRecord(args: {
  supabase: any;
  sourceId: string;
  userId: string;
}) {
  const source = await loadOwnedKnowledgeSourceById(args);

  if (!source) {
    throw new Error("Knowledge source not found.");
  }

  if (source.status === "archived") {
    return source;
  }

  const metadata =
    source.metadata && typeof source.metadata === "object" && !Array.isArray(source.metadata)
      ? (source.metadata as Record<string, unknown>)
      : {};
  const archivedAt = new Date().toISOString();
  const processingStatus = isProcessingStatus(source.processing_status)
    ? source.processing_status
    : "failed";

  const { error } = await args.supabase
    .from("knowledge_sources")
    .update({
      status: "archived",
      processing_status: processingStatus,
      metadata: {
        ...metadata,
        archived_at: archivedAt
      },
      updated_at: archivedAt
    })
    .eq("id", args.sourceId)
    .eq("owner_user_id", args.userId);

  if (error) {
    throw new Error(`Failed to archive knowledge source: ${error.message}`);
  }

  await insertKnowledgeSourceProcessingRun({
    supabase: args.supabase,
    sourceId: args.sourceId,
    userId: args.userId,
    stage: "completed",
    status: "info",
    message: "Knowledge source archived.",
    metadata: {
      archived_at: archivedAt
    }
  });

  return source;
}

export async function deleteKnowledgeSourceRecord(args: {
  supabase: any;
  sourceId: string;
  userId: string;
}) {
  const source = await loadOwnedKnowledgeSourceById(args);

  if (!source) {
    throw new Error("Knowledge source not found.");
  }

  if (typeof source.storage_path === "string" && source.storage_path.length > 0) {
    const admin = createAdminClient();
    const { error: storageError } = await admin.storage
      .from(KNOWLEDGE_STORAGE_BUCKET)
      .remove([source.storage_path]);

    if (storageError) {
      throw new Error(`Failed to delete stored knowledge file: ${storageError.message}`);
    }
  }

  const { error } = await args.supabase
    .from("knowledge_sources")
    .delete()
    .eq("id", args.sourceId)
    .eq("owner_user_id", args.userId);

  if (error) {
    throw new Error(`Failed to delete knowledge source: ${error.message}`);
  }

  return source;
}
