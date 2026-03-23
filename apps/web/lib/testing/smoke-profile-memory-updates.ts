import { upsertSmokeProfileMemory } from "@/lib/testing/smoke-memory-seeding";
import { normalizeSmokePrompt } from "@/lib/testing/smoke-prompt-normalization";

export async function applySmokeProfileMemoryUpdates(args: {
  supabase: Parameters<typeof upsertSmokeProfileMemory>[0]["supabase"];
  workspaceId: string;
  userId: string;
  agentId: string;
  sourceMessageId: string;
  trimmedContent: string;
}) {
  const createdTypes: Array<"profile" | "preference"> = [];
  const loweredContent = normalizeSmokePrompt(args.trimmedContent);

  if (loweredContent.includes("product designer")) {
    const result = await upsertSmokeProfileMemory({
      supabase: args.supabase,
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.agentId,
      sourceMessageId: args.sourceMessageId,
      memoryType: "profile",
      value: "product designer",
      confidence: 0.95
    });

    if (result.created) {
      createdTypes.push("profile");
    }
  }

  if (loweredContent.includes("concise weekly planning")) {
    const result = await upsertSmokeProfileMemory({
      supabase: args.supabase,
      workspaceId: args.workspaceId,
      userId: args.userId,
      agentId: args.agentId,
      sourceMessageId: args.sourceMessageId,
      memoryType: "preference",
      value: "concise weekly planning",
      confidence: 0.93
    });

    if (result.created) {
      createdTypes.push("preference");
    }
  }

  return createdTypes;
}
