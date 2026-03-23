export type SmokeUserLike = {
  id: string;
  email: string;
  workspaceId: string;
};

export type SmokeModelProfile = {
  id: string;
  slug: string;
  name: string;
};

export type SmokeSeedPersonaPack = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  persona_summary: string;
  style_prompt: string;
  system_prompt: string;
};
