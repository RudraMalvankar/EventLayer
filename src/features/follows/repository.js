import { supabaseAdmin } from "../../shared/clients/supabase.js";
import { ok, fail, isMissingTableError } from "../../shared/db/errors.js";

function slugifyOrganizer(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function followUserRepo(followerId, followingId) {
  if (followerId === followingId) return fail("Cannot follow yourself");
  try {
    const { error } = await supabaseAdmin
      .from("user_follows")
      .upsert(
        { follower_id: followerId, following_id: followingId },
        { onConflict: "follower_id,following_id" },
      );
    if (error) {
      if (isMissingTableError(error)) return ok({ following: true, offline: true });
      return fail(error.message);
    }
    return ok({ following: true });
  } catch {
    return fail("Failed to follow user");
  }
}

export async function unfollowUserRepo(followerId, followingId) {
  try {
    const { error } = await supabaseAdmin
      .from("user_follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) {
      if (isMissingTableError(error)) return ok({ following: false, offline: true });
      return fail(error.message);
    }
    return ok({ following: false });
  } catch {
    return fail("Failed to unfollow user");
  }
}

export async function followOrganizerRepo(userId, organizerName) {
  const organizer_slug = slugifyOrganizer(organizerName);
  if (!organizer_slug) return fail("Invalid organizer");
  try {
    const { error } = await supabaseAdmin.from("organizer_follows").upsert(
      { user_id: userId, organizer_slug },
      { onConflict: "user_id,organizer_slug" },
    );
    if (error) {
      if (isMissingTableError(error)) return ok({ following: true, offline: true });
      return fail(error.message);
    }
    return ok({ following: true, organizer_slug });
  } catch {
    return fail("Failed to follow organizer");
  }
}

export async function unfollowOrganizerRepo(userId, organizerSlug) {
  try {
    const { error } = await supabaseAdmin
      .from("organizer_follows")
      .delete()
      .eq("user_id", userId)
      .eq("organizer_slug", organizerSlug);
    if (error) {
      if (isMissingTableError(error)) return ok({ following: false, offline: true });
      return fail(error.message);
    }
    return ok({ following: false });
  } catch {
    return fail("Failed to unfollow organizer");
  }
}

export async function getFollowingRepo(userId) {
  try {
    const [usersRes, orgsRes] = await Promise.all([
      supabaseAdmin
        .from("user_follows")
        .select("following_id, profiles:following_id(id, display_name, name, city, profile_picture_url)")
        .eq("follower_id", userId),
      supabaseAdmin
        .from("organizer_follows")
        .select("organizer_slug, created_at")
        .eq("user_id", userId),
    ]);

    if (usersRes.error && !isMissingTableError(usersRes.error)) {
      return fail(usersRes.error.message);
    }
    if (orgsRes.error && !isMissingTableError(orgsRes.error)) {
      return fail(orgsRes.error.message);
    }

    const users = (usersRes.data || [])
      .map((row) => row.profiles)
      .filter(Boolean);
    const organizers = (orgsRes.data || []).map((row) => ({
      slug: row.organizer_slug,
      name: row.organizer_slug.replace(/-/g, " "),
    }));

    return ok({ users, organizers });
  } catch {
    return fail("Failed to load following");
  }
}

export async function isFollowingUserRepo(followerId, followingId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error)) return ok({ following: false });
      return fail(error.message);
    }
    return ok({ following: Boolean(data?.id) });
  } catch {
    return ok({ following: false });
  }
}

export { slugifyOrganizer };
