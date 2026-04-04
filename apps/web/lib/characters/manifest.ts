// Character manifest — single source of truth for all system-defined characters.
//
// Storage path convention: character-assets/{slug}/{asset-type}-{variant}.{ext}
// Asset types: portrait, audio
// Portrait variants: main (full card), chat (cropped avatar)
// Audio variants: sample (short demo clip)
//
// To add a new character: add an entry here, upload assets to the bucket,
// then add the corresponding persona_pack migration.

export type CharacterMode = "companion" | "assistant";
export type CharacterGender = "female" | "male" | "neutral";
export type CharacterAvatarStyle = "realistic" | "anime" | "illustrated";

export type CharacterAssets = {
  /** Full portrait image for cards and profile views */
  portraitMain: string;
  /** Cropped square avatar for chat headers and lists */
  portraitChat: string;
  /** Short audio clip demoing the character's voice */
  audioSample: string;
};

export type CharacterDefinition = {
  slug: string;
  personaPackSlug: string;
  displayName: string;
  mode: CharacterMode;
  avatarGender: CharacterGender;
  avatarStyle: CharacterAvatarStyle;
  assets: CharacterAssets;
};

const BUCKET = "character-assets";

function assetPath(slug: string, filename: string): string {
  return `${BUCKET}/${slug}/${filename}`;
}

export const CHARACTER_MANIFEST = {
  caria: {
    slug: "caria",
    personaPackSlug: "product-girlfriend",
    displayName: "Caria",
    mode: "companion",
    avatarGender: "female",
    avatarStyle: "realistic",
    assets: {
      portraitMain: assetPath("caria", "portrait-main.webp"),
      portraitChat: assetPath("caria", "portrait-chat.webp"),
      audioSample:  assetPath("caria", "audio-sample.mp3"),
    },
  },
  teven: {
    slug: "teven",
    personaPackSlug: "product-boyfriend",
    displayName: "Teven",
    mode: "companion",
    avatarGender: "male",
    avatarStyle: "realistic",
    assets: {
      portraitMain: assetPath("teven", "portrait-main.webp"),
      portraitChat: assetPath("teven", "portrait-chat.webp"),
      audioSample:  assetPath("teven", "audio-sample.mp3"),
    },
  },
  velia: {
    slug: "velia",
    personaPackSlug: "product-assistant",
    displayName: "Velia",
    mode: "assistant",
    avatarGender: "female",
    avatarStyle: "realistic",
    assets: {
      portraitMain: assetPath("velia", "portrait-main.webp"),
      portraitChat: assetPath("velia", "portrait-chat.webp"),
      audioSample:  assetPath("velia", "audio-sample.mp3"),
    },
  },
  lena: {
    slug: "lena",
    personaPackSlug: "product-companion-lena",
    displayName: "Lena",
    mode: "companion",
    avatarGender: "female",
    avatarStyle: "realistic",
    assets: {
      portraitMain: assetPath("lena", "portrait-main.webp"),
      portraitChat: assetPath("lena", "portrait-chat.webp"),
      audioSample:  assetPath("lena", "audio-sample.mp3"),
    },
  },
  sora: {
    slug: "sora",
    personaPackSlug: "product-companion-sora",
    displayName: "Sora",
    mode: "companion",
    avatarGender: "female",
    avatarStyle: "anime",
    assets: {
      portraitMain: assetPath("sora", "portrait-main.webp"),
      portraitChat: assetPath("sora", "portrait-chat.webp"),
      audioSample:  assetPath("sora", "audio-sample.mp3"),
    },
  },
  leon: {
    slug: "leon",
    personaPackSlug: "product-assistant-leon",
    displayName: "Leon",
    mode: "assistant",
    avatarGender: "male",
    avatarStyle: "realistic",
    assets: {
      portraitMain: assetPath("leon", "portrait-main.webp"),
      portraitChat: assetPath("leon", "portrait-chat.webp"),
      audioSample:  assetPath("leon", "audio-sample.mp3"),
    },
  },
  mira: {
    slug: "mira",
    personaPackSlug: "product-assistant-mira",
    displayName: "Mira",
    mode: "assistant",
    avatarGender: "female",
    avatarStyle: "realistic",
    assets: {
      portraitMain: assetPath("mira", "portrait-main.webp"),
      portraitChat: assetPath("mira", "portrait-chat.webp"),
      audioSample:  assetPath("mira", "audio-sample.mp3"),
    },
  },
  ryuu: {
    slug: "ryuu",
    personaPackSlug: "product-assistant-ryuu",
    displayName: "Ryuu",
    mode: "assistant",
    avatarGender: "male",
    avatarStyle: "anime",
    assets: {
      portraitMain: assetPath("ryuu", "portrait-main.webp"),
      portraitChat: assetPath("ryuu", "portrait-chat.webp"),
      audioSample:  assetPath("ryuu", "audio-sample.mp3"),
    },
  },
  fen: {
    slug: "fen",
    personaPackSlug: "product-assistant-fen",
    displayName: "Fen",
    mode: "assistant",
    avatarGender: "male",
    avatarStyle: "realistic",
    assets: {
      portraitMain: assetPath("fen", "portrait-main.webp"),
      portraitChat: assetPath("fen", "portrait-chat.webp"),
      audioSample:  assetPath("fen", "audio-sample.mp3"),
    },
  },
  "sora-anime": {
    slug: "sora-anime",
    personaPackSlug: "product-assistant-sora-anime",
    displayName: "Sora",
    mode: "assistant",
    avatarGender: "female",
    avatarStyle: "anime",
    assets: {
      portraitMain: assetPath("sora-anime", "portrait-main.webp"),
      portraitChat: assetPath("sora-anime", "portrait-chat.webp"),
      audioSample:  assetPath("sora-anime", "audio-sample.mp3"),
    },
  },
} as const satisfies Record<string, CharacterDefinition>;

export type CharacterSlug = keyof typeof CHARACTER_MANIFEST;

export const DEFAULT_CHARACTERS = [
  CHARACTER_MANIFEST.caria,
  CHARACTER_MANIFEST.teven,
  CHARACTER_MANIFEST.velia,
] as const;
