import { isOnline, offlineDB } from "@/lib/offline";

export const apiClient = {
  async getJSON<T = any>(url: string, opts: { cacheKey?: string; ttl?: number } = {}): Promise<T> {
    const cacheKey = opts.cacheKey || url;
    const ttl = typeof opts.ttl === "number" ? opts.ttl : 5 * 60 * 1000;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as T;
      // best-effort cache
      if (typeof window !== "undefined") offlineDB.cacheSet(cacheKey, data, ttl);
      return data;
    } catch (e) {
      // offline fallback
      const cached = typeof window !== "undefined" ? await offlineDB.cacheGet<T>(cacheKey) : null;
      if (cached) return cached;
      throw e;
    }
  },

  async requestJSON<T = any>(url: string, opts: { method?: string; body?: any; queueOnOffline?: boolean } = {}): Promise<{ queued?: boolean; data?: T }> {
    const method = (opts.method || 'GET').toUpperCase();
    const queueOnOffline = opts.queueOnOffline !== false;

    if (!isOnline() && queueOnOffline && method !== 'GET') {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await offlineDB.queueAction({ id, method, url, body: opts.body });
      return { queued: true };
    }

    const res = await fetch(url, {
      method,
      headers: method === 'GET' ? undefined : { "Content-Type": "application/json" },
      body: opts.body && method !== 'GET' ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    return { data };
  },

  async postJSON<T = any>(url: string, body: any, opts: { queueOnOffline?: boolean } = {}): Promise<{ queued?: boolean; data?: T }> {
    const queueOnOffline = opts.queueOnOffline !== false;

    if (typeof window !== "undefined" && !isOnline() && queueOnOffline) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await offlineDB.queueAction({ id, method: "POST", url, body });
      return { queued: true };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    return { data };
  },

  async syncQueued(): Promise<void> {
    if (typeof window === "undefined") return;
    if (!isOnline()) return;
    const pending = await offlineDB.listPending();
    for (const item of pending) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: { "Content-Type": "application/json" },
          body: item.body ? JSON.stringify(item.body) : undefined,
        });
        if (res.ok) {
          await offlineDB.removePending(item.id);
        }
      } catch {
        // leave in queue for next time
      }
    }
  },
};

