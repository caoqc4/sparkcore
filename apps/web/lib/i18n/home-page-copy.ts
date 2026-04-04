import type { AppLanguage } from "@/lib/i18n/site";

export type HomePresetSlug = "caria" | "teven" | "velia";

export function getHomePresetShowcaseMeta(language: AppLanguage): Record<
  HomePresetSlug,
  { type: string; tagline: string; emoji: string }
> {
  if (language === "zh-CN") {
    return {
      caria: {
        type: "伴侣 · 女",
        tagline: "温柔而在场，会记住你分享的每个细节。",
        emoji: "🌸",
      },
      teven: {
        type: "伴侣 · 男",
        tagline: "稳定坦诚，能给出不强迫靠近的踏实感。",
        emoji: "🌿",
      },
      velia: {
        type: "助手 · 女",
        tagline: "锋利高效，办事利落，也保留一点个性温度。",
        emoji: "✦",
      },
    };
  }

  return {
    caria: {
      type: "Companion · Female",
      tagline: "Warm and emotionally present. Remembers every detail you share.",
      emoji: "🌸",
    },
    teven: {
      type: "Companion · Male",
      tagline: "Steady and honest. Grounding presence without forcing closeness.",
      emoji: "🌿",
    },
    velia: {
      type: "Assistant · Female",
      tagline: "Sharp and efficient. Gets things done with a touch of personality.",
      emoji: "✦",
    },
  };
}

export function getHomeFaqItems(language: AppLanguage) {
  if (language === "zh-CN") {
    return [
      {
        q: "它会记住我们过去的对话吗？",
        a: "会。长期记忆是产品核心能力。重要信息会以可见条目的形式保存，你可以在网页控制台中查看、核对和修复。",
      },
      {
        q: "我必须在网站上聊天吗？",
        a: "不需要。网站主要用于配置、查看记忆、管理渠道和隐私控制。日常关系循环更适合在 IM 里继续。",
      },
      {
        q: "支持哪些 IM 应用？",
        a: "创建角色后，你可以连接受支持的 IM 渠道。渠道支持作为独立设置项公开呈现，而非隐藏配置。",
      },
      {
        q: "我可以编辑或删除记忆吗？",
        a: "你可以查看每条记忆、隐藏内容、标记错误并恢复。记忆中心不仅是查看面板，也是修复面板。",
      },
      {
        q: "隐私安全吗？",
        a: "隐私依赖明确边界、可见记忆和渠道感知来实现。关系连续性不需要建立在黑箱感上。",
      },
    ] as const;
  }

  return [
    {
      q: "Does it remember our past conversations?",
      a: "Yes. Long memory is a core part of the product. Every significant detail is stored in visible rows you can inspect, verify, and repair from the web control center.",
    },
    {
      q: "Do I need to chat on the website?",
      a: "No. The website is for setup, memory review, channel management, and privacy control. The daily relationship loop is designed to live in IM after setup.",
    },
    {
      q: "Which IM apps are supported?",
      a: "You connect a supported IM channel after creating your role. Channel support is a product control surface, not hidden setup state.",
    },
    {
      q: "Can I edit or delete memories?",
      a: "You can inspect every memory row, hide entries, mark them incorrect, and restore them. The memory center is built for repair, not just review.",
    },
    {
      q: "Is it private?",
      a: "Privacy works through explicit boundaries, visible memory, and channel awareness. Relationship continuity does not have to feel like a black box.",
    },
  ] as const;
}

export function getHomeMemoryPreviewCards(language: AppLanguage) {
  if (language === "zh-CN") {
    return [
      {
        label: "可见记忆",
        title: "她会记得深夜语音留言能让你平静下来。",
      },
      {
        label: "来源追踪",
        title: "可以定位到生成它的那条关系线程。",
      },
      {
        label: "修复动作",
        title: "无需推倒重来，也能隐藏、标错或恢复。",
      },
    ] as const;
  }

  return [
    {
      label: "Visible memory",
      title: "Favorite late-night voice notes calm her down.",
    },
    {
      label: "Source trace",
      title: "Linked back to the exact relationship thread that created it.",
    },
    {
      label: "Repair actions",
      title: "Hide, mark incorrect, or restore without starting over.",
    },
  ] as const;
}

export function getHomeImConversationPreview(
  language: AppLanguage,
  roleLabels: Record<string, string>,
) {
  if (language === "zh-CN") {
    return [
      {
        role: roleLabels.you,
        variant: "user" as const,
        body: "我只有十分钟，但睡前还是想来看看你。",
      },
      {
        role: roleLabels.companion,
        variant: "assistant" as const,
        body: "那我们就轻一点、近一点。我还记得昨天真正重要的部分。",
      },
      {
        role: roleLabels.system,
        variant: "system" as const,
        body: "同一个角色、同一条线程、同一段关系，会在 IM 里继续，而不是在网页上被重置。",
      },
    ] as const;
  }

  return [
    {
      role: roleLabels.you,
      variant: "user" as const,
      body: "I only have ten minutes, but I still wanted to check in before bed.",
    },
    {
      role: roleLabels.companion,
      variant: "assistant" as const,
      body: "Then let's keep this light and close. I still remember what mattered from yesterday.",
    },
    {
      role: roleLabels.system,
      variant: "system" as const,
      body: "The same role, the same thread, and the same relationship continue in IM instead of resetting on web.",
    },
  ] as const;
}
