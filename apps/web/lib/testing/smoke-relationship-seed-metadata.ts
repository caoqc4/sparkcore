import { buildSmokeSeedMetadata } from "@/lib/testing/smoke-seed-metadata";

export function buildSmokeRelationshipSeedMetadata(relationKind: string) {
  return buildSmokeSeedMetadata({
    relation_kind: relationKind
  });
}
