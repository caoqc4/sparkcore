import { webImRuntimePort } from "@/lib/chat/im-runtime-port";
import { getFeishuEnv } from "@/lib/env";
import {
  type FeishuMessageReceiveEvent,
  Lark,
  normalizeFeishuInboundMessage,
  sendFeishuOutboundMessages
} from "@/lib/integrations/feishu";
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
import { createAdminClient } from "@/lib/supabase/admin";

type StartFeishuWsWorkerOptions = {
  logger?: Pick<typeof console, "info" | "warn" | "error">;
};

const seenDedupeKeys = new InboundDedupeWindow();

async function processFeishuMessageReceive(args: {
  event: FeishuMessageReceiveEvent;
  logger: Pick<typeof console, "info" | "warn" | "error">;
}) {
  const inbound = normalizeFeishuInboundMessage(args.event);

  if (!inbound) {
    return;
  }

  const dedupeKey = buildInboundDedupeKey(inbound);
  if (!seenDedupeKeys.claim(dedupeKey)) {
    args.logger.info("[feishu-ws-worker:duplicate]", {
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
      source: "feishu_ws_worker"
    }
  });

  if (claimedReceipt.status === "duplicate") {
    args.logger.info("[feishu-ws-worker:duplicate-receipt]", {
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

    args.logger.info("[feishu-ws-worker:inbound]", {
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
      const delivery = await sendFeishuOutboundMessages({
        messages: result.outbound_messages
      });

      args.logger.info("[feishu-ws-worker:delivery]", {
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
    args.logger.info("[feishu-ws-worker:delivery]", {
      event_id: inbound.event_id,
      channel_id: inbound.channel_id,
      failed: true
    });

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

export async function startFeishuWsWorker(
  options: StartFeishuWsWorkerOptions = {}
) {
  const logger = options.logger ?? console;
  const { appId, appSecret } = getFeishuEnv();
  const wsClient = new Lark.WSClient({
    appId,
    appSecret,
    domain: Lark.Domain.Feishu,
    autoReconnect: true
  });
  const eventDispatcher = new Lark.EventDispatcher({});

  eventDispatcher.register({
    "im.message.receive_v1": async (payload: FeishuMessageReceiveEvent) => {
      await processFeishuMessageReceive({
        event: payload,
        logger
      });
    }
  });

  logger.info("[feishu-ws-worker] starting");
  await wsClient.start({
    eventDispatcher
  });
}
