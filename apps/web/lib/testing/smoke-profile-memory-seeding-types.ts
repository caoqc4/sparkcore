import type { SupabaseClient } from "@supabase/supabase-js";

export type SmokeProfileMemorySeedingInput = {
  supabase: SupabaseClient;
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  memoryType: "profile" | "preference";
  value: string;
  confidence: number;
};
