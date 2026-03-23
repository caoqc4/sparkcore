import type { insertMessage } from "@/lib/chat/message-persistence";

export function buildSmokeUserTurnPayload(
  content: string
): Parameters<typeof insertMessage>[0]["payload"] {
  return {
    role: "user",
    content
  };
}
