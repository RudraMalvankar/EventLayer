import { requireAuth } from "../../../src/features/auth/service.js";
import { getOrganizerDashboardService } from "../../../src/features/organizers/service.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);
    const { data, error } = await getOrganizerDashboardService(user.id);
    return Response.json({ data, error });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}
