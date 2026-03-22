import { StubProactiveSender } from "@/lib/chat/follow-up-proactive-sender";
import type { ProactiveSender } from "@/lib/integrations/im-adapter";
import { TelegramProactiveSender } from "@/lib/integrations/telegram-proactive-sender";

export type FollowUpSenderKind = "stub" | "telegram";

export type ResolveFollowUpSenderOptions = {
  routeKind: "test" | "internal";
  requestedSender?: FollowUpSenderKind;
  defaultSender?: FollowUpSenderKind;
  enableTelegramSend?: boolean;
};

export type ResolvedFollowUpSender = {
  sender: ProactiveSender;
  senderKind: FollowUpSenderKind;
  requestedSender: FollowUpSenderKind;
  telegramSendEnabled: boolean;
};

export function resolveFollowUpSender({
  routeKind,
  requestedSender,
  defaultSender = "stub",
  enableTelegramSend = false
}: ResolveFollowUpSenderOptions): ResolvedFollowUpSender {
  const desiredSender = requestedSender ?? defaultSender;

  if (routeKind === "internal" && desiredSender === "telegram" && enableTelegramSend) {
    return {
      sender: new TelegramProactiveSender(),
      senderKind: "telegram",
      requestedSender: desiredSender,
      telegramSendEnabled: true
    };
  }

  return {
    sender: new StubProactiveSender(),
    senderKind: "stub",
    requestedSender: desiredSender,
    telegramSendEnabled: enableTelegramSend
  };
}
