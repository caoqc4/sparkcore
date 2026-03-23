export function buildSmokeSeedMetadata(fields?: Record<string, unknown>) {
  return {
    smoke_seed: true,
    ...(fields ?? {})
  };
}

export function mergeSmokeSeedMetadata(
  base?: Record<string, unknown> | null,
  fields?: Record<string, unknown>
) {
  return {
    ...(base ?? {}),
    ...buildSmokeSeedMetadata(fields)
  };
}
