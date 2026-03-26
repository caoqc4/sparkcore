import { loadPrimaryWorkspace } from "@/lib/chat/runtime-turn-context";
import { loadOwnedChannelBindings } from "@/lib/product/channels";
import { loadProductMemoryPageData } from "@/lib/product/memory";

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
  availableNow: Array<{
    title: string;
    body: string;
    href: string;
    cta: string;
  }>;
  boundaries: Array<{
    title: string;
    body: string;
  }>;
};

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
    availableNow: [
      {
        title: "Memory visibility and repair",
        body:
          "Inspect what is being retained, hide entries from recall, mark incorrect rows, and restore them when needed.",
        href: "/dashboard/memory",
        cta: "Open memory controls"
      },
      {
        title: "Source trace and thread context",
        body:
          "Follow memory back to its source thread so continuity can be inspected instead of guessed.",
        href: "/dashboard/memory",
        cta: "Review memory trace"
      },
      {
        title: "IM channel boundaries",
        body:
          "See which channels are attached to the relationship and set a binding inactive when that entry should stop being used.",
        href: "/dashboard/channels",
        cta: "Open channel controls"
      },
      {
        title: "Relationship setup boundaries",
        body:
          "Review tone, relationship mode, and boundary-related role settings without pretending there is a separate privacy rule engine already live.",
        href: "/dashboard/profile",
        cta: "Open role profile"
      }
    ],
    boundaries: [
      {
        title: "Available now",
        body:
          "The current control center covers memory visibility, memory correction, source trace review, and channel management."
      },
      {
        title: "Not yet exposed here",
        body:
          "Fine-grained export, delete, and automation rules are not presented as self-serve controls yet, so this page does not render fake switches or disabled controls."
      },
      {
        title: "What comes next",
        body:
          "The next privacy iteration should deepen trace visibility and add explicit data-boundary explanations before heavier account-level controls appear."
      }
    ]
  };
}
