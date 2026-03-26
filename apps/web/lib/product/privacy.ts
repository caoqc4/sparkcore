import { loadPrimaryWorkspace } from "@/lib/chat/runtime-turn-context";
import { loadOwnedChannelBindings } from "@/lib/product/channels";
import {
  getMemoryEffectHint,
  loadProductMemoryPageData,
  type ProductMemoryItem
} from "@/lib/product/memory";

export type ProductPrivacyPageData = {
  memory: {
    total: number;
    active: number;
    hidden: number;
    incorrect: number;
    traceAvailable: number;
  };
  channels: {
    total: number;
    active: number;
    inactive: number;
    platforms: string[];
  };
  drillDownItems: Array<{
    id: string;
    content: string;
    categoryLabel: string;
    scopeLabel: string;
    statusLabel: string;
    effectHint: string;
    confidence: number;
    sourceTimestamp: string | null;
    sourceThreadTitle: string | null;
    sourceThreadId: string | null;
    sourceExcerpt: string | null;
    sourceRole: "user" | "assistant" | null;
    targetAgentName: string | null;
    action: "hide" | "incorrect" | "restore" | null;
  }>;
  boundaries: Array<{
    title: string;
    body: string;
  }>;
};

function getPrivacyAction(memory: ProductMemoryItem): "hide" | "incorrect" | "restore" | null {
  if (memory.status === "active" && memory.scope === "thread_local") {
    return "incorrect";
  }

  if (memory.status === "active") {
    return "hide";
  }

  if (memory.status === "hidden" || memory.status === "incorrect") {
    return "restore";
  }

  return null;
}

export async function loadProductPrivacyPageData(args: {
  supabase: any;
  userId: string;
}): Promise<ProductPrivacyPageData | null> {
  const { data: workspace } = await loadPrimaryWorkspace({
    supabase: args.supabase,
    userId: args.userId
  });

  if (!workspace) {
    return null;
  }

  const [memoryData, bindings] = await Promise.all([
    loadProductMemoryPageData({
      supabase: args.supabase,
      userId: args.userId
    }),
    loadOwnedChannelBindings({
      supabase: args.supabase,
      workspaceId: workspace.id,
      userId: args.userId
    })
  ]);

  const memoryItems = memoryData?.items ?? [];
  const activeMemory = memoryItems.filter((item) => item.status === "active");
  const hiddenMemory = memoryItems.filter((item) => item.status === "hidden");
  const incorrectMemory = memoryItems.filter((item) => item.status === "incorrect");
  const traceAvailableCount = memoryItems.filter((item) => item.sourceThreadId).length;
  const activeBindings = bindings.filter((item) => item.status === "active");
  const inactiveBindings = bindings.filter((item) => item.status === "inactive");
  const platforms = Array.from(new Set(bindings.map((item) => item.platform)));

  return {
    memory: {
      total: memoryItems.length,
      active: activeMemory.length,
      hidden: hiddenMemory.length,
      incorrect: incorrectMemory.length,
      traceAvailable: traceAvailableCount
    },
    channels: {
      total: bindings.length,
      active: activeBindings.length,
      inactive: inactiveBindings.length,
      platforms
    },
    drillDownItems: memoryItems.slice(0, 8).map((item) => ({
      id: item.id,
      content: item.content,
      categoryLabel: item.categoryLabel,
      scopeLabel: item.scopeLabel,
      statusLabel: item.statusLabel,
      effectHint: getMemoryEffectHint(item),
      confidence: item.confidence,
      sourceTimestamp: item.sourceTimestamp,
      sourceThreadTitle: item.sourceThreadTitle,
      sourceThreadId: item.sourceThreadId,
      sourceExcerpt: item.sourceExcerpt,
      sourceRole: item.sourceRole,
      targetAgentName: item.targetAgentName,
      action: getPrivacyAction(item)
    })),
    boundaries: [
      {
        title: "Available now",
        body:
          "The current control center covers visible memory, correction actions, source trace review, and channel management."
      },
      {
        title: "Not yet exposed here",
        body:
          "Fine-grained export, delete, and automation rules are not presented as self-serve controls yet, so this page does not render fake switches or fake delete buttons."
      },
      {
        title: "What comes next",
        body:
          "The next privacy iteration should deepen trace visibility and add richer continuity context before heavier account-level controls appear."
      }
    ]
  };
}
