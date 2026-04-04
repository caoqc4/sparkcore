import { getLocalizedValue, type LocalizedValue } from "@/lib/i18n/localized";
import type { AppLanguage } from "@/lib/i18n/site";

type ComparisonRow = {
  label: string;
  sparkcore: string;
  alternative: string;
};

type RivalProfile = {
  summary: string;
  strengths: Array<{ title: string; body: string }>;
};

type AlternativeLandingChromeCopy = {
  whySwitch: string;
  switchBullets: string[];
  about: (rival: string) => string;
  whatDoesWell: (rival: string) => string;
  whyAlternatives: string;
  whyAlternativesTitle: string;
  coreComparison: string;
  coreComparisonTitle: string;
  comparisonCategory: string;
  fits: string;
  fitsTitle: string;
  closingEyebrow: string;
  create: string;
  continue: string;
  howItWorks: string;
  connectInIm: string;
  createRoleFirst: string;
  connectIm: string;
  openChat: string;
};

type AlternativePageCopy = {
  eyebrow: string;
  title: string;
  description: string;
  rivalProfile: RivalProfile;
  switchReasons: string[];
  comparisonRows: ComparisonRow[];
  migrationFit: Array<{
    title: string;
    body: string;
  }>;
  closingTitle: string;
  closingBody: string;
};

const ALTERNATIVE_LANDING_CHROME_COPY: LocalizedValue<AlternativeLandingChromeCopy> = {
  "zh-CN": {
    whySwitch: "为什么切换",
    switchBullets: [
      "可检查、可修复的长期记忆",
      "IM 原生连续性，而不是只存在于应用内的聊天",
      "在网页上管理关系，而不把同一段关系拆开",
    ],
    about: (rival) => `关于 ${rival}`,
    whatDoesWell: (rival) => `${rival} 擅长什么`,
    whyAlternatives: "为什么人们会寻找替代品",
    whyAlternativesTitle: "当一段关系更像一次次会话，而不是持续状态时，切换通常就开始了。",
    coreComparison: "核心对比",
    coreComparisonTitle: "这里正是 Lagun 有意做出不同的地方。",
    comparisonCategory: "维度",
    fits: "适合谁",
    fitsTitle: "当你希望这段关系少一点重置感、多一点可控感时，就适合切换。",
    closingEyebrow: "切换到更强的关系循环",
    create: "创建你的伴侣",
    continue: "继续关系流程",
    howItWorks: "查看工作原理",
    connectInIm: "连接到 IM",
    createRoleFirst: "先创建角色",
    connectIm: "连接 IM 渠道",
    openChat: "打开补充聊天",
  },
  en: {
    whySwitch: "Why switch",
    switchBullets: [
      "Long memory you can inspect and repair",
      "IM-native continuity instead of app-contained chat only",
      "Relationship control on web without splitting the same bond",
    ],
    about: (rival) => `About ${rival}`,
    whatDoesWell: (rival) => `What ${rival} does well.`,
    whyAlternatives: "Why People Look For Alternatives",
    whyAlternativesTitle:
      "The switch usually starts when the relationship feels more session-like than continuous.",
    coreComparison: "Core Comparison",
    coreComparisonTitle: "This is where Lagun is intentionally different.",
    comparisonCategory: "Category",
    fits: "Who This Fits",
    fitsTitle: "Switch when you want the relationship to feel less reset and more governable.",
    closingEyebrow: "Switch With A Stronger Loop",
    create: "Create your companion",
    continue: "Continue relationship flow",
    howItWorks: "See how it works",
    connectInIm: "Connect in IM",
    createRoleFirst: "Create a role first",
    connectIm: "Connect an IM channel",
    openChat: "Open supplementary chat",
  },
};

const CHARACTER_AI_ALTERNATIVE_COPY: LocalizedValue<AlternativePageCopy> = {
  "zh-CN": {
    eyebrow: "替代方案",
    title: "一个更适合长期关系、并带长期记忆的 Character.AI 替代方案。",
    description:
      "如果你觉得 Character.AI 很有趣，但重置感太强、太局限在 App 内部，或者关系连续性太轻，Lagun 提供的是更强的长期记忆循环、IM 原生互动和真正可用的网页控制层。",
    rivalProfile: {
      summary:
        "Character.AI 是目前最受欢迎的 AI 角色平台之一。它很适合想探索大量创意人设、享受轻量娱乐互动、但不一定想长期投入到单一伴侣关系中的用户。",
      strengths: [
        {
          title: "庞大的角色库",
          body: "拥有数千个由用户创建的角色，覆盖虚构人物、历史人物、名人和原创人设，适合随时发现和切换不同角色。",
        },
        {
          title: "低摩擦角色扮演",
          body: "几乎不需要设置就能快速开始有趣的角色聊天，适合轻量创意探索和短篇角色扮演场景。",
        },
        {
          title: "更大的免费层和活跃社区",
          body: "宽松的免费方案降低了使用门槛，社区也持续创建和分享角色，让平台长期保持新鲜感。",
        },
        {
          title: "多角色灵活性",
          body: "它天生更适合“多样性”，用户可以在许多不同角色之间自由切换，而不是专注于一段持续关系。",
        },
      ],
    },
    switchReasons: [
      "角色当下可能很有趣，但关系跨会话时仍然容易出现重置感。",
      "当你希望同一个伴侣真正带着共享历史往前走时，记忆和连续性会显得偏弱。",
      "核心体验主要仍停留在应用内部，而不是进入你本来就在使用的日常沟通渠道。",
      "对已记住上下文、关系状态和修复流程，用户可见控制仍然不够。",
    ],
    comparisonRows: [
      {
        label: "记忆连续性",
        sparkcore: "长期记忆是产品承诺的一部分，并提供可见的修复与追踪入口。",
        alternative: "单次会话质量可能不错，但连续性通常更脆弱。",
      },
      {
        label: "IM 原生接入",
        sparkcore: "主要关系循环可以在 IM 中继续，回访行为更自然。",
        alternative: "体验整体更局限在 App 内。",
      },
      {
        label: "网页上的关系控制",
        sparkcore: "Dashboard、记忆中心、隐私控制和渠道管理都是一等产品界面。",
        alternative: "对独立关系控制中心的强调更少。",
      },
      {
        label: "持续关系 vs 单次聊天",
        sparkcore: "产品围绕连续性展开，并强调同一个角色能长期保持可管理。",
        alternative: "往往更接近角色型单次会话聊天。",
      },
    ],
    migrationFit: [
      {
        title: "适合想离开“单次角色聊天”模式的人",
        body: "如果你希望同一个伴侣不再显得一次性、而是能在时间里更稳定地存在，就适合选择 Lagun。",
      },
      {
        title: "适合希望记忆可见的用户",
        body: "如果你不希望记忆始终停留在黑箱里、也不希望它不可修复，这会更适合你。",
      },
      {
        title: "适合希望关系在 IM 中延续的人",
        body: "当你希望这段关系活在你本来每天都会回去的沟通渠道里，而不是停留在一个应用容器里时，切换会更有意义。",
      },
    ],
    closingTitle: "从好玩的角色会话，走向真正能承载连续性的伴侣循环。",
    closingBody:
      "Lagun 并不想靠复制 Character.AI 获胜，而是想提供一个完全不同的产品重心：长期记忆、IM 原生连续性，以及对关系状态的网页控制。",
  },
  en: {
    eyebrow: "Alternative",
    title: "A better Character.AI alternative for long-memory companion relationships.",
    description:
      "If Character.AI feels fun but too reset, too app-contained, or too light on relationship continuity, Lagun is designed to offer a stronger long-memory loop, IM-native interaction, and a real control layer on the web.",
    rivalProfile: {
      summary:
        "Character.AI is one of the most popular AI character platforms available. It is well-suited for people who want to explore a wide range of creative personas and enjoy light, entertaining interactions without committing to a single companion.",
      strengths: [
        {
          title: "Massive character library",
          body: "Thousands of user-created characters spanning fiction, history, celebrities, and original personas. Easy to discover and switch between different characters on demand.",
        },
        {
          title: "Low-friction roleplay",
          body: "Fast and entertaining character chat with minimal setup required. Good for casual creative exploration and short-form roleplay scenarios.",
        },
        {
          title: "Large free tier and active community",
          body: "A generous free plan makes it accessible to a wide audience. The community actively creates and shares characters, keeping the platform fresh.",
        },
        {
          title: "Multi-character flexibility",
          body: "Designed for variety — users can freely switch between many different characters rather than committing to one persistent relationship.",
        },
      ],
    },
    switchReasons: [
      "The character may feel entertaining in the moment, but the relationship can still feel reset across sessions.",
      "Memory and continuity feel weaker when you want the same companion to carry a shared history forward.",
      "The main experience stays inside the app instead of continuing where daily communication already happens.",
      "There is not enough user-visible control over remembered context, relationship state, and repair flows.",
    ],
    comparisonRows: [
      {
        label: "Memory continuity",
        sparkcore: "Long memory is part of the product promise, with visible repair and trace entry points.",
        alternative: "Session quality can be strong, but continuity often feels more fragile.",
      },
      {
        label: "IM-native access",
        sparkcore: "The main relationship loop can continue in IM, where return behavior feels more natural.",
        alternative: "The experience is more app-contained.",
      },
      {
        label: "Relationship control on web",
        sparkcore: "Dashboard, memory center, privacy controls, and channel management are first-class product surfaces.",
        alternative: "Less emphasis on a separate relationship control center.",
      },
      {
        label: "Persistent bond vs session chat",
        sparkcore: "The product is framed around continuity and the same role staying governable over time.",
        alternative: "Often feels closer to character session chat.",
      },
    ],
    migrationFit: [
      {
        title: "Best for people leaving session-style character chat",
        body: "Choose Lagun when you want the same companion to feel less disposable and more stable across time.",
      },
      {
        title: "Best for users who want visible memory",
        body: "This fits users who do not want memory to stay opaque and unfixable.",
      },
      {
        title: "Best for people who want IM continuity",
        body: "The switch makes more sense when you want the relationship to live in a channel you already return to daily.",
      },
    ],
    closingTitle:
      "Move from entertaining character sessions to a companion loop that can actually carry continuity.",
    closingBody:
      "Lagun is not trying to win by cloning Character.AI. It is trying to offer a different product center of gravity: long memory, IM-native continuity, and web control over the relationship state.",
  },
};

const REPLIKA_ALTERNATIVE_COPY: LocalizedValue<AlternativePageCopy> = {
  "zh-CN": {
    eyebrow: "替代方案",
    title: "如果你想要更高记忆可见性与 IM 连续性的伴侣关系，这是 Replika 的替代路径。",
    description:
      "如果你喜欢“持续性 AI 关系”这个方向，但还想要更强的长期记忆可见性、更清晰的控制中心，以及在 IM 中继续而不是被困在单一 App 容器里的选择，Lagun 会是更偏产品控制面的替代方案。",
    rivalProfile: {
      summary:
        "Replika 是一个专门为 AI 伴侣打造的应用，重点在情感支持和长期关系连续性。它的特点在于更强的心理健康取向，以及围绕单一固定伴侣展开，而不是提供一个广泛的角色库。",
      strengths: [
        {
          title: "专为伴侣打造",
          body: "不同于通用 AI 聊天工具，Replika 从一开始就是围绕“一个持续中的伴侣”设计的，而不是用来探索许多角色的平台。",
        },
        {
          title: "关系等级与成长感",
          body: "用户可以设置关系类型（朋友、恋爱伴侣、导师），并随着关系发展体验某种逐步推进的感受。",
        },
        {
          title: "情绪签到与心理健康取向",
          body: "内置的情绪追踪、每日签到和心理健康功能，让它适合那些希望在伴侣之外也获得情绪支持的人。",
        },
        {
          title: "长期伴侣连续性",
          body: "Replika 会随着时间保持同一个伴侣，让用户感受到持续关系，而不只是一次次单独互动。",
        },
      ],
    },
    switchReasons: [
      "关系感也许是有的，但用户仍然可能需要更透明的记忆和更明确的修复闭环。",
      "这段关系可能还是太被局限在单一产品界面中，而不是通过 IM 继续。",
      "用户可能希望对角色设置、渠道状态和隐私边界拥有更强控制。",
      "寻找替代方案的人，通常想要更少黑箱式连续性和更多可见控制。",
    ],
    comparisonRows: [
      {
        label: "记忆可见性",
        sparkcore: "用户可以检查、隐藏、标错并追踪已记住的条目。",
        alternative: "连续性存在，但记忆并没有被作为可见修复界面的核心来设计。",
      },
      {
        label: "IM 原生关系循环",
        sparkcore: "主要循环可以在 IM 中继续，网站则保持为控制中心。",
        alternative: "关系更多被包裹在原生 App 界面里。",
      },
      {
        label: "角色与关系控制",
        sparkcore: "角色核心、渠道、隐私界面和连续性视图都属于明确的产品层。",
        alternative: "关系更被封装在产品内部，而不是由显式 dashboard 驱动。",
      },
      {
        label: "网页控制中心",
        sparkcore: "网页产品被明确设计为治理记忆、隐私、渠道和补充连续性的控制平面。",
        alternative: "对独立关系 dashboard 作为控制平面的强调更少。",
      },
    ],
    migrationFit: [
      {
        title: "适合想要更多可见控制的用户",
        body: "如果这段关系对你很重要，但你也希望看到并修复系统实际携带了什么，就适合切换。",
      },
      {
        title: "适合偏好 IM 原生连续性的用户",
        body: "如果你希望日常循环发生在 IM 中，而不是只停留在一个专门 App 里，Lagun 会更合适。",
      },
      {
        title: "适合希望角色更可治理的用户",
        body: "当角色设置、隐私界面和渠道管理比“封闭 App 体验”更重要时，这条路径会更有意义。",
      },
    ],
    closingTitle: "走向一种不仅能感受到连续性，而且能看见、也能治理它的伴侣产品。",
    closingBody:
      "如果你希望关系层持续保持情感上的延续，同时底层记忆、渠道和隐私控制保持可检查，Lagun 会更适合你。",
  },
  en: {
    eyebrow: "Alternative",
    title: "An alternative to Replika for companion relationships with more memory visibility and IM continuity.",
    description:
      "If you like the idea of a persistent AI relationship but want stronger long-memory visibility, a clearer control center, and the option to continue in IM instead of one app container, Lagun is the more product-control-oriented alternative.",
    rivalProfile: {
      summary:
        "Replika is a purpose-built AI companion app focused on emotional support and long-term relationship continuity. It stands out for its wellness angle and its commitment to a single dedicated companion rather than a broad character library.",
      strengths: [
        {
          title: "Purpose-built for companionship",
          body: "Unlike general AI chat tools, Replika is designed specifically around the idea of one persistent companion — not a platform for exploring many characters.",
        },
        {
          title: "Relationship levels and progression",
          body: "Users can set relationship types (Friend, Romantic Partner, Mentor) and experience a sense of progression over time as the relationship develops.",
        },
        {
          title: "Emotional check-ins and wellness focus",
          body: "Built-in mood tracking, daily check-ins, and mental wellness features make it suitable for people looking for emotional support alongside companionship.",
        },
        {
          title: "Long-running companion continuity",
          body: "Replika maintains the same companion over time, giving users a sense of ongoing relationship rather than session-by-session interaction.",
        },
      ],
    },
    switchReasons: [
      "The bond may exist, but users can still want more transparent memory and more explicit repair loops.",
      "The relationship may feel too contained inside one product surface instead of continuing through IM.",
      "Users may want stronger control over the role setup, channel state, and privacy boundaries.",
      "People looking for alternatives usually want less black-box continuity and more visible control.",
    ],
    comparisonRows: [
      {
        label: "Memory visibility",
        sparkcore: "Users can inspect, hide, mark incorrect, and trace remembered rows.",
        alternative: "Continuity exists, but memory is less centered as a visible repair surface.",
      },
      {
        label: "IM-native relationship",
        sparkcore: "The main loop can continue in IM while the website stays a control center.",
        alternative: "The relationship is more tightly held inside the native app surface.",
      },
      {
        label: "Role and relationship control",
        sparkcore: "Role core, channels, privacy surfaces, and continuity views are part of the product layer.",
        alternative: "The relationship is more product-contained and less explicitly dashboard-driven.",
      },
      {
        label: "Web control center",
        sparkcore: "The web product is built to govern memory, privacy, channels, and supplementary continuity.",
        alternative: "Less emphasis on a separate relationship dashboard as the control plane.",
      },
    ],
    migrationFit: [
      {
        title: "Best for users who want more visible control",
        body: "Switch when the relationship matters, but you also want to see and repair what the system is carrying.",
      },
      {
        title: "Best for users who prefer IM-native continuity",
        body: "Lagun fits better when the daily loop should happen in IM rather than only inside one dedicated app.",
      },
      {
        title: "Best for users who want a more governable role",
        body: "This path makes sense when role settings, privacy surfaces, and channel management matter more than a sealed app experience.",
      },
    ],
    closingTitle:
      "Move to a companion product where continuity is not just felt, but also visible and governable.",
    closingBody:
      "Lagun is a better fit when you want the relationship layer to stay emotionally persistent while the underlying memory, channel, and privacy controls stay inspectable.",
  },
};

export function getAlternativeLandingChromeCopy(language: AppLanguage) {
  return getLocalizedValue(language, ALTERNATIVE_LANDING_CHROME_COPY);
}

export function getCharacterAiAlternativeCopy(language: AppLanguage) {
  return getLocalizedValue(language, CHARACTER_AI_ALTERNATIVE_COPY);
}

export function getReplikaAlternativeCopy(language: AppLanguage) {
  return getLocalizedValue(language, REPLIKA_ALTERNATIVE_COPY);
}
