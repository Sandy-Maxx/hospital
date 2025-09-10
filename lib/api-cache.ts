class ApiCache {
  private store = new Map<string, { data: any; expiresAt: number }>();

  get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: any, ttlMs: number = 300000) {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  clear() {
    this.store.clear();
  }
}

export const apiCache = new ApiCache();

