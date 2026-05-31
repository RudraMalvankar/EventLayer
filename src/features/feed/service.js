import { supabaseAdmin } from "../../shared/clients/supabase.js";
import { findEvents } from "../events/repository.js";
import { getFollowingRepo } from "../follows/repository.js";
import { getFollowedCommunitiesRepo } from "../communities/service.js";
import { eventMatchesCommunity } from "../communities/mumbai.js";
import { ok, fail, isMissingTableError } from "../../shared/db/errors.js";

function scoreEvent(event, profile, followedOrganizers = new Set(), followedCommunities = []) {
  let score = 0;
  const interests = (profile?.interests || []).map((i) => i.toLowerCase());
  const types = (profile?.event_types || []).map((t) => t.toLowerCase());
  const city = String(profile?.city || "").toLowerCase();
  const tags = (event.tags || []).map((t) => String(t).toLowerCase());
  const title = String(event.title || "").toLowerCase();
  const desc = String(event.description || "").toLowerCase();

  if (city && String(event.city || "").toLowerCase().includes(city)) score += 3;
  if (event.category && types.includes(String(event.category).toLowerCase())) {
    score += 4;
  }
  for (const interest of interests) {
    if (
      tags.some((t) => t.includes(interest)) ||
      title.includes(interest) ||
      desc.includes(interest)
    ) {
      score += 2;
    }
  }
  const orgSlug = String(event.organizer || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  if (orgSlug && followedOrganizers.has(orgSlug)) score += 5;
  for (const community of followedCommunities) {
    if (eventMatchesCommunity(event, community)) {
      score += 6;
      break;
    }
  }
  if (event.trending_saves) score += Math.min(event.trending_saves, 10);
  return score;
}

export async function getPersonalizedFeedService(userId, { limit = 12, page = 1 } = {}) {
  try {
    const profileRes = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const profile = profileRes.data || {};
    const following = await getFollowingRepo(userId);
    const communitiesRes = await getFollowedCommunitiesRepo(userId);
    const followedOrganizers = new Set(
      (following.data?.organizers || []).map((o) => o.slug),
    );
    const followedCommunities = communitiesRes.data?.communities || [];

    const eventsResult = await findEvents({
      city: profile.city || undefined,
      limit: 60,
      page: 1,
      upcomingOnly: true,
    });

    if (eventsResult.error) return eventsResult;

    const ranked = (eventsResult.data?.events || [])
      .map((event) => ({
        ...event,
        feed_score: scoreEvent(event, profile, followedOrganizers, followedCommunities),
        feed_reason: buildReason(event, profile, followedOrganizers, followedCommunities),
      }))
      .sort((a, b) => b.feed_score - a.feed_score);

    const from = (Number(page) - 1) * Number(limit);
    const slice = ranked.slice(from, from + Number(limit));

    return ok({
      events: slice,
      total: ranked.length,
      profile: {
        city: profile.city,
        interests: profile.interests || [],
      },
    });
  } catch {
    return fail("Failed to build personalized feed");
  }
}

function buildReason(event, profile, followedOrganizers, followedCommunities = []) {
  for (const community of followedCommunities) {
    if (eventMatchesCommunity(event, community)) {
      return `From ${community.name}`;
    }
  }
  const orgSlug = String(event.organizer || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  if (orgSlug && followedOrganizers.has(orgSlug)) {
    return `From organizer you follow`;
  }
  if (profile.city && String(event.city || "").toLowerCase().includes(profile.city.toLowerCase())) {
    return `Near ${profile.city}`;
  }
  if (profile.interests?.length) return `Matches your interests`;
  return "Recommended for you";
}

export async function getCommunityActivityService(userId, limit = 20) {
  try {
    const following = await getFollowingRepo(userId);
    const userIds = (following.data?.users || []).map((u) => u.id);
    if (!userIds.length) return ok({ activity: [] });

    const { data, error } = await supabaseAdmin
      .from("saved_events")
      .select("saved_at, user_id, events(*), profiles:user_id(display_name, name)")
      .in("user_id", userIds)
      .order("saved_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTableError(error)) return ok({ activity: [] });
      return fail(error.message);
    }

    const activity = (data || []).map((row) => ({
      user: row.profiles,
      event: row.events,
      saved_at: row.saved_at,
    }));

    return ok({ activity });
  } catch {
    return ok({ activity: [] });
  }
}
