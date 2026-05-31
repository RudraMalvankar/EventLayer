import { requireAuth } from "../../../src/features/auth/service.js";
import {
  getPersonalizedFeedService,
  getCommunityActivityService,
} from "../../../src/features/feed/service.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 12);
    const page = Number(searchParams.get("page") || 1);
    const activity = searchParams.get("activity") === "1";

    if (activity) {
      const { data, error } = await getCommunityActivityService(user.id);
      return Response.json({ data, error });
    }

    const { data, error } = await getPersonalizedFeedService(user.id, {
      limit,
      page,
    });
    return Response.json({ data, error });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}
