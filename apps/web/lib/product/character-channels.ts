import type {
  ProductRoleAvatarGender,
  ProductRoleMode
} from "@/lib/product/role-core";

export const CHARACTER_CHANNEL_SLUGS = ["caria", "teven", "velia"] as const;

export type CharacterChannelSlug = (typeof CHARACTER_CHANNEL_SLUGS)[number];

export function isCharacterChannelSlug(value: unknown): value is CharacterChannelSlug {
  return (
    typeof value === "string" &&
    (CHARACTER_CHANNEL_SLUGS as readonly string[]).includes(value)
  );
}

export function getCharacterChannelLabel(slug: CharacterChannelSlug) {
  switch (slug) {
    case "teven":
      return "Teven";
    case "velia":
      return "Velia";
    case "caria":
    default:
      return "Caria";
  }
}

export function recommendCharacterChannel(args: {
  mode: ProductRoleMode;
  avatarGender: ProductRoleAvatarGender | null;
}): CharacterChannelSlug {
  if (args.mode === "assistant") {
    return "velia";
  }

  if (args.avatarGender === "male") {
    return "teven";
  }

  return "caria";
}
