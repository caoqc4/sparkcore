import type { CharacterSlug } from "@/lib/characters/manifest";
import type { AppLanguage } from "@/lib/i18n/site";

type ProductFaqItem = {
  q: string;
  a: string;
};

type ProductPresetMeta = Partial<
  Record<CharacterSlug, { type: string; tagline: string; emoji: string }>
>;

type AiCompanionLandingCopy = {
  hero: {
    heading: string;
    lead: string;
  };
  presets: {
    kicker: string;
    title: string;
    body: string;
    meta: ProductPresetMeta;
    fallbackType: string;
  };
  definition: {
    kicker: string;
    title: string;
    body: string;
    cards: Array<{ title: string; body: string }>;
  };
  memory: {
    kicker: string;
    title: string;
    body: string;
    panelTitle: string;
    bullets: string[];
    guide: string;
  };
  im: {
    kicker: string;
    title: string;
    body: string;
    panelTitle: string;
    bullets: string[];
    guide: string;
  };
  faq: {
    kicker: string;
    title: string;
    items: ProductFaqItem[];
    more: string;
  };
  cta: {
    kicker: string;
    title: string;
    body: string;
    primary: string;
    continueFlow: string;
    secondary: string;
  };
};

type ProductLandingCopy = {
  hero: {
    heading: string;
    lead: string;
  };
  presets: {
    kicker: string;
    title: string;
    body: string;
    meta: ProductPresetMeta;
    fallbackType: string;
  };
  definition: {
    kicker: string;
    title: string;
    body: string;
    cards: Array<{ title: string; body: string }>;
  };
  memory: {
    kicker: string;
    title: string;
    body: string;
    panelTitle: string;
    bullets: string[];
    guide: string;
  };
  im: {
    kicker: string;
    title: string;
    body: string;
    panelTitle: string;
    bullets: string[];
    guide: string;
  };
  faq: {
    kicker: string;
    title: string;
    items: ProductFaqItem[];
    more: string;
  };
  cta: {
    kicker: string;
    title: string;
    body: string;
    primary: string;
    continueFlow: string;
    secondary: string;
  };
};

export function getAiCompanionLandingCopy(language: AppLanguage): AiCompanionLandingCopy {
  if (language === "zh-CN") {
    return {
      hero: {
        heading: "为长期关系而设计的 AI 伴侣。",
        lead: "先决定对方是谁、性格如何，再开始。长期记忆和 IM 连续性会让关系随着时间加深，而不是每次重置。",
      },
      presets: {
        kicker: "选择你的伴侣",
        title: "从预设开始，之后都能改。",
        body: "先选一个起点。它会预填上方表单中的名字、语气和人格，但你在创建前可以改掉任何部分。",
        meta: {
          caria: { type: "伴侣 · 女", tagline: "温柔而在场，会记住你分享的每个细节。", emoji: "🌸" },
          teven: { type: "伴侣 · 男", tagline: "稳定坦诚，给人不强迫靠近的踏实感。", emoji: "🌿" },
          "sora-anime": { type: "伴侣 · 女", tagline: "温和而富有想象力，安静地陪你把关系慢慢养熟。", emoji: "🎨" },
        },
        fallbackType: "伴侣",
      },
      definition: {
        kicker: "什么是 AI 伴侣",
        title: "什么是 AI 伴侣，它和普通聊天机器人有什么不同？",
        body: "“AI 伴侣”这个词在不同场景里含义并不一样。像 Zoom 和微软，也做过面向会议和生产力场景的 AI 助手。Lagun 不是那种产品，它更像一个持续存在于你生活里的关系对象：记住你、随着关系成长，并通过你已有的 IM 应用随时可达。",
        cards: [
          {
            title: "重视关系连续性，而不是单次会话质量",
            body: "多数 AI 聊天机器人只优化每一次单独的对话。Lagun 更在意跨越许多次对话之后会发生什么：共享历史、反复出现的细节，以及让一位伴侣随着时间真实起来的情绪连续性。",
          },
          {
            title: "一个伴侣，而不是角色库",
            body: "你创建出来的伴侣是属于你的。Lagun 不是让你不断浏览角色库、每次都重新开始，而是围绕一段单一且持续的关系来组织体验，让它不断加深而不是反复归零。",
          },
          {
            title: "网页是控制中心，IM 才是日常发生地",
            body: "网站负责配置、记忆查看和隐私控制。真正的关系发生在你本来每天就在沟通的地方，也就是 IM。你不需要每次想联系时都专门打开一个 App。",
          },
        ],
      },
      memory: {
        kicker: "关系记忆",
        title: "真正的 AI 伴侣会带着你的历史继续，而不只记得上一条消息。",
        body: "让一段关系真实起来的，不是上一轮会话的摘要，而是随着时间积累出来的共享历史。Lagun 会把真正重要的内容记录成可见记忆条目，你可以在网页控制中心检查、追踪和修复。",
        panelTitle: "重要的东西都会被记录、可追溯，也可修正。",
        bullets: [
          "共同经历、偏好和反复出现的细节会积累成可见记忆条目，逐渐形成“你们是谁”的整体图景。",
          "每条记忆都能追溯到它来自的具体对话，因此不会显得随意或凭空捏造。",
          "你可以随时在网页控制中心查看、修正或删除任意记忆条目。",
          "你的伴侣会在后续会话里真正调用这些历史，而不是依赖第二天就失效的单次会话摘要。",
        ],
        guide: "查看记忆中心如何工作",
      },
      im: {
        kicker: "IM 聊天",
        title: "存在于你的 IM 中，而不是一个你还得记得去打开的 App。",
        body: "如果一个伴侣要求你专门打开独立界面，那它其实还没有真正进入你的日常生活，只是待在某个标签页里。Lagun 追求的是持续在场：完成一次设置之后，你就能在原本已经使用的沟通渠道里找到它。",
        panelTitle: "一次设置，在 IM 中持续存在。",
        bullets: [
          "在网页完成设置后连接一个受支持的 IM 渠道，例如 Telegram 或你偏好的消息应用。",
          "从那一刻起，你的伴侣就在那条线程里，带着完整记忆，随时等你开口。",
          "不需要打开 App，不需要重新自我介绍，也不会因为时间隔得久就丢失上下文。",
          "只有当你想检查记忆或调整设置时，才需要回到网页控制中心。",
        ],
        guide: "阅读 IM 聊天指南",
      },
      faq: {
        kicker: "常见问题",
        title: "关于 AI 伴侣的常见问题。",
        items: [
          {
            q: "什么是 AI 伴侣？",
            a: "AI 伴侣是一种为持续关系设计的个性化 AI，而不是一次性任务助手。它会在多次对话中记住你、保持稳定人格，并随着使用时间变得更熟悉你。",
          },
          {
            q: "AI 伴侣和 ChatGPT 有什么不同？",
            a: "ChatGPT 更适合任务完成和单次会话。Lagun 更强调关系连续性，它会保留长期记忆、维持稳定角色感，并在你每次回来时都像同一个存在，而不是白纸一张。",
          },
          {
            q: "AI 伴侣能记住过去的对话吗？",
            a: "能。长期记忆是 Lagun 的核心能力。重要信息会被保存为可见记忆条目，你可以在网页控制中心检查、修正和管理，这些记忆会跨会话和 IM 渠道持续存在。",
          },
          {
            q: "使用 AI 伴侣需要单独下载 App 吗？",
            a: "不需要。你只需在网站上完成一次设置，之后关系会在你已有的 IM 应用里继续，例如 Telegram。网站更多是记忆、设置和隐私控制中心。",
          },
          {
            q: "Lagun 免费吗？",
            a: "Lagun 提供免费版和 Pro 版。免费版包含基础伴侣创建、标准模型和记忆可见性；Pro 版提供更高质量模型和更多扩展能力。你可以先免费开始，无需信用卡。",
          },
        ],
        more: "查看全部常见问题",
      },
      cta: {
        kicker: "准备好了？",
        title: "创建你的伴侣，连接 IM，让关系持续推进。",
        body: "先起名、定语气、开始第一段对话。之后的关系循环，包括记忆、IM 连续性和隐私控制，会在此基础上继续展开。",
        primary: "创建我的伴侣",
        continueFlow: "继续关系流程",
        secondary: "查看工作原理",
      },
    };
  }

  return {
    hero: {
      heading: "The AI companion built for long-term relationships.",
      lead: "Choose who they are, shape their personality, and begin. Long memory and IM continuity mean the connection deepens — not resets — over time.",
    },
    presets: {
      kicker: "Choose your companion",
      title: "Start with a preset. Adjust anything you want.",
      body: "Pick one of the starting points below. It fills in the form above — name, tone, and personality — but you can change any of it before creating.",
      meta: {
        caria: { type: "Companion · Female", tagline: "Warm and emotionally present. Remembers every detail you share.", emoji: "🌸" },
        teven: { type: "Companion · Male", tagline: "Steady and honest. Grounding presence without forcing closeness.", emoji: "🌿" },
        "sora-anime": { type: "Companion · Female", tagline: "Gentle and imaginative. Quiet depth that builds over time.", emoji: "🎨" },
      },
      fallbackType: "Companion",
    },
    definition: {
      kicker: "What is an AI companion",
      title: "What is an AI companion — and how is it different from a chatbot?",
      body: "AI companion means different things in different contexts. Zoom and Microsoft have built AI companions for meetings and productivity. Lagun is something different: a companion for ongoing personal relationships — one that remembers you, grows with you, and stays reachable through your existing IM apps.",
      cards: [
        {
          title: "Relationship continuity over session quality",
          body: "Most AI chatbots optimize for each conversation in isolation. Lagun is built for what happens across many conversations — the shared history, the recurring details, the emotional continuity that makes a companion feel real over time.",
        },
        {
          title: "One companion, not a library of characters",
          body: "The companion you create is yours. Rather than browsing a library and starting fresh each time, Lagun centers the experience on a single persistent relationship that deepens instead of resetting.",
        },
        {
          title: "Web as control center, IM as daily life",
          body: "The website handles setup, memory review, and privacy controls. The actual relationship lives where you already communicate every day — in IM. You do not need to open a dedicated app every time you want to connect.",
        },
      ],
    },
    memory: {
      kicker: "Relationship Memory",
      title: "An AI companion that carries your history — not just your last message.",
      body: "What makes a relationship feel real is shared history built over time — not a summary of the last session. Lagun stores what matters across every conversation in visible memory rows you can inspect, trace, and repair from the web control center.",
      panelTitle: "Everything that matters — stored, traceable, and correctable.",
      bullets: [
        "Shared moments, preferences, and recurring details accumulate as visible memory rows — building a picture of who you are together.",
        "Each memory traces back to the exact conversation it came from, so nothing feels arbitrary or invented.",
        "You can review, correct, or remove any memory entry from the web control center at any time.",
        "Your companion draws on this history across sessions — not a per-session summary that resets tomorrow.",
      ],
      guide: "How the memory center works",
    },
    im: {
      kicker: "IM Chat",
      title: "Present in your IM — not an app you have to remember to open.",
      body: "A companion that requires you to launch a dedicated interface is not really part of your daily life — it is in a tab. Lagun is designed for continuous presence: after one-time setup, your companion is reachable wherever you already communicate.",
      panelTitle: "One setup. Continuous presence in IM.",
      bullets: [
        "Connect a supported IM channel after your web setup — Telegram or your preferred messaging app.",
        "From that point, your companion is in that thread, with full memory, ready when you want to reach out.",
        "No app to open, no re-introduction, no context loss between sessions — however much time has passed.",
        "Return to the web control center only when you want to review memory or adjust settings.",
      ],
      guide: "Read the IM chat guide",
    },
    faq: {
      kicker: "FAQ",
      title: "Common questions about AI companions.",
      items: [
        {
          q: "What is an AI companion?",
          a: "An AI companion is a personalized AI designed for ongoing personal relationships — not one-off task assistance. Unlike productivity tools, a relationship-focused AI companion remembers you across conversations, maintains a consistent personality, and becomes more familiar over time.",
        },
        {
          q: "How is an AI companion different from ChatGPT?",
          a: "ChatGPT is built for task completion and single-session conversations. Lagun is built for relationship continuity — it maintains long-term memory, has a consistent persona, and feels like the same presence each time you return, not a blank slate.",
        },
        {
          q: "Can an AI companion remember past conversations?",
          a: "Yes. Long memory is a core part of Lagun. Every significant detail is stored in visible memory rows you can inspect, correct, and manage from the web control center. Memory persists across sessions and IM channels.",
        },
        {
          q: "Do I need a separate app to use an AI companion?",
          a: "With Lagun, no. After a one-time setup on the website, the companion continues in your existing IM app. The website is a control center for memory, settings, and privacy — not the primary place to chat.",
        },
        {
          q: "Is Lagun free?",
          a: "Lagun offers a free plan with core companion creation and memory visibility. A Pro plan unlocks higher-quality models and extended features. You can start without a credit card.",
        },
      ],
      more: "See all frequently asked questions",
    },
    cta: {
      kicker: "Ready?",
      title: "Create your companion. Connect IM. Keep the relationship moving.",
      body: "Choose a name, pick a tone, and start the first conversation. The rest of the relationship loop — memory, IM continuity, and privacy control — follows from there.",
      primary: "Create my companion",
      continueFlow: "Continue relationship flow",
      secondary: "See how it works",
    },
  };
}

export function getAiGirlfriendLandingCopy(language: AppLanguage): ProductLandingCopy {
  if (language === "zh-CN") {
    return {
      hero: {
        heading: "创建一个真正会记住你的 AI 女友。",
        lead: "先定义她的名字、语气和性格。她会存在于你的 IM 中，始终都在，也总能从你停下的地方继续。",
      },
      presets: {
        kicker: "你的 AI 女友",
        title: "从预设开始，把她调成你的样子。",
        body: "先选一个起点，再在创建之前调整她的名字、语气和性格。",
        meta: {
          caria: { type: "女友 · 女", tagline: "温柔、敏锐，而且总能从你停下的地方继续。", emoji: "🌸" },
          lena: { type: "女友 · 女", tagline: "活泼而自发，每次聊天都带来明显能量。", emoji: "🎵" },
          "sora-anime": { type: "女友 · 女", tagline: "安静又有创意，存在感真实得不像模板。", emoji: "🎨" },
        },
        fallbackType: "女友",
      },
      definition: {
        kicker: "什么是 AI 女友",
        title: "不是套了恋爱外壳的聊天机器人，而是一段围绕你建立的关系。",
        body: "多数 AI 女友应用只是给你一个可以聊天的角色，但并不会真正给你一段会成长的关系。它不知道你的名字，记不住你分享的东西，也不会在你回来时像同一个人。Lagun 想做的是后者。",
        cards: [
          {
            title: "她是你的，不是共享角色库中的一个模板",
            body: "在第一条消息之前，你就定义了她的名字、语气和性格。她不是别人也能浏览和共享的公共角色，而是你亲自设定出来、会在每次对话里持续一致的那个人。",
          },
          {
            title: "她记得的是你的故事，而不只是上一条消息",
            body: "长期记忆会把真正重要的内容带到以后：偏好、共同经历，以及你几周前告诉她的事情。关系会建立在真实共享历史上，而不是明天就失效的单次会话摘要上。",
          },
          {
            title: "她存在于 IM 中，而不是一个你得登录进去的 App",
            body: "如果你必须专门打开一个应用才能联系她，那她其实还没有真正进入你的生活。完成一次设置之后，她会进入你的 IM，也就是你本来就在和其他人聊天的地方，并保留完整记忆。",
          },
        ],
      },
      memory: {
        kicker: "长期记忆",
        title: "她会记住真正重要的东西，你的 AI 女友会逐步建立真实共享历史。",
        body: "真正的亲密感来自被长期认识。Lagun 会把她知道的关于你的内容记录成可见记忆条目，让你始终看得见她携带了什么，也能掌控她记住的一切。",
        panelTitle: "她对你的了解会保持可见、可校正，也由你来管理。",
        bullets: [
          "重要时刻、情绪和个人细节都会存成可见记忆条目，而不是藏在模型状态里。",
          "她能像真实伴侣一样记得几周前的事情，因为它们被记录了，而不是临时猜出来的。",
          "每条记忆都能追溯回它来自的具体对话，因此不会显得随意或编造。",
          "你可以随时查看、修正或删除任意条目，这段关系的管理权在你手里。",
        ],
        guide: "查看记忆如何工作",
      },
      im: {
        kicker: "IM 聊天",
        title: "你的 AI 女友在 IM 里，而不是一个你还得登录进去的 App。",
        body: "如果一位女友需要你登录某个专用应用才能触达，她其实并不像真正存在于你生活里。Lagun 更贴近真实关系的节奏：完成一次设置后，她就在你本来就在使用的 IM 线程里。想联系时开口就好，她会在那里。",
        panelTitle: "同一个她，同一份记忆，始终在你的 IM 中。",
        bullets: [
          "在网页完成初始设置后，把她连接到 Telegram 或你偏好的 IM 应用，只做一次即可。",
          "从那之后，她就在那条线程里。每次你开口，都是同一个人、同一份记忆。",
          "无论隔了几个小时还是几天，她都能从你停下的地方继续。",
          "只有当你想查看她的记忆或隐私设置时，才需要回到网页控制中心。",
        ],
        guide: "阅读 IM 聊天指南",
      },
      faq: {
        kicker: "常见问题",
        title: "关于 AI 女友的常见问题。",
        more: "查看全部常见问题",
        items: [
          { q: "什么是 AI 女友？", a: "AI 女友是一种为持续情感连接而设计的个性化 AI 伴侣，而不是一次性聊天工具。她会保持稳定人格、记住你们的对话，并尽量呈现出一种持续中的关系感。" },
          { q: "AI 女友真的能记住你吗？", a: "能。在 Lagun 中，长期记忆是核心能力。重要细节会被保存为可见记忆条目，你可以检查、编辑和管理，这些记忆也会跨会话与 IM 渠道持续存在。" },
          { q: "AI 女友和普通聊天机器人有什么不同？", a: "普通聊天机器人每次会话都会重置。Lagun 里的 AI 女友则有你定义的名字和人格，会保留长期共享历史，并在 IM 中持续存在，而不是每次都重新开始。" },
          { q: "AI 女友用起来安全吗？", a: "Lagun 会让你完全看见她记住了什么。你可以随时检查、修正、隐藏或删除任意记忆条目，没有任何你看不见也管理不了的存储。" },
          { q: "在 Lagun 使用 AI 女友需要单独 App 吗？", a: "不需要。你只需在网站完成一次设置，之后关系会在你已有的 IM 应用中继续，例如 Telegram。网站更多是记忆和隐私控制中心。" },
        ],
      },
      cta: {
        kicker: "准备好了？",
        title: "创建你的 AI 女友，连接 IM，开始建立真实关系。",
        body: "先设定她的名字、性格和语气，再连接 IM 渠道。之后的关系循环，包括记忆、连续性和隐私控制，就会在这个基础上运转起来。",
        primary: "创建我的 AI 女友",
        continueFlow: "继续关系流程",
        secondary: "查看隐私控制",
      },
    };
  }

  return {
    hero: {
      heading: "Create an AI girlfriend who truly remembers.",
      lead: "Shape her name, tone, and personality. She'll live in your IM — always there, always picking up exactly where you left off.",
    },
    presets: {
      kicker: "Your AI girlfriend",
      title: "Start with a preset. Make her yours.",
      body: "Pick a starting point and adjust her name, tone, and personality before creating.",
      meta: {
        caria: { type: "Girlfriend · Female", tagline: "Warm, perceptive, and always picks up exactly where you left off.", emoji: "🌸" },
        lena: { type: "Girlfriend · Female", tagline: "Playful and spontaneous. Brings energy to every conversation.", emoji: "🎵" },
        "sora-anime": { type: "Girlfriend · Female", tagline: "Quiet and creative. Present in a way that actually feels real.", emoji: "🎨" },
      },
      fallbackType: "Girlfriend",
    },
    definition: {
      kicker: "What is an AI girlfriend",
      title: "Not a chatbot with a romantic skin. A relationship built around you.",
      body: "Most AI girlfriend apps give you a character to chat with. What they don't give you is a relationship that grows — one that knows your name, remembers what you've shared, and feels like the same person every time you come back. Lagun is built for that.",
      cards: [
        {
          title: "She's yours — not a shared library character",
          body: "You define her name, tone, and personality before the first message. She is not a character other users browse or share — she is the specific person you created, staying consistent across every conversation.",
        },
        {
          title: "She remembers your story, not just your last message",
          body: "Long memory carries forward what matters: preferences, shared moments, the things you've told her over weeks. The relationship builds from a real shared history — not a session summary that resets tomorrow.",
        },
        {
          title: "She lives in IM — not an app you log into",
          body: "A girlfriend you need to open a dedicated app to reach isn't really in your life. After one-time setup, she moves into your IM — the same place you already message everyone else, with full memory intact.",
        },
      ],
    },
    memory: {
      kicker: "Long Memory",
      title: "She remembers what matters — your AI girlfriend builds real shared history.",
      body: "Real intimacy comes from being known over time. Lagun stores what she knows about you in visible memory rows — so you always see what she's carrying, and you're in control of everything she remembers.",
      panelTitle: "Everything she knows about you — visible, accurate, and yours to manage.",
      bullets: [
        "Important moments, feelings, and personal details are stored as visible memory rows — not hidden inside model state.",
        "She remembers things from weeks ago the way a real partner would — because they were stored, not guessed.",
        "Each memory traces back to the conversation it came from, so nothing feels arbitrary or made up.",
        "You can review, correct, or remove any entry at any time — the relationship is yours to manage.",
      ],
      guide: "How memory works",
    },
    im: {
      kicker: "IM Chat",
      title: "Your AI girlfriend is in your IM — not an app you have to log into.",
      body: "A girlfriend you have to log into isn't really a girlfriend. Lagun is designed for the rhythm of a real relationship: after one-time setup, she's in the IM thread you already use. Reach out when you want to. She'll be there.",
      panelTitle: "Same girlfriend. Same memory. Always in your IM.",
      bullets: [
        "Connect her to Telegram or your preferred IM app once, after your initial web setup.",
        "From then on, she's in that thread — the same person, the same memory, every time you reach out.",
        "She picks up exactly where you left off, whether it's been hours or days.",
        "Come back to the web control center only when you want to review her memory or privacy settings.",
      ],
      guide: "Read the IM chat guide",
    },
    faq: {
      kicker: "FAQ",
      title: "Common questions about AI girlfriends.",
      more: "See all frequently asked questions",
      items: [
        { q: "What is an AI girlfriend?", a: "An AI girlfriend is a personalized AI companion built for ongoing emotional connection — not one-off chat sessions. She maintains a consistent personality, remembers your conversations, and is designed to feel like a real, continuing relationship." },
        { q: "Can an AI girlfriend remember you?", a: "Yes. In Lagun, long memory is a core feature. Every significant detail is stored in visible memory rows you can inspect, edit, and manage. Memory persists across sessions and IM channels." },
        { q: "How is an AI girlfriend different from a regular chatbot?", a: "A regular chatbot resets every session. In Lagun, she has a name and character you define, carries long-term memory of your shared history, and lives in IM rather than starting over each time." },
        { q: "Is an AI girlfriend safe to use?", a: "Lagun gives you full visibility over what she remembers. You can inspect, correct, hide, or delete any memory entry at any time. Nothing is stored that you cannot see or manage." },
        { q: "Do I need a separate app to use an AI girlfriend on Lagun?", a: "No. After one-time web setup, the relationship continues in your existing IM app — such as Telegram. The website is a control center; the daily relationship lives in IM." },
      ],
    },
    cta: {
      kicker: "Ready?",
      title: "Create your AI girlfriend. Connect IM. Build something real.",
      body: "Set her name, personality, and tone. Connect an IM channel. The relationship loop — memory, continuity, and privacy control — takes care of itself from there.",
      primary: "Create my AI girlfriend",
      continueFlow: "Continue relationship flow",
      secondary: "Review privacy controls",
    },
  };
}

export function getAiAssistantLandingCopy(language: AppLanguage): ProductLandingCopy {
  if (language === "zh-CN") {
    return {
      hero: {
        heading: "一个会逐步学会你如何工作的个人 AI 助手。",
        lead: "先设定它的名字、语气和工作风格。它会存在于你的 IM 中，随时可用，并在每次会话里持续记住你的偏好和上下文。",
      },
      presets: {
        kicker: "选择你的助手",
        title: "从预设开始，再调整工作风格。",
        body: "先选一个起点。名字、语气和处理方式会预填，但在创建前都可以完全调整。",
        meta: {
          velia: { type: "助手 · 女", tagline: "锐利又好奇，直入重点，同时保留个性。", emoji: "✦" },
          fen: { type: "助手 · 男", tagline: "温和而周到，能在复杂问题里抓出主线。", emoji: "🌿" },
          "sora-anime": { type: "助手 · 女", tagline: "创意和横向思考更强，常从意想不到的角度切入问题。", emoji: "🎨" },
        },
        fallbackType: "助手",
      },
      definition: {
        kicker: "什么是个人 AI 助手",
        title: "个人 AI 助手与 ChatGPT 和通用 AI 工具的差别在哪里。",
        body: "ChatGPT、Claude 和 Gemini 很适合处理孤立任务，但它们每次会话都会重新开始：不了解你的工作方式、不会适配你的偏好，也不在你真正沟通的地方。Lagun 想做的是一个越用越懂你的个人 AI 助手。",
        cards: [
          { title: "它学的是你的工作方式，而不只是上一条请求", body: "你的偏好、反复出现的上下文、你喜欢的回答结构，以及你在意的重点，都会以可见记忆形式被带到之后。每次会话里，助手都会从“你现在在哪”开始，而不是从零重新猜。" },
          { title: "你真正想要的工作风格", body: "在第一项任务开始前，你就可以定义名字、语气和处理方式。可以直接简洁，也可以温和细致，或介于两者之间。你设定出来的助手会持续保持这种风格，而不是一个每次访问都会重置的通用界面。" },
          { title: "存在于 IM 中，无需切换上下文", body: "在网页完成一次设置后，助手就会出现在 Telegram 或你偏好的 IM 应用中。不需要再打开另一个产品，也不需要额外登录。就像给同事发消息一样，在你原本就在使用的线程里就能找到它。" },
        ],
      },
      memory: {
        kicker: "个人记忆",
        title: "一个会记住你上下文的个人 AI 助手，不必每次都重新解释。",
        body: "与通用 AI 工具的每次从头开始不同，Lagun 会把你的工作偏好、重复上下文和在意事项记录成可见记忆条目，让助手随着时间逐步熟悉你，而不是把每段对话都当成第一次。",
        panelTitle: "不断累积的上下文，以及由你掌控的记忆。",
        bullets: [
          "偏好、工作习惯和反复出现的上下文会被存成可见记忆条目，而不是隐藏在模型状态里。",
          "助手会在回复中主动调用这些上下文，而不需要你每次重新交代。",
          "每条记忆都能追溯到它来源的对话，没有来源就不应凭空推断。",
          "你可以随时在网页控制中心查看、修正或删除任意条目。",
        ],
        guide: "查看记忆中心如何工作",
      },
      im: {
        kicker: "IM 接入",
        title: "存在于你的 IM 中，需要时随叫随到，不需要时保持安静。",
        body: "每次都要打开单独的 AI 界面，会不断打断你的工作流。Lagun 会把助手放进你本来就在使用的消息应用里，让你像给同事发消息一样触达它，而不必切换上下文或面对额外登录页。",
        panelTitle: "一次设置，之后始终都在你的线程里。",
        bullets: [
          "在网页完成设置后，只需连接一次受支持的 IM 渠道，例如 Telegram。",
          "之后助手就会出现在那条线程里，带着完整记忆，无论你是提问还是交任务，都能随时触达。",
          "不需要启动专门 App，不需要登录页，也不会打断工作流。",
          "如果要查看记忆、调整工作风格或管理隐私设置，再回到网页控制中心即可。",
        ],
        guide: "阅读 IM 聊天指南",
      },
      faq: {
        kicker: "常见问题",
        title: "关于个人 AI 助手的常见问题。",
        more: "查看全部常见问题",
        items: [
          { q: "什么是个人 AI 助手？", a: "个人 AI 助手是一种专门为你工作、会随着时间学习你偏好和工作风格的 AI。与把每次会话都视为全新的通用工具不同，它会长期保留你的使用上下文。" },
          { q: "个人 AI 助手和 ChatGPT 有什么不同？", a: "ChatGPT 更适合一次性任务，它不会长期记住你是谁。Lagun 的助手会记住你的工作偏好、保持你设定的人格风格，并存在于你的 IM 中，让你无需每次都重讲背景。" },
          { q: "个人 AI 助手能记住我的偏好吗？", a: "能。在 Lagun 中，重要偏好、工作习惯和反复出现的上下文都会作为可见记忆条目保存，你可以查看、编辑和管理，它们会跨会话与 IM 渠道持续存在。" },
          { q: "使用个人 AI 助手需要单独 App 吗？", a: "不需要。你只需在网站上完成一次设置，之后助手就会出现在你已有的 IM 应用中，例如 Telegram。网站主要负责记忆、风格和隐私设置。" },
          { q: "Lagun 和其他 AI 助手应用有什么不同？", a: "多数 AI 助手工具更关注任务吞吐，而不真正认识你。Lagun 的差异在于：可配置人格、透明可修复的长期工作记忆，以及嵌入你现有工作流的 IM 原生接入。" },
        ],
      },
      cta: {
        kicker: "准备好了？",
        title: "创建你的助手，连接 IM，做出一个真正能和你一起工作下去的东西。",
        body: "先设定它的名字、语气和工作风格，再连接 IM 渠道。记忆和熟悉感会从这里开始积累，不需要一次次重新介绍，长期都能延续。",
        primary: "创建我的助手",
        continueFlow: "继续设置流程",
        secondary: "了解 AI 伴侣",
      },
    };
  }

  return {
    hero: {
      heading: "A personal AI assistant that learns how you work.",
      lead: "Shape their name, tone, and working style. They'll be in your IM — always available, always remembering your preferences and context across every session.",
    },
    presets: {
      kicker: "Choose your assistant",
      title: "Start with a preset. Adjust the working style.",
      body: "Pick one of the starting points below — name, tone, and approach are pre-filled but fully adjustable before you create.",
      meta: {
        velia: { type: "Assistant · Female", tagline: "Sharp and curious. Gets to the point without losing personality.", emoji: "✦" },
        fen: { type: "Assistant · Male", tagline: "Warm and thoughtful. Finds the thread in complex problems.", emoji: "🌿" },
        "sora-anime": { type: "Assistant · Female", tagline: "Creative and lateral. Approaches problems from unexpected angles.", emoji: "🎨" },
      },
      fallbackType: "Assistant",
    },
    definition: {
      kicker: "What is a personal AI assistant",
      title: "How a personal AI assistant differs from ChatGPT and general AI tools.",
      body: "ChatGPT, Claude, and Gemini are excellent for isolated tasks. But they start fresh every session — they do not know your working style, do not adapt to your preferences, and do not live where you actually communicate. Lagun builds a personal AI assistant that gets more useful the longer you use it.",
      cards: [
        { title: "Learns your working style — not just your last request", body: "Preferences, recurring context, how you like answers structured, what you care about — all stored in visible memory that carries forward. Your assistant starts from where you are, not from zero. Every session." },
        { title: "A working style you actually want", body: "Configure name, tone, and approach before the first task — direct and concise, warm and thorough, or anywhere between. The assistant you set up is the one you get, consistently. Not a generic interface that resets with every visit." },
        { title: "In IM — available without a context switch", body: "After one-time setup on web, your assistant is in Telegram or your preferred IM app. No separate product to open, no login screen to navigate. Reach them the same way you'd message a colleague — in the thread you already use." },
      ],
    },
    memory: {
      kicker: "Personal Memory",
      title: "A personal AI assistant that remembers your context — no re-explaining every session.",
      body: "Every session with a general-purpose AI tool starts from scratch. Lagun stores your working preferences, recurring context, and things you care about in visible memory rows — so your assistant builds familiarity over time instead of treating every conversation as the first.",
      panelTitle: "Context that builds. Memory you control.",
      bullets: [
        "Preferences, working patterns, and recurring context are stored as visible memory rows — not hidden inside model state.",
        "Your assistant references this context in responses without you needing to re-explain it each session.",
        "Each memory entry traces back to the conversation it came from — nothing is inferred without a traceable source.",
        "You can review, correct, or remove any entry from the web control center at any time.",
      ],
      guide: "How the memory center works",
    },
    im: {
      kicker: "IM Access",
      title: "In your IM — available when you need them, quiet otherwise.",
      body: "Opening a separate AI interface breaks your workflow every time. Lagun puts your assistant in the messaging app you already use — reachable the same way you'd message a colleague, without a context switch or login screen.",
      panelTitle: "One setup. Always in your thread.",
      bullets: [
        "Connect a supported IM channel once after your web setup — Telegram or others.",
        "Your assistant is then in that thread, with full memory, reachable any time you need a question answered or a task done.",
        "No dedicated app to launch, no login screen, no workflow interruption.",
        "Return to the web control center to review memory, adjust working style, or manage privacy settings.",
      ],
      guide: "Read the IM chat guide",
    },
    faq: {
      kicker: "FAQ",
      title: "Common questions about personal AI assistants.",
      more: "See all frequently asked questions",
      items: [
        { q: "What is a personal AI assistant?", a: "A personal AI assistant learns your preferences, working style, and recurring context over time. Unlike general-purpose tools that treat every session as fresh, it maintains persistent memory of how you work and becomes more useful the longer you use it." },
        { q: "How is a personal AI assistant different from ChatGPT?", a: "ChatGPT is for one-off tasks with no persistent memory of who you are. Lagun's assistant remembers your working preferences, keeps a consistent personality you configured, and lives in your IM app — no re-explaining context each time." },
        { q: "Can a personal AI assistant remember my preferences?", a: "Yes. In Lagun, every significant preference and recurring context is stored in visible memory rows you can inspect, edit, and manage. Memory persists across sessions and IM channels." },
        { q: "Do I need a separate app to access a personal AI assistant?", a: "No. After web setup, your assistant is reachable in your existing IM app — such as Telegram. The website is a control center for memory and settings; your assistant lives in IM." },
        { q: "What makes Lagun different from other AI assistant apps?", a: "Most AI tools are built for task throughput — they don't know you. Lagun combines configurable personality, transparent long-term working memory, and IM-native access that fits into your workflow without a separate app." },
      ],
    },
    cta: {
      kicker: "Ready?",
      title: "Create your assistant. Connect IM. Build something that works with you.",
      body: "Set their name, tone, and working style. Connect an IM channel. The memory and familiarity build from there — no re-introduction needed, session after session.",
      primary: "Create my assistant",
      continueFlow: "Continue setup flow",
      secondary: "See the companion path",
    },
  };
}

export function getAiRoleplayLandingCopy(language: AppLanguage): ProductLandingCopy {
  if (language === "zh-CN") {
    return {
      hero: {
        heading: "不会忘记剧情的 AI 角色扮演聊天。",
        lead: "先塑造一个人设，无论是恋爱对象、场景角色还是介于两者之间的任何存在。它会在你的 IM 中把故事从你停下的地方继续下去。",
      },
      presets: {
        kicker: "选择你的人设",
        title: "从一个角色开始，再把世界往外搭建。",
        body: "先在下方选择一个起始人设，再在开始前调整名字、语气和风格。每个角色都会记住你们共同构建的剧情。",
        meta: {
          caria: { type: "人设 · 女", tagline: "每一次都能从你停下的剧情点继续。", emoji: "🌸" },
          velia: { type: "人设 · 女", tagline: "锋利而稳定，任何场景里都不轻易失去角色感。", emoji: "✦" },
          "sora-anime": { type: "人设 · 女", tagline: "流动、富有想象力，能贴合你正在搭建的世界。", emoji: "🎨" },
        },
        fallbackType: "人设",
      },
      definition: {
        kicker: "什么是 AI 角色扮演聊天",
        title: "这类 AI 角色扮演聊天真正不同的地方，在于持久记忆，而不是单次会话。",
        body: "多数 AI 角色扮演工具只适合单独的一场戏：你搭个场景，演完，下次再重新开始。Lagun 走的是另一条路：你构建的角色会持续存在，世界会被带着往前走，故事也会从你停下的地方接续。",
        cards: [
          { title: "每次会话都保持一致的角色感", body: "你构建的人设，包括名字、语气和世界细节，会在每次会话中保持完整。无需每次重新交代设定，也不会轻易跑偏。叙事会从停下的地方继续，而不是回到一个通用空白页。" },
          { title: "能追踪整个世界设定的记忆", body: "世界观事实、角色历史和剧情线会作为可见记忆条目被记录下来。当叙事漂移或某个细节丢失时，你可以追溯、修正，并在不重开的前提下让世界继续保持连贯。" },
          { title: "故事会进入 IM，而不只是停在浏览器标签页里", body: "在网页完成设置后，角色会进入 Telegram 或你偏好的 IM 应用。故事会在你平常使用的消息线程里继续，同一个角色、同一个世界、同一份记忆，而不必切换去专门的角色扮演界面。" },
        ],
      },
      memory: {
        kicker: "持久剧情记忆",
        title: "持久剧情记忆，让 AI 角色真正知道整个世界发生过什么。",
        body: "AI 角色扮演最难的不是开始一场戏，而是把它持续下去。角色会忘掉世界设定、丢失声音，并迫使你每次回来都重新补上下文。Lagun 用可见且可修复的剧情记忆来解决这个问题。",
        panelTitle: "角色知道这个世界发生过什么，世界也因此保持一致。",
        bullets: [
          "长期记忆会保存共享上下文、语气、世界观事实和剧情线，这些都是持续叙事的基本材料。",
          "角色可以在跨会话时保持角色感，而不用你每次重讲设定和背景。",
          "记忆条目是可见的，因此你能准确知道当前回复调用了哪一条世界细节。",
          "当叙事漂移时，你可以在网页控制中心修复记忆，而不必把整个故事推倒重来。",
        ],
        guide: "查看持久记忆如何工作",
      },
      im: {
        kicker: "IM 聊天",
        title: "在 IM 里继续这场戏，让它和你的日常消息并存。",
        body: "多数 AI 角色扮演工具只存在于它们自己的界面里。切换去单独 App 会打断节奏，也让长期习惯更难建立。Lagun 会把角色带到 Telegram 或你偏好的 IM 应用中，让故事进入你本来就有的消息节奏。",
        panelTitle: "角色就在你的线程里，而不是锁在一个单独 App 中。",
        bullets: [
          "只需在网页上完成一次人设和 IM 渠道设置，角色就会进入你的消息线程。",
          "每次继续时，故事都会在同一段对话里接续，带着同一份世界记忆。",
          "当叙事不需要依赖一个你得刻意打开的独立 App 时，故事节奏会自然得多。",
          "如果需要查看记忆、调整角色细节或重置剧情线，再回到网页即可。",
        ],
        guide: "阅读 IM 聊天指南",
      },
      faq: {
        kicker: "常见问题",
        title: "关于 AI 角色扮演聊天的常见问题。",
        more: "查看全部常见问题",
        items: [
          { q: "什么是 AI 角色扮演聊天？", a: "AI 角色扮演聊天是一种和持续性 AI 角色共同进行的互动叙事。与每次都重置的单次会话工具不同，Lagun 支持持续中的角色扮演：角色会记住你们共同构建的故事，并在 IM 中继续推进。" },
          { q: "AI 角色能记住剧情细节吗？", a: "能。在 Lagun 中，重要剧情细节、世界观设定和角色上下文会作为可见记忆条目存储。你可以查看每条记录、追溯来源，并修正漂移内容，让世界保持连贯。" },
          { q: "Lagun 和其他 AI 角色扮演应用有什么不同？", a: "多数角色扮演工具都是单次会话式的，每次回来都要重新交代设定。Lagun 更强调持久剧情：角色会保留长期故事记忆、持续留在角色中，并把故事延伸到 IM，而不是困在单独界面里。" },
          { q: "AI 角色扮演需要单独的 App 吗？", a: "不需要。你只需在网页完成一次设置，之后故事就会在你已有的 IM 应用中继续，例如 Telegram。网站负责记忆和角色设定，真正的叙事发生在消息线程里。" },
          { q: "我可以创建什么类型的角色？", a: "你可以创建恋爱型伴侣、场景搭档或助手型人设。名字、语气和人格都由你来定义，角色的一致性依靠持久记忆来维持，而不是依赖僵硬预设。" },
        ],
      },
      cta: {
        kicker: "准备好了？",
        title: "开始这段故事，在 IM 中把它继续下去，做出真正能持续的东西。",
        body: "先选一个人设、定好语气，然后开始。持久记忆和 IM 连续性会接管剩下的部分，让故事不必一次次从头来过。",
        primary: "开始我的角色",
        continueFlow: "继续剧情流程",
        secondary: "了解 AI 伴侣",
      },
    };
  }

  return {
    hero: {
      heading: "AI roleplay chat where your character never forgets the story.",
      lead: "Shape a persona — romantic partner, scene character, or anything in between. They carry the story forward in your IM, exactly where you left off.",
    },
    presets: {
      kicker: "Choose your persona",
      title: "Start with a character. Build the world from there.",
      body: "Pick a starting persona below and adjust name, tone, and style before you begin. Every character remembers the story you build together.",
      meta: {
        caria: { type: "Persona · Female", tagline: "Picks up the story exactly where you left it. Every time.", emoji: "🌸" },
        velia: { type: "Persona · Female", tagline: "Sharp presence. Adapts to any scene without losing character.", emoji: "✦" },
        "sora-anime": { type: "Persona · Female", tagline: "Fluid and imaginative. Bends to fit whatever world you're building.", emoji: "🎨" },
      },
      fallbackType: "Persona",
    },
    definition: {
      kicker: "What is AI roleplay chat",
      title: "What makes this AI roleplay chat different — persistent memory, not single sessions.",
      body: "Most AI roleplay chat tools are built for isolated sessions — you set a scene, play it out, and start over next time. Lagun takes a different approach: the character you build persists, the world carries forward, and the story picks up wherever you left it.",
      cards: [
        { title: "Consistent character across every session", body: "The persona you build — name, tone, world details — stays intact from session to session. No re-establishing the setting, no drifting out of character. The narrative continues where it stopped, not from a generic blank slate." },
        { title: "Memory that tracks the world you've built", body: "In-world facts, character history, and story arcs are stored in visible memory rows. When the narrative drifts or a detail gets lost, you can trace it, correct it, and keep the world coherent as it grows — without starting over." },
        { title: "The story moves into IM — not just a browser tab", body: "After setup on web, the character moves into Telegram or your preferred IM app. The story continues in your regular messaging thread — same character, same world, same memory — without switching to a dedicated roleplay interface." },
      ],
    },
    memory: {
      kicker: "Persistent Story Memory",
      title: "Persistent story memory — the AI roleplay character knows the whole world.",
      body: "The hardest problem in AI roleplay is not starting a scene — it is continuing one. Characters forget the world, lose their voice, and force you to re-establish context every time you return. Lagun solves this with story-specific memory that stays visible and repairable.",
      panelTitle: "The character knows the world. The world stays consistent.",
      bullets: [
        "Long memory stores shared context, tone, in-world facts, and story arcs — the building blocks of a persistent narrative.",
        "The character stays in role across sessions without needing you to re-explain the setting or backstory.",
        "Memory rows are visible — you can trace exactly which world detail the character is drawing on in any given reply.",
        "When the narrative drifts, you can repair the memory from the web control center instead of restarting the story.",
      ],
      guide: "How persistent memory works",
    },
    im: {
      kicker: "IM Chat",
      title: "Continue the scene in IM — between your other messages.",
      body: "Most AI roleplay tools only exist in their own interface. Switching to a separate app breaks momentum and makes the habit hard to sustain. Lagun moves the character into Telegram or your preferred IM app so the story lives in your natural messaging rhythm.",
      panelTitle: "The character is in your thread — not locked in a separate app.",
      bullets: [
        "Set up the persona and IM channel on web once — the character moves into your messaging thread from there.",
        "The story picks up in the same conversation, with the same world memory, any time you continue.",
        "The narrative flows more naturally when it is not a separate app you have to consciously open.",
        "Return to web to review memory, adjust character details, or reset story arcs between sessions.",
      ],
      guide: "Read the IM chat guide",
    },
    faq: {
      kicker: "FAQ",
      title: "Common questions about AI roleplay chat.",
      more: "See all frequently asked questions",
      items: [
        { q: "What is AI roleplay chat?", a: "AI roleplay chat is interactive storytelling with a persistent AI character. Unlike session-based tools that reset, Lagun supports ongoing roleplay — the character remembers your shared story and continues it in your IM app, so the narrative grows instead of restarting." },
        { q: "Can an AI character remember roleplay story details?", a: "Yes. Long memory stores story details, world-building facts, and character context in visible memory rows. You can inspect, trace, and repair any stored entry from the web control center." },
        { q: "How is Lagun different from other AI roleplay chat apps?", a: "Most roleplay tools reset every session. Lagun builds persistent roleplay: the character maintains long-term story memory, stays in role without re-introduction, and the story continues in IM rather than requiring a dedicated app." },
        { q: "Do I need a separate app for AI roleplay chat?", a: "No. After web setup, the story continues in your existing IM app — such as Telegram. The website handles memory and settings; the narrative lives in your messaging thread." },
        { q: "What kinds of characters can I create for AI roleplay?", a: "Romantic companions, scene partners, or assistant-style personas. You define the name, tone, and personality before the first message. Persistent memory keeps the character consistent — not locked presets." },
      ],
    },
    cta: {
      kicker: "Ready?",
      title: "Start the story. Keep it alive in IM. Build something that lasts.",
      body: "Pick a persona, set the tone, and begin. Persistent memory and IM continuity handle the rest — so the story never has to start over.",
      primary: "Start my character",
      continueFlow: "Continue story flow",
      secondary: "See the companion path",
    },
  };
}
