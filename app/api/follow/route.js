import { requireAuth } from "../../../src/features/auth/service.js";
import {
  followUserRepo,
  unfollowUserRepo,
  followOrganizerRepo,
  unfollowOrganizerRepo,
  getFollowingRepo,
} from "../../../src/features/follows/repository.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);
    const { data, error } = await getFollowingRepo(user.id);
    return Response.json({ data, error });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    const { user } = await requireAuth(request);
    const body = await request.json();
    const { data, error } = body?.organizer
      ? await followOrganizerRepo(user.id, body.organizer)
      : await followUserRepo(user.id, body.following_id);
    if (error) return Response.json({ data: null, error }, { status: 400 });
    return Response.json({ data, error: null });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request) {
  try {
    const { user } = await requireAuth(request);
    const body = await request.json();
    const { data, error } = body?.organizer_slug
      ? await unfollowOrganizerRepo(user.id, body.organizer_slug)
      : await unfollowUserRepo(user.id, body.following_id);
    if (error) return Response.json({ data: null, error }, { status: 400 });
    return Response.json({ data, error: null });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}
