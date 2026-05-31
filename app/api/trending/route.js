import { getTrendingEventsService } from "../../../src/features/events/service";
import { publicCacheHeaders } from "../../../src/shared/cache/headers.js";
import { cacheKey, withCache, CACHE_TTL } from "../../../src/shared/cache/memory.js";

export async function GET() {
  try {
    const key = cacheKey(["trending", "6"]);
    const { data, error } = await withCache(key, CACHE_TTL.trending, () =>
      getTrendingEventsService(6),
    );
    return Response.json({ data, error }, { headers: publicCacheHeaders(180, 600) });
  } catch (e) {
    return Response.json(
      { data: null, error: "Failed to fetch trending" },
      { status: 500 },
    );
  }
}
