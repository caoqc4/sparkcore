import { loadActiveModelProfileById } from "@/lib/chat/runtime-turn-context";

export async function loadSmokeBoundModelProfile(args: {
  supabase: Parameters<typeof loadActiveModelProfileById>[0]["supabase"];
  modelProfileId: string;
}) {
  const { data: modelProfile, error: modelProfileError } =
    await loadActiveModelProfileById({
      supabase: args.supabase,
      modelProfileId: args.modelProfileId
    });

  if (modelProfileError || !modelProfile) {
    throw new Error(
      modelProfileError?.message ??
        "The bound smoke model profile is unavailable."
    );
  }

  return modelProfile;
}
