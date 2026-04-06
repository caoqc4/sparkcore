import type { AnswerCompositionTemporalHints } from "@/lib/chat/runtime-composition-contracts";
import type {
  HumanizedCaptionScene,
  HumanizedInteractionStage,
  HumanizedMovementImpulseMode,
  HumanizedUserEmotion,
  HumanizedUserIntent
} from "@/lib/chat/humanized-delivery-contracts";
import type { RecentRawTurn } from "@/lib/chat/session-context";

function parseIsoMillis(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const millis = Date.parse(value);
  return Number.isFinite(millis) ? millis : null;
}

export function normalizeComparableUserText(input: string) {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[，。,\.！!？?\s]/gu, "");
}

export function isMovementEscapeMessage(input: string) {
  return /想出门|想出去|想旅游|想旅行|想走走|散散心|透口气|抽身|逃离|躲开|换个地方/u.test(
    input
  );
}

export function detectHumanizedUserEmotion(
  latestUserMessage: string
): HumanizedUserEmotion {
  const normalized = latestUserMessage.normalize("NFKC").trim().toLowerCase();
  if (!normalized) {
    return "unclear";
  }

  if (
    /撑不住|崩溃|快不行|活不下去|受不了了|绝望|痛苦死了|真的很难受|i can't take it|i cant take it|breaking down|falling apart/u.test(
      normalized
    )
  ) {
    return "distressed";
  }

  if (
    /焦虑|慌|压力好大|压力很大|紧张|睡不着|失眠|害怕|烦死了|烦得很|overwhelmed|anxious|stressed|panic/u.test(
      normalized
    )
  ) {
    return "anxious";
  }

  if (
    /有点烦|很烦|心烦|烦啊|烦呢|烦躁|有点烦躁|累|好累|低落|难受|委屈|心情不好|没劲|疲惫|沮丧|sad|tired|down/u.test(
      normalized
    )
  ) {
    return "low";
  }

  if (
    /开心|高兴|激动|好兴奋|太爽了|太好了|冲|想马上|有动力|excited|pumped|energized/u.test(
      normalized
    )
  ) {
    return "energized";
  }

  if (
    /我觉得|我刚刚|看到|想到|分享|哈哈|笑死|猫|路上|今天|刚才|noticed|saw|thought/u.test(
      normalized
    )
  ) {
    return "sharing";
  }

  return "calm";
}

export function detectHumanizedUserIntent(
  latestUserMessage: string
): HumanizedUserIntent {
  const normalized = latestUserMessage.normalize("NFKC").trim().toLowerCase();
  if (!normalized) {
    return "continue";
  }

  if (
    /^(?:你好|你好呀|你好啊|早上好|上午好|中午好|下午好|晚上好|晚安|早呀|早安|hi|hello)(?:[，,\s。！？!?]*(?:你好|你好呀|你好啊|早上好|上午好|中午好|下午好|晚上好|晚安|早呀|早安|hi|hello))*[，,\s。！？!?]*$/iu.test(
      normalized
    )
  ) {
    return "greeting";
  }

  if (/哈哈|笑死|嘿嘿|逗你|抱抱|亲亲|哼|坏蛋|playful|joking/u.test(normalized)) {
    return "playful";
  }

  if (/记得|还记得|你知道我|你怎么看我|理解我|懂我|remember|understand me/u.test(normalized)) {
    return "understanding";
  }

  if (/陪我|陪陪我|在吗|别走|跟我聊聊|陪着我|stay with me|be here/u.test(normalized)) {
    return "companionship";
  }

  if (/安慰|抱抱|接住我|哄哄我|comfort me|reassure me/u.test(normalized)) {
    return "comfort";
  }

  if (
    /有点烦|很烦|心烦|烦啊|烦呢|烦躁|有点烦躁|难受|委屈|低落|不舒服|撑不住|好累|我现在有点/u.test(
      normalized
    )
  ) {
    return "companionship";
  }

  if (/帮我理|一起理|一起想|一起做|一起推进|一起排|陪我弄|co-work|work through/u.test(normalized)) {
    return "co_working";
  }

  if (/怎么办|建议|怎么做|帮我|可以吗|能不能|how do i|what should i|advice|suggest/u.test(normalized)) {
    return "advice";
  }

  if (/我觉得|我刚刚|看到|想到|分享|路上|今天|刚才|noticed|saw|thought/u.test(normalized)) {
    return "sharing";
  }

  return "continue";
}

export function detectHumanizedInteractionStage(args: {
  latestUserMessage: string;
  temporalHints: AnswerCompositionTemporalHints;
}): HumanizedInteractionStage {
  const normalized = args.latestUserMessage.normalize("NFKC").trim().toLowerCase();
  if (!normalized) {
    return "continuation";
  }

  if (!args.temporalHints.sameDayContinuation) {
    return "opening";
  }

  if (
    /^(?:你好|你好呀|你好啊|早上好|上午好|中午好|下午好|晚上好|晚安|早呀|早安|hi|hello)(?:[，,\s。！？!?]*(?:你好|你好呀|你好啊|早上好|上午好|中午好|下午好|晚上好|晚安|早呀|早安|hi|hello))*[，,\s。！？!?]*$/iu.test(
      normalized
    )
  ) {
    return "continuation";
  }

  if (/先不聊了|晚点再说|先这样|我先去忙|回头聊|bye|good night/u.test(normalized)) {
    return "closing";
  }

  if (/另外|还有|换个话题|顺便|说到这个|by the way/u.test(normalized)) {
    return "transition";
  }

  if (/其实|说真的|我现在|最近|一直|越来越|真的|honestly|lately/u.test(normalized)) {
    return "deepening";
  }

  return "continuation";
}

export function detectRepeatedEmotionSignal(args: {
  recentUserMessages: string[];
  latestEmotion: HumanizedUserEmotion;
}) {
  if (!["low", "anxious", "distressed"].includes(args.latestEmotion)) {
    return null;
  }

  const matchingCount = args.recentUserMessages.filter((message) => {
    const emotion = detectHumanizedUserEmotion(message);
    return (
      emotion === args.latestEmotion ||
      (args.latestEmotion === "low" && emotion === "anxious")
    );
  }).length;

  return matchingCount >= 2 ? args.latestEmotion : null;
}

export function detectEmotionIntensity(
  latestUserMessage: string,
  emotion: HumanizedUserEmotion
): "light" | "medium" | "high" | "unclear" {
  const normalized = latestUserMessage.normalize("NFKC").trim().toLowerCase();
  if (!normalized || emotion === "unclear") {
    return "unclear";
  }

  if (
    /真的|特别|非常|太|快撑不住|崩溃|受不了了|绝望|痛苦死了|panic|breaking down|falling apart/u.test(
      normalized
    )
  ) {
    return "high";
  }

  if (/有点|一点|还好|稍微|先|just a bit|kind of|a little/u.test(normalized)) {
    return "light";
  }

  return "medium";
}

export function detectEmotionConfidence(
  latestUserMessage: string,
  emotion: HumanizedUserEmotion
): "high" | "medium" | "low" {
  const normalized = latestUserMessage.normalize("NFKC").trim();
  if (!normalized || emotion === "unclear") {
    return "low";
  }

  if (/(烦|烦躁|焦虑|难受|委屈|低落|开心|激动|高兴|失眠|压力|累|撑不住|崩溃)/u.test(normalized)) {
    return "high";
  }

  if (normalized.length <= 2) {
    return "low";
  }

  return "medium";
}

export function detectIntentConfidence(
  latestUserMessage: string,
  intent: HumanizedUserIntent
): "high" | "medium" | "low" {
  const normalized = latestUserMessage.normalize("NFKC").trim();
  if (!normalized) {
    return "low";
  }

  if (
    intent === "greeting" ||
    intent === "advice" ||
    intent === "co_working" ||
    intent === "comfort" ||
    intent === "understanding"
  ) {
    return "high";
  }

  if (normalized.length <= 2 || /^(嗯|哦|好|行|啊|诶|欸)$/u.test(normalized)) {
    return "low";
  }

  return "medium";
}

import { detectExplicitAudioReplyIntent } from "@/lib/chat/multimodal-intent-decision";

export function detectRelationshipProbeSignal(latestUserMessage: string) {
  return /你还记得|你记得|你在不在|你还在吗|你会不会觉得|你是不是还记得|你有没有记住/u.test(
    latestUserMessage.normalize("NFKC")
  );
}

export function detectExplicitAudioIntent(latestUserMessage: string) {
  return detectExplicitAudioReplyIntent(latestUserMessage);
}

function normalizeComparableZh(content: string) {
  return content
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[，。！？!?、,\.\s]/gu, "")
    .trim();
}

export function areVerySimilarUserTurnsZh(a: string, b: string) {
  const left = normalizeComparableZh(a);
  const right = normalizeComparableZh(b);
  return left.length > 0 && left === right;
}

export function detectLightGreetingPrompt(latestUserMessage: string) {
  const normalized = latestUserMessage.normalize("NFKC").trim();
  if (!normalized) {
    return false;
  }

  return /^(你好|你好呀|你好啊|早上好|上午好|中午好|下午好|晚上好|晚安|早呀|早安|hi|hello)[，,\s。！？!?]*$/iu.test(
    normalized
  );
}

export function detectMovementImpulse(latestUserMessage: string) {
  const normalized = latestUserMessage.normalize("NFKC").trim();
  if (!normalized) {
    return false;
  }

  return /想出门|想出去|想旅游|想旅行|想走走|想散心|想透口气|想离开一下|想去个地方/u.test(
    normalized
  );
}

export function detectMovementImpulseMode(
  latestUserMessage: string
): HumanizedMovementImpulseMode {
  const normalized = latestUserMessage.normalize("NFKC");

  if (/想旅游|想旅行|去哪儿|去哪里|去个地方|认真去个地方|认真想去哪/u.test(normalized)) {
    return "destination_planning";
  }

  if (/离开一下|躲一会|抽身|退开|逃开|先离开|走开一下/u.test(normalized)) {
    return "short_escape";
  }

  return "stroll_breath";
}

export function detectCaptionScene(source: string): HumanizedCaptionScene {
  if (/草原|非洲|长颈鹿|象群|大象|斑马/u.test(source)) {
    return "grassland";
  }

  if (/阿拉斯加|雪山|山脉|群山|湖面|湖水|倒影|雪峰/u.test(source)) {
    return "mountain_water";
  }

  if (/海边|海浪|海风|沙滩|海面/u.test(source)) {
    return "seaside";
  }

  if (/冰川|冰山|北极|雪原|冰面/u.test(source)) {
    return "icy_plain";
  }

  if (/蓝天|飞鸟|鸟群|天空/u.test(source)) {
    return "sky_birds";
  }

  if (/夕阳|日落|黄昏|落日/u.test(source)) {
    return "sunset";
  }

  return "generic";
}

export function detectDeepIntent(args: {
  latestUserMessage: string;
  surfaceIntent: HumanizedUserIntent;
  emotion: HumanizedUserEmotion;
}) {
  const normalized = args.latestUserMessage.normalize("NFKC");
  const hasExplicitAdviceAsk =
    /怎么办|怎么做|怎么安慰|怎么回|怎么说|帮我想|帮我看看|给我建议|帮我出主意/u.test(
      normalized
    );
  if (
    args.surfaceIntent === "advice" &&
    !hasExplicitAdviceAsk &&
    /(烦|难受|委屈|低落|只是想聊聊|陪我|在吗)/u.test(normalized)
  ) {
    return "companionship" as const;
  }

  if (
    args.surfaceIntent === "continue" &&
    detectRelationshipProbeSignal(normalized)
  ) {
    return "understanding" as const;
  }

  if (
    (args.surfaceIntent === "sharing" || args.surfaceIntent === "continue") &&
    (args.emotion === "low" || args.emotion === "anxious")
  ) {
    return "companionship" as const;
  }

  return null;
}

export function detectMessageShape(latestUserMessage: string) {
  const normalized = latestUserMessage.normalize("NFKC").trim();
  if (/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{S}\p{P}]+$/u.test(normalized)) {
    return "emoji_or_symbol" as const;
  }

  if (normalized.length <= 2) {
    return "single_token" as const;
  }

  if (normalized.length <= 24) {
    return "short_sentence" as const;
  }

  return "long_paragraph" as const;
}

export function detectBehaviorRhythm(args: {
  temporalHints: AnswerCompositionTemporalHints;
  recentRawTurns: RecentRawTurn[];
}) {
  if (args.temporalHints.consecutiveUserMessages >= 2) {
    return "rapid_fire" as const;
  }

  const latestUserTurn = [...args.recentRawTurns].reverse().find((turn) => turn.role === "user");
  const previousTurn =
    args.recentRawTurns.length >= 2
      ? args.recentRawTurns[args.recentRawTurns.length - 2]
      : null;
  const latestMillis = parseIsoMillis(latestUserTurn?.created_at);
  const previousMillis = parseIsoMillis(previousTurn?.created_at);

  if (
    latestMillis !== null &&
    previousMillis !== null &&
    latestMillis - previousMillis >= 30 * 60_000
  ) {
    return "slow_return" as const;
  }

  return "normal" as const;
}

export function countTurnsSince(args: {
  recentRawTurns: RecentRawTurn[];
  localDate: string;
  nowMs: number;
}) {
  let todayTurnCount = 0;
  let recentHourTurnCount = 0;

  for (const turn of args.recentRawTurns) {
    const createdAt = turn.created_at;
    if (createdAt.slice(0, 10) === args.localDate) {
      todayTurnCount += 1;
    }

    const turnMillis = parseIsoMillis(createdAt);
    if (turnMillis !== null && args.nowMs - turnMillis <= 60 * 60_000) {
      recentHourTurnCount += 1;
    }
  }

  return {
    todayTurnCount,
    recentHourTurnCount
  };
}

export function detectRecurrentThemeSignal(args: {
  latestUserMessage: string;
  recentUserMessages: string[];
}) {
  const latestNormalized = normalizeComparableUserText(args.latestUserMessage);
  const repeatedSameMessage = args.recentUserMessages.some((message) => {
    if (message === args.latestUserMessage) {
      return false;
    }
    return normalizeComparableUserText(message) === latestNormalized;
  });

  if (repeatedSameMessage) {
    return "movement_escape" as const;
  }

  const movementCount = args.recentUserMessages.filter((message) =>
    isMovementEscapeMessage(message)
  ).length;
  return movementCount >= 2 && isMovementEscapeMessage(args.latestUserMessage)
    ? ("movement_escape" as const)
    : null;
}

export function detectInputConflictSignal(latestUserMessage: string) {
  const normalized = latestUserMessage.normalize("NFKC");
  const placeMentions = [
    { label: "北海", pattern: /北海/u },
    { label: "阿拉斯加", pattern: /阿拉斯加/u },
    { label: "澳洲", pattern: /澳洲|澳大利亚/u },
    { label: "非洲", pattern: /非洲/u }
  ].filter((entry) => entry.pattern.test(normalized));

  if (placeMentions.length >= 2) {
    return {
      inputConflict: true,
      conflictHint: `${placeMentions[0]!.label} vs ${placeMentions[1]!.label}`
    };
  }

  return {
    inputConflict: false,
    conflictHint: null
  };
}
