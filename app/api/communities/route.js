import {
  getCommunitiesService,
  getFollowedCommunitiesEventsService,
} from "../../../src/features/communities/service.js";
import { requireAuth } from "../../../src/features/auth/service.js";
import { publicCacheHeaders, privateNoStoreHeaders } from "../../../src/shared/cache/headers.js";
import { cacheKey, withCache, CACHE_TTL } from "../../../src/shared/cache/memory.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || "Mumbai";
  const followed = searchParams.get("followed") === "1";

  if (followed) {
    try {
      const { user } = await requireAuth(request);
      const { data, error } = await getFollowedCommunitiesEventsService(user.id);
      return Response.json({ data, error }, { headers: privateNoStoreHeaders() });
    } catch (e) {
      if (e instanceof Response) return e;
      return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }
  }

  const key = cacheKey(["communities", city]);
  const { data, error } = await withCache(key, CACHE_TTL.communities, () =>
    getCommunitiesService({ city }),
  );

  return Response.json(
    { data, error },
    { headers: publicCacheHeaders(120, 600) },
  );
}
