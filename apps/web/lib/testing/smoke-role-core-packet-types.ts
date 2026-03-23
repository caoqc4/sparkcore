import type {
  SmokeReplyLanguage,
  SmokeReplyLanguageSource
} from "@/lib/testing/smoke-role-core-packet";

export type SmokeRoleCorePacketInput = {
  agentId: string;
  agentName: string;
  personaSummary: string | null;
  styleGuidance: string | null;
  relationshipStyleValue: string | null;
  replyLanguage: SmokeReplyLanguage;
  replyLanguageSource: SmokeReplyLanguageSource;
  preferSameThreadContinuation: boolean;
};
