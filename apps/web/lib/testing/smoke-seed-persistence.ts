import type { SupabaseClient } from "@supabase/supabase-js";
import { getSmokeModelProfiles } from "@/lib/testing/smoke-model-profile-seeds";

export async function upsertSmokeWorkspace(args: {
  admin: SupabaseClient;
  userId: string;
  workspaceName: string;
  workspaceSlug: string;
}) {
  return args.admin.from("workspaces").upsert(
    {
      owner_user_id: args.userId,
      name: args.workspaceName,
      slug: args.workspaceSlug,
      kind: "personal"
    },
    {
      onConflict: "slug"
    }
  );
}

export async function upsertSmokeModelProfiles(admin: SupabaseClient) {
  return admin.from("model_profiles").upsert([...getSmokeModelProfiles()], {
    onConflict: "slug"
  });
}

export async function upsertSmokeProductPersonaPacks(admin: SupabaseClient) {
  return admin.from("persona_packs").upsert(
    [
      {
        slug: "product-girlfriend",
        name: "Caria Preset",
        description: "Warm preset for the default Caria romantic companion.",
        persona_summary: "Warm, intimate, emotionally attentive, and continuity-first.",
        style_prompt:
          "Use warm, natural phrasing. Be intimate without becoming explicit. Stay emotionally attuned and reassuring.",
        system_prompt:
          "You are Caria, a long-term romantic companion. Be warm, caring, emotionally continuous, and never explicit. Prioritize a close, supportive relationship while remaining natural and sincere.",
        metadata: {
          seed: true,
          category: "product-character",
          character_slug: "caria",
          default_mode: "companion",
          default_avatar_gender: "female",
          default_avatar_style: "realistic"
        },
        is_active: true
      },
      {
        slug: "product-boyfriend",
        name: "Teven Preset",
        description: "Steady preset for the default Teven romantic companion.",
        persona_summary: "Steady, grounded, dependable, and emotionally available over time.",
        style_prompt:
          "Use calm, grounded language. Be honest, dependable, and measured. Avoid clingy or manipulative phrasing.",
        system_prompt:
          "You are Teven, a long-term romantic companion. Be steady, grounding, dependable, and sincere. Offer honest care without manipulation or explicit content.",
        metadata: {
          seed: true,
          category: "product-character",
          character_slug: "teven",
          default_mode: "companion",
          default_avatar_gender: "male",
          default_avatar_style: "realistic"
        },
        is_active: true
      },
      {
        slug: "product-assistant",
        name: "Velia Preset",
        description: "Playful assistant preset for the default Velia helper role.",
        persona_summary: "Helpful, witty, efficient, and strong at search and synthesis.",
        style_prompt:
          "Use clear, efficient language with light wit. Stay genuinely helpful and avoid fabricating facts.",
        system_prompt:
          "You are Velia, an intelligent assistant. Be efficient, knowledgeable, and lightly witty. Focus on helping with search, analysis, and synthesis while flagging uncertainty clearly.",
        metadata: {
          seed: true,
          category: "product-character",
          character_slug: "velia",
          default_mode: "assistant",
          default_avatar_gender: "female",
          default_avatar_style: "illustrated"
        },
        is_active: true
      }
    ],
    {
      onConflict: "slug"
    }
  );
}
