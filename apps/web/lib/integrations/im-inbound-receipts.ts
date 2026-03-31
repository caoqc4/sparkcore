type ReceiptIdentity = {
  platform: string;
  eventId: string;
  dedupeKey: string;
  channelId: string;
  peerId: string;
  platformUserId: string;
};

type ReceiptRecord = {
  id: string;
  platform: string;
  event_id: string | null;
  dedupe_key: string;
  channel_id: string;
  peer_id: string;
  platform_user_id: string;
  status: string;
  attempt_count: number;
  metadata: Record<string, unknown> | null;
};

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export async function claimImInboundReceipt(args: {
  supabase: any;
  identity: ReceiptIdentity;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    platform: args.identity.platform,
    event_id: args.identity.eventId.trim().length > 0 ? args.identity.eventId : null,
    dedupe_key: args.identity.dedupeKey,
    channel_id: args.identity.channelId,
    peer_id: args.identity.peerId,
    platform_user_id: args.identity.platformUserId,
    status: "processing",
    metadata: args.metadata ?? {},
    attempt_count: 1,
    first_received_at: new Date().toISOString(),
    last_received_at: new Date().toISOString()
  };

  const { data, error } = await args.supabase
    .from("im_inbound_receipts")
    .insert(payload)
    .select(
      "id, platform, event_id, dedupe_key, channel_id, peer_id, platform_user_id, status, attempt_count, metadata"
    )
    .single();

  if (!error && data) {
    return {
      status: "claimed" as const,
      receipt: data as ReceiptRecord
    };
  }

  const isDuplicate = error && error.code === "23505";
  if (!isDuplicate) {
    throw new Error(
      error?.message ?? "Failed to claim IM inbound receipt."
    );
  }

  const { data: existing, error: existingError } = await args.supabase
    .from("im_inbound_receipts")
    .select(
      "id, platform, event_id, dedupe_key, channel_id, peer_id, platform_user_id, status, attempt_count, metadata"
    )
    .eq("platform", args.identity.platform)
    .eq("dedupe_key", args.identity.dedupeKey)
    .maybeSingle();

  if (existingError || !existing) {
    throw new Error(
      existingError?.message ?? "Failed to load duplicate IM inbound receipt."
    );
  }

  const currentMetadata = asRecord(existing.metadata) ?? {};
  await args.supabase
    .from("im_inbound_receipts")
    .update({
      attempt_count: (existing.attempt_count ?? 1) + 1,
      last_received_at: new Date().toISOString(),
      status: "duplicate",
      metadata: {
        ...currentMetadata,
        duplicate_seen_at: new Date().toISOString()
      }
    })
    .eq("id", existing.id);

  return {
    status: "duplicate" as const,
    receipt: existing as ReceiptRecord
  };
}

export async function updateImInboundReceipt(args: {
  supabase: any;
  receiptId: string;
  status: string;
  metadataPatch?: Record<string, unknown>;
  lastError?: string | null;
  processed?: boolean;
}) {
  const { data: current } = await args.supabase
    .from("im_inbound_receipts")
    .select("metadata")
    .eq("id", args.receiptId)
    .maybeSingle();

  const currentMetadata = asRecord(current?.metadata) ?? {};

  await args.supabase
    .from("im_inbound_receipts")
    .update({
      status: args.status,
      last_error: args.lastError ?? null,
      processed_at: args.processed ? new Date().toISOString() : null,
      last_received_at: new Date().toISOString(),
      metadata: {
        ...currentMetadata,
        ...(args.metadataPatch ?? {})
      }
    })
    .eq("id", args.receiptId);
}
