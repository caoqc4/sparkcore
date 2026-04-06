import type { HumanizedDeliveryPacket } from "@/lib/chat/humanized-delivery-contracts";
import type { OutputGovernancePacketV1, RoleExpressionPacketV1 } from "@/lib/chat/output-governance";
import type { RuntimeReplyLanguage } from "@/lib/chat/role-core";

export type PromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type PromptSection = {
  key: string;
  content: string;
};

export type PromptSectionLength = {
  key: string;
  chars: number;
};

export type RuntimePromptPreparation = {
  systemPrompt: string;
  promptMessages: PromptMessage[];
  promptMessageCount: number;
  promptSystemChars: number;
  promptUserChars: number;
  promptAssistantChars: number;
  promptTotalChars: number;
  promptTotalBytes: number;
  promptApproxTokenCount: number;
  promptSystemSectionLengths: PromptSectionLength[];
};

export type ResponseSurfacePromptsArgs = {
  runtimeSurface: "full" | "im_summary";
  governance: OutputGovernancePacketV1 | null | undefined;
  roleExpression: RoleExpressionPacketV1 | null | undefined;
  humanizedDeliveryPacket: HumanizedDeliveryPacket | null;
  replyLanguage: RuntimeReplyLanguage;
};

export type ResponseSurfacePromptsResult = {
  outputGovernancePrompt: string;
  rolePresenceAnchorPrompt: string;
  humanizedDeliveryPrompt: string;
};
