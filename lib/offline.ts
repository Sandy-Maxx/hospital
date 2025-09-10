class OfflineDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    this.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("HospitalDB", 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("cache")) {
          const store = db.createObjectStore("cache", { keyPath: "key" });
          store.createIndex("expiresAt", "expiresAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("pending_actions")) {
          db.createObjectStore("pending_actions", { keyPath: "id" });
        }
      };
    });
  }

  private getStore(store: string, mode: IDBTransactionMode = "readonly") {
    if (!this.db) throw new Error("OfflineDB not initialized");
    const tx = this.db.transaction([store], mode);
    return tx.objectStore(store);
  }

  async cacheSet(key: string, data: any, ttlMs: number): Promise<void> {
    try {
      await this.init();
      const expiresAt = Date.now() + ttlMs;
      await new Promise<void>((resolve, reject) => {
        const store = this.getStore("cache", "readwrite");
        const req = store.put({ key, data, expiresAt });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {}
  }

  async cacheGet<T = any>(key: string): Promise<T | null> {
    try {
      await this.init();
      return await new Promise<T | null>((resolve, reject) => {
        const store = this.getStore("cache", "readonly");
        const req = store.get(key);
        req.onsuccess = () => {
          const val = req.result as { key: string; data: T; expiresAt: number } | undefined;
          if (!val) return resolve(null);
          if (Date.now() > val.expiresAt) return resolve(null);
          resolve(val.data);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async queueAction(action: { id: string; method: string; url: string; body?: any }): Promise<void> {
    try {
      await this.init();
      await new Promise<void>((resolve, reject) => {
        const store = this.getStore("pending_actions", "readwrite");
        const req = store.put(action);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {}
  }

  async listPending(): Promise<Array<{ id: string; method: string; url: string; body?: any }>> {
    try {
      await this.init();
      return await new Promise((resolve, reject) => {
        const store = this.getStore("pending_actions", "readonly");
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as any[]);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  }

  async removePending(id: string): Promise<void> {
    try {
      await this.init();
      await new Promise<void>((resolve, reject) => {
        const store = this.getStore("pending_actions", "readwrite");
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {}
  }
}

export const offlineDB = new OfflineDB();

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

