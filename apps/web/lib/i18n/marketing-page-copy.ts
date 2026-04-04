import { getLocalizedValue, type LocalizedValue } from "@/lib/i18n/localized";
import type { AppLanguage } from "@/lib/i18n/site";

type FeatureItem = {
  title: string;
  body: string;
};

type HowItWorksCopy = {
  eyebrow: string;
  title: string;
  description: string;
  items: FeatureItem[];
  create: string;
  continue: string;
  seeIm: string;
  createRoleFirst: string;
  connectIm: string;
  openChat: string;
  memoryCenter: string;
};

type PricingCadence = {
  label: string;
  price: string;
  period: string;
  note: string | null;
  badge: string | null;
};

type PricingCopy = {
  eyebrow: string;
  title: string;
  description: string;
  free: string;
  freeDesc: string;
  pro: string;
  recommended: string;
  proDesc: string;
  monthly: string;
  quarterly: string;
  yearly: string;
  save11: string;
  save44: string;
  startFree: string;
  onFree: string;
  getStarted: string;
  createCompanion: string;
  upgrade: string;
  footnote: string;
  faq: string;
  freeFeatures: string[];
  proFeatures: string[];
  cadences: PricingCadence[];
};

type FaqCopy = {
  eyebrow: string;
  title: string;
  description: string;
  items: FeatureItem[];
  create: string;
  continue: string;
  memory: string;
  privacy: string;
};

type SafetyCopy = {
  eyebrow: string;
  title: string;
  description: string;
  items: FeatureItem[];
  create: string;
  continue: string;
  privacy: string;
  faq: string;
};

type AiBoyfriendCopy = {
  eyebrow: string;
  title: string;
  description: string;
  items: FeatureItem[];
  create: string;
  continue: string;
  imHow: string;
  roleFirst: string;
  connectIm: string;
  openChat: string;
  companionOverview: string;
};

type BlogCopy = {
  eyebrow: string;
  title: string;
  description: string;
  comparisons: string;
  comparisonsTitle: string;
  comparisonsBody: string;
  guides: string;
  guidesTitle: string;
  guidesBody: string;
  readComparison: string;
  openGuide: string;
};

type FeaturePageCopy = {
  eyebrow: string;
  title: string;
  description: string;
  items: FeatureItem[];
  create: string;
  firstRole: string;
  secondary: string;
  tertiary?: string;
  connectIm?: string;
  openChat?: string;
};

const HOW_IT_WORKS_COPY: LocalizedValue<HowItWorksCopy> = {
  "zh-CN": {
    eyebrow: "工作原理",
    title: "创建你的伴侣，连接 IM，让同一段关系持续下去。",
    description:
      "第一阶段体验刻意保持简单：网站负责搭建起点，IM 负责承接日常关系，控制中心负责管理长期状态。",
    items: [
      {
        title: "1. 创建你的伴侣",
        body: "选择关系优先模式，设定最初的角色核心，并生成你想持续互动的角色。",
      },
      {
        title: "2. 连接你的 IM",
        body: "把伴侣绑定到受支持的 IM 入口，让主要互动循环进入你熟悉的聊天渠道。",
      },
      {
        title: "3. 返回控制中心",
        body: "通过网站查看记忆、关系状态和渠道健康，而不是把它做成一个普通网页聊天工具。",
      },
    ],
    create: "创建你的伴侣",
    continue: "继续关系流程",
    seeIm: "查看 IM 流程",
    createRoleFirst: "先创建角色",
    connectIm: "连接 IM 渠道",
    openChat: "打开网页对话",
    memoryCenter: "查看记忆中心",
  },
  en: {
    eyebrow: "How it works",
    title: "Create your companion, connect IM, and keep one relationship going.",
    description:
      "The first-stage experience is intentionally simple. The website sets things up. IM carries the daily relationship. The control center helps you manage long-term state.",
    items: [
      {
        title: "1. Create your companion",
        body: "Choose a relationship-first mode, set the initial role core, and generate the character you want to continue with.",
      },
      {
        title: "2. Connect your IM",
        body: "Bind the companion to a supported IM entry so the main interaction loop moves into a familiar channel.",
      },
      {
        title: "3. Return to the control center",
        body: "Use the website to review memory, relationship state, and channel health without turning it into a generic chat workspace.",
      },
    ],
    create: "Create your companion",
    continue: "Continue relationship flow",
    seeIm: "See IM chat flow",
    createRoleFirst: "Create a role first",
    connectIm: "Connect an IM channel",
    openChat: "Open supplementary chat",
    memoryCenter: "Explore the memory center",
  },
};

const PRICING_COPY: LocalizedValue<PricingCopy> = {
  "zh-CN": {
    eyebrow: "定价",
    title: "一个免费版，一个 Pro 版，没有隐藏层级。",
    description: "两个版本都包含长期记忆和 IM 渠道接入。Pro 解锁更强模型和更高月额度。",
    free: "免费版",
    freeDesc: "从零开始建立关系。记忆和 IM 能力免费包含。",
    pro: "Pro",
    recommended: "推荐",
    proDesc: "为高频关系循环提供更强模型能力和更高月配额。",
    monthly: "月付",
    quarterly: "季付",
    yearly: "年付",
    save11: "省 11%",
    save44: "省 44%",
    startFree: "免费开始",
    onFree: "你当前是免费版",
    getStarted: "开始使用",
    createCompanion: "创建你的伴侣",
    upgrade: "升级到 Pro",
    footnote:
      "所有方案都包含长期记忆、IM 渠道连接和网页控制中心。扩展图片与音频用量的积分仅在 Pro 中提供。",
    faq: "查看套餐和积分常见问题 →",
    freeFeatures: [
      "伴侣聊天标准文本模型",
      "伴侣头像标准图片模型",
      "每月 10 次图片生成",
      "每月 15 分钟音频时长",
      "可检查、可修复的长期记忆中心",
      "IM 渠道连接（Telegram、微信等）",
    ],
    proFeatures: [
      "高级文本模型，回复质量更高",
      "高级图片模型，头像质量更高",
      "每月 80 次图片生成",
      "每月 120 分钟音频时长",
      "支持扩展图片和音频使用的积分",
      "包含 Free 全部权益",
    ],
    cadences: [
      { label: "月付", price: "$14.99", period: "/ 月", note: null, badge: null },
      { label: "季付", price: "$39.99", period: "/ 季", note: "~$13.33 / 月", badge: "省 11%" },
      { label: "年付", price: "$99.99", period: "/ 年", note: "~$8.33 / 月", badge: "省 44%" },
    ],
  },
  en: {
    eyebrow: "Pricing",
    title: "One free plan. One Pro plan. No hidden tiers.",
    description:
      "Both plans include long-memory and IM channel access. Pro unlocks premium models and higher monthly allowances.",
    free: "Free",
    freeDesc: "Start building a relationship. Memory and IM are included at no cost.",
    pro: "Pro",
    recommended: "Recommended",
    proDesc: "More model power and higher monthly allowances for an active relationship loop.",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    save11: "Save 11%",
    save44: "Save 44%",
    startFree: "Start free",
    onFree: "You're on Free",
    getStarted: "Get started",
    createCompanion: "Create your companion",
    upgrade: "Upgrade to Pro",
    footnote:
      "All plans include long-memory, IM channel connection, and the web control center. Credits for extended image and audio usage are available on Pro.",
    faq: "Common questions about plans and credits →",
    freeFeatures: [
      "Standard text model for companion chat",
      "Standard image model for companion portraits",
      "10 image generations per month",
      "15 audio minutes per month",
      "Long-memory center with inspect and repair",
      "IM channel connection (Telegram, WeChat, etc.)",
    ],
    proFeatures: [
      "Premium text model — higher quality responses",
      "Premium image model — higher quality portraits",
      "80 image generations per month",
      "120 audio minutes per month",
      "Credits for extended image and audio usage",
      "Everything in Free",
    ],
    cadences: [
      { label: "Monthly", price: "$14.99", period: "/ mo", note: null, badge: null },
      { label: "Quarterly", price: "$39.99", period: "/ qtr", note: "~$13.33 / mo", badge: "Save 11%" },
      { label: "Yearly", price: "$99.99", period: "/ yr", note: "~$8.33 / mo", badge: "Save 44%" },
    ],
  },
};

const FAQ_COPY: LocalizedValue<FaqCopy> = {
  "zh-CN": {
    eyebrow: "FAQ",
    title: "关于记忆、IM 和网站控制中心的常见问题。",
    description:
      "这些回答解释了 Lagun 与普通浏览器聊天机器人的不同，包括记忆、IM 连续性、隐私和网页控制中心。",
    items: [
      {
        title: "这是 AI 女友，还是 AI 伴侣？",
        body: "在 Lagun 里，AI 伴侣是更大的产品类别。AI 女友、AI 男友和角色扮演入口，都是同一套系统里的不同关系模式。",
      },
      {
        title: "它会记得过去的聊天吗？",
        body: "会。长期记忆是产品的核心能力，而记忆中心也专门做成了可查看、可修正的形式，让你能随时检查它记住了什么。",
      },
      {
        title: "我必须在网站上聊天吗？",
        body: "不需要。网站主要用于配置、查看记忆、管理渠道和隐私控制。主要关系循环设计在 IM 中持续发生。",
      },
      {
        title: "支持哪些 IM 应用？",
        body: "当前产品流程是在创建角色后连接受支持的 IM 渠道。渠道支持被做成显式产品控制面，而不是隐藏配置。",
      },
      {
        title: "我能控制或删除记忆吗？",
        body: "你可以查看记忆、隐藏条目、标记错误，并通过网页控制层修复发生漂移的关系状态。",
      },
      {
        title: "隐私安全吗？",
        body: "隐私通过明确边界、可见记忆和渠道感知来处理，让关系连续性不必建立在黑箱感上。",
      },
    ],
    create: "创建你的伴侣",
    continue: "继续关系流程",
    memory: "查看记忆中心",
    privacy: "查看隐私控制",
  },
  en: {
    eyebrow: "FAQ",
    title: "Common questions about memory, IM, and the website control center.",
    description:
      "These answers explain how Lagun differs from a generic browser chatbot: covering memory, IM continuity, privacy, and the web control center.",
    items: [
      {
        title: "Is this an AI girlfriend or an AI companion?",
        body: "Lagun uses AI companion as the broader product category. AI girlfriend, AI boyfriend, and roleplay entry points are relationship modes inside the same system.",
      },
      {
        title: "Does it remember past chats?",
        body: "Yes. Long memory is a core part of the product, and the memory center is designed so remembered state can be reviewed and repaired.",
      },
      {
        title: "Do I need to chat on the website?",
        body: "No. The website is mainly for setup, memory review, channel management, and privacy control. The main relationship loop is designed to live in IM.",
      },
      {
        title: "Which IM apps are supported?",
        body: "The current product flow is built around connecting supported IM channels after role creation. Channel support is exposed as a product control surface rather than hidden setup state.",
      },
      {
        title: "Can I control or delete memories?",
        body: "You can inspect memory, hide entries, mark them incorrect, and use the web control layer to repair relationship state when it drifts.",
      },
      {
        title: "Is it private?",
        body: "Privacy is handled through explicit boundaries, visible memory, and channel awareness so relationship continuity does not have to feel like a black box.",
      },
    ],
    create: "Create your companion",
    continue: "Continue relationship flow",
    memory: "Review memory center",
    privacy: "Review privacy controls",
  },
};

const SAFETY_COPY: LocalizedValue<SafetyCopy> = {
  "zh-CN": {
    eyebrow: "安全",
    title: "关系型 AI 需要明确边界、可见控制和更稳妥的预期。",
    description:
      "Lagun 并不打算成为一个无限制的幻想沙盒。产品方向更强调连续性、可控性，以及更值得信任的控制界面。",
    items: [
      {
        title: "边界很重要",
        body: "角色行为和关系设置应通过明确边界来塑造，而不是依赖模糊的隐藏默认值。",
      },
      {
        title: "记忆应保持可管理",
        body: "用户需要看到系统携带了什么，并在必要时纠正它。",
      },
      {
        title: "IM 不等于失去控制",
        body: "即使主要互动发生在 IM，也仍然需要网页控制中心来处理渠道状态、隐私和修复流程。",
      },
    ],
    create: "创建你的伴侣",
    continue: "继续关系流程",
    privacy: "查看隐私控制",
    faq: "阅读 FAQ",
  },
  en: {
    eyebrow: "Safety",
    title: "Relationship-oriented AI needs clear boundaries, visible controls, and grounded expectations.",
    description:
      "Lagun is not trying to become an unrestricted fantasy sandbox. The product direction emphasizes continuity, controllability, and a more trustworthy control surface.",
    items: [
      {
        title: "Boundaries matter",
        body: "Role behavior and relationship settings should be shaped with explicit boundaries instead of vague hidden defaults.",
      },
      {
        title: "Memory should stay manageable",
        body: "Users need to see what the system is carrying and be able to correct it when necessary.",
      },
      {
        title: "IM does not remove control",
        body: "Keeping the main interaction in IM still requires a web control center for channel state, privacy, and repair flows.",
      },
    ],
    create: "Create your companion",
    continue: "Continue relationship flow",
    privacy: "Review privacy controls",
    faq: "Read the FAQ",
  },
};

const AI_BOYFRIEND_COPY: LocalizedValue<AiBoyfriendCopy> = {
  "zh-CN": {
    eyebrow: "关系",
    title: "一个更稳、更有连续感的 AI 男友体验，能真正把关系延续下去。",
    description:
      "Lagun 把 AI 男友看作同一套伴侣系统里的关系配置，而不是套在通用聊天上的一次性恋爱皮肤。",
    items: [
      {
        title: "更稳定的一致存在感",
        body: "这个角色可以把语气、共享上下文和关系状态带到以后，而不是每次打开标签页都重新开始。",
      },
      {
        title: "为持续联系而设计",
        body: "IM 保持为日常主界面，让关系更容易维持，而不必把每一次联系都变成浏览器会话。",
      },
      {
        title: "在重要时刻提供可见控制",
        body: "网站给你一个查看记忆、调整角色核心、管理渠道和保持隐私清晰的地方。",
      },
    ],
    create: "创建你的 AI 男友",
    continue: "继续关系流程",
    imHow: "查看 IM 连续性如何工作",
    roleFirst: "先创建角色",
    connectIm: "连接 IM 渠道",
    openChat: "打开网页对话",
    companionOverview: "想先看更完整的伴侣概览？",
  },
  en: {
    eyebrow: "Relationship",
    title: "A grounded AI boyfriend experience with continuity, memory, and room to actually continue.",
    description:
      "Lagun treats AI boyfriend as a relationship configuration inside one companion system, not as a disposable romance skin on top of generic chat.",
    items: [
      {
        title: "More consistent presence",
        body: "The role can keep tone, shared context, and relationship state over time instead of resetting every time you open a tab.",
      },
      {
        title: "Built for ongoing contact",
        body: "IM stays the main daily surface, which makes the bond easier to maintain without turning every moment into a browser session.",
      },
      {
        title: "Visible control when it matters",
        body: "The website gives you a place to review memory, tune the role core, manage channels, and keep privacy legible.",
      },
    ],
    create: "Create your AI boyfriend",
    continue: "Continue relationship flow",
    imHow: "See how IM continuity works",
    roleFirst: "Create a role first",
    connectIm: "Connect an IM channel",
    openChat: "Open supplementary chat",
    companionOverview: "Want the broader companion overview?",
  },
};

const BLOG_COPY: LocalizedValue<BlogCopy> = {
  "zh-CN": {
    eyebrow: "博客",
    title: "围绕关系优先型 AI 伴侣产品的指南与对比。",
    description: "热门产品对比、功能解释，以及对长期记忆 AI 伴侣意味着什么的深入说明。",
    comparisons: "对比",
    comparisonsTitle: "看看 Lagun 与主流 AI 伴侣应用有什么不同。",
    comparisonsBody: "长期记忆连续性和 IM 原生设计带来的差异是实质性的，这些对比会把它们讲清楚。",
    guides: "指南",
    guidesTitle: "在深入使用之前，先理解这个产品。",
    guidesBody: "这些指南会解释记忆如何工作、IM 连续性如何接入，以及关系优先型伴侣与普通聊天机器人的差别。",
    readComparison: "阅读这篇对比",
    openGuide: "打开这篇指南",
  },
  en: {
    eyebrow: "Blog",
    title: "Guides and comparisons for relationship-first AI companion products.",
    description: "Comparisons with popular apps, feature explainers, and deep dives into what long-memory AI companionship actually means.",
    comparisons: "Comparisons",
    comparisonsTitle: "See how Lagun compares to popular AI companion apps.",
    comparisonsBody: "Long-memory continuity and IM-native design make for meaningful differences. These comparisons lay them out clearly.",
    guides: "Guides",
    guidesTitle: "Understand the product before you dive in.",
    guidesBody: "These guides explain how memory works, how IM continuity fits in, and what makes a relationship-first companion different from a generic chatbot.",
    readComparison: "Read this comparison",
    openGuide: "Open this guide",
  },
};

const IM_CHAT_FEATURE_COPY: LocalizedValue<FeaturePageCopy> = {
  "zh-CN": {
    eyebrow: "功能",
    title: "IM 原生聊天，让关系留在日常本来就在发生的地方。",
    description:
      "Lagun 把 IM 当作主要互动界面，网站则作为配置、记忆和关系状态的控制中心，而不是强迫每次聊天都回到浏览器。",
    items: [
      {
        title: "自然入口",
        body: "人们本来就整天使用 IM，把伴侣放在那里能降低摩擦，也更容易形成稳定回访。",
      },
      {
        title: "共享状态，而不是镜像噪音",
        body: "核心线程和关系状态保持共享，但网站消息不必机械镜像成 IM 气泡。",
      },
      {
        title: "网站作为控制中心",
        body: "IM 保持轻量，网站则负责配置、渠道控制和记忆可见性。",
      },
    ],
    create: "创建你的伴侣",
    firstRole: "创建第一个角色",
    secondary: "查看连接流程",
    connectIm: "连接 IM 渠道",
    openChat: "打开网页对话",
  },
  en: {
    eyebrow: "Feature",
    title: "IM-native chat keeps the relationship where daily life already happens.",
    description:
      "Lagun treats IM as the main interaction surface. The website acts as a control center for setup, memory, and relationship state rather than forcing every conversation back into the browser.",
    items: [
      {
        title: "Natural entry point",
        body: "People already use IM all day. Keeping the companion there lowers friction and supports steady return behavior.",
      },
      {
        title: "Shared state, not mirrored clutter",
        body: "The canonical thread and relationship state stay shared, but website messages do not have to become mirrored IM bubbles.",
      },
      {
        title: "Website as control center",
        body: "IM stays lightweight while the website handles configuration, channel control, and memory visibility.",
      },
    ],
    create: "Create your companion",
    firstRole: "Create your first role",
    secondary: "See the connect flow",
    connectIm: "Connect an IM channel",
    openChat: "Open supplementary chat",
  },
};

const MEMORY_CENTER_FEATURE_COPY: LocalizedValue<FeaturePageCopy> = {
  "zh-CN": {
    eyebrow: "功能",
    title: "记忆中心让长期关系状态保持可见且可修正。",
    description:
      "Lagun 不把记忆当成不透明的副作用。产品设计目标是让你理解系统记住了什么、为什么重要，以及它如何影响连续性。",
    items: [
      {
        title: "可见记忆",
        body: "用户可以检查伴侣携带了哪些长期记忆，而不是只能猜测。",
      },
      {
        title: "纠正控制",
        body: "隐藏、标错和恢复流程，让记忆保持可用，同时不让关系显得脆弱。",
      },
      {
        title: "关系信任",
        body: "记忆可见性是产品承诺的一部分，不只是“它记得你”，还包括“你能管理这种连续性”。",
      },
    ],
    create: "创建你的伴侣",
    firstRole: "创建第一个角色",
    secondary: "打开记忆中心",
    tertiary: "查看伴侣概览",
  },
  en: {
    eyebrow: "Feature",
    title: "Memory center makes long-term relationship state visible and correctable.",
    description:
      "Lagun does not treat memory as an opaque side effect. The product is designed so you can understand what is remembered, why it matters, and how it affects continuity.",
    items: [
      {
        title: "Visible memory",
        body: "Users can inspect what the companion is carrying as long-term memory instead of guessing.",
      },
      {
        title: "Corrective controls",
        body: "Hide, mark incorrect, and restore flows help keep memory useful without making the relationship feel brittle.",
      },
      {
        title: "Relationship trust",
        body: "Memory visibility is part of the product promise: not just that the companion remembers you, but that you can manage that continuity.",
      },
    ],
    create: "Create your companion",
    firstRole: "Create your first role",
    secondary: "Open memory center",
    tertiary: "See the companion overview",
  },
};

const PRIVACY_CONTROLS_FEATURE_COPY: LocalizedValue<FeaturePageCopy> = {
  "zh-CN": {
    eyebrow: "功能",
    title: "隐私控制从可见记忆和明确边界开始。",
    description:
      "Lagun 不应该要求用户相信隐藏的保留规则。隐私的第一层，是让记忆、追踪和渠道边界足够可见、可检查、可修复。",
    items: [
      {
        title: "可见，而非不透明",
        body: "用户能看到长期记忆里具体存在什么，而不是只能相信后台模糊承诺。",
      },
      {
        title: "纠正控制",
        body: "隐藏、标错和恢复动作，可以修复已记住的状态，而不是假装系统不可变。",
      },
      {
        title: "渠道边界感知",
        body: "产品会显示哪些 IM 渠道已接入当前关系，让用户理解连续性是从哪里进入的。",
      },
    ],
    create: "创建你的伴侣",
    firstRole: "创建第一个角色",
    secondary: "打开设置",
    tertiary: "查看 AI 女友",
  },
  en: {
    eyebrow: "Feature",
    title: "Privacy controls start with visible memory and explicit boundaries.",
    description:
      "Lagun should not ask people to trust hidden retention rules. The first layer of privacy is making memory, trace, and channel boundaries visible enough to inspect and repair.",
    items: [
      {
        title: "Visible, not opaque",
        body: "Users can see what long-term memory exists instead of treating privacy as a vague promise behind the scenes.",
      },
      {
        title: "Corrective controls",
        body: "Hide, mark incorrect, and restore actions help repair remembered state without pretending the system is immutable.",
      },
      {
        title: "Channel boundary awareness",
        body: "The product shows which IM channels are attached to the relationship so users can understand where continuity is entering from.",
      },
    ],
    create: "Create your companion",
    firstRole: "Create your first role",
    secondary: "Open settings",
    tertiary: "Explore AI girlfriend",
  },
};

export function getHowItWorksCopy(language: AppLanguage) {
  return getLocalizedValue(language, HOW_IT_WORKS_COPY);
}

export function getPricingCopy(language: AppLanguage) {
  return getLocalizedValue(language, PRICING_COPY);
}

export function getFaqCopy(language: AppLanguage) {
  return getLocalizedValue(language, FAQ_COPY);
}

export function getSafetyCopy(language: AppLanguage) {
  return getLocalizedValue(language, SAFETY_COPY);
}

export function getAiBoyfriendCopy(language: AppLanguage) {
  return getLocalizedValue(language, AI_BOYFRIEND_COPY);
}

export function getBlogCopy(language: AppLanguage) {
  return getLocalizedValue(language, BLOG_COPY);
}

export function getImChatFeatureCopy(language: AppLanguage) {
  return getLocalizedValue(language, IM_CHAT_FEATURE_COPY);
}

export function getMemoryCenterFeatureCopy(language: AppLanguage) {
  return getLocalizedValue(language, MEMORY_CENTER_FEATURE_COPY);
}

export function getPrivacyControlsFeatureCopy(language: AppLanguage) {
  return getLocalizedValue(language, PRIVACY_CONTROLS_FEATURE_COPY);
}
