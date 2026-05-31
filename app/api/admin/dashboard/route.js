import { isAdminAuthorized } from "../../../../src/features/auth/adminSession.js";
import { getPlatformAdminDashboard } from "../../../../src/features/admin/service.js";

export async function GET(request) {
  const allowed = await isAdminAuthorized(request);
  if (!allowed) {
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await getPlatformAdminDashboard();
  return Response.json({ data, error });
}
