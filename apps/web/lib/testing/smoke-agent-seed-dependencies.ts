import type {
  SmokeModelProfile,
  SmokeSeedPersonaPack
} from "@/lib/testing/smoke-agent-seeding-types";

export function resolveSmokeAgentSeedDependencies(args: {
  personaPacks: SmokeSeedPersonaPack[];
  modelProfiles: SmokeModelProfile[];
}) {
  const sparkGuidePack = args.personaPacks.find(
    (pack) => pack.slug === "spark-guide"
  );
  const memoryCoachPack = args.personaPacks.find(
    (pack) => pack.slug === "memory-coach"
  );
  const defaultProfile = args.modelProfiles.find(
    (profile) => profile.slug === "spark-default"
  );
  const altProfile = args.modelProfiles.find(
    (profile) => profile.slug === "smoke-alt"
  );

  if (!sparkGuidePack || !memoryCoachPack || !defaultProfile || !altProfile) {
    throw new Error("Smoke seed dependencies are incomplete.");
  }

  return {
    sparkGuidePack,
    memoryCoachPack,
    defaultProfile,
    altProfile
  };
}
