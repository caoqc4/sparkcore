import WebSocket from "ws";
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
import {
  type DiscordMessageCreateEvent,
  normalizeDiscordInboundMessage,
  sendDiscordOutboundMessages
} from "@/lib/integrations/discord";
import { runDeferredPostProcessingForInboundResult } from "@/lib/integrations/im-deferred-processing";
import { InboundDedupeWindow } from "@/lib/integrations/inbound-dedupe";
import { getDiscordEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const DISCORD_GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";
const DISCORD_DIRECT_MESSAGE_INTENTS = 1 << 12;
const DISCORD_MESSAGE_CONTENT_INTENTS = 1 << 15;
const DISCORD_IDENTIFY_INTENTS =
  DISCORD_DIRECT_MESSAGE_INTENTS | DISCORD_MESSAGE_CONTENT_INTENTS;

type DiscordGatewayPacket = {
  op: number;
  d?: unknown;
  s?: number | null;
  t?: string | null;
};

type DiscordGatewayHello = {
  heartbeat_interval: number;
};

type StartDiscordGatewayWorkerOptions = {
  logger?: Pick<typeof console, "info" | "warn" | "error">;
};

const seenDedupeKeys = new InboundDedupeWindow();

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getHelloData(packet: DiscordGatewayPacket): DiscordGatewayHello | null {
  if (!packet.d || typeof packet.d !== "object" || Array.isArray(packet.d)) {
    return null;
  }

  const heartbeatInterval = (packet.d as Record<string, unknown>).heartbeat_interval;
  return typeof heartbeatInterval === "number"
    ? { heartbeat_interval: heartbeatInterval }
    : null;
}

async function processDiscordMessageCreate(args: {
  event: DiscordMessageCreateEvent;
  botToken: string;
  logger: Pick<typeof console, "info" | "warn" | "error">;
}) {
  const inbound = normalizeDiscordInboundMessage(args.event);

  if (!inbound) {
    return;
  }

  const dedupeKey = buildInboundDedupeKey(inbound);
  if (!seenDedupeKeys.claim(dedupeKey)) {
    args.logger.info("[discord-gateway-worker:duplicate]", {
      event_id: inbound.event_id,
      channel_id: inbound.channel_id
    });
    return;
  }

  const admin = createAdminClient();
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
      source: "discord_gateway_worker"
    }
  });

  if (claimedReceipt.status === "duplicate") {
    args.logger.info("[discord-gateway-worker:duplicate-receipt]", {
      event_id: inbound.event_id,
      channel_id: inbound.channel_id
    });
    return;
  }

  const receiptId = claimedReceipt.receipt.id;
  const bindingLookup = createSupabaseBindingLookup(admin);
  try {
    const result = await handleInboundChannelMessage({
      inbound,
      bindingLookup,
      runtimePort: webImRuntimePort
    });

    args.logger.info("[discord-gateway-worker:inbound]", {
      event_id: inbound.event_id,
      channel_id: inbound.channel_id,
      peer_id: inbound.peer_id,
      platform_user_id: inbound.platform_user_id,
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

    if ("outbound_messages" in result) {
      const delivery = await sendDiscordOutboundMessages({
        botToken: args.botToken,
        messages: result.outbound_messages
      });

      if (result.status === "processed") {
        await runDeferredPostProcessingForInboundResult(result);
      }

      args.logger.info("[discord-gateway-worker:delivery]", {
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
}

export async function startDiscordGatewayWorker(
  options: StartDiscordGatewayWorkerOptions = {}
) {
  const logger = options.logger ?? console;
  const { botToken } = getDiscordEnv();

  while (true) {
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let websocket: WebSocket | null = null;
    let lastSequence: number | null = null;

    try {
      await new Promise<void>((resolve, reject) => {
        websocket = new WebSocket(DISCORD_GATEWAY_URL);

        const cleanup = () => {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
        };

        websocket.on("open", () => {
          logger.info("[discord-gateway-worker] connected");
        });

        websocket.on("message", async (raw) => {
          try {
            const packet = JSON.parse(String(raw)) as DiscordGatewayPacket;

            if (typeof packet.s === "number") {
              lastSequence = packet.s;
            }

            if (packet.op === 10) {
              const hello = getHelloData(packet);

              if (!hello) {
                throw new Error("Discord gateway HELLO payload missing heartbeat interval.");
              }

              websocket?.send(
                JSON.stringify({
                  op: 2,
                  d: {
                    token: botToken,
                    intents: DISCORD_IDENTIFY_INTENTS,
                    properties: {
                      os: process.platform,
                      browser: "sparkcore-discord-worker",
                      device: "sparkcore-discord-worker"
                    }
                  }
                })
              );

              heartbeatTimer = setInterval(() => {
                websocket?.send(
                  JSON.stringify({
                    op: 1,
                    d: lastSequence
                  })
                );
              }, hello.heartbeat_interval);

              return;
            }

            if (packet.op === 7) {
              logger.warn("[discord-gateway-worker] server requested reconnect");
              websocket?.close();
              return;
            }

            if (packet.op === 9) {
              throw new Error("Discord gateway rejected session as invalid.");
            }

            if (packet.t === "READY") {
              logger.info("[discord-gateway-worker] ready");
              return;
            }

            if (packet.t === "MESSAGE_CREATE") {
              await processDiscordMessageCreate({
                event: packet.d as DiscordMessageCreateEvent,
                botToken,
                logger
              });
            }
          } catch (error) {
            cleanup();
            reject(error);
          }
        });

        websocket.on("error", (error) => {
          cleanup();
          reject(error);
        });

        websocket.on("close", () => {
          cleanup();
          resolve();
        });
      });
    } catch (error) {
      logger.error("[discord-gateway-worker] failed", {
        error_message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
    }

    logger.warn("[discord-gateway-worker] reconnecting in 3s");
    await wait(3000);
  }
}
