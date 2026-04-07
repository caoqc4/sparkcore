import { NextResponse, type NextRequest } from "next/server";
import {
  buildInboundDedupeKey,
} from "@/lib/integrations/im-adapter";
import {
  isValidTelegramWebhookSecret,
  normalizeTelegramUpdate,
  type TelegramUpdate
} from "@/lib/integrations/telegram";
import { getTelegramBotConfig } from "@/lib/env";
import {
  claimImInboundReceipt,
  updateImInboundReceipt
} from "@/lib/integrations/im-inbound-receipts";
import { enqueueImInboundJob } from "@/lib/integrations/im-inbound-jobs";
import { runTelegramInboundWorker } from "@/lib/integrations/telegram-inbound-worker";
import {
  isCharacterChannelSlug,
  type CharacterChannelSlug
} from "@/lib/product/character-channels";
import { createAdminClient } from "@/lib/supabase/admin";

function nowMs() {
  return Date.now();
}

function elapsedMs(startedAt: number) {
  return Math.max(0, nowMs() - startedAt);
}

const INLINE_TELEGRAM_WORKER_IN_DEV = process.env.NODE_ENV !== "production";
const INLINE_TELEGRAM_WORKER_BATCH_SIZE = 4;
const INLINE_TELEGRAM_WORKER_MAX_PASSES = 4;

async function drainTelegramInboundWorker(args: {
  characterChannelSlug: CharacterChannelSlug;
  claimedBy: string;
}) {
  const records: Array<Record<string, unknown>> = [];

  for (let pass = 0; pass < INLINE_TELEGRAM_WORKER_MAX_PASSES; pass += 1) {
    const result = await runTelegramInboundWorker({
      characterChannelSlug: args.characterChannelSlug,
      claimedBy: args.claimedBy,
      limit: INLINE_TELEGRAM_WORKER_BATCH_SIZE
    });

    if (result.records.length > 0) {
      records.push(...result.records);
    }

    if (result.claimed_count < INLINE_TELEGRAM_WORKER_BATCH_SIZE) {
      break;
    }
  }

  return {
    processed_count: records.length,
    records
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ character_channel_slug: string }> }
) {
  const webhookStartedAt = nowMs();
  const { character_channel_slug: rawCharacterChannelSlug } = await context.params;

  if (!isCharacterChannelSlug(rawCharacterChannelSlug)) {
    return NextResponse.json({ ok: false, message: "Invalid Telegram character channel." }, { status: 404 });
  }

  const characterChannelSlug = rawCharacterChannelSlug as CharacterChannelSlug;
  const { webhookSecret } = getTelegramBotConfig(characterChannelSlug);

  if (
    !isValidTelegramWebhookSecret({
      headerValue: request.headers.get("x-telegram-bot-api-secret-token"),
      configuredSecret: webhookSecret
    })
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let inbound: ReturnType<typeof normalizeTelegramUpdate> = null;
  let receiptId: string | null = null;
  let parseDurationMs: number | null = null;
  let receiptClaimDurationMs: number | null = null;
  let enqueueDurationMs: number | null = null;

  try {
    const parseStartedAt = nowMs();
    const update = (await request.json()) as TelegramUpdate;
    inbound = normalizeTelegramUpdate(update);
    parseDurationMs = elapsedMs(parseStartedAt);

    if (!inbound) {
      console.info("[telegram-webhook]", {
        character_channel_slug: characterChannelSlug,
        status: "ignored_non_text_update",
        total_duration_ms: elapsedMs(webhookStartedAt),
        parse_duration_ms: parseDurationMs
      });
      return NextResponse.json({
        ok: true,
        status: "ignored_non_text_update"
      });
    }

    inbound = {
      ...inbound,
      metadata: {
        ...(inbound.metadata ?? {}),
        character_channel_slug: characterChannelSlug
      }
    };

    const admin = createAdminClient();
    const dedupeKey = buildInboundDedupeKey(inbound);
    const receiptClaimStartedAt = nowMs();
    const claimedReceipt = await claimImInboundReceipt({
      supabase: admin,
      identity: {
        platform: inbound.platform,
        eventId: inbound.event_id,
        dedupeKey,
        channelId: inbound.channel_id,
        peerId: inbound.peer_id,
        platformUserId: inbound.platform_user_id
      },
      metadata: {
        webhook_received_at: new Date().toISOString(),
        character_channel_slug: characterChannelSlug
      }
    });
    receiptClaimDurationMs = elapsedMs(receiptClaimStartedAt);

    receiptId = claimedReceipt.receipt.id;

    if (claimedReceipt.status === "duplicate") {
      console.info("[telegram-webhook]", {
        character_channel_slug: characterChannelSlug,
        status: "skipped_duplicate_receipt",
        dedupe_key: dedupeKey,
        total_duration_ms: elapsedMs(webhookStartedAt),
        parse_duration_ms: parseDurationMs,
        receipt_claim_duration_ms: receiptClaimDurationMs
      });
      return NextResponse.json({
        ok: true,
        status: "skipped_duplicate_receipt",
        dedupe_key: dedupeKey
      });
    }

    const enqueueStartedAt = nowMs();
    const enqueuedJob = await enqueueImInboundJob({
      supabase: admin,
      receiptId,
      platform: inbound.platform,
      channelSlug: characterChannelSlug,
      jobType: "telegram_inbound_turn",
      payload: {
        inbound,
        dedupe_key: dedupeKey
      }
    });
    enqueueDurationMs = elapsedMs(enqueueStartedAt);

    await updateImInboundReceipt({
      supabase: admin,
      receiptId,
      status: "received",
      metadataPatch: {
        enqueue_status: enqueuedJob.status,
        enqueue_job_id: enqueuedJob.job.id,
        enqueued_at: new Date().toISOString(),
        character_channel_slug: characterChannelSlug
      }
    });
    const claimedBy = `telegram-webhook:${characterChannelSlug}`;

    if (INLINE_TELEGRAM_WORKER_IN_DEV) {
      try {
        const drainResult = await drainTelegramInboundWorker({
          characterChannelSlug,
          claimedBy
        });

        console.info("[telegram-webhook:inline-worker]", {
          character_channel_slug: characterChannelSlug,
          receipt_id: receiptId,
          job_id: enqueuedJob.job.id,
          processed_count: drainResult.processed_count
        });
      } catch (workerError) {
        console.error("[telegram-webhook:inline-worker]", {
          character_channel_slug: characterChannelSlug,
          receipt_id: receiptId,
          job_id: enqueuedJob.job.id,
          error_message:
            workerError instanceof Error ? workerError.message : String(workerError)
        });
      }
    }

    console.info("[telegram-webhook]", {
      character_channel_slug: characterChannelSlug,
      status: "accepted",
      dedupe_key: dedupeKey,
      enqueue_status: enqueuedJob.status,
      enqueue_job_id: enqueuedJob.job.id,
      total_duration_ms: elapsedMs(webhookStartedAt),
      parse_duration_ms: parseDurationMs,
      receipt_claim_duration_ms: receiptClaimDurationMs,
      enqueue_duration_ms: enqueueDurationMs
    });

    return NextResponse.json({
      ok: true,
      status: "accepted",
      dedupe_key: dedupeKey,
      receipt_id: receiptId,
      job_id: enqueuedJob.job.id,
      character_channel_slug: characterChannelSlug
    });
  } catch (error) {
    if (receiptId) {
      const admin = createAdminClient();
      await updateImInboundReceipt({
        supabase: admin,
        receiptId,
        status: "processing_failed",
        lastError:
          error instanceof Error
            ? error.message
            : "Telegram webhook handling failed.",
        metadataPatch: {
          webhook_failed_at: new Date().toISOString(),
          webhook_timing_ms: {
            total: elapsedMs(webhookStartedAt),
            parse: parseDurationMs,
            receipt_claim: receiptClaimDurationMs,
            enqueue: enqueueDurationMs
          },
          character_channel_slug: characterChannelSlug
        }
      }).catch(() => null);
    }

    console.error("[telegram-webhook]", {
      character_channel_slug: characterChannelSlug,
      status: "processing_failed",
      total_duration_ms: elapsedMs(webhookStartedAt),
      parse_duration_ms: parseDurationMs,
      receipt_claim_duration_ms: receiptClaimDurationMs,
      enqueue_duration_ms: enqueueDurationMs,
      error_message:
        error instanceof Error ? error.message : "Telegram webhook handling failed."
    });

    return NextResponse.json({
      ok: false,
      status: "processing_failed",
      message:
        error instanceof Error
          ? error.message
          : "Telegram webhook handling failed."
    });
  }
}
