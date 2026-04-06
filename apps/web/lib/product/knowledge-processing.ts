import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import * as XLSX from "xlsx";
import { createAdminClient } from "@/lib/supabase/admin";
import { downloadKnowledgeDocument } from "@/lib/knowledge-storage";
import {
  buildKnowledgeSnapshotRecords,
  clearKnowledgeSnapshotsForSource,
  replaceKnowledgeSnapshotsForSource
} from "@/lib/product/knowledge-snapshots";
import {
  insertKnowledgeSourceProcessingRun,
  updateKnowledgeSourceStatus
} from "@/lib/product/knowledge-sources";

type KnowledgeSourceProcessRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  target_role_id: string | null;
  title: string;
  source_type: "document" | "url" | "note" | "pack";
  status: string;
  processing_status: string;
  storage_path: string | null;
  mime_type: string | null;
  content_excerpt: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
};

function getMetadataRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function stripHtml(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clipExcerpt(text: string, maxLength = 280) {
  return text.replace(/\s+/g, " ").trim().slice(0, maxLength) || null;
}

function getBufferFromBlob(blob: Blob) {
  return blob.arrayBuffer().then((arrayBuffer) => Buffer.from(arrayBuffer));
}

function normalizeExtractedText(text: string) {
  return text.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();
}

function isCsvLikeMimeType(mimeType: string) {
  return (
    mimeType === "text/csv" ||
    mimeType === "application/csv" ||
    mimeType === "text/comma-separated-values"
  );
}

function isSpreadsheetMimeType(mimeType: string) {
  return (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  );
}

function isDocxMimeType(mimeType: string) {
  return (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}

function isPdfMimeType(mimeType: string) {
  return mimeType === "application/pdf";
}

function buildKnowledgeErrorCode(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("missing source url")) {
    return "missing_source_url";
  }

  if (normalized.includes("failed to fetch url")) {
    return "url_fetch_failed";
  }

  if (normalized.includes("missing storage path")) {
    return "missing_storage_path";
  }

  if (normalized.includes("failed to download")) {
    return "document_download_failed";
  }

  if (normalized.includes("not indexed yet")) {
    return "document_type_not_supported";
  }

  if (normalized.includes("pdf")) {
    return "pdf_parse_failed";
  }

  if (
    normalized.includes("wordprocessingml") ||
    normalized.includes("docx") ||
    normalized.includes("mammoth")
  ) {
    return "docx_parse_failed";
  }

  if (
    normalized.includes("excel") ||
    normalized.includes("spreadsheet") ||
    normalized.includes("csv") ||
    normalized.includes("worksheet")
  ) {
    return "spreadsheet_parse_failed";
  }

  return "processing_failed";
}

async function extractTextFromDocument(args: {
  blob: Blob;
  mimeType: string;
}) {
  const mimeType = args.mimeType.toLowerCase();

  if (mimeType.startsWith("text/") || mimeType === "application/json") {
    return normalizeExtractedText(await args.blob.text());
  }

  if (isCsvLikeMimeType(mimeType)) {
    const buffer = await getBufferFromBlob(args.blob);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = sheetName ? workbook.Sheets[sheetName] : null;

    if (!worksheet) {
      return "";
    }

    return normalizeExtractedText(
      XLSX.utils.sheet_to_csv(worksheet, {
        blankrows: false
      })
    );
  }

  if (isSpreadsheetMimeType(mimeType)) {
    const buffer = await getBufferFromBlob(args.blob);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const extracted = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const csv = worksheet
        ? XLSX.utils.sheet_to_csv(worksheet, { blankrows: false })
        : "";
      return `# ${sheetName}\n${csv}`;
    }).join("\n\n");

    return normalizeExtractedText(extracted);
  }

  if (isDocxMimeType(mimeType)) {
    const buffer = await getBufferFromBlob(args.blob);
    const result = await mammoth.extractRawText({ buffer });
    return normalizeExtractedText(result.value ?? "");
  }

  if (isPdfMimeType(mimeType)) {
    const buffer = await getBufferFromBlob(args.blob);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return normalizeExtractedText(result.text ?? "");
  }

  throw new Error(`Document type ${mimeType || "unknown"} is not indexed yet.`);
}

async function loadKnowledgeSource(sourceId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("knowledge_sources")
    .select(
      "id, workspace_id, owner_user_id, target_role_id, title, source_type, status, processing_status, storage_path, mime_type, content_excerpt, error_message, metadata"
    )
    .eq("id", sourceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load knowledge source: ${error.message}`);
  }

  return (data as KnowledgeSourceProcessRow | null) ?? null;
}

async function logKnowledgeRun(args: {
  source: KnowledgeSourceProcessRow;
  stage: "queued" | "parsing" | "downloading" | "extracting" | "indexing" | "completed" | "failed";
  status: "started" | "completed" | "failed" | "info";
  message?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();

  await insertKnowledgeSourceProcessingRun({
    supabase: admin,
    sourceId: args.source.id,
    userId: args.source.owner_user_id,
    stage: args.stage,
    status: args.status,
    message: args.message,
    metadata: args.metadata
  });
}

async function markKnowledgeProcessingStarted(source: KnowledgeSourceProcessRow) {
  const admin = createAdminClient();
  const startedAt = new Date().toISOString();

  await updateKnowledgeSourceStatus({
    supabase: admin,
    sourceId: source.id,
    userId: source.owner_user_id,
    status: "processing",
    processingStatus: "parsing",
    errorMessage: null,
    errorCode: null,
    incrementAttemptCount: true,
    processingStartedAt: startedAt,
    metadataPatch: {
      last_processing_source_type: source.source_type
    }
  });

  await logKnowledgeRun({
    source,
    stage: "parsing",
    status: "started",
    message: "Knowledge source processing started.",
    metadata: {
      source_type: source.source_type,
      started_at: startedAt
    }
  });
}

async function markKnowledgeProcessingFailed(source: KnowledgeSourceProcessRow, message: string) {
  const admin = createAdminClient();
  const errorCode = buildKnowledgeErrorCode(message);
  const processedAt = new Date().toISOString();

  await clearKnowledgeSnapshotsForSource({
    supabase: admin,
    knowledgeSourceId: source.id
  });

  await updateKnowledgeSourceStatus({
    supabase: admin,
    sourceId: source.id,
    userId: source.owner_user_id,
    status: "failed",
    processingStatus: "failed",
    errorMessage: message,
    errorCode,
    processedAt
  });

  await logKnowledgeRun({
    source,
    stage: "failed",
    status: "failed",
    message,
    metadata: {
      error_code: errorCode,
      processed_at: processedAt
    }
  });
}

async function markKnowledgeProcessingCompleted(
  source: KnowledgeSourceProcessRow,
  extractedText: string,
  excerpt: string | null,
  detailMessage: string
) {
  const admin = createAdminClient();
  const processedAt = new Date().toISOString();

  const snapshotRows = buildKnowledgeSnapshotRecords({
    knowledgeSourceId: source.id,
    workspaceId: source.workspace_id,
    ownerUserId: source.owner_user_id,
    targetRoleId: source.target_role_id,
    title: source.title,
    sourceType: source.source_type,
    extractedText,
    capturedAt: processedAt,
    metadata: {
      processing_detail: detailMessage
    }
  });

  await replaceKnowledgeSnapshotsForSource({
    supabase: admin,
    knowledgeSourceId: source.id,
    rows: snapshotRows
  });

  await updateKnowledgeSourceStatus({
    supabase: admin,
    sourceId: source.id,
    userId: source.owner_user_id,
    status: "active",
    processingStatus: "indexed",
    contentExcerpt: excerpt,
    errorMessage: null,
    errorCode: null,
    processedAt
  });

  await logKnowledgeRun({
    source,
    stage: "completed",
    status: "completed",
    message: detailMessage,
    metadata: {
      processed_at: processedAt,
      excerpt_length: excerpt?.length ?? 0
    }
  });
}

async function processUrlSource(source: KnowledgeSourceProcessRow) {
  const metadata = getMetadataRecord(source.metadata);
  const url =
    typeof metadata?.source_url === "string" ? metadata.source_url.trim() : "";

  if (!url) {
    await markKnowledgeProcessingFailed(source, "Missing source URL.");
    return { ok: false, sourceId: source.id, message: "Missing source URL." };
  }

  await logKnowledgeRun({
    source,
    stage: "downloading",
    status: "started",
    message: "Fetching URL source.",
    metadata: {
      source_url: url
    }
  });

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim().length > 0
        ? `Failed to fetch URL: ${error.message}`
        : "Failed to fetch URL.";
    await markKnowledgeProcessingFailed(source, message);
    return { ok: false, sourceId: source.id, message };
  }

  if (!response.ok) {
    const message = `Failed to fetch URL (${response.status}).`;
    await markKnowledgeProcessingFailed(source, message);
    return { ok: false, sourceId: source.id, message };
  }

  const html = await response.text();
  await logKnowledgeRun({
    source,
    stage: "extracting",
    status: "info",
    message: "Extracting URL content excerpt.",
    metadata: {
      html_length: html.length
    }
  });
  const extractedText = stripHtml(html);
  const excerpt = clipExcerpt(extractedText);
  await markKnowledgeProcessingCompleted(
    source,
    extractedText,
    excerpt,
    "URL source processed."
  );

  return { ok: true, sourceId: source.id, message: "URL source processed." };
}

async function processDocumentSource(source: KnowledgeSourceProcessRow) {
  if (!source.storage_path) {
    const message = "Missing storage path for document source.";
    await markKnowledgeProcessingFailed(source, message);
    return { ok: false, sourceId: source.id, message };
  }

  await logKnowledgeRun({
    source,
    stage: "downloading",
    status: "started",
    message: "Downloading stored document.",
    metadata: {
      storage_path: source.storage_path
    }
  });

  let downloaded: Awaited<ReturnType<typeof downloadKnowledgeDocument>>;
  try {
    downloaded = await downloadKnowledgeDocument({
      storagePath: source.storage_path,
      mimeType: source.mime_type,
      metadata: source.metadata
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to download stored document.";
    await markKnowledgeProcessingFailed(source, message);
    return { ok: false, sourceId: source.id, message };
  }

  const mimeType = source.mime_type ?? downloaded.mimeType ?? "";
  let excerpt: string | null = null;
  let extractedText = "";

  await logKnowledgeRun({
    source,
    stage: "extracting",
    status: "started",
    message: "Extracting document content.",
    metadata: {
      mime_type: mimeType || "unknown",
      file_size: downloaded.size
    }
  });

  try {
    const text = await extractTextFromDocument({
      blob: downloaded.blob,
      mimeType
    });
    extractedText = text;
    excerpt = clipExcerpt(text);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Document type ${mimeType || "unknown"} is not indexed yet.`;
    await markKnowledgeProcessingFailed(source, message);
    return { ok: false, sourceId: source.id, message };
  }

  await logKnowledgeRun({
    source,
    stage: "indexing",
    status: "info",
    message: "Document excerpt extracted and indexed.",
    metadata: {
      mime_type: mimeType || "unknown"
    }
  });
  await markKnowledgeProcessingCompleted(
    source,
    extractedText,
    excerpt,
    "Document source processed."
  );

  return { ok: true, sourceId: source.id, message: "Document source processed." };
}

export async function processKnowledgeSourceById(sourceId: string) {
  const source = await loadKnowledgeSource(sourceId);

  if (!source) {
    return { ok: false, sourceId, message: "Knowledge source not found." };
  }

  if (source.source_type === "note") {
    const metadata = getMetadataRecord(source.metadata);
    const noteContent =
      typeof metadata?.note_content === "string" && metadata.note_content.trim().length > 0
        ? metadata.note_content
        : source.content_excerpt ?? "";

    await markKnowledgeProcessingStarted(source);
    await logKnowledgeRun({
      source,
      stage: "indexing",
      status: "info",
      message: "Note source does not require extraction.",
      metadata: {
        excerpt_length: source.content_excerpt?.length ?? 0
      }
    });
    await markKnowledgeProcessingCompleted(
      source,
      noteContent,
      source.content_excerpt ?? clipExcerpt(noteContent),
      "Note source marked as indexed."
    );
    return { ok: true, sourceId, message: "Note sources are indexed on write." };
  }

  if (source.source_type === "url") {
    await markKnowledgeProcessingStarted(source);
    return processUrlSource(source);
  }

  if (source.source_type === "document") {
    await markKnowledgeProcessingStarted(source);
    return processDocumentSource(source);
  }

  const message = `Source type ${source.source_type} is not processed yet.`;
  await markKnowledgeProcessingStarted(source);
  await markKnowledgeProcessingFailed(source, message);

  return {
    ok: false,
    sourceId,
    message
  };
}

export async function processQueuedKnowledgeSources(limit = 10) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("knowledge_sources")
    .select("id")
    .in("status", ["draft", "processing"])
    .in("processing_status", ["queued", "parsing"])
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load queued knowledge sources: ${error.message}`);
  }

  const results = [] as Array<{ ok: boolean; sourceId: string; message: string }>;

  for (const row of data ?? []) {
    if (typeof row.id === "string" && row.id.length > 0) {
      results.push(await processKnowledgeSourceById(row.id));
    }
  }

  return results;
}
