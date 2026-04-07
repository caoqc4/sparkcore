export type MultimodalIntentDecision = {
  imageRequested: boolean;
  audioRequested: boolean;
  explicitHumanSubjectRequested: boolean;
  shouldUseRolePortraitReference: boolean;
  rolePortraitReferenceStrength: "none" | "light" | "strong";
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
    /\b(give|show)\b[\s\S]{0,24}\b(me|us)?[\s\S]{0,24}\b(image|picture|photo|portrait|avatar)\b/i,
    /\b(image|picture|photo|portrait|avatar)\b[\s\S]{0,24}\b(of|about|for)\b/i,
    /\b(photo|picture|image|portrait|avatar)\b[\s\S]{0,24}\b(of you|of yourself|your|yourself)\b/i,
    /\b(foto|imagen|retrato)\b[\s\S]{0,24}\b(tuya|tuya misma|de ti|tu)\b/i,
    /\b(photo|image|portrait)\b[\s\S]{0,24}\b(de toi|toi|ta|ton)\b/i,
    /\b(foto|bild|portr[aä]t)\b[\s\S]{0,24}\b(von dir|dein|deine|dich)\b/i,
    /(你的|你自己|你本人的?)[\\s\\S]{0,12}(照片|相片|图片|头像|样子|长相)/u,
    /(あなた|君|きみ)[のが]?[\\s\\S]{0,8}(写真|画像|顔|姿)/u,
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

function decideRolePortraitReference(content: string) {
  const normalized = content.normalize("NFKC").trim();
  if (!normalized) {
    return {
      shouldUseRolePortraitReference: false,
      rolePortraitReferenceStrength: "none" as const,
      reasoning: "No content available for portrait-reference decision."
    };
  }

  const strongSignals = [
    /她本人|他本人|她的样子|他的样子|她长什么样|他长什么样/u,
    /她的脸|他的脸|她的长相|他的长相/u,
    /她的照片|他的照片|她的相片|他的相片/u,
    /你本人|你自己的样子|你长什么样|你的脸|你的长相/u,
    /你的照片|你的相片|你的图片|你的头像/u,
    /自拍|近照|证件照|头像照/u,
    /\b(look like|looks like|face|facial features|selfie|headshot|close[- ]?up)\b/i,
    /\b(photo of her|photo of him|picture of her|picture of him)\b/i,
    /\b(photo of you|picture of you|photo of yourself|picture of yourself|your photo|your picture|your portrait)\b/i,
    /\b(what do you look like|show me yourself|show me your face)\b/i,
    /\b(foto tuya|foto de ti|imagen tuya|retrato tuyo|como te ves)\b/i,
    /\b(photo de toi|image de toi|portrait de toi|a quoi tu ressembles)\b/i,
    /\b(dein foto|bild von dir|portr[aä]t von dir|wie siehst du aus)\b/i,
    /(あなた|君|きみ)の(写真|画像|顔|姿)/u
  ];

  const lightSignals = [
    /她在|他在|她穿着|他穿着|她坐在|他坐在|她站在|他站在/u,
    /给我看她|给我看他|来一张她|来一张他/u,
    /给我看你|来一张你|画你|拍你/u,
    /画她|画他|拍她|拍他/u,
    /你站在|你坐在|你走在|你在.+里|你在.+中|你在.+上/u,
    /以她为主|以他为主|主角是她|主角是他/u,
    /\b(her|him)\b[\s\S]{0,18}\b(photo|image|picture|portrait)\b/i,
    /\b(show|draw|make|create)\b[\s\S]{0,18}\b(her|him)\b/i,
    /\b(you|yourself)\b[\s\S]{0,18}\b(photo|image|picture|portrait)\b/i,
    /\b(show|draw|make|create)\b[\s\S]{0,18}\b(you|yourself)\b/i,
    /\byou\b[\s\S]{0,24}\b(in|inside|at|on|standing|sitting|walking)\b/i,
    /\b(tu|tú|usted|vous|toi|dir|du|você|voce)\b[\s\S]{0,24}\b(en|dans|im|na|em)\b/i,
    /(あなた|君|きみ)[\s\S]{0,16}(の中|にいる|に立つ|に座る)/u,
    /(너|당신)[\s\S]{0,16}(안에|위에|서 있는|앉아 있는)/u
  ];

  const sceneFirstSignals = [
    /风景|场景|天空|海边|海景|山景|日落|月亮|夜景|街景|房间|室内|壁纸/u,
    /海报|封面|旅行照|旅游照|明信片/u,
    /咖啡杯|蛋糕|桌面|菜单|建筑|城市天际线/u,
    /\b(landscape|scenery|skyline|room|interior|wallpaper|poster|environment|scene)\b/i,
    /\b(mountain|beach|sunset|moon|ocean|cityscape)\b/i
  ];

  const strongMatches = strongSignals.filter((pattern) => pattern.test(normalized)).length;
  const lightMatches = lightSignals.filter((pattern) => pattern.test(normalized)).length;
  const sceneMatches = sceneFirstSignals.filter((pattern) => pattern.test(normalized)).length;

  const weightedScore = strongMatches * 3 + lightMatches - sceneMatches;

  if (strongMatches > 0 || weightedScore >= 3) {
    return {
      shouldUseRolePortraitReference: true,
      rolePortraitReferenceStrength: "strong" as const,
      reasoning: "User wording strongly suggests character likeness or a role-centered photo."
    };
  }

  if (lightMatches > 0 && weightedScore >= 1) {
    return {
      shouldUseRolePortraitReference: true,
      rolePortraitReferenceStrength: "light" as const,
      reasoning: "User wording suggests the role should appear with some visual consistency."
    };
  }

  return {
    shouldUseRolePortraitReference: false,
    rolePortraitReferenceStrength: "none" as const,
    reasoning:
      sceneMatches > 0
        ? "Scene-first wording outweighs character-likeness cues."
        : "No clear need to preserve portrait-level character consistency."
  };
}

function decideExplicitHumanSubjectRequest(content: string) {
  const normalized = content.normalize("NFKC").trim();
  if (!normalized) {
    return false;
  }

  const strongPatterns = [
    /(你本人|你自己|你本人的?|她本人|他本人)[\s\S]{0,12}(照片|相片|图片|头像|样子|长相|脸)/u,
    /(你的|她的|他的)[\s\S]{0,8}(照片|相片|图片|头像|脸|长相|样子)/u,
    /(你|她|他)[\s\S]{0,10}(站在|坐在|走在|待在|在)[\s\S]{0,24}(照片|相片|图片|画像|样子)/u,
    /自拍|半身照|全身照|近照|证件照|头像照/u,
    /\b(photo|picture|image|portrait|avatar|shot|selfie)\b[\s\S]{0,32}\b(of you|of yourself|yourself|you|her|him)\b/i,
    /\b(your|her|his)\b[\s\S]{0,16}\b(photo|picture|image|portrait|avatar|selfie)\b/i,
    /\b(show|draw|make|create|generate|send)\b[\s\S]{0,32}\b(you|yourself|her|him)\b/i,
    /\b(what do you look like|show me yourself|show me your face|a photo of you|you standing in|you in the)\b/i,
    /\b(photo|picture|portrait|imagen|foto)\b[\s\S]{0,24}\b(de ti|de usted|de você|de você mesma|de você mesmo|de toi|von dir)\b/i,
    /\b(tú|tu|usted|vous|toi|du|dir|você|voce|あなた|君|너|당신)\b[\s\S]{0,24}\b(en|dans|im|na|em|在|の中で|안에)\b/i,
  ];

  if (strongPatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  const hasImageNoun =
    /(照片|相片|图片|画像|头像|写真|photo|picture|image|portrait|avatar|selfie|foto|imagen|imagem|fotoğraf|写真|画像|사진)/iu.test(
      normalized
    );
  const hasCharacterCue =
    /(你|你自己|你本人|她|他|yourself|you|herself|himself|her|him|tu|tú|usted|vous|toi|dir|du|você|voce|あなた|君|너|당신)/iu.test(
      normalized
    );
  const hasScenePresenceCue =
    /(站在|坐在|走在|待在|在.+里|在.+中|在.+上|inside|in the|at the|on the|standing in|standing on|sitting in|sitting on|walking in|walking through|dans|sur|en|im|am|auf|na|em|の中|にいる|안에|위에)/iu.test(
      normalized
    );

  return hasImageNoun && hasCharacterCue && hasScenePresenceCue;
}

export async function detectMultimodalIntent(
  content: string
): Promise<MultimodalIntentDecision> {
  const ruleDecision = detectMultimodalIntentByRules(content);
  const explicitHumanSubjectRequested = ruleDecision.imageRequested
    ? decideExplicitHumanSubjectRequest(content)
    : false;
  const portraitReferenceDecision = ruleDecision.imageRequested
    ? decideRolePortraitReference(content)
    : {
        explicitHumanSubjectRequested: false,
        shouldUseRolePortraitReference: false,
        rolePortraitReferenceStrength: "none" as const,
        reasoning: "No image request detected, so no portrait reference is needed."
      };
  if (ruleDecision.imageRequested || ruleDecision.audioRequested) {
    return {
      ...ruleDecision,
      explicitHumanSubjectRequested,
      shouldUseRolePortraitReference:
        portraitReferenceDecision.shouldUseRolePortraitReference,
      rolePortraitReferenceStrength:
        portraitReferenceDecision.rolePortraitReferenceStrength,
      imageConfidence: ruleDecision.imageRequested ? 0.98 : 0.02,
      audioConfidence: ruleDecision.audioRequested ? 0.98 : 0.02,
      source: "rules",
      reasoning: [
        "Matched high-confidence multimodal intent rules.",
        portraitReferenceDecision.reasoning
      ]
        .filter(Boolean)
        .join(" ")
    };
  }

  return {
    imageRequested: false,
    audioRequested: false,
    explicitHumanSubjectRequested: false,
    shouldUseRolePortraitReference: false,
    rolePortraitReferenceStrength: "none",
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
