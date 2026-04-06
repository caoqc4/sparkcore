import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

type CharacterAssetsR2Env = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string | null;
};

type KnowledgeR2Env = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

function readCharacterAssetsR2Env() {
  const accountId = normalizeOptionalString(process.env.CF_R2_ACCOUNT_ID);
  const accessKeyId = normalizeOptionalString(process.env.CF_R2_ACCESS_KEY_ID);
  const secretAccessKey = normalizeOptionalString(process.env.CF_R2_SECRET_ACCESS_KEY);
  const bucket = normalizeOptionalString(process.env.CF_R2_CHARACTER_ASSETS_BUCKET);
  const publicBaseUrl = normalizeOptionalString(
    process.env.CF_R2_CHARACTER_ASSETS_PUBLIC_BASE_URL
  );

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl
  };
}

export function getOptionalCharacterAssetsR2Env(): CharacterAssetsR2Env | null {
  const env = readCharacterAssetsR2Env();
  const values = [env.accountId, env.accessKeyId, env.secretAccessKey, env.bucket];
  const presentCount = values.filter(Boolean).length;

  if (presentCount === 0) {
    return null;
  }

  if (presentCount !== values.length) {
    throw new Error(
      "Incomplete Cloudflare R2 configuration for character assets. Set CF_R2_ACCOUNT_ID, CF_R2_ACCESS_KEY_ID, CF_R2_SECRET_ACCESS_KEY, and CF_R2_CHARACTER_ASSETS_BUCKET together."
    );
  }

  return {
    accountId: env.accountId!,
    accessKeyId: env.accessKeyId!,
    secretAccessKey: env.secretAccessKey!,
    bucket: env.bucket!,
    publicBaseUrl: env.publicBaseUrl
  };
}

export function createCharacterAssetsR2Client() {
  const env = getOptionalCharacterAssetsR2Env();

  if (!env) {
    throw new Error("Cloudflare R2 character asset storage is not configured.");
  }

  return {
    env,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey
      }
    })
  };
}

function createR2Client(args: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
}) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${args.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: args.accessKeyId,
      secretAccessKey: args.secretAccessKey
    }
  });
}

export async function uploadCharacterAssetToR2(args: {
  objectKey: string;
  body: Buffer;
  contentType?: string;
}) {
  const { env } = createCharacterAssetsR2Client();
  const client = createR2Client(env);

  await client.send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: args.objectKey,
      Body: args.body,
      ContentType: args.contentType
    })
  );

  const baseUrl =
    env.publicBaseUrl ??
    `https://pub-${env.accountId}.r2.dev/${env.bucket}`;

  return {
    bucket: env.bucket,
    publicUrl: `${baseUrl.replace(/\/+$/, "")}/${args.objectKey.replace(/^\/+/, "")}`
  };
}

function readKnowledgeR2Env() {
  const accountId = normalizeOptionalString(process.env.CF_R2_ACCOUNT_ID);
  const accessKeyId =
    normalizeOptionalString(process.env.CF_R2_KNOWLEDGE_ACCESS_KEY_ID) ??
    normalizeOptionalString(process.env.CF_R2_ACCESS_KEY_ID);
  const secretAccessKey =
    normalizeOptionalString(process.env.CF_R2_KNOWLEDGE_SECRET_ACCESS_KEY) ??
    normalizeOptionalString(process.env.CF_R2_SECRET_ACCESS_KEY);
  const bucket = normalizeOptionalString(process.env.CF_R2_KNOWLEDGE_BUCKET);

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket
  };
}

export function getOptionalKnowledgeR2Env(): KnowledgeR2Env | null {
  const env = readKnowledgeR2Env();
  const values = [env.accountId, env.accessKeyId, env.secretAccessKey, env.bucket];
  const presentCount = values.filter(Boolean).length;

  if (presentCount === 0) {
    return null;
  }

  if (presentCount !== values.length) {
    throw new Error(
      "Incomplete Cloudflare R2 configuration for knowledge documents. Set CF_R2_ACCOUNT_ID, CF_R2_KNOWLEDGE_BUCKET, and either the shared CF_R2_ACCESS_KEY_ID/CF_R2_SECRET_ACCESS_KEY pair or the knowledge-specific CF_R2_KNOWLEDGE_ACCESS_KEY_ID/CF_R2_KNOWLEDGE_SECRET_ACCESS_KEY pair together."
    );
  }

  return {
    accountId: env.accountId!,
    accessKeyId: env.accessKeyId!,
    secretAccessKey: env.secretAccessKey!,
    bucket: env.bucket!
  };
}

export async function uploadKnowledgeDocumentToR2(args: {
  objectKey: string;
  body: Buffer;
  contentType?: string;
}) {
  const env = getOptionalKnowledgeR2Env();

  if (!env) {
    throw new Error("Cloudflare R2 knowledge storage is not configured.");
  }

  const client = createR2Client(env);

  await client.send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: args.objectKey,
      Body: args.body,
      ContentType: args.contentType
    })
  );

  return {
    bucket: env.bucket
  };
}

async function readBodyAsBuffer(body: unknown) {
  const streamBody = body as { transformToByteArray?: () => Promise<Uint8Array> } | null;
  if (!streamBody?.transformToByteArray) {
    throw new Error("R2 object body could not be read.");
  }

  return Buffer.from(await streamBody.transformToByteArray());
}

export async function downloadKnowledgeDocumentFromR2(args: {
  bucket?: string | null;
  objectKey: string;
  mimeType?: string | null;
}) {
  const env = getOptionalKnowledgeR2Env();

  if (!env) {
    throw new Error("Cloudflare R2 knowledge storage is not configured.");
  }

  const client = createR2Client(env);
  const bucket = normalizeOptionalString(args.bucket) ?? env.bucket;
  const result = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: args.objectKey
    })
  );

  const buffer = await readBodyAsBuffer(result.Body);
  const mimeType =
    normalizeOptionalString(result.ContentType) ??
    normalizeOptionalString(args.mimeType) ??
    "application/octet-stream";

  return {
    blob: new Blob([buffer], { type: mimeType }),
    size: buffer.byteLength,
    mimeType
  };
}

export async function deleteKnowledgeDocumentFromR2(args: {
  bucket?: string | null;
  objectKey: string;
}) {
  const env = getOptionalKnowledgeR2Env();

  if (!env) {
    throw new Error("Cloudflare R2 knowledge storage is not configured.");
  }

  const client = createR2Client(env);
  const bucket = normalizeOptionalString(args.bucket) ?? env.bucket;

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: args.objectKey
    })
  );
}
