import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-local-env";

loadLocalEnv(path.resolve(process.cwd()));

type GenderPresentation = "female" | "male" | "neutral";
type PortraitSourceType = "preset" | "upload" | "generated";
type StyleTag = "realistic" | "anime" | "illustrated";

type PortraitSidecar = {
  display_name?: string;
  provider?: string;
  source_type?: PortraitSourceType;
  gender_presentation?: GenderPresentation;
  style_tags?: string[];
  is_shared?: boolean;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  default_for_character?: string | string[];
};

type AudioSidecar = {
  display_name?: string;
  provider?: string;
  gender_presentation?: GenderPresentation;
  style_tags?: string[];
  tier?: "free" | "pro";
  is_default?: boolean;
  sort_order?: number;
  metadata?: Record<string, unknown>;
  default_for_character?: string | string[];
};

const BUCKET = "character-assets";
const DEFAULT_ASSET_ROOT = path.resolve(process.cwd(), "../../assets/character-assets");
const DRY_RUN = process.argv.includes("--dry-run");
const PORTRAIT_POOL_DIR = "portrait-pool";
const AUDIO_POOL_DIR = "audio-pool";
const MEDIA_EXTENSIONS = new Set([
  ".webp",
  ".png",
  ".jpg",
  ".jpeg",
  ".mp3",
  ".wav",
  ".m4a"
]);
const PORTRAIT_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a"]);
const VALID_GENDERS = new Set<GenderPresentation>(["female", "male", "neutral"]);
const VALID_PORTRAIT_STYLES = new Set<StyleTag>(["realistic", "anime", "illustrated"]);

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function createAdminSupabaseClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

function walkFiles(rootDir: string): string[] {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function normalizeStoragePath(rootDir: string, fullPath: string) {
  const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
  return `${BUCKET}/${relativePath}`;
}

function normalizeRelativePath(rootDir: string, fullPath: string) {
  return path.relative(rootDir, fullPath).replace(/\\/g, "/");
}

function parseJsonFile<T>(fullPath: string): T | null {
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const raw = fs.readFileSync(fullPath, "utf8").trim();
  if (raw.length === 0) {
    return null;
  }

  return JSON.parse(raw) as T;
}

function readSidecarFile<T>(assetFullPath: string) {
  const extension = path.extname(assetFullPath);
  return parseJsonFile<T>(assetFullPath.slice(0, -extension.length) + ".json");
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = typeof value === "string" ? value.trim() : "";
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function asObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function isPortraitAssetPath(storagePath: string) {
  const ext = path.extname(storagePath).toLowerCase();
  return PORTRAIT_EXTENSIONS.has(ext);
}

function isAudioAssetPath(storagePath: string) {
  const ext = path.extname(storagePath).toLowerCase();
  return AUDIO_EXTENSIONS.has(ext);
}

function isMediaFile(fullPath: string) {
  const ext = path.extname(fullPath).toLowerCase();
  return MEDIA_EXTENSIONS.has(ext);
}

function normalizeCharacterDefaults(value: unknown) {
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [] as string[];
}

function buildPortraitRecord(args: {
  rootDir: string;
  fullPath: string;
  storagePath: string;
}) {
  const relativePath = normalizeRelativePath(args.rootDir, args.fullPath);
  const segments = relativePath.split("/");

  if (segments.length !== 4 || segments[0] !== PORTRAIT_POOL_DIR) {
    return null;
  }

  const [, styleSegment, genderSegment] = segments;

  if (!VALID_PORTRAIT_STYLES.has(styleSegment as StyleTag)) {
    throw new Error(
      `Invalid portrait style folder for ${relativePath}. Expected one of: realistic, anime, illustrated.`
    );
  }

  if (!VALID_GENDERS.has(genderSegment as GenderPresentation)) {
    throw new Error(
      `Invalid portrait gender folder for ${relativePath}. Expected one of: female, male, neutral.`
    );
  }

  const sidecar = readSidecarFile<PortraitSidecar>(args.fullPath);
  const filename = path.basename(relativePath, path.extname(relativePath));
  const displayName =
    typeof sidecar?.display_name === "string" && sidecar.display_name.trim().length > 0
      ? sidecar.display_name.trim()
      : filename
          .split(/[-_]/g)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
  const defaultCharacters = normalizeCharacterDefaults(sidecar?.default_for_character);
  const metadata = {
    ...asObject(sidecar?.metadata),
    asset_slug: filename
  } as Record<string, unknown>;

  if (defaultCharacters.length === 1) {
    metadata.character_slug = defaultCharacters[0];
    metadata.variant = "main";
  }

  if (defaultCharacters.length > 1) {
    metadata.character_slugs = defaultCharacters;
  }

  return {
    provider:
      typeof sidecar?.provider === "string" && sidecar.provider.trim().length > 0
        ? sidecar.provider.trim()
        : "SparkCore",
    source_type: sidecar?.source_type ?? "preset",
    storage_path: args.storagePath,
    public_url: null,
    display_name: displayName,
    gender_presentation: sidecar?.gender_presentation ?? (genderSegment as GenderPresentation),
    style_tags: uniqueStrings([
      styleSegment,
      ...normalizeStringArray(sidecar?.style_tags)
    ]),
    is_shared: sidecar?.is_shared ?? true,
    is_active: sidecar?.is_active ?? true,
    metadata
  };
}

function buildAudioRecord(args: {
  rootDir: string;
  fullPath: string;
  storagePath: string;
}) {
  const relativePath = normalizeRelativePath(args.rootDir, args.fullPath);
  const segments = relativePath.split("/");

  if (segments.length !== 4 || segments[0] !== AUDIO_POOL_DIR) {
    return null;
  }

  const [, modelSlug, genderSegment, filename] = segments;

  if (!VALID_GENDERS.has(genderSegment as GenderPresentation)) {
    throw new Error(
      `Invalid audio gender folder for ${relativePath}. Expected one of: female, male, neutral.`
    );
  }

  const voiceKey = filename.replace(/\.[^.]+$/, "");
  if (!modelSlug || !voiceKey) {
    throw new Error(`Invalid audio sample path: ${relativePath}`);
  }

  const sidecar = readSidecarFile<AudioSidecar>(args.fullPath);
  const defaultCharacters = normalizeCharacterDefaults(sidecar?.default_for_character);
  const metadata = {
    ...asObject(sidecar?.metadata)
  } as Record<string, unknown>;

  if (defaultCharacters.length === 1) {
    metadata.default_for_character = defaultCharacters[0];
  }

  if (defaultCharacters.length > 1) {
    metadata.default_for_characters = defaultCharacters;
  }

  return {
    modelSlug,
    voiceKey,
    genderPresentation: sidecar?.gender_presentation ?? (genderSegment as GenderPresentation),
    displayName:
      typeof sidecar?.display_name === "string" && sidecar.display_name.trim().length > 0
        ? sidecar.display_name.trim()
        : null,
    styleTags: normalizeStringArray(sidecar?.style_tags),
    tier: sidecar?.tier ?? null,
    isDefault: typeof sidecar?.is_default === "boolean" ? sidecar.is_default : null,
    sortOrder: typeof sidecar?.sort_order === "number" ? sidecar.sort_order : null,
    provider:
      typeof sidecar?.provider === "string" && sidecar.provider.trim().length > 0
        ? sidecar.provider.trim()
        : null,
    metadata,
    storagePath: args.storagePath
  };
}

async function uploadFile(args: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  rootDir: string;
  fullPath: string;
}) {
  const storagePath = normalizeStoragePath(args.rootDir, args.fullPath);
  const bucketPath = storagePath.replace(/^character-assets\//, "");
  const fileBuffer = fs.readFileSync(args.fullPath);

  if (DRY_RUN) {
    console.log(`[dry-run] upload ${args.fullPath} -> ${storagePath}`);
    return { storagePath };
  }

  const { error } = await args.supabase.storage
    .from(BUCKET)
    .upload(bucketPath, fileBuffer, {
      upsert: true,
      contentType: undefined
    });

  if (error) {
    throw new Error(`Failed to upload ${storagePath}: ${error.message}`);
  }

  console.log(`uploaded ${storagePath}`);
  return { storagePath };
}

async function upsertPortraitRecord(args: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  rootDir: string;
  fullPath: string;
  storagePath: string;
}) {
  const record = buildPortraitRecord(args);

  if (!record) {
    console.log(`skipped portrait db sync for ${args.storagePath}`);
    return;
  }

  if (DRY_RUN) {
    console.log(
      `[dry-run] upsert portrait asset ${record.display_name} -> ${args.storagePath} (${record.gender_presentation}, ${record.style_tags.join(", ")})`
    );
    return;
  }

  const { data: existing, error: existingError } = await args.supabase
    .from("product_portrait_assets")
    .select("id")
    .eq("storage_path", args.storagePath)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to look up portrait asset ${args.storagePath}: ${existingError.message}`
    );
  }

  if (existing?.id) {
    const { error: updateError } = await args.supabase
      .from("product_portrait_assets")
      .update({
        ...record,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(
        `Failed to update portrait asset ${args.storagePath}: ${updateError.message}`
      );
    }

    console.log(`updated portrait asset ${args.storagePath}`);
    return;
  }

  const { error: insertError } = await args.supabase
    .from("product_portrait_assets")
    .insert(record);

  if (insertError) {
    throw new Error(`Failed to insert portrait asset ${args.storagePath}: ${insertError.message}`);
  }

  console.log(`inserted portrait asset ${args.storagePath}`);
}

async function upsertAudioSampleRecord(args: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  rootDir: string;
  fullPath: string;
  storagePath: string;
}) {
  const audioRecord = buildAudioRecord(args);

  if (!audioRecord) {
    console.log(`skipped audio db sync for ${args.storagePath}`);
    return;
  }

  const publicUrl = args.supabase.storage
    .from(BUCKET)
    .getPublicUrl(args.storagePath.replace(/^character-assets\//, "")).data.publicUrl;

  if (DRY_RUN) {
    console.log(
      `[dry-run] update audio sample ${audioRecord.modelSlug}/${audioRecord.voiceKey} -> ${args.storagePath} (${audioRecord.genderPresentation}, ${audioRecord.styleTags.join(", ") || "no-tags"})`
    );
    return;
  }

  const { data: existing, error: existingError } = await args.supabase
    .from("product_audio_voice_options")
    .select("id, display_name, provider, gender_presentation, style_tags, tier, sort_order, is_default, metadata")
    .eq("model_slug", audioRecord.modelSlug)
    .eq("voice_key", audioRecord.voiceKey)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to look up audio voice option ${audioRecord.modelSlug}/${audioRecord.voiceKey}: ${existingError.message}`
    );
  }

  if (!existing?.id) {
    console.log(
      `skipped audio sample db sync for ${args.storagePath} (voice option not found: ${audioRecord.modelSlug}/${audioRecord.voiceKey})`
    );
    return;
  }

  const currentMetadata = asObject(existing.metadata);
  const nextMetadata = {
    ...currentMetadata,
    ...audioRecord.metadata,
    sample_storage_path: audioRecord.storagePath,
    sample_public_url: publicUrl
  };

  const { error: updateError } = await args.supabase
    .from("product_audio_voice_options")
    .update({
      display_name: audioRecord.displayName ?? existing.display_name,
      provider: audioRecord.provider ?? existing.provider,
      gender_presentation:
        audioRecord.genderPresentation ??
        (typeof existing.gender_presentation === "string" ? existing.gender_presentation : null),
      style_tags:
        audioRecord.styleTags.length > 0
          ? uniqueStrings(audioRecord.styleTags)
          : normalizeStringArray(existing.style_tags),
      tier: audioRecord.tier ?? existing.tier ?? null,
      sort_order: audioRecord.sortOrder ?? existing.sort_order ?? 0,
      is_default: audioRecord.isDefault ?? existing.is_default ?? false,
      metadata: nextMetadata,
      updated_at: new Date().toISOString()
    })
    .eq("id", existing.id);

  if (updateError) {
    throw new Error(
      `Failed to update audio sample metadata for ${audioRecord.modelSlug}/${audioRecord.voiceKey}: ${updateError.message}`
    );
  }

  console.log(`updated audio sample ${audioRecord.modelSlug}/${audioRecord.voiceKey}`);
}

async function main() {
  const assetRoot = path.resolve(getArgValue("--dir") ?? DEFAULT_ASSET_ROOT);

  if (!fs.existsSync(assetRoot)) {
    throw new Error(`Asset directory does not exist: ${assetRoot}`);
  }

  const supabase = createAdminSupabaseClient();
  const files = walkFiles(assetRoot).filter((fullPath) => isMediaFile(fullPath));

  if (files.length === 0) {
    console.log(`No media files found in ${assetRoot}`);
    return;
  }

  console.log(`Using asset directory: ${assetRoot}`);
  console.log(DRY_RUN ? "Mode: dry-run" : "Mode: apply");

  for (const fullPath of files) {
    const { storagePath } = await uploadFile({
      supabase,
      rootDir: assetRoot,
      fullPath
    });

    if (isPortraitAssetPath(storagePath)) {
      await upsertPortraitRecord({
        supabase,
        rootDir: assetRoot,
        fullPath,
        storagePath
      });
      continue;
    }

    if (isAudioAssetPath(storagePath)) {
      await upsertAudioSampleRecord({
        supabase,
        rootDir: assetRoot,
        fullPath,
        storagePath
      });
      continue;
    }
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown import failure.");
  process.exitCode = 1;
});
