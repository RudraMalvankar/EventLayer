const store = new Map();
const MAX_CACHE_SIZE = 500;

/**
 * Evict expired entries and enforce max size.
 */
function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }
  // If still over limit, evict oldest entries
  if (store.size > MAX_CACHE_SIZE) {
    const entries = [...store.entries()]
      .sort(([, a], [, b]) => a.expiresAt - b.expiresAt);
    const toRemove = entries.slice(0, store.size - MAX_CACHE_SIZE);
    for (const [key] of toRemove) {
      store.delete(key);
    }
  }
}

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs = 60_000) {
  // Evict before adding to prevent unbounded growth
  if (store.size >= MAX_CACHE_SIZE) {
    evictExpired();
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function cacheKey(parts) {
  return parts.filter(Boolean).join("::");
}

export function withCache(key, ttlMs, fn) {
  const hit = getCached(key);
  if (hit !== null) return Promise.resolve(hit);
  return Promise.resolve(fn()).then((result) => setCached(key, result, ttlMs));
}

export const CACHE_TTL = {
  events: 60_000,
  communities: 120_000,
  trending: 180_000,
  communityDetail: 90_000,
};
