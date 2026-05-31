import { requireAuth } from "../../../src/features/auth/service.js";
import {
  listNotificationsRepo,
  markNotificationsReadRepo,
} from "../../../src/features/notifications/repository.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);
    const { data, error } = await listNotificationsRepo(user.id);
    return Response.json({ data, error });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request) {
  try {
    const { user } = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const { data, error } = await markNotificationsReadRepo(
      user.id,
      body?.ids,
    );
    return Response.json({ data, error });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}
