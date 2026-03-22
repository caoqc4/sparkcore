import type {
  ProactiveSendRequest,
  ProactiveSendResult,
  ProactiveSender
} from "@/lib/integrations/im-adapter";

export class StubProactiveSender implements ProactiveSender {
  async send(request: ProactiveSendRequest): Promise<ProactiveSendResult> {
    if (request.message.message_type !== "text") {
      return {
        follow_up_id: request.follow_up_id,
        status: "unsupported",
        failure_reason: "only text proactive messages are supported by the stub sender",
        metadata: {
          message_type: request.message.message_type
        }
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
      metadata: {
        sender: "stub",
        target_platform: request.target.platform,
        target_channel_id: request.target.channel_id
      }
    };
  }
}
