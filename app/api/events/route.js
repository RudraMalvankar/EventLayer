import { getEventsService } from "../../../src/features/events/service";
import { publicCacheHeaders } from "../../../src/shared/cache/headers.js";
import { cacheKey, withCache, CACHE_TTL } from "../../../src/shared/cache/memory.js";
import { eventsQuerySchema } from "../../../src/shared/validation/schemas.js";
import { validateSearchParams } from "../../../src/shared/validation/validate.js";

// Route is automatically dynamic because it reads searchParams from request.url.
// CDN caching is handled via publicCacheHeaders below.
export async function GET(request) {
  try {
    const { data: parsed, error: validationError } = validateSearchParams(
      eventsQuerySchema,
      request,
    );
    if (validationError) return validationError;

    const args = {
      city: parsed.city || undefined,
      category: parsed.category || undefined,
      mode: parsed.mode || undefined,
      is_free: parsed.is_free,
      platform: parsed.platform || undefined,
      keyword: parsed.search || undefined,
      upcomingOnly: parsed.upcomingOnly,
      page: parsed.page,
      limit: parsed.limit,
    };

    const key = cacheKey(["events", JSON.stringify(args)]);
    const { data, error } = await withCache(key, CACHE_TTL.events, () =>
      getEventsService(args),
    );

    if (error) throw new Error(error);
    return Response.json(
      {
        data: {
          events: data?.events || [],
          total: data?.total || 0,
          page: parsed.page,
          limit: parsed.limit,
        },
        error: null,
      },
      { headers: publicCacheHeaders(60, 300) },
    );
  } catch (err) {
    console.error("API Events Error:", err.message);
    return Response.json(
      { data: { events: [], total: 0 }, error: err.message },
      { status: 500 },
    );
  }
}
