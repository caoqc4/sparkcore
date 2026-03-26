"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createOwnedAgent,
  createOwnedThread,
  loadFirstActiveModelProfile,
  loadFirstActivePersonaPack,
  loadPrimaryWorkspace
} from "@/lib/chat/runtime-turn-context";
import {
  buildProductAgentMetadata,
  buildProductPersonaSummary,
  buildProductStylePrompt,
  buildProductSystemPrompt,
  safeProductRoleMode,
  safeProductRoleTone,
  trimProductText
} from "@/lib/product/role-core";

export async function createProductRole(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fcreate");
  }

  const mode = safeProductRoleMode(trimProductText(formData.get("mode")));
  const name =
    trimProductText(formData.get("name")) ||
    (mode === "girlfriend" ? "Luna" : mode === "boyfriend" ? "Atlas" : "Nova");
  const tone = safeProductRoleTone(trimProductText(formData.get("tone")));
  const relationshipMode =
    trimProductText(formData.get("relationship_mode")) || "long-term companion";
  const boundaries =
    trimProductText(formData.get("boundaries")) ||
    "Be supportive, respectful, and avoid manipulative or coercive behavior.";

  const [{ data: workspace }, { data: modelProfile }, { data: personaPack }] =
    await Promise.all([
      loadPrimaryWorkspace({
        supabase,
        userId: user.id
      }),
      loadFirstActiveModelProfile({ supabase }),
      loadFirstActivePersonaPack({ supabase })
    ]);

  if (!workspace || !modelProfile || !personaPack) {
    redirect("/create?error=Missing+workspace,+model+profile,+or+persona+pack.");
  }

  const { data: createdAgent, error: agentError } = await createOwnedAgent({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    sourcePersonaPackId: personaPack.id,
    name,
    personaSummary: buildProductPersonaSummary({
      mode,
      tone,
      relationshipMode
    }),
    stylePrompt: buildProductStylePrompt(tone),
    systemPrompt: buildProductSystemPrompt({
      name,
      mode,
      tone,
      relationshipMode,
      boundaries,
      proactivityLevel: "balanced"
    }),
    defaultModelProfileId: modelProfile.id,
    isCustom: true,
    metadata: buildProductAgentMetadata({
      mode,
      tone,
      relationshipMode,
      boundaries,
      proactivityLevel: "balanced"
    }),
    select: "id, name, persona_summary"
  });

  if (agentError || !createdAgent) {
    redirect(`/create?error=${encodeURIComponent(agentError?.message ?? "Failed to create role.")}`);
  }

  const { data: createdThread, error: threadError } = await createOwnedThread({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    agentId: createdAgent.id,
    title: `${createdAgent.name} relationship thread`
  });

  if (threadError || !createdThread) {
    redirect(`/create?error=${encodeURIComponent(threadError?.message ?? "Failed to create thread.")}`);
  }

  redirect(
    `/connect-im?thread=${encodeURIComponent(createdThread.id)}&agent=${encodeURIComponent(
      createdAgent.id
    )}&created=1`
  );
}
