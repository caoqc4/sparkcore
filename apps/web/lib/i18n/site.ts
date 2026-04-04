import { cookies } from "next/headers";
import {
  CHAT_UI_LANGUAGE_COOKIE,
  resolveChatLocale,
  type ChatLocale,
} from "@/lib/i18n/chat-ui";

export type AppLanguage = ChatLocale;
export type SystemLanguageMode = "follow-content" | "manual";

export const CONTENT_LANGUAGE_COOKIE = "sparkcore_content_lang";
export const SYSTEM_LANGUAGE_MODE_COOKIE = "sparkcore_system_lang_mode";

export const DEFAULT_CONTENT_LANGUAGE: AppLanguage = "en";
export const DEFAULT_SYSTEM_LANGUAGE: AppLanguage = "en";
export const DEFAULT_SYSTEM_LANGUAGE_MODE: SystemLanguageMode = "follow-content";

export function resolveAppLanguage(value: string | undefined | null): AppLanguage {
  return resolveChatLocale(value ?? undefined);
}

export function resolveSystemLanguageMode(
  value: string | undefined | null,
): SystemLanguageMode {
  return value === "manual" ? "manual" : DEFAULT_SYSTEM_LANGUAGE_MODE;
}

export type SiteLanguageState = {
  contentLanguage: AppLanguage;
  systemLanguage: AppLanguage;
  systemLanguageMode: SystemLanguageMode;
  effectiveSystemLanguage: AppLanguage;
};

export async function getSiteLanguageState(): Promise<SiteLanguageState> {
  const cookieStore = await cookies();
  return readSiteLanguageStateFromValues({
    contentLanguage: cookieStore.get(CONTENT_LANGUAGE_COOKIE)?.value,
    systemLanguage: cookieStore.get(CHAT_UI_LANGUAGE_COOKIE)?.value,
    systemLanguageMode: cookieStore.get(SYSTEM_LANGUAGE_MODE_COOKIE)?.value,
  });
}

export function readSiteLanguageStateFromValues(args: {
  contentLanguage?: string;
  systemLanguage?: string;
  systemLanguageMode?: string;
}): SiteLanguageState {
  const contentLanguage = resolveAppLanguage(args.contentLanguage);
  const systemLanguage = contentLanguage;
  const systemLanguageMode = DEFAULT_SYSTEM_LANGUAGE_MODE;

  return {
    contentLanguage,
    systemLanguage,
    systemLanguageMode,
    effectiveSystemLanguage: contentLanguage,
  };
}

export function getLanguageName(language: AppLanguage, systemLanguage: AppLanguage) {
  const names =
    systemLanguage === "zh-CN"
      ? { en: "英文", "zh-CN": "中文" }
      : { en: "English", "zh-CN": "Chinese" };

  return names[language];
}

export function getLanguagePreferenceCopy(systemLanguage: AppLanguage) {
  if (systemLanguage === "zh-CN") {
    return {
      contentLanguageLabel: "语言",
      contentLanguageHint:
        "统一控制营销页、控制台、设置和操作界面的显示语言。",
      systemLanguageLabel: "语言",
      systemLanguageHint:
        "统一控制整个站点的显示语言。",
      followContentLanguage: "跟随站点语言",
      languageOptions: { en: "English", "zh-CN": "中文" },
      savePreferences: "保存语言",
      savingPreferences: "保存中...",
      savedMessage: "语言已保存。",
    };
  }

  return {
    contentLanguageLabel: "Language",
    contentLanguageHint:
      "Controls the display language across marketing pages, console, settings, and operational UI.",
    systemLanguageLabel: "Language",
    systemLanguageHint:
      "Controls the display language across the whole site.",
    followContentLanguage: "Follow site language",
    languageOptions: { en: "English", "zh-CN": "Chinese" },
    savePreferences: "Save language",
    savingPreferences: "Saving...",
    savedMessage: "Language saved.",
  };
}

export function getSiteChromeCopy(systemLanguage: AppLanguage) {
  if (systemLanguage === "zh-CN") {
    return {
      marketing: {
        brandTagline: "关系型 AI 操作系统",
        footerBrandTagline: "能长期记住你的 AI 伴侣",
        footerSummary:
          "Lagun 把持续关系、IM 延续、记忆修复与网页控制台整合成一个长期循环。",
        footerBuiltFor: "为重视长期关系连续性的 AI 伴侣体验而设计。",
        footerGroups: {
          landing: "落地页",
          blog: "博客",
          product: "产品",
          trust: "信任",
        },
        footerLinks: {
          memory: "记忆",
          imChat: "IM 聊天",
          faq: "常见问题",
          blogHome: "博客首页",
          characterAiAlt: "Character.AI 替代品",
          replikaAlt: "Replika 替代品",
          aiCompanion: "AI 伴侣",
          aiGirlfriend: "AI 女友",
          aiRoleplay: "AI 角色扮演",
          aiAssistant: "AI 助手",
          memoryGuide: "记忆指南",
          imGuide: "IM 指南",
          pricing: "定价",
          howItWorks: "工作原理",
          privacy: "隐私",
          safety: "安全",
          privacyPolicy: "隐私政策",
          terms: "服务条款",
        },
        ctas: {
          signIn: "登录",
          console: "控制台",
          createYours: "开始创建",
          createRole: "创建角色",
          continueFlow: "继续",
        },
      },
      nav: {
        primaryLabel: "主导航",
        companionGroup: "伴侣类型",
        compareGroup: "对比",
        companionLinks: {
          aiCompanion: "AI 伴侣",
          aiGirlfriend: "AI 女友",
          aiRoleplay: "AI 角色扮演",
          aiAssistant: "AI 助手",
        },
        compareLinks: {
          characterAiAlt: "Character.AI 替代品",
          replikaAlt: "Replika 替代品",
        },
        imChat: "IM 聊天",
      },
      contentSwitch: {
        label: "内容语言",
      },
      console: {
        navLabel: "控制台",
        quickLinksLabel: "快捷入口",
        exitToSite: "← 返回站点",
        viewRole: "查看角色",
        sections: {
          chat: "聊天",
          role: "角色",
          knowledge: "知识",
          channels: "渠道",
          settings: "设置",
        },
        descriptions: {
          chat: "继续当前对话",
          role: "定义伴侣角色并查看记忆",
          knowledge: "管理角色可调用的知识来源",
          channels: "连接并管理 IM 渠道",
          settings: "账户、模型与偏好",
        },
        quickLinks: {
          role: "角色",
          channels: "渠道",
        },
        status: {
          noRoleYet: "暂无角色",
          noRoleDescription: "先创建一个角色，关系循环才会开始。",
          imLive: "IM 已连接",
          webOnly: "仅网页",
          needsAttention: "需要处理",
          setupNeeded: "尚未完成设置",
          noImConnected: "还没有连接 IM",
          backToChat: "返回聊天",
        },
      },
      settings: {
        pageEyebrow: "设置",
        pageTitle: "设置",
        pageDescription: "管理你的账户、模型、订阅和应用偏好。",
        account: "账户",
        signOut: "退出登录",
        signingOut: "退出中...",
        googleAccount: "Google 账户",
        legacy: "旧版",
        id: "ID",
        aiModel: "AI 模型",
        saveModelSettings: "保存模型设置",
        saving: "保存中...",
        subscription: "订阅",
        renewsOn: "续费于",
        manageBilling: "管理账单",
        credits: "积分",
        upgradeToPro: "升级到 Pro",
        appPreferences: "应用偏好",
        theme: "主题",
        systemDefault: "跟随系统",
        light: "浅色",
        dark: "深色",
        dataPrivacy: "数据与隐私",
        privacyDescription: "查看你的数据如何被处理和存储。",
        privacyPolicy: "隐私政策 ↗",
        terms: "服务条款 ↗",
        dangerZone: "危险区域",
        signOutAllDevices: "退出所有设备",
        signOutAllDevicesHint: "结束所有设备上的活动会话。",
        deleteAccount: "删除账户",
        deleteAccountHint: "永久删除账户及相关工作区数据。",
      },
      homepage: {
        heading: "创建一位会记住你的 AI 伴侣。",
        lead:
          "先定义对方是谁、性格如何，再开始。长期记忆与 IM 延续会让关系每次都在深化，而不是重置。",
        presetsKicker: "预设",
        presetsTitle: "从预设开始，之后都能改。",
        presetsBody:
          "先选下面三个起点之一。它会填充上方表单中的名字、语气和人格设定，但你在创建前可以改掉任何部分。",
        imKicker: "IM 聊天",
        imTitle: "在网页完成配置，在 IM 里延续关系。",
        imPanelTitle: "网页负责配置和控制，IM 才是关系持续发生的地方。",
        imBullets: [
          "先在网页创建角色和线程。",
          "连接 Telegram，同一段关系会在那里继续。",
          "只有需要修复记忆或渠道时再回到网页。",
        ],
        imGuide: "查看 IM 指南",
        memoryKicker: "记忆",
        memoryTitle: "记忆保持可见，而不是藏在黑箱里。",
        memoryPanelTitle: "检查、追踪并修复伴侣记住的内容。",
        memoryBullets: [
          "记住的内容会以可查看的记忆条目呈现。",
          "能追溯到生成它的具体对话。",
          "支持隐藏、标错与恢复修复。",
        ],
        memoryGuide: "查看记忆指南",
        faqKicker: "FAQ",
        faqTitle: "关于你的 AI 伴侣，常见问题如下。",
        faqBody:
          "Lagun 的设计不同于普通聊天机器人。下面这些回答会更具体地说明记忆、IM 和隐私闭环是如何工作的。",
        readyKicker: "准备好了？",
        ctaTitle: "创建你的伴侣，连接 IM，让关系持续推进。",
        ctaBody:
          "先起名、选语气、开始第一段对话。之后的关系循环会沿着记忆、IM 延续和隐私控制继续展开。",
        createCompanion: "创建我的伴侣",
        seeHowItWorks: "查看工作原理",
        previewRoles: {
          you: "你",
          companion: "伴侣",
          system: "系统",
        },
      },
    };
  }

  return {
    marketing: {
      brandTagline: "Relationship operating system",
      footerBrandTagline: "Long-memory companion",
      footerSummary:
        "Lagun packages one persistent relationship loop across role setup, IM continuity, memory review, and the web control center.",
      footerBuiltFor: "Built for relationship-first companion products.",
      footerGroups: {
        landing: "Landing",
        blog: "Blog",
        product: "Product",
        trust: "Trust",
      },
      footerLinks: {
        memory: "Memory",
        imChat: "IM Chat",
        faq: "FAQ",
        blogHome: "Blog home",
        characterAiAlt: "Character.AI Alternative",
        replikaAlt: "Replika Alternative",
        aiCompanion: "AI Companion",
        aiGirlfriend: "AI Girlfriend",
        aiRoleplay: "AI Roleplay Chat",
        aiAssistant: "AI Assistant",
        memoryGuide: "Memory Guide",
        imGuide: "IM Chat Guide",
        pricing: "Pricing",
        howItWorks: "How It Works",
        privacy: "Privacy",
        safety: "Safety",
        privacyPolicy: "Privacy Policy",
        terms: "Terms of Service",
      },
      ctas: {
        signIn: "Sign in",
        console: "Console",
        createYours: "Create yours",
        createRole: "Create role",
        continueFlow: "Continue flow",
      },
    },
    nav: {
      primaryLabel: "Primary",
      companionGroup: "Companions",
      compareGroup: "Compare",
      companionLinks: {
        aiCompanion: "AI Companion",
        aiGirlfriend: "AI Girlfriend",
        aiRoleplay: "AI Roleplay Chat",
        aiAssistant: "AI Assistant",
      },
      compareLinks: {
        characterAiAlt: "Character.AI Alternative",
        replikaAlt: "Replika Alternative",
      },
      imChat: "IM Chat",
    },
    contentSwitch: {
      label: "Content language",
    },
    console: {
      navLabel: "Console",
      quickLinksLabel: "Quick links",
      exitToSite: "← Back to site",
      viewRole: "View role",
      sections: {
        chat: "Chat",
        role: "Role",
        knowledge: "Knowledge",
        channels: "Channels",
        settings: "Settings",
      },
      descriptions: {
        chat: "Continue the current relationship thread",
        role: "Define the companion and review memory",
        knowledge: "Manage the sources the companion can use",
        channels: "Connect and maintain IM paths",
        settings: "Account, model, and preferences",
      },
      quickLinks: {
        role: "Role",
        channels: "Channels",
      },
      status: {
        noRoleYet: "No role yet",
        noRoleDescription: "Create a role to start the relationship loop.",
        imLive: "IM live",
        webOnly: "Web only",
        needsAttention: "Needs attention",
        setupNeeded: "Setup needed",
        noImConnected: "No IM connected",
        backToChat: "Back to chat",
      },
    },
    settings: {
      pageEyebrow: "Settings",
      pageTitle: "Settings",
      pageDescription: "Manage your account, model, subscription, and app preferences.",
      account: "Account",
      signOut: "Sign out",
      signingOut: "Signing out...",
      googleAccount: "Google account",
      legacy: "Legacy",
      id: "ID",
      aiModel: "AI Model",
      saveModelSettings: "Save model settings",
      saving: "Saving...",
      subscription: "Subscription",
      renewsOn: "Renews",
      manageBilling: "Manage billing",
      credits: "Credits",
      upgradeToPro: "Upgrade to Pro",
      appPreferences: "App preferences",
      theme: "Theme",
      systemDefault: "System",
      light: "Light",
      dark: "Dark",
      dataPrivacy: "Data & Privacy",
      privacyDescription: "Review how your data is handled and stored.",
      privacyPolicy: "Privacy Policy ↗",
      terms: "Terms of Service ↗",
      dangerZone: "Danger zone",
      signOutAllDevices: "Sign out all devices",
      signOutAllDevicesHint: "End all active sessions across every device.",
      deleteAccount: "Delete account",
      deleteAccountHint: "Permanently remove your account and related workspace data.",
    },
    homepage: {
      heading: "Create an AI companion that remembers you.",
      lead:
        "Choose who they are, shape their personality, and begin. Long memory and IM continuity mean the connection deepens, not resets, every time.",
      presetsKicker: "Presets",
      presetsTitle: "Start with a preset. Adjust anything you want.",
      presetsBody:
        "Pick one of the three starting points below. It fills in the form above, but you can change any of it before creating.",
      imKicker: "IM Chat",
      imTitle: "Set up on web. Keep the relationship alive in IM.",
      imPanelTitle: "Web is for setup and control. IM is where the bond continues.",
      imBullets: [
        "Create the role and thread once on web.",
        "Connect Telegram. The same relationship continues there.",
        "Return to web only when you need memory or channel repair.",
      ],
      imGuide: "Read the IM chat guide",
      memoryKicker: "Memory",
      memoryTitle: "Memory that stays visible, not hidden in a black box.",
      memoryPanelTitle: "Inspect, trace, and repair what the companion remembers.",
      memoryBullets: [
        "Visible memory rows you can inspect anytime.",
        "Source trace back to the conversation that created it.",
        "Repair actions: hide, mark incorrect, or restore.",
      ],
      memoryGuide: "Memory guide",
      faqKicker: "FAQ",
      faqTitle: "Common questions about your AI companion.",
      faqBody:
        "Lagun is built differently from a generic chatbot. These answers explain how the memory, IM, and privacy loop actually works.",
      readyKicker: "Ready?",
      ctaTitle: "Create your companion. Connect IM. Keep the relationship moving.",
      ctaBody:
        "Choose a name, pick a tone, and start the first conversation. The rest of the relationship loop follows from there.",
      createCompanion: "Create my companion",
      seeHowItWorks: "See how it works",
      previewRoles: {
        you: "You",
        companion: "Companion",
        system: "System",
      },
    },
  };
}
