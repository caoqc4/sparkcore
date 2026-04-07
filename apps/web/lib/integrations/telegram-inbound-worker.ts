import {
  type OutboundChannelMessage,
  SupabaseBindingRepository,
  createSupabaseBindingLookup,
  handleInboundChannelMessage,
  type InboundChannelMessage,
} from "@/lib/integrations/im-adapter";
import {
  runDeferredImArtifactGeneration,
  runDeferredImPostProcessing,
  webImRuntimePort,
} from "@/lib/chat/im-runtime-port";
import { classifyAssistantError } from "@/lib/chat/assistant-error";
import { updateAssistantPreviewMetadata } from "@/lib/chat/assistant-preview-metadata";
import {
  claimQueuedImInboundJobs,
  markImInboundJobCompleted,
  markImInboundJobFailed,
  markImInboundJobProcessing,
  type ImInboundJobRecord,
} from "@/lib/integrations/im-inbound-jobs";
import {
  enrichTelegramInboundMessage,
  isTelegramInvalidDeliveryResponse,
  sendTelegramOutboundMessages,
} from "@/lib/integrations/telegram";
import { getDeferredPostProcessingTask } from "@/lib/integrations/im-deferred-processing";
import { getTelegramBotConfig } from "@/lib/env";
import { updateImInboundReceipt } from "@/lib/integrations/im-inbound-receipts";
import { updateOwnedChannelBindingStatus } from "@/lib/product/channels";
import { type CharacterChannelSlug } from "@/lib/product/character-channels";
import { createAdminClient } from "@/lib/supabase/admin";

function nowMs() {
  return Date.now();
}

function elapsedMs(startedAt: number) {
  return Math.max(0, nowMs() - startedAt);
}

const DEFAULT_PROVIDER_RETRY_DELAY_MS = 60_000;

function parseRetryDelayMs(errorMessage: string) {
  const retryMatch = errorMessage.match(/retry in\s+([0-9]+(?:\.[0-9]+)?)s/i);
  if (!retryMatch) {
    return DEFAULT_PROVIDER_RETRY_DELAY_MS;
  }

  const seconds = Number.parseFloat(retryMatch[1] ?? "");
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return DEFAULT_PROVIDER_RETRY_DELAY_MS;
  }

  return Math.max(1_000, Math.ceil(seconds * 1000));
}

async function sendFallbackMessage(args: {
  botToken: string;
  channelId: string;
  content: string;
}) {
  await fetch(`https://api.telegram.org/bot${args.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: args.channelId, text: args.content }),
  }).catch(() => null);
}

function getTelegramDeliveryDescription(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return typeof (body as Record<string, unknown>).description === "string"
    ? ((body as Record<string, unknown>).description as string)
    : null;
}

function shouldSendRetryFallback(delivery: Array<{
  ok: boolean;
  status: number;
  body: unknown;
}>) {
  if (delivery.length === 0) {
    return false;
  }

  // If at least one message got through, avoid sending a generic retry prompt that
  // makes a partially successful multi-message reply feel more broken than it is.
  if (delivery.some((item) => item.ok)) {
    return false;
  }

  return delivery.some((item) => {
    if (item.ok) {
      return false;
    }

    if (isTelegramInvalidDeliveryResponse(item)) {
      return false;
    }

    if (item.status === 429 || item.status >= 500) {
      return true;
    }

    const description = getTelegramDeliveryDescription(item.body)?.toLowerCase() ?? "";

    return (
      description.includes("timeout") ||
      description.includes("temporarily unavailable") ||
      description.includes("internal server error") ||
      description.includes("bad gateway") ||
      description.includes("too many requests")
    );
  });
}

function buildArtifactOutboundMessages(args: {
  channelId: string;
  peerId: string;
  artifacts: Array<Record<string, unknown>>;
}): OutboundChannelMessage[] {
  const messages: OutboundChannelMessage[] = [];

  for (const artifact of args.artifacts) {
    if (artifact.status !== "ready") {
      continue;
    }

    if (artifact.type === "image" && typeof artifact.url === "string" && artifact.url.length > 0) {
      messages.push({
        platform: "telegram",
        channel_id: args.channelId,
        peer_id: args.peerId,
        message_type: "image",
        content: "",
        attachments: [
          {
            kind: "image",
            url: artifact.url,
            metadata: {
              alt: typeof artifact.alt === "string" ? artifact.alt : null,
              artifact_type: "assistant_image"
            }
          }
        ],
        send_mode: "reply",
        metadata: {
          delivery_hint: "assistant_artifact"
        }
      });
    }

    if (artifact.type === "audio" && typeof artifact.url === "string" && artifact.url.length > 0) {
      messages.push({
        platform: "telegram",
        channel_id: args.channelId,
        peer_id: args.peerId,
        message_type: "attachment",
        content: "",
        attachments: [
          {
            kind: "audio",
            url: artifact.url,
            metadata: {
              content_type:
                typeof artifact.contentType === "string" ? artifact.contentType : null,
              transcript:
                typeof artifact.transcript === "string" ? artifact.transcript : null,
              artifact_type: "assistant_audio"
            }
          }
        ],
        send_mode: "reply",
        metadata: {
          delivery_hint: "assistant_artifact"
        }
      });
    }
  }

  return messages;
}

type TelegramInboundJobPayload = {
  inbound: InboundChannelMessage;
  dedupe_key: string;
};

function getJobPayload(job: ImInboundJobRecord): TelegramInboundJobPayload {
  const payload = job.payload ?? {};
  const inbound = payload.inbound;
  const dedupeKey = payload.dedupe_key;

  if (!inbound || typeof inbound !== "object" || Array.isArray(inbound)) {
    throw new Error("Telegram inbound job payload is missing inbound message.");
  }

  if (typeof dedupeKey !== "string" || dedupeKey.length === 0) {
    throw new Error("Telegram inbound job payload is missing dedupe key.");
  }

  return {
    inbound: inbound as InboundChannelMessage,
    dedupe_key: dedupeKey
  };
}

async function processTelegramInboundJob(args: {
  job: ImInboundJobRecord;
  claimedBy: string;
  botToken: string;
}) {
  const startedAt = nowMs();
  const admin = createAdminClient();
  const payload = getJobPayload(args.job);
  const characterChannelSlug = args.job.channel_slug as CharacterChannelSlug;
  let stage = "mark_processing";
  const stageTimings: Record<string, number> = {};

  async function measureStage<T>(name: string, fn: () => Promise<T>) {
    const stageStartedAt = nowMs();
    console.info("[telegram-inbound-worker:stage:start]", {
      channel_slug: characterChannelSlug,
      job_id: args.job.id,
      receipt_id: args.job.receipt_id,
      stage: name
    });
    try {
      return await fn();
    } finally {
      const durationMs = elapsedMs(stageStartedAt);
      stageTimings[name] = durationMs;
      console.info("[telegram-inbound-worker:stage:end]", {
        channel_slug: characterChannelSlug,
        job_id: args.job.id,
        receipt_id: args.job.receipt_id,
        stage: name,
        duration_ms: durationMs
      });
    }
  }

  await measureStage("mark_processing", async () =>
    markImInboundJobProcessing({
      supabase: admin,
      jobId: args.job.id,
      resultPatch: {
        processing_started_at: new Date().toISOString(),
        worker_claimed_by: args.claimedBy
      }
    })
  );

  try {
    stage = "enrich_inbound";
    const inbound = await measureStage("enrich_inbound", async () =>
      enrichTelegramInboundMessage({
        botToken: args.botToken,
        inbound: payload.inbound
      })
    );

    stage = "create_binding_lookup";
    const bindingLookup = await measureStage("create_binding_lookup", async () =>
      createSupabaseBindingLookup(admin)
    );
    stage = "handle_inbound";
    const result = await measureStage("handle_inbound", async () =>
      handleInboundChannelMessage({
        inbound,
        bindingLookup,
        runtimePort: webImRuntimePort
      })
    );
    const adapterDurationMs = stageTimings.handle_inbound ?? 0;

    await measureStage("update_receipt_processing", async () =>
      updateImInboundReceipt({
        supabase: admin,
        receiptId: args.job.receipt_id,
        status: result.status === "binding_not_found" ? "binding_not_found" : "processing",
        metadataPatch: {
          adapter_result_status: result.status,
          adapter_result_at: new Date().toISOString(),
          character_channel_slug: characterChannelSlug,
          job_id: args.job.id
        }
      })
    );

    const telegramSendStartedAt = new Date().toISOString();
    const immediateArtifactMessages =
      result.status === "processed" && Array.isArray(result.runtime_output.immediate_artifacts)
        ? buildArtifactOutboundMessages({
            channelId: inbound.channel_id,
            peerId: inbound.peer_id,
            artifacts: result.runtime_output.immediate_artifacts,
          })
        : [];
    const explicitMediaDeliveryMode =
      result.status === "processed" &&
      typeof result.runtime_output.debug_metadata?.explicit_media_delivery_mode === "string"
        ? result.runtime_output.debug_metadata.explicit_media_delivery_mode
        : null;
    const suppressExplicitAudioTextReply =
      result.status === "processed" &&
      result.runtime_output.debug_metadata?.suppress_explicit_audio_text_reply === true;
    const runtimeOutboundMessages =
      "outbound_messages" in result
        ? result.outbound_messages.filter((message) => {
            const deliveryHint =
              message.metadata &&
              typeof message.metadata === "object" &&
              !Array.isArray(message.metadata) &&
              typeof message.metadata.delivery_hint === "string"
                ? message.metadata.delivery_hint
                : null;

            if (deliveryHint === "assistant_artifact") {
              return false;
            }

            if (
              suppressExplicitAudioTextReply &&
              message.send_mode === "reply" &&
              message.message_type === "text"
            ) {
              return false;
            }

            return true;
          })
        : [];
    const orderedOutboundMessages =
      explicitMediaDeliveryMode === "artifact_first" && immediateArtifactMessages.length > 0
        ? [...immediateArtifactMessages, ...runtimeOutboundMessages]
        : [...runtimeOutboundMessages, ...immediateArtifactMessages];

    stage = "send_outbound";
    const outboundDelivery =
      "outbound_messages" in result
        ? await measureStage("send_outbound", async () =>
            sendTelegramOutboundMessages({
              botToken: args.botToken,
              messages: orderedOutboundMessages
            })
          )
        : [];
    const outboundDurationMs = stageTimings.send_outbound ?? 0;
    const outboundFailureDescriptions = outboundDelivery
      .filter((item) => !item.ok)
      .map((item) => getTelegramDeliveryDescription(item.body) ?? `status_${item.status}`);
    const shouldFallbackForRetry = shouldSendRetryFallback(outboundDelivery);

    if (shouldFallbackForRetry) {
      stage = "send_retry_fallback";
      await measureStage("send_retry_fallback", async () =>
        sendFallbackMessage({
          botToken: args.botToken,
          channelId: inbound.channel_id,
          content: "There was a temporary delivery issue just now. Please send your message again.",
        })
      );
    }

    const deferredArtifactGeneration =
      result.status === "processed"
        ? result.runtime_output.deferred_artifact_generation
        : null;
    const deferredPostProcessing = getDeferredPostProcessingTask(result);

    if (deferredPostProcessing) {
      stage = "update_preview_metadata";
      await measureStage("update_preview_metadata", async () =>
        updateAssistantPreviewMetadata({
          supabase: admin,
          assistantMessageId: deferredPostProcessing.task.assistant_message_id,
          threadId: deferredPostProcessing.task.thread_id,
          workspaceId: deferredPostProcessing.task.workspace_id,
          userId: deferredPostProcessing.task.user_id,
          updates: (currentMetadata) => ({
            im_delivery: {
              ...(currentMetadata?.im_delivery &&
              typeof currentMetadata.im_delivery === "object" &&
              !Array.isArray(currentMetadata.im_delivery)
                ? (currentMetadata.im_delivery as Record<string, unknown>)
                : {}),
              receipt_id: args.job.receipt_id,
              telegram_send_started_at: telegramSendStartedAt,
              telegram_sent_at: new Date().toISOString(),
              telegram_delivery_ok: outboundDelivery.every((item) => item.ok),
              character_channel_slug: characterChannelSlug
            }
          })
        })
      );
    }

    if (deferredArtifactGeneration) {
      stage = "run_deferred_artifacts";
      await measureStage("run_deferred_artifacts", async () => {
        const artifacts = await runDeferredImArtifactGeneration({
          assistantMessageId: deferredArtifactGeneration.assistant_message_id,
          threadId: deferredArtifactGeneration.thread_id,
          workspaceId: deferredArtifactGeneration.workspace_id,
          userId: deferredArtifactGeneration.user_id,
          agentId: deferredArtifactGeneration.agent_id,
          userMessage: deferredArtifactGeneration.user_message,
          assistantReply: deferredArtifactGeneration.assistant_reply,
          agentName: deferredArtifactGeneration.agent_name,
          personaSummary: deferredArtifactGeneration.persona_summary,
          preGeneratedImageArtifact:
            deferredArtifactGeneration.pre_generated_image_artifact ?? null,
          audioTranscriptOverride:
            deferredArtifactGeneration.audio_transcript_override ?? null,
          explicitImageRequested:
            deferredArtifactGeneration.explicit_image_requested ?? false,
          explicitAudioRequested:
            deferredArtifactGeneration.explicit_audio_requested ?? false,
          deliveryGate: deferredArtifactGeneration.delivery_gate
            ? {
                clarifyBeforeAction:
                  deferredArtifactGeneration.delivery_gate.clarify_before_action === true,
                reason: deferredArtifactGeneration.delivery_gate.reason ?? null,
                conflictHint:
                  deferredArtifactGeneration.delivery_gate.conflict_hint ?? null,
              }
            : null,
          imageArtifactAction:
            deferredArtifactGeneration.image_artifact_action ?? null,
          audioArtifactAction:
            deferredArtifactGeneration.audio_artifact_action ?? null,
        });

        const artifactOutboundMessages = buildArtifactOutboundMessages({
          channelId: inbound.channel_id,
          peerId: inbound.peer_id,
          artifacts,
        });

        if (artifactOutboundMessages.length > 0) {
          await sendTelegramOutboundMessages({
            botToken: args.botToken,
            messages: artifactOutboundMessages,
          });
        }
      });
    }

    if (deferredPostProcessing) {
      stage = "run_deferred_post_processing";
      await measureStage("run_deferred_post_processing", async () =>
        runDeferredImPostProcessing({
          assistantMessageId: deferredPostProcessing.task.assistant_message_id,
          threadId: deferredPostProcessing.task.thread_id,
          workspaceId: deferredPostProcessing.task.workspace_id,
          userId: deferredPostProcessing.task.user_id,
          agentId: deferredPostProcessing.task.agent_id,
          sourceMessageId: deferredPostProcessing.task.source_message_id,
          runtimeTurnResult: deferredPostProcessing.runtimeTurnResult,
        })
      );
    }

    if (outboundDelivery.some(isTelegramInvalidDeliveryResponse)) {
      stage = "invalidate_binding_lookup";
      const binding = await measureStage("invalidate_binding_lookup", async () => {
        const repository = new SupabaseBindingRepository(admin);
        return repository.findActiveBinding({
          platform: inbound.platform,
          channel_id: inbound.channel_id,
          peer_id: inbound.peer_id,
          platform_user_id: inbound.platform_user_id,
          character_channel_slug: characterChannelSlug
        });
      });

      if (binding?.id) {
        const bindingId = binding.id;
        const invalidResponse = outboundDelivery.find(isTelegramInvalidDeliveryResponse) ?? null;
        const invalidBody =
          invalidResponse?.body &&
          typeof invalidResponse.body === "object" &&
          !Array.isArray(invalidResponse.body)
            ? (invalidResponse.body as Record<string, unknown>)
            : null;

        await measureStage("invalidate_binding_write", async () =>
          updateOwnedChannelBindingStatus({
            supabase: admin,
            bindingId,
            userId: binding.user_id,
            status: "invalid",
            metadataPatch: {
              invalidated_at: new Date().toISOString(),
              invalidated_by: "telegram-inbound-worker-outbound-delivery",
              invalid_reason:
                typeof invalidBody?.description === "string"
                  ? invalidBody.description
                  : "telegram_delivery_invalid",
              invalid_platform: inbound.platform
            }
          })
        );
      }
    }

    stage = "update_receipt_processed";
    await measureStage("update_receipt_processed", async () =>
      updateImInboundReceipt({
        supabase: admin,
        receiptId: args.job.receipt_id,
        status: result.status === "processed" ? "processed" : result.status,
        processed: true,
        metadataPatch: {
          outbound_count:
            "outbound_messages" in result ? result.outbound_messages.length : 0,
          outbound_delivery_ok: outboundDelivery.every((item) => item.ok),
          outbound_delivery_failures:
            outboundFailureDescriptions.length > 0 ? outboundFailureDescriptions : null,
          retry_fallback_sent: shouldFallbackForRetry,
          worker_completed_at: new Date().toISOString(),
          worker_timing_ms: {
            total: elapsedMs(startedAt),
            adapter: adapterDurationMs,
            outbound: outboundDurationMs,
            ...stageTimings
          },
          character_channel_slug: characterChannelSlug,
          job_id: args.job.id
        }
      })
    );

    stage = "mark_job_completed";
    await measureStage("mark_job_completed", async () =>
      markImInboundJobCompleted({
        supabase: admin,
        jobId: args.job.id,
        resultPatch: {
          dedupe_key: payload.dedupe_key,
          inbound_status: result.status,
          outbound_count:
            "outbound_messages" in result ? result.outbound_messages.length : 0,
          outbound_delivery_ok: outboundDelivery.every((item) => item.ok),
          worker_completed_at: new Date().toISOString(),
          worker_timing_ms: {
            total: elapsedMs(startedAt),
            adapter: adapterDurationMs,
            outbound: outboundDurationMs,
            ...stageTimings
          }
        }
      })
    );

    return {
      status: result.status,
      dedupe_key: payload.dedupe_key,
      outbound_count: "outbound_messages" in result ? result.outbound_messages.length : 0,
      outbound_delivery_ok: outboundDelivery.every((item) => item.ok),
      worker_timing_ms: {
        total: elapsedMs(startedAt),
        adapter: adapterDurationMs,
        outbound: outboundDurationMs,
        ...stageTimings
      }
    };
  } catch (error) {
    const assistantFailure = classifyAssistantError(error);
    const shouldRetryLater = assistantFailure.providerFailureCategory === "quota_or_plan";
    const retryDelayMs =
      shouldRetryLater && error instanceof Error
        ? parseRetryDelayMs(error.message)
        : null;
    const nextAvailableAt =
      retryDelayMs !== null ? new Date(nowMs() + retryDelayMs).toISOString() : null;
    const cause =
      error instanceof Error &&
      "cause" in error &&
      error.cause &&
      typeof error.cause === "object" &&
      !Array.isArray(error.cause)
        ? (error.cause as Record<string, unknown>)
        : null;
    await updateImInboundReceipt({
      supabase: admin,
      receiptId: args.job.receipt_id,
      status: shouldRetryLater ? "received" : "processing_failed",
      lastError: error instanceof Error ? error.message : "Telegram inbound worker failed.",
      metadataPatch: {
        worker_failed_at: new Date().toISOString(),
        character_channel_slug: characterChannelSlug,
        job_id: args.job.id,
        worker_failed_stage: stage,
        worker_retry_scheduled_at: nextAvailableAt,
        worker_retry_delay_ms: retryDelayMs
      }
    }).catch(() => null);

    await markImInboundJobFailed({
      supabase: admin,
      jobId: args.job.id,
      errorMessage:
        error instanceof Error ? error.message : "Telegram inbound worker failed.",
      nextAvailableAt,
      resultPatch: {
        worker_failed_at: new Date().toISOString(),
        worker_retry_scheduled_at: nextAvailableAt,
        worker_retry_delay_ms: retryDelayMs
      }
    }).catch(() => null);

    console.error("[telegram-inbound-worker]", {
      channel_slug: characterChannelSlug,
      job_id: args.job.id,
      receipt_id: args.job.receipt_id,
      status: "failed",
      stage,
      total_duration_ms: elapsedMs(startedAt),
      retry_scheduled_at: nextAvailableAt,
      retry_delay_ms: retryDelayMs,
      assistant_error_type: assistantFailure.errorType,
      provider_failure_category: assistantFailure.providerFailureCategory,
      worker_timing_ms: {
        ...stageTimings
      },
      error_message: error instanceof Error ? error.message : String(error),
      error_name: error instanceof Error ? error.name : null,
      error_cause_code: typeof cause?.code === "string" ? cause.code : null,
      error_cause_host: typeof cause?.host === "string" ? cause.host : null,
      error_cause_port:
        typeof cause?.port === "number" || typeof cause?.port === "string"
          ? cause.port
          : null,
      error_cause_message:
        typeof cause?.message === "string" ? cause.message : null
    });

    return {
      status: "failed" as const,
      dedupe_key: payload.dedupe_key,
      worker_timing_ms: {
        ...stageTimings
      }
    };
  }
}

export async function runTelegramInboundWorker(args: {
  characterChannelSlug: CharacterChannelSlug;
  limit?: number;
  claimedBy: string;
}) {
  const startedAt = nowMs();
  const admin = createAdminClient();
  const { botToken } = getTelegramBotConfig(args.characterChannelSlug);
  const claimResult = await claimQueuedImInboundJobs({
    supabase: admin,
    jobType: "telegram_inbound_turn",
    limit: args.limit ?? 1,
    claimedBy: args.claimedBy,
    platform: "telegram",
    channelSlug: args.characterChannelSlug
  });

  const records: Array<Record<string, unknown>> = [];

  for (const job of claimResult.jobs) {
    const result = await processTelegramInboundJob({
      job,
      claimedBy: args.claimedBy,
      botToken
    });

    records.push({
      job_id: job.id,
      receipt_id: job.receipt_id,
      ...result
    });
  }

  console.info("[telegram-inbound-worker]", {
    channel_slug: args.characterChannelSlug,
    claimed_count: claimResult.claimed_count,
    processed_count: records.length,
    total_duration_ms: elapsedMs(startedAt),
    records
  });
  if (records.length > 0) {
    console.info(
      "[telegram-inbound-worker:records]",
      JSON.stringify(records, null, 2)
    );
  }

  return {
    claimed_count: claimResult.claimed_count,
    processed_count: records.length,
    records
  };
}
