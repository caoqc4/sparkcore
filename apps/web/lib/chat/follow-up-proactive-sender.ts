import type {
  ProactiveSendRequest,
  ProactiveSendResult,
  ProactiveSender
} from "@/lib/integrations/im-adapter";
import { buildProactiveSendResultMetadata } from "@/lib/chat/follow-up-proactive-metadata";

export class StubProactiveSender implements ProactiveSender {
  async send(request: ProactiveSendRequest): Promise<ProactiveSendResult> {
    if (request.message.message_type !== "text") {
      return {
        follow_up_id: request.follow_up_id,
        status: "unsupported",
        failure_reason: "only text proactive messages are supported by the stub sender",
        metadata: buildProactiveSendResultMetadata({
          sender: "stub",
          fields: {
            message_type: request.message.message_type
          }
        })
      };
    }

    if (!request.message.content || request.message.content.trim().length === 0) {
      return {
        follow_up_id: request.follow_up_id,
        status: "invalid",
        failure_reason: "proactive message content is empty"
      };
    }

    return {
      follow_up_id: request.follow_up_id,
      status: "sent",
      metadata: buildProactiveSendResultMetadata({
        sender: "stub",
        fields: {
          target_platform: request.target.platform,
          target_channel_id: request.target.channel_id
        }
      })
    };
  }
}
