import { requireAuth } from "../../../src/features/auth/service.js";
import {
  trackEventRepo,
  getAnalyticsDashboardRepo,
} from "../../../src/features/analytics/repository.js";
import { sanitizeAnalyticsPayload } from "../../../src/shared/security/helpers.js";
import { isAdminEmail } from "../../../src/features/auth/admin.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);
    if (!isAdminEmail(user.email)) {
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
    const safe = sanitizeAnalyticsPayload(body);
    let userId = null;
    try {
      const { user } = await requireAuth(request);
      userId = user?.id || null;
    } catch {
      // anonymous tracking allowed for page views only
    }
    const { data, error } = await trackEventRepo({
      event_type: safe.event_type,
      user_id: userId,
      event_id: safe.event_id,
      metadata: safe.metadata,
    });
    return Response.json({ data, error });
  } catch {
    return Response.json({ data: { tracked: false }, error: null });
  }
}
