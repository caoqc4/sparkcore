const CHARACTER_ASSETS_BUCKET = "character-assets";

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function isCharacterAssetStoragePath(value: string | null | undefined) {
  return typeof value === "string" && value.startsWith(`${CHARACTER_ASSETS_BUCKET}/`);
}

export function stripCharacterAssetsBucketPrefix(storagePath: string) {
  return storagePath.replace(/^character-assets\//, "");
}

export function getCharacterAssetsBucketName() {
  return CHARACTER_ASSETS_BUCKET;
}

export function getCharacterAssetsPublicBaseUrl() {
  return normalizeOptionalString(process.env.CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL);
}

function joinPublicUrl(baseUrl: string, key: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}

export function resolveCharacterAssetPublicUrl(args: {
  publicUrl?: string | null;
  storagePath?: string | null;
  supabase?: any;
}) {
  const directUrl = normalizeOptionalString(args.publicUrl);
  if (directUrl) {
    return directUrl;
  }

  const storagePath = normalizeOptionalString(args.storagePath);
  if (!storagePath || !isCharacterAssetStoragePath(storagePath)) {
    return null;
  }

  const objectKey = stripCharacterAssetsBucketPrefix(storagePath);
  const r2BaseUrl = getCharacterAssetsPublicBaseUrl();
  if (r2BaseUrl) {
    return joinPublicUrl(r2BaseUrl, objectKey);
  }

  if (args.supabase) {
    return args.supabase.storage
      .from(CHARACTER_ASSETS_BUCKET)
      .getPublicUrl(objectKey).data.publicUrl;
  }

  return null;
}
