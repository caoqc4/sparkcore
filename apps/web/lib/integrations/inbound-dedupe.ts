const DEDUPE_TTL_MS = 5 * 60 * 1000;

export class InboundDedupeWindow {
  private readonly seen = new Map<string, number>();

  has(key: string) {
    this.pruneExpired();
    return this.seen.has(key);
  }

  claim(key: string) {
    this.pruneExpired();

    if (this.seen.has(key)) {
      return false;
    }

    this.seen.set(key, Date.now() + DEDUPE_TTL_MS);
    return true;
  }

  add(key: string) {
    this.pruneExpired();
    this.seen.set(key, Date.now() + DEDUPE_TTL_MS);
  }

  private pruneExpired() {
    const now = Date.now();

    for (const [key, expiresAt] of this.seen.entries()) {
      if (expiresAt <= now) {
        this.seen.delete(key);
      }
    }
  }
}
