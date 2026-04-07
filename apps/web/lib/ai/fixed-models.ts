export const FIXED_TEXT_MODEL_SLUG = "text-gemini-2-5-flash";
export const FIXED_TEXT_MODEL_NAME = "Gemini 2.5 Flash";
export const FIXED_TEXT_MODEL_PROVIDER = "google-ai-studio";
export const FIXED_TEXT_MODEL_ID = "gemini-2.5-flash";
export type FixedTextFallbackProvider = "replicate" | "fal_ai";
export type FixedTextFallbackRoute = {
  provider: FixedTextFallbackProvider;
  model: string;
};

export const FIXED_TEXT_MODEL_FALLBACK_ROUTES: FixedTextFallbackRoute[] = [
  {
    provider: "replicate",
    model: "google/gemini-2.5-flash"
  }
];

export const FIXED_IMAGE_MODEL_SLUG = "image-flux-2-klein-4b";
export const FIXED_IMAGE_MODEL_NAME = "FLUX.2 [klein] 4B";
export const FIXED_IMAGE_MODEL_PROVIDER = "fal-ai";
export const FIXED_IMAGE_MODEL_ID = "fal-ai/flux-2/klein/4b";
