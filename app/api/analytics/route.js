import { requireAuth } from "../../../src/features/auth/service.js";
import {
  trackEventRepo,
  getAnalyticsDashboardRepo,
} from "../../../src/features/analytics/repository.js";
import { env } from "../../../src/shared/config/env.js";

function isAdmin(email) {
  const list = String(env.adminEmails || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email || "").toLowerCase());
}

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdmin(user.email)) {
      return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
    }
    const { data, error } = await getAnalyticsDashboardRepo();
    return Response.json({ data, error });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    let userId = null;
    try {
      const { user } = await requireAuth(request);
      userId = user?.id || null;
    } catch {
      // anonymous tracking allowed
    }
    const { data, error } = await trackEventRepo({
      event_type: body.event_type,
      user_id: userId,
      event_id: body.event_id || null,
      metadata: body.metadata || {},
    });
    return Response.json({ data, error });
  } catch {
    return Response.json({ data: { tracked: false }, error: null });
  }
}
