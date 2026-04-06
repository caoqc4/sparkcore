export function nowMs() {
  return Date.now();
}

export function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function elapsedMs(startedAt: number) {
  return Math.max(0, nowMs() - startedAt);
}

export function isSmokeModeEnabled() {
  return process.env.PLAYWRIGHT_SMOKE_MODE === "1";
}

export function approximateTokenCountFromBytes(bytes: number) {
  return Math.max(1, Math.ceil(bytes / 4));
}
