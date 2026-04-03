import {
  type AdapterRuntimeOutput,
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
}) {
  const startedAt = nowMs();
  const admin = createAdminClient();
  const payload = getJobPayload(args.job);
  const characterChannelSlug = args.job.channel_slug as CharacterChannelSlug;
  const { botToken } = getTelegramBotConfig(characterChannelSlug);
  let stage = "mark_processing";
  const stageTimings: Record<string, number> = {};

  async function measureStage<T>(name: string, fn: () => Promise<T>) {
    const stageStartedAt = nowMs();
    try {
      return await fn();
    } finally {
      stageTimings[name] = elapsedMs(stageStartedAt);
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
        botToken,
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
              botToken,
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
          botToken,
          channelId: inbound.channel_id,
          content: "There was a temporary delivery issue just now. Please send your message again.",
        })
      );
    }

    const deferredArtifactGeneration =
      result.status === "processed"
        ? result.runtime_output.deferred_artifact_generation
        : null;
    const deferredPostProcessing =
      result.status === "processed"
        ? result.runtime_output.deferred_post_processing
        : null;

    if (deferredPostProcessing) {
      stage = "update_preview_metadata";
      await measureStage("update_preview_metadata", async () =>
        updateAssistantPreviewMetadata({
          supabase: admin,
          assistantMessageId: deferredPostProcessing.assistant_message_id,
          threadId: deferredPostProcessing.thread_id,
          workspaceId: deferredPostProcessing.workspace_id,
          userId: deferredPostProcessing.user_id,
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

    if (deferredArtifactGeneration) {
      const artifactTask = deferredArtifactGeneration!;
      void (async () => {
        try {
          const artifacts = await runDeferredImArtifactGeneration({
            assistantMessageId: artifactTask.assistant_message_id,
            threadId: artifactTask.thread_id,
            workspaceId: artifactTask.workspace_id,
            userId: artifactTask.user_id,
            agentId: artifactTask.agent_id,
            userMessage: artifactTask.user_message,
            assistantReply: artifactTask.assistant_reply,
            agentName: artifactTask.agent_name,
            personaSummary: artifactTask.persona_summary,
            preGeneratedImageArtifact:
              artifactTask.pre_generated_image_artifact ?? null,
            audioTranscriptOverride:
              artifactTask.audio_transcript_override ?? null,
            explicitImageRequested:
              artifactTask.explicit_image_requested ?? false,
            explicitAudioRequested:
              artifactTask.explicit_audio_requested ?? false,
            deliveryGate: artifactTask.delivery_gate
              ? {
                  clarifyBeforeAction:
                    artifactTask.delivery_gate.clarify_before_action === true,
                  reason: artifactTask.delivery_gate.reason ?? null,
                  conflictHint:
                    artifactTask.delivery_gate.conflict_hint ?? null,
                }
              : null,
            imageArtifactAction:
              artifactTask.image_artifact_action ?? null,
            audioArtifactAction:
              artifactTask.audio_artifact_action ?? null,
          });

          const artifactOutboundMessages = buildArtifactOutboundMessages({
            channelId: inbound.channel_id,
            peerId: inbound.peer_id,
            artifacts
          });

          if (artifactOutboundMessages.length > 0) {
            await sendTelegramOutboundMessages({
              botToken,
              messages: artifactOutboundMessages
            });
          }
        } catch (artifactGenerationError) {
          console.error("Deferred IM artifact generation failed:", artifactGenerationError);
        }
      })();
    }

    if (deferredPostProcessing && result.status === "processed" && "runtime_output" in result) {
      const postProcessingTask = deferredPostProcessing!;
      const runtimeOutput = (result as {
        runtime_output: {
          memory_write_requests: AdapterRuntimeOutput["memory_write_requests"];
          follow_up_requests: AdapterRuntimeOutput["follow_up_requests"];
        };
      }).runtime_output;
      const runtimeTurnResult = {
        memory_write_requests: runtimeOutput.memory_write_requests,
        follow_up_requests: runtimeOutput.follow_up_requests
      };
      void (async () => {
        try {
          await runDeferredImPostProcessing({
            assistantMessageId: postProcessingTask.assistant_message_id,
            threadId: postProcessingTask.thread_id,
            workspaceId: postProcessingTask.workspace_id,
            userId: postProcessingTask.user_id,
            agentId: postProcessingTask.agent_id,
            sourceMessageId: postProcessingTask.source_message_id,
            runtimeTurnResult
          });
        } catch (postProcessingError) {
          console.error("Deferred IM post-processing failed:", postProcessingError);
        }
      })();
    }
  } catch (error) {
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
      status: "processing_failed",
      lastError: error instanceof Error ? error.message : "Telegram inbound worker failed.",
      metadataPatch: {
        worker_failed_at: new Date().toISOString(),
        character_channel_slug: characterChannelSlug,
        job_id: args.job.id,
        worker_failed_stage: stage
      }
    }).catch(() => null);

    await markImInboundJobFailed({
      supabase: admin,
      jobId: args.job.id,
      errorMessage:
        error instanceof Error ? error.message : "Telegram inbound worker failed.",
      resultPatch: {
        worker_failed_at: new Date().toISOString()
      }
    }).catch(() => null);

    console.error("[telegram-inbound-worker]", {
      channel_slug: characterChannelSlug,
      job_id: args.job.id,
      receipt_id: args.job.receipt_id,
      status: "failed",
      stage,
      total_duration_ms: elapsedMs(startedAt),
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
      claimedBy: args.claimedBy
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
