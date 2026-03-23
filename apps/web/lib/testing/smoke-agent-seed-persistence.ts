import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSmokeSeedAgentPayloads } from "@/lib/testing/smoke-agent-seed-payload";
import type {
  SmokeSeedPersonaPack,
  SmokeUserLike
} from "@/lib/testing/smoke-agent-seeding-types";

export async function insertSmokeSeedAgents(args: {
  admin: SupabaseClient;
  user: SmokeUserLike;
  sparkGuidePack: SmokeSeedPersonaPack;
  memoryCoachPack: SmokeSeedPersonaPack;
  defaultProfileId: string;
  altProfileId: string;
}) {
  return args.admin.from("agents").insert(buildSmokeSeedAgentPayloads(args));
}
