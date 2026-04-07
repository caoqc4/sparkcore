import { after, NextResponse, type NextRequest } from "next/server";
import {
  type OutboundChannelMessage,
  SupabaseBindingRepository,
  buildInboundDedupeKey,
  createSupabaseBindingLookup,
  handleInboundChannelMessage
} from "@/lib/integrations/im-adapter";
import {
  runDeferredImArtifactGeneration,
  runDeferredImPostProcessing,
  webImRuntimePort
} from "@/lib/chat/im-runtime-port";
import { updateAssistantPreviewMetadata } from "@/lib/chat/assistant-preview-metadata";
import {
  enrichTelegramInboundMessage,
  isTelegramInvalidDeliveryResponse,
  isValidTelegramWebhookSecret,
  normalizeTelegramUpdate,
  sendTelegramOutboundMessages,
  type TelegramUpdate
} from "@/lib/integrations/telegram";
import { getTelegramBotEnv } from "@/lib/env";
import {
  claimImInboundReceipt,
  updateImInboundReceipt
} from "@/lib/integrations/im-inbound-receipts";
import { updateOwnedChannelBindingStatus } from "@/lib/product/channels";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function POST(request: NextRequest) {
  const { botToken, webhookSecret } = getTelegramBotEnv();

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

  try {
    const update = (await request.json()) as TelegramUpdate;
    inbound = normalizeTelegramUpdate(update);

    if (!inbound) {
      return NextResponse.json({
        ok: true,
        status: "ignored_non_text_update"
      });
    }

    const admin = createAdminClient();
    const dedupeKey = buildInboundDedupeKey(inbound);
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
        webhook_received_at: new Date().toISOString()
      }
    });

    receiptId = claimedReceipt.receipt.id;

    if (claimedReceipt.status === "duplicate") {
      return NextResponse.json({
        ok: true,
        status: "skipped_duplicate_receipt",
        dedupe_key: dedupeKey
      });
    }

    inbound = await enrichTelegramInboundMessage({
      botToken,
      inbound
    });

    const bindingLookup = await createSupabaseBindingLookup(admin);

    const result = await handleInboundChannelMessage({
      inbound,
      bindingLookup,
      runtimePort: webImRuntimePort
    });

    await updateImInboundReceipt({
      supabase: admin,
      receiptId,
      status: result.status === "binding_not_found" ? "binding_not_found" : "processing",
      metadataPatch: {
        adapter_result_status: result.status,
        adapter_result_at: new Date().toISOString()
      }
    });

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

    const outboundDelivery = "outbound_messages" in result
      ? await sendTelegramOutboundMessages({
          botToken,
          messages: orderedOutboundMessages
        })
      : [];

    if (
      result.status === "processed" &&
      result.runtime_output.deferred_artifact_generation
    ) {
      const deferredArtifactGeneration = result.runtime_output.deferred_artifact_generation;
      const resolvedInbound = inbound;
      after(async () => {
        try {
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
            preGeneratedImageArtifact: deferredArtifactGeneration.pre_generated_image_artifact ?? null,
            audioTranscriptOverride: deferredArtifactGeneration.audio_transcript_override ?? null,
            explicitImageRequested: deferredArtifactGeneration.explicit_image_requested ?? false,
            explicitAudioRequested: deferredArtifactGeneration.explicit_audio_requested ?? false,
            deliveryGate: deferredArtifactGeneration.delivery_gate
              ? {
                  clarifyBeforeAction:
                    deferredArtifactGeneration.delivery_gate.clarify_before_action === true,
                  reason: deferredArtifactGeneration.delivery_gate.reason ?? null,
                  conflictHint:
                    deferredArtifactGeneration.delivery_gate.conflict_hint ?? null,
                }
              : null,
            imageArtifactAction: deferredArtifactGeneration.image_artifact_action ?? null,
            audioArtifactAction: deferredArtifactGeneration.audio_artifact_action ?? null,
          });

          const artifactOutboundMessages = buildArtifactOutboundMessages({
            channelId: resolvedInbound.channel_id,
            peerId: resolvedInbound.peer_id,
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
      });
    }

    if (
      result.status === "processed" &&
      result.runtime_output.deferred_post_processing
    ) {
      const deferred = result.runtime_output.deferred_post_processing;
      await updateAssistantPreviewMetadata({
        supabase: admin,
        assistantMessageId: deferred.assistant_message_id,
        threadId: deferred.thread_id,
        workspaceId: deferred.workspace_id,
        userId: deferred.user_id,
        updates: (currentMetadata) => ({
          im_delivery: {
            ...(currentMetadata?.im_delivery &&
            typeof currentMetadata.im_delivery === "object" &&
            !Array.isArray(currentMetadata.im_delivery)
              ? (currentMetadata.im_delivery as Record<string, unknown>)
              : {}),
            receipt_id: receiptId,
            telegram_send_started_at: telegramSendStartedAt,
            telegram_sent_at: new Date().toISOString(),
            telegram_delivery_ok: outboundDelivery.every((item) => item.ok)
          }
        })
      });
    }

    if (outboundDelivery.some(isTelegramInvalidDeliveryResponse)) {
      const repository = new SupabaseBindingRepository(admin);
      const binding = await repository.findActiveBinding({
        platform: inbound.platform,
        channel_id: inbound.channel_id,
        peer_id: inbound.peer_id,
        platform_user_id: inbound.platform_user_id
      });

      if (binding?.id) {
        const invalidResponse = outboundDelivery.find(isTelegramInvalidDeliveryResponse) ?? null;
        const invalidBody =
          invalidResponse?.body &&
          typeof invalidResponse.body === "object" &&
          !Array.isArray(invalidResponse.body)
            ? (invalidResponse.body as Record<string, unknown>)
            : null;

        await updateOwnedChannelBindingStatus({
          supabase: admin,
          bindingId: binding.id,
          userId: binding.user_id,
          status: "invalid",
          metadataPatch: {
            invalidated_at: new Date().toISOString(),
            invalidated_by: "telegram-webhook-outbound-delivery",
            invalid_reason:
              typeof invalidBody?.description === "string"
                ? invalidBody.description
                : "telegram_delivery_invalid",
            invalid_platform: inbound.platform
          }
        });
      }
    }

    await updateImInboundReceipt({
      supabase: admin,
      receiptId,
      status: result.status === "processed" ? "processed" : result.status,
      processed: true,
      metadataPatch: {
        outbound_count:
          "outbound_messages" in result
            ? result.outbound_messages.length
            : 0,
        outbound_delivery_ok: outboundDelivery.every((item) => item.ok),
        webhook_completed_at: new Date().toISOString()
      }
    });

    if (
      result.status === "processed" &&
      result.runtime_output.deferred_post_processing
    ) {
      const deferred = result.runtime_output.deferred_post_processing;
      try {
        await runDeferredImPostProcessing({
          assistantMessageId: deferred.assistant_message_id,
          threadId: deferred.thread_id,
          workspaceId: deferred.workspace_id,
          userId: deferred.user_id,
          agentId: deferred.agent_id,
          sourceMessageId: deferred.source_message_id,
          runtimeTurnResult: {
            memory_write_requests: result.runtime_output.memory_write_requests,
            follow_up_requests: result.runtime_output.follow_up_requests
          }
        });
      } catch (postProcessingError) {
        console.error("Deferred IM post-processing failed:", postProcessingError);
      }
    }

    return NextResponse.json({
      ok: true,
      status: result.status,
      dedupe_key: result.dedupe_key,
      outbound_count: "outbound_messages" in result ? result.outbound_messages.length : 0,
      delivery: outboundDelivery
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
          webhook_failed_at: new Date().toISOString()
        }
      }).catch(() => null);
    }

    if (inbound) {
      await sendFallbackMessage({
        botToken,
        channelId: inbound.channel_id,
        content: "Something went wrong while processing your message. Please try again.",
      });
    }
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
