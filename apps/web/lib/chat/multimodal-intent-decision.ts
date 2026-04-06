export type MultimodalIntentDecision = {
  imageRequested: boolean;
  audioRequested: boolean;
  imageConfidence: number;
  audioConfidence: number;
  source: "rules" | "fallback_rules";
  reasoning: string | null;
};

function buildImageIntentPatterns() {
  return [
    /生成(一张|一个|些)?图/,
    /生成[\s\S]{0,24}(图|图片|照片|相片)/,
    /来张图/,
    /发(我)?一张图/,
    /发(我)?[\s\S]{0,24}(图|图片|照片|相片)/,
    /给我[\s\S]{0,24}(图|图片|照片|相片)/,
    /画(一张|个)?/,
    /做(一张|个)?(图片|头像)/,
    /看(看)?(图|图片)/,
    /照片/,
    /相片/,
    /\b(generate|make|create|draw|send)\b[\s\S]{0,24}\b(image|picture|photo|portrait|avatar)\b/i,
    /\bimage\b[\s\S]{0,24}\bplease\b/i,
  ];
}

function buildAudioIntentPatterns() {
  return [
    /语音回/,
    /发(我)?语音/,
    /用语音/,
    /语音说/,
    /语音讲/,
    /语音念/,
    /说给我听/,
    /读给我听/,
    /讲给我听/,
    /读给我/,
    /讲给我/,
    /听听你的声音/,
    /语音消息/,
    /\bvoice\b[\s\S]{0,16}\b(reply|message|note)\b/i,
    /\baudio\b[\s\S]{0,16}\b(reply|message|note)\b/i,
  ];
}

export function detectMultimodalIntentByRules(content: string) {
  const normalized = content.trim();
  const imageRequested = buildImageIntentPatterns().some((pattern) => pattern.test(normalized));
  const audioRequested = buildAudioIntentPatterns().some((pattern) => pattern.test(normalized));

  return {
    imageRequested,
    audioRequested,
  };
}

export async function detectMultimodalIntent(
  content: string
): Promise<MultimodalIntentDecision> {
  const ruleDecision = detectMultimodalIntentByRules(content);
  if (ruleDecision.imageRequested || ruleDecision.audioRequested) {
    return {
      ...ruleDecision,
      imageConfidence: ruleDecision.imageRequested ? 0.98 : 0.02,
      audioConfidence: ruleDecision.audioRequested ? 0.98 : 0.02,
      source: "rules",
      reasoning: "Matched high-confidence multimodal intent rules."
    };
  }

  return {
    imageRequested: false,
    audioRequested: false,
    imageConfidence: 0.01,
    audioConfidence: 0.01,
    source: "fallback_rules",
    reasoning: "No explicit multimodal request matched the centralized decision rules."
  };
}

export function detectExplicitAudioReplyIntent(content: string) {
  return detectMultimodalIntentByRules(content).audioRequested;
}

export function extractExplicitAudioContent(content: string): string | null {
  const normalized = content.trim();
  if (!normalized) {
    return null;
  }

  const hasAudioCue = buildAudioIntentPatterns().some((pattern) => pattern.test(normalized));
  if (!hasAudioCue) {
    return null;
  }

  const quotedMatches = Array.from(
    normalized.matchAll(/[“"「『](.+?)[”"」』]/g)
  );
  const lastQuoted = quotedMatches.at(-1)?.[1]?.trim() ?? null;
  if (lastQuoted && lastQuoted.length > 0) {
    return lastQuoted;
  }

  const colonMatch = normalized.match(
    /(?:用语音(?:回(?:我)?|说|讲|念|读)?|语音(?:回(?:我)?|说|讲|念|读)?|说给我听|读给我听|讲给我听)[：:]\s*([\s\S]+)/
  );
  if (colonMatch?.[1]) {
    const extracted = colonMatch[1].trim();
    return extracted.length > 0 ? extracted : null;
  }

  const conversationalMatch = normalized.match(
    /(?:你能|可以|麻烦你|请你)?(?:用语音|语音|说给我听|读给我听|讲给我听)(?:说|讲|念|读)?(?:一下|一声)?[，,\s]*([^。！？!?]{1,80}?)(?:吗|呢|吧|呀|啊)?[。！？!?]?$/u
  );
  if (conversationalMatch?.[1]) {
    const extracted = conversationalMatch[1]
      .trim()
      .replace(/^[“"「『]|[”"」』]$/g, "")
      .trim();
    return extracted.length > 0 ? extracted : null;
  }

  return null;
}
