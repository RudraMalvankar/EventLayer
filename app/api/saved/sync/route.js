import { requireAuth } from "../../../../src/features/auth/service.js";
import { syncSavedEventsRepo } from "../../../../src/features/saved/sync.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since") || null;
    const { data, error } = await syncSavedEventsRepo(user.id, since);
    return Response.json({ data, error });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}
