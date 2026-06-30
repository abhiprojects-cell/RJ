// music.cache.js — TTL-based in-memory Map cache + in-flight deduplication

/**
 * Creates a TTL cache backed by a Map.
 * @param {number} defaultTtlMs  Default TTL in milliseconds
 */
export function createCache(defaultTtlMs = 5 * 60 * 1000) {
  /** @type {Map<string, { value: any, expiresAt: number }>} */
  const store = new Map();

  /** @type {Map<string, Promise<any>>} */
  const inFlight = new Map();

  function get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  }

  function set(key, value, ttlMs = defaultTtlMs) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  function del(key) {
    store.delete(key);
  }

  function clear() {
    store.clear();
  }

  /**
   * Deduplication-aware fetch helper.
   * If the same key is already being fetched, returns the same promise.
   * On success, caches the result and removes from in-flight map.
   * @param {string} key
   * @param {() => Promise<any>} fetcher
   * @param {number} [ttlMs]
   * @returns {Promise<any>}
   */
  async function getOrFetch(key, fetcher, ttlMs = defaultTtlMs) {
    const cached = get(key);
    if (cached !== null) return cached;

    if (inFlight.has(key)) {
      return inFlight.get(key);
    }

    const promise = fetcher()
      .then((result) => {
        set(key, result, ttlMs);
        inFlight.delete(key);
        return result;
      })
      .catch((err) => {
        inFlight.delete(key);
        throw err;
      });

    inFlight.set(key, promise);
    return promise;
  }

  /** Prune all expired entries (call periodically if needed) */
  function prune() {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.expiresAt) store.delete(key);
    }
  }

  return { get, set, del, clear, getOrFetch, prune };
}

// ── Shared cache instances (one per endpoint TTL group) ──────────────────────

/** 5-minute cache for search results */
export const searchCache = createCache(5 * 60 * 1000);

/** 10-minute cache for stream URLs */
export const streamCache = createCache(10 * 60 * 1000);

/** 30-minute cache for trending */
export const trendingCache = createCache(30 * 60 * 1000);

/** 2-minute cache for suggestions */
export const suggestCache = createCache(2 * 60 * 1000);

/** 5-minute cache for track info */
export const infoCache = createCache(5 * 60 * 1000);

// Prune caches every 10 minutes to avoid memory growth
setInterval(() => {
  searchCache.prune();
  streamCache.prune();
  trendingCache.prune();
  suggestCache.prune();
  infoCache.prune();
}, 10 * 60 * 1000);
