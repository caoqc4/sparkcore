import type { RuntimeTurnInput } from "@/lib/chat/runtime-input";
import {
  insertMessage,
  updateScopedMessage
} from "@/lib/chat/message-persistence";

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function buildTelegramArtifactUrl(args: {
  threadId: string;
  messageId: string;
  artifactId: string;
}) {
  const params = new URLSearchParams({
    threadId: args.threadId,
    messageId: args.messageId,
    artifactId: args.artifactId
  });

  return `/api/integrations/telegram/file?${params.toString()}`;
}

function buildInboundArtifacts(args: {
  threadId: string;
  messageId: string;
  runtimeTurnInput: RuntimeTurnInput;
}) {
  const adapterMetadata = asRecord(args.runtimeTurnInput.message.metadata);
  const attachments = Array.isArray(adapterMetadata?.attachments)
    ? adapterMetadata.attachments
    : [];
  const fallbackAlt =
    getString(adapterMetadata?.display_content) ??
    getString(args.runtimeTurnInput.message.content) ??
    "Telegram attachment";

  const artifacts = attachments
    .map((attachment, index) => {
      const record = asRecord(attachment);
      if (!record) {
        return null;
      }

      const metadata = asRecord(record.metadata) ?? {};
      const artifactId =
        getString(metadata.artifact_id) ?? `telegram-artifact-${index + 1}`;
      const kind = getString(record.kind);
      const mimeType = getString(record.mime_type);
      const directUrl = getString(record.url);
      const proxyUrl = buildTelegramArtifactUrl({
        threadId: args.threadId,
        messageId: args.messageId,
        artifactId
      });
      const resolvedUrl = directUrl ?? proxyUrl;

      if (kind === "image") {
        return {
          id: artifactId,
          type: "image",
          status: "ready",
          modelSlug: "telegram-image",
          url: resolvedUrl,
          alt: fallbackAlt,
          telegram: metadata,
          mimeType
        };
      }

      if (kind === "audio") {
        return {
          id: artifactId,
          type: "audio",
          status: "ready",
          modelSlug:
            getString(metadata.telegram_kind) === "audio"
              ? "telegram-audio"
              : "telegram-voice",
          provider: "Telegram",
          voiceName:
            getString(metadata.display_label) ??
            (getString(metadata.telegram_kind) === "audio"
              ? "Audio file"
              : "Voice note"),
          url: resolvedUrl,
          transcript: getString(metadata.transcript),
          telegram: metadata,
          mimeType
        };
      }

      return null;
    })
    .filter(Boolean);

  return artifacts as Array<Record<string, unknown>>;
}

function buildRuntimeUserMessageMetadata(args: {
  threadId: string;
  messageId: string;
  runtimeTurnInput: RuntimeTurnInput;
}) {
  const artifacts = buildInboundArtifacts(args);

  return {
    source: args.runtimeTurnInput.message.source,
    runtime_source_timestamp: args.runtimeTurnInput.message.timestamp,
    adapter_metadata: args.runtimeTurnInput.message.metadata,
    runtime_turn_input: args.runtimeTurnInput,
    ...(artifacts.length > 0 ? { artifacts } : {})
  };
}

type UserMessageTarget = {
  supabase: any;
  threadId: string;
  workspaceId: string;
  userId: string;
};

export async function insertUserMessage(
  args: UserMessageTarget & {
    content: string;
    metadata?: Record<string, unknown>;
  }
) {
  return insertMessage({
    supabase: args.supabase,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    payload: {
      role: "user",
      content: args.content,
      ...(args.metadata ? { metadata: args.metadata } : {})
    },
    select: "id"
  }).single();
}

export async function persistRuntimeUserMessageMetadata(
  args: UserMessageTarget & {
    messageId: string;
    runtimeTurnInput: RuntimeTurnInput;
  }
) {
  return updateScopedMessage({
    supabase: args.supabase,
    messageId: args.messageId,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    patch: {
      metadata: buildRuntimeUserMessageMetadata({
        threadId: args.threadId,
        messageId: args.messageId,
        runtimeTurnInput: args.runtimeTurnInput
      }),
      updated_at: new Date().toISOString()
    }
  });
}

export async function insertRuntimeUserMessage(
  args: UserMessageTarget & {
    content: string;
    runtimeTurnInput: RuntimeTurnInput;
  }
) {
  const insertResult = await insertUserMessage({
    ...args,
    content: args.content
  });

  if (insertResult.error || !insertResult.data) {
    return insertResult;
  }

  await persistRuntimeUserMessageMetadata({
    supabase: args.supabase,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    messageId: insertResult.data.id,
    runtimeTurnInput: args.runtimeTurnInput
  });

  return insertResult;
}

export async function insertAndPersistRuntimeUserMessage(
  args: UserMessageTarget & {
    content: string;
    buildRuntimeTurnInput: (messageId: string) => RuntimeTurnInput;
  }
) {
  const insertResult = await insertUserMessage({
    supabase: args.supabase,
    threadId: args.threadId,
    workspaceId: args.workspaceId,
    userId: args.userId,
    content: args.content
  });

  const insertedMessage = insertResult.data;

  if (insertResult.error || !insertedMessage) {
    return {
      ...insertResult,
      runtimeTurnInput: null
    };
  }

  const runtimeTurnInput = args.buildRuntimeTurnInput(insertedMessage.id);

  let metadataError: unknown = null;

  try {
    await persistRuntimeUserMessageMetadata({
      supabase: args.supabase,
      threadId: args.threadId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      messageId: insertedMessage.id,
      runtimeTurnInput
    });
  } catch (error) {
    metadataError = error;
  }

  return {
    ...insertResult,
    runtimeTurnInput,
    metadataError
  };
}
