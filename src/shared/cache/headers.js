export function publicCacheHeaders(maxAge = 60, swr = 300) {
  return {
    "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
  };
}

export function privateNoStoreHeaders() {
  return { "Cache-Control": "private, no-store" };
}
