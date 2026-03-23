import type {
  ProactiveSendRequest,
  ProactiveSendResult,
  ProactiveSender
} from "@/lib/integrations/im-adapter";
import { buildProactiveSendResultMetadata } from "@/lib/chat/follow-up-proactive-metadata";
import { callTelegramApi } from "@/scripts/telegram-utils";

export class TelegramProactiveSender implements ProactiveSender {
  async send(request: ProactiveSendRequest): Promise<ProactiveSendResult> {
    if (request.target.platform !== "telegram") {
      return {
        follow_up_id: request.follow_up_id,
        status: "unsupported",
        failure_reason: `telegram sender does not support platform ${request.target.platform}`
      };
    }

    if (request.message.message_type !== "text") {
      return {
        follow_up_id: request.follow_up_id,
        status: "unsupported",
        failure_reason: `telegram sender does not support message_type ${request.message.message_type}`
      };
    }

    if (!request.message.content || request.message.content.trim().length === 0) {
      return {
        follow_up_id: request.follow_up_id,
        status: "invalid",
        failure_reason: "telegram proactive message content is empty"
      };
    }

    const body = await callTelegramApi("sendMessage", {
      chat_id: request.target.channel_id,
      text: request.message.content
    });

    if (!body?.ok) {
      return {
        follow_up_id: request.follow_up_id,
        status: "failed",
        failure_reason:
          typeof body?.description === "string"
            ? body.description
            : "telegram proactive send failed",
        metadata: buildProactiveSendResultMetadata({
          sender: "telegram",
          fields: {
            response: body ?? null
          }
        })
      };
    }

    return {
      follow_up_id: request.follow_up_id,
      status: "sent",
      platform_message_id:
        typeof body?.result?.message_id === "number"
          ? String(body.result.message_id)
          : undefined,
      metadata: buildProactiveSendResultMetadata({
        sender: "telegram",
        fields: {
          chat_id: request.target.channel_id,
          response: body ?? null
        }
      })
    };
  }
}
