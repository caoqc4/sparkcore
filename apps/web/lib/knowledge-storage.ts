import { createAdminClient } from "@/lib/supabase/admin";
import {
  deleteKnowledgeDocumentFromR2,
  downloadKnowledgeDocumentFromR2,
  getOptionalKnowledgeR2Env,
  uploadKnowledgeDocumentToR2
} from "@/lib/r2";

const KNOWLEDGE_STORAGE_BUCKET = "knowledge-sources";

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getMetadataRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getKnowledgeStorageMetadata(value: unknown) {
  const metadata = getMetadataRecord(value);

  return {
    provider: normalizeOptionalString(metadata?.storage_provider),
    bucket: normalizeOptionalString(metadata?.storage_bucket)
  };
}

export function getKnowledgeStorageBucketName() {
  return KNOWLEDGE_STORAGE_BUCKET;
}

export function isKnowledgeStoredInR2(metadata: unknown) {
  return getKnowledgeStorageMetadata(metadata).provider === "r2";
}

export async function uploadKnowledgeDocument(args: {
  storagePath: string;
  file: File;
}) {
  const r2Env = getOptionalKnowledgeR2Env();

  if (r2Env) {
    const buffer = Buffer.from(await args.file.arrayBuffer());
    const uploaded = await uploadKnowledgeDocumentToR2({
      objectKey: args.storagePath,
      body: buffer,
      contentType: args.file.type || "application/octet-stream"
    });

    return {
      provider: "r2" as const,
      bucket: uploaded.bucket
    };
  }

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from(KNOWLEDGE_STORAGE_BUCKET)
    .upload(args.storagePath, args.file, {
      upsert: false,
      contentType: args.file.type || "application/octet-stream"
    });

  if (uploadError) {
    throw new Error(`Failed to upload knowledge file: ${uploadError.message}`);
  }

  return {
    provider: "supabase" as const,
    bucket: KNOWLEDGE_STORAGE_BUCKET
  };
}

export async function downloadKnowledgeDocument(args: {
  storagePath: string;
  mimeType?: string | null;
  metadata?: unknown;
}) {
  const storage = getKnowledgeStorageMetadata(args.metadata);

  if (storage.provider === "r2") {
    return downloadKnowledgeDocumentFromR2({
      bucket: storage.bucket,
      objectKey: args.storagePath,
      mimeType: args.mimeType
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(KNOWLEDGE_STORAGE_BUCKET)
    .download(args.storagePath);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to download stored document.");
  }

  return {
    blob: data,
    size: data.size,
    mimeType: normalizeOptionalString(data.type) ?? normalizeOptionalString(args.mimeType) ?? ""
  };
}

export async function deleteKnowledgeDocument(args: {
  storagePath: string;
  metadata?: unknown;
}) {
  const storage = getKnowledgeStorageMetadata(args.metadata);

  if (storage.provider === "r2") {
    await deleteKnowledgeDocumentFromR2({
      bucket: storage.bucket,
      objectKey: args.storagePath
    });
    return;
  }

  const admin = createAdminClient();
  const { error: storageError } = await admin.storage
    .from(KNOWLEDGE_STORAGE_BUCKET)
    .remove([args.storagePath]);

  if (storageError) {
    throw new Error(`Failed to delete stored knowledge file: ${storageError.message}`);
  }
}
