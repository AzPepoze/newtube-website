type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

class IsolateCache<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private defaultTtlMs: number;

    constructor(defaultTtlSeconds: number = 30) {
        this.defaultTtlMs = defaultTtlSeconds * 1000;
    }

    get(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value;
    }

    set(key: string, value: T, ttlSeconds?: number): void {
        const ttlMs = ttlSeconds ? ttlSeconds * 1000 : this.defaultTtlMs;
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}

class DownloadDeduplicator {
    private downloads = new Map<string, number>();
    private cooldownMs: number;

    constructor(cooldownMinutes: number = 60) {
        this.cooldownMs = cooldownMinutes * 60 * 1000;
    }

    shouldRecord(clientKey: string, themeId: string): boolean {
        const key = `${clientKey}:${themeId}`;
        const now = Date.now();
        const lastTime = this.downloads.get(key);

        if (lastTime && now - lastTime < this.cooldownMs) {
            return false;
        }

        this.downloads.set(key, now);
        // Clean up entries older than cooldown
        if (this.downloads.size > 5000) {
            for (const [k, time] of this.downloads.entries()) {
                if (now - time > this.cooldownMs) {
                    this.downloads.delete(k);
                }
            }
        }

        return true;
    }
}

export const sessionCache = new IsolateCache<{ userId: string; expiresAt: Date } | null>(30);
export const downloadDeduplicator = new DownloadDeduplicator(60);
