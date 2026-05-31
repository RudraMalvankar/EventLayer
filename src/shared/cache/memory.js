const store = new Map();

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
