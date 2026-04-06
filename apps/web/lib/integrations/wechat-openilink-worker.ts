import { webImRuntimePort } from "@/lib/chat/im-runtime-port";
import {
  buildInboundDedupeKey,
  createSupabaseBindingLookup,
  handleInboundChannelMessage
} from "@/lib/integrations/im-adapter";
import {
  claimImInboundReceipt,
  updateImInboundReceipt
} from "@/lib/integrations/im-inbound-receipts";
import { InboundDedupeWindow } from "@/lib/integrations/inbound-dedupe";
import {
  type WeChatOpenILinkSession,
  createWeChatOpenILinkClient,
  normalizeWeChatInboundMessage,
  sendWeChatOutboundMessages
} from "@/lib/integrations/wechat-openilink";
import {
  findPendingWeChatOpenILinkLoginAttemptByWeChatUserId,
  updateWeChatOpenILinkLoginAttempt
} from "@/lib/integrations/wechat-openilink-login-attempt";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Client } from "@openilink/openilink-sdk-node";
import type { WeixinMessage } from "@openilink/openilink-sdk-node";

type StartWeChatOpenILinkWorkerWithClientArgs = {
  client: Client;
  session: WeChatOpenILinkSession;
  logger?: Pick<typeof console, "info" | "warn" | "error">;
  stopOnIdentityReady?: boolean;
  onSyncBufUpdate?: (buf: string) => Promise<void> | void;
  onSessionActivity?: () => Promise<void> | void;
  onSessionExpired?: () => Promise<void> | void;
};

const seenDedupeKeys = new InboundDedupeWindow();

export async function startWeChatOpenILinkWorkerWithClient(
  args: StartWeChatOpenILinkWorkerWithClientArgs
) {
  const logger = args.logger ?? console;
  const { client, session } = args;
  const admin = createAdminClient();
  const bindingLookup = createSupabaseBindingLookup(admin);
  let emptyPollCount = 0;
  let shouldContinue = true;

  logger.info("[wechat-openilink-worker] starting");

  await client.monitor(
    async (message: WeixinMessage) => {
      const inbound = normalizeWeChatInboundMessage(message);

      if (!inbound) {
        logger.info("[wechat-openilink-worker:dropped]", {
          message_id: message.message_id ?? null,
          session_id: message.session_id ?? null,
          from_user_id: message.from_user_id ?? null,
          to_user_id: message.to_user_id ?? null,
          message_type: message.message_type ?? null,
          item_types: Array.isArray(message.item_list)
            ? message.item_list.map((item) => item?.type ?? null)
            : [],
          text_preview: Array.isArray(message.item_list)
            ? message.item_list
                .map((item) =>
                  item?.text_item && typeof item.text_item.text === "string"
                    ? item.text_item.text
                    : item?.voice_item && typeof item.voice_item.text === "string"
                      ? item.voice_item.text
                      : null
                )
                .filter((value): value is string => typeof value === "string")
                .join(" | ")
            : ""
        });
        return;
      }

      const dedupeKey = buildInboundDedupeKey(inbound);
      if (!seenDedupeKeys.claim(dedupeKey)) {
        logger.info("[wechat-openilink-worker:duplicate]", {
          event_id: inbound.event_id,
          channel_id: inbound.channel_id
        });
        return;
      }

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
          worker_received_at: new Date().toISOString(),
          source: "wechat_openilink_worker"
        }
      });

      if (claimedReceipt.status === "duplicate") {
        logger.info("[wechat-openilink-worker:duplicate-receipt]", {
          event_id: inbound.event_id,
          channel_id: inbound.channel_id
        });
        return;
      }

      const receiptId = claimedReceipt.receipt.id;

      try {
        const result = await handleInboundChannelMessage({
          inbound,
          bindingLookup,
          runtimePort: webImRuntimePort
        });

        logger.info("[wechat-openilink-worker:inbound]", {
          event_id: inbound.event_id,
          channel_id: inbound.channel_id,
          peer_id: inbound.peer_id,
          status: result.status
        });

        await updateImInboundReceipt({
          supabase: admin,
          receiptId,
        status:
          result.status === "binding_not_found" ? "binding_not_found" : "processing",
          metadataPatch: {
            adapter_result_status: result.status,
            adapter_result_at: new Date().toISOString()
          }
        });

        const loginAttempt = await findPendingWeChatOpenILinkLoginAttemptByWeChatUserId({
          supabase: admin,
          wechatUserId: inbound.peer_id
        });

        if (loginAttempt) {
          await updateWeChatOpenILinkLoginAttempt({
            supabase: admin,
            attemptId: loginAttempt.id,
            patch: {
              status: "identity_ready",
              channel_id: inbound.channel_id,
              peer_id: inbound.peer_id,
              platform_user_id: inbound.platform_user_id
            }
          });

          if (args.stopOnIdentityReady) {
            shouldContinue = false;
            logger.info("[wechat-openilink-worker] identity captured, stopping dedicated login listener", {
              event_id: inbound.event_id,
              channel_id: inbound.channel_id
            });
          }
        }

        if ("outbound_messages" in result) {
          const delivery = await sendWeChatOutboundMessages({
            client,
            messages: result.outbound_messages
          });

          logger.info("[wechat-openilink-worker:delivery]", {
            event_id: inbound.event_id,
            channel_id: inbound.channel_id,
            delivery_count: delivery.length,
            ok_count: delivery.filter((item) => item.ok).length
          });

          await updateImInboundReceipt({
            supabase: admin,
            receiptId,
            status: result.status === "binding_not_found" ? "binding_not_found" : "processed",
            processed: result.status === "processed",
            metadataPatch: {
              delivery_count: delivery.length,
              delivery_ok_count: delivery.filter((item) => item.ok).length,
              delivery_completed_at: new Date().toISOString()
            }
          });
          return;
        }

        await updateImInboundReceipt({
          supabase: admin,
          receiptId,
          status: result.status,
          metadataPatch: {
            delivery_skipped: true,
            delivery_completed_at: new Date().toISOString()
          }
        });
      } catch (error) {
        await updateImInboundReceipt({
          supabase: admin,
          receiptId,
          status: "failed",
          lastError: error instanceof Error ? error.message : String(error),
          metadataPatch: {
            failed_at: new Date().toISOString()
          }
        });

        throw error;
      }
    },
    {
      initial_buf: session.syncBuf ?? "",
      on_buf_update: (buf: string) => {
        if (args.onSyncBufUpdate) {
          return Promise.resolve(args.onSyncBufUpdate(buf)).catch((error) => {
            logger.error("[wechat-openilink-worker] sync buffer update failed", {
              error_message: error instanceof Error ? error.message : String(error)
            });
          });
        }
      },
      on_response: (response) => {
        const msgCount = Array.isArray(response.msgs) ? response.msgs.length : 0;

        if (args.onSessionActivity) {
          Promise.resolve(args.onSessionActivity()).catch((error) => {
            logger.error("[wechat-openilink-worker] session activity update failed", {
              error_message: error instanceof Error ? error.message : String(error)
            });
          });
        }

        if (msgCount > 0) {
          emptyPollCount = 0;
          logger.info("[wechat-openilink-worker:poll]", {
            ret: response.ret ?? 0,
            errcode: response.errcode ?? 0,
            msg_count: msgCount
          });
          return;
        }

        emptyPollCount += 1;

        if (emptyPollCount === 1 || emptyPollCount % 5 === 0) {
          logger.info("[wechat-openilink-worker:poll-empty]", {
            ret: response.ret ?? 0,
            errcode: response.errcode ?? 0,
            poll_count: emptyPollCount
          });
        }
      },
      on_error: (error: Error) => {
        logger.error("[wechat-openilink-worker] monitor error", {
          error_message: error instanceof Error ? error.message : String(error)
        });
      },
      on_session_expired: () => {
        logger.warn("[wechat-openilink-worker] session expired, re-login required");
        if (args.onSessionExpired) {
          Promise.resolve(args.onSessionExpired()).catch((error) => {
            logger.error("[wechat-openilink-worker] session expiration handler failed", {
              error_message: error instanceof Error ? error.message : String(error)
            });
          });
        }
      },
      should_continue: () => shouldContinue
    }
  );
}
