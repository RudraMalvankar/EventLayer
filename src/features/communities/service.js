import { supabaseAdmin } from "../../shared/clients/supabase.js";
import { findEvents } from "../events/repository.js";
import {
  listCommunities,
  getCommunityBySlug,
  eventMatchesCommunity,
  countEventsForCommunity,
  withCommunityLogo,
} from "./mumbai.js";
import { ok, fail, isMissingTableError } from "../../shared/db/errors.js";

export async function getCommunitiesService({ city = "Mumbai", limit = 50 } = {}) {
  const communities = listCommunities({ city }).slice(0, limit);

  const eventsResult = await findEvents({
    city: "Mumbai",
    limit: 200,
    page: 1,
    upcomingOnly: true,
  });

  const allEvents = eventsResult.data?.events || [];

  const enriched = communities.map((community) =>
    withCommunityLogo({
      ...community,
      upcoming_count: countEventsForCommunity(allEvents, community),
    }),
  );

  return ok({ communities: enriched, city });
}

export async function getCommunityEventsService(slug) {
  const community = getCommunityBySlug(slug);
  if (!community) return fail("Community not found");

  const eventsResult = await findEvents({
    limit: 100,
    page: 1,
    upcomingOnly: true,
  });

  const events = (eventsResult.data?.events || []).filter((event) =>
    eventMatchesCommunity(event, community),
  );

  return ok({
    community: withCommunityLogo(community),
    events,
    total: events.length,
  });
}

export async function followCommunityRepo(userId, communitySlug) {
  const community = getCommunityBySlug(communitySlug);
  if (!community) return fail("Community not found");

  try {
    const { error } = await supabaseAdmin.from("community_follows").upsert(
      { user_id: userId, community_slug: communitySlug },
      { onConflict: "user_id,community_slug" },
    );
    if (error) {
      if (isMissingTableError(error)) {
        return ok({ following: true, community: community.slug, offline: true });
      }
      return fail(error.message);
    }
    return ok({ following: true, community: community.slug });
  } catch {
    return fail("Failed to follow community");
  }
}

export async function unfollowCommunityRepo(userId, communitySlug) {
  try {
    const { error } = await supabaseAdmin
      .from("community_follows")
      .delete()
      .eq("user_id", userId)
      .eq("community_slug", communitySlug);
    if (error) {
      if (isMissingTableError(error)) return ok({ following: false, offline: true });
      return fail(error.message);
    }
    return ok({ following: false });
  } catch {
    return fail("Failed to unfollow community");
  }
}

export async function getFollowedCommunitiesRepo(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("community_follows")
      .select("community_slug, created_at")
      .eq("user_id", userId);
    if (error) {
      if (isMissingTableError(error)) return ok({ communities: [] });
      return fail(error.message);
    }

    const slugs = (data || []).map((r) => r.community_slug);
    const communities = slugs
      .map((slug) => getCommunityBySlug(slug))
      .filter(Boolean);

    return ok({ communities, slugs });
  } catch {
    return ok({ communities: [], slugs: [] });
  }
}

export async function getFollowedCommunitiesEventsService(userId, limit = 24) {
  const followed = await getFollowedCommunitiesRepo(userId);
  const communities = followed.data?.communities || [];
  if (!communities.length) return ok({ events: [], communities: [] });

  const eventsResult = await findEvents({ limit: 150, upcomingOnly: true });
  const allEvents = eventsResult.data?.events || [];

  const matched = [];
  for (const event of allEvents) {
    for (const community of communities) {
      if (eventMatchesCommunity(event, community)) {
        matched.push({ ...event, community_slug: community.slug, community_name: community.name });
        break;
      }
    }
    if (matched.length >= limit) break;
  }

  return ok({ events: matched.slice(0, limit), communities });
}
