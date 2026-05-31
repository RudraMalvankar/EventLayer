import { requireAuth } from "../../../src/features/auth/service.js";
import {
  getDigestService,
  generateDigestService,
} from "../../../src/features/digest/service.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);
    const { data, error } = await getDigestService(user.id);
    return Response.json({ data, error });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    const { user } = await requireAuth(request);
    const { data, error } = await generateDigestService(user.id);
    return Response.json({ data, error });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}
