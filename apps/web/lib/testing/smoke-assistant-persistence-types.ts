import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SmokeReplyLanguage,
  SmokeReplyLanguageSource,
  SmokeRoleCorePacket
} from "@/lib/testing/smoke-assistant-builders";
import type { SmokeAssistantMetadataRecall } from "@/lib/testing/smoke-assistant-metadata-types";
import type { SmokeAssistantPersistenceSharedFields } from "@/lib/testing/smoke-assistant-persistence-shared-types";
import type { SmokeCreatedMemoryType } from "@/lib/testing/smoke-memory-write-types";
import type { SmokeRecallMemory } from "@/lib/testing/smoke-recall-memory-types";

export type SmokeAssistantInsertArgs = {
  supabase: SupabaseClient;
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  agentName: string;
  roleCorePacket: SmokeRoleCorePacket;
  replyLanguage: SmokeReplyLanguage;
  replyLanguageDetected: SmokeReplyLanguage;
  recalledMemories: SmokeAssistantMetadataRecall[];
} & SmokeAssistantPersistenceSharedFields;

export type SmokeAnalyzedAssistantInsertArgs = {
  supabase: SmokeAssistantInsertArgs["supabase"];
  threadId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  agentName: string;
  personaSummary: string | null;
  styleGuidance: string | null;
  relationshipStyleValue: string | null;
  recalledMemories: SmokeRecallMemory[];
} & SmokeAssistantPersistenceSharedFields;
