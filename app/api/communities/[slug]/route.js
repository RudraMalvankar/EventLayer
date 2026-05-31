import { getCommunityEventsService } from "../../../../src/features/communities/service.js";
import { publicCacheHeaders } from "../../../../src/shared/cache/headers.js";
import { cacheKey, withCache, CACHE_TTL } from "../../../../src/shared/cache/memory.js";

export async function GET(_request, { params }) {
  const slug = String(params?.slug || "").trim();
  if (!slug) {
    return Response.json({ data: null, error: "slug is required" }, { status: 400 });
  }

  const key = cacheKey(["community", slug]);
  const { data, error } = await withCache(key, CACHE_TTL.communityDetail, () =>
    getCommunityEventsService(slug),
  );

  if (error === "Community not found") {
    return Response.json({ data: null, error }, { status: 404 });
  }
  return Response.json({ data, error }, { headers: publicCacheHeaders(90, 300) });
}
