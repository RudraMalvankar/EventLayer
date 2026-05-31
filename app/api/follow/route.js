import { requireAuth } from "../../../src/features/auth/service.js";
import {
  followUserRepo,
  unfollowUserRepo,
  followOrganizerRepo,
  unfollowOrganizerRepo,
  getFollowingRepo,
} from "../../../src/features/follows/repository.js";
import {
  followCommunityRepo,
  unfollowCommunityRepo,
} from "../../../src/features/communities/service.js";

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
    let result;
    if (body?.community_slug) {
      result = await followCommunityRepo(user.id, body.community_slug);
    } else if (body?.organizer) {
      result = await followOrganizerRepo(user.id, body.organizer);
    } else {
      result = await followUserRepo(user.id, body.following_id);
    }
    const { data, error } = result;
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
    let result;
    if (body?.community_slug) {
      result = await unfollowCommunityRepo(user.id, body.community_slug);
    } else if (body?.organizer_slug) {
      result = await unfollowOrganizerRepo(user.id, body.organizer_slug);
    } else {
      result = await unfollowUserRepo(user.id, body.following_id);
    }
    const { data, error } = result;
    if (error) return Response.json({ data: null, error }, { status: 400 });
    return Response.json({ data, error: null });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }
}
