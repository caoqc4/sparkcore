import path from "node:path";
import { processKnowledgeSourceById } from "@/lib/product/knowledge-processing";
import {
  createKnowledgeDocumentSource,
  deleteKnowledgeSourceRecord
} from "@/lib/product/knowledge-sources";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv(path.resolve(process.cwd()));

async function main() {
  const supabase = createAdminClient();
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, owner_user_id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (workspaceError || !workspace) {
    throw new Error(workspaceError?.message ?? "No workspace found.");
  }

  const file = new File(
    [
      `SparkCore R2 knowledge migration smoke.\nCreated at: ${new Date().toISOString()}\nThis is a temporary verification document.`
    ],
    "r2-knowledge-smoke.txt",
    { type: "text/plain" }
  );

  const created = await createKnowledgeDocumentSource({
    supabase,
    workspaceId: workspace.id,
    userId: workspace.owner_user_id,
    roleId: null,
    title: "R2 Knowledge Smoke",
    file
  });

  if (created.error || !created.data?.id) {
    throw new Error(created.error?.message ?? "Failed to create knowledge source.");
  }

  const sourceId = created.data.id;

  try {
    const processResult = await processKnowledgeSourceById(sourceId);
    const { data: source, error: sourceError } = await supabase
      .from("knowledge_sources")
      .select("id, status, processing_status, storage_path, metadata, content_excerpt")
      .eq("id", sourceId)
      .maybeSingle();

    if (sourceError || !source) {
      throw new Error(sourceError?.message ?? "Failed to load created knowledge source.");
    }

    console.log(
      JSON.stringify(
        {
          sourceId,
          processResult,
          status: source.status,
          processingStatus: source.processing_status,
          storagePath: source.storage_path,
          storageProvider:
            source.metadata &&
            typeof source.metadata === "object" &&
            !Array.isArray(source.metadata)
              ? (source.metadata as Record<string, unknown>).storage_provider ?? null
              : null,
          storageBucket:
            source.metadata &&
            typeof source.metadata === "object" &&
            !Array.isArray(source.metadata)
              ? (source.metadata as Record<string, unknown>).storage_bucket ?? null
              : null,
          excerpt: source.content_excerpt ?? null
        },
        null,
        2
      )
    );
  } finally {
    await deleteKnowledgeSourceRecord({
      supabase,
      sourceId,
      userId: workspace.owner_user_id
    });

    console.log(JSON.stringify({ deletedSourceId: sourceId }, null, 2));
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Knowledge R2 smoke failed.");
  process.exitCode = 1;
});
