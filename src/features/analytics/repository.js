import { supabaseAdmin } from "../../shared/clients/supabase.js";
import { ok, fail, isMissingTableError } from "../../shared/db/errors.js";

export async function trackEventRepo({
  event_type,
  user_id = null,
  event_id = null,
  metadata = {},
}) {
  if (!event_type) return fail("event_type is required");
  try {
    const { error } = await supabaseAdmin.from("analytics_events").insert({
      event_type,
      user_id,
      event_id,
      metadata,
    });
    if (error) {
      if (isMissingTableError(error)) return ok({ tracked: false, offline: true });
      return fail(error.message);
    }
    return ok({ tracked: true });
  } catch {
    return ok({ tracked: false });
  }
}

export async function getAnalyticsDashboardRepo() {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [views, saves, searches, signups] = await Promise.all([
      supabaseAdmin
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "page_view")
        .gte("created_at", since.toISOString()),
      supabaseAdmin
        .from("saved_events")
        .select("id", { count: "exact", head: true })
        .gte("saved_at", since.toISOString()),
      supabaseAdmin
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "search")
        .gte("created_at", since.toISOString()),
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since.toISOString()),
    ]);

    const { data: topEvents } = await supabaseAdmin
      .from("saved_events")
      .select("event_id, events(title, platform, city)");

    const saveCounts = new Map();
    for (const row of topEvents || []) {
      const id = row.event_id;
      if (!id) continue;
      const current = saveCounts.get(id) || { event: row.events, saves: 0 };
      current.saves += 1;
      saveCounts.set(id, current);
    }

    const trending = Array.from(saveCounts.values())
      .sort((a, b) => b.saves - a.saves)
      .slice(0, 5)
      .map(({ event, saves }) => ({ ...event, saves }));

    return ok({
      period_days: 30,
      metrics: {
        page_views: views.error ? 0 : (views.count ?? 0),
        saves: saves.error ? 0 : (saves.count ?? 0),
        searches: searches.error ? 0 : (searches.count ?? 0),
        new_profiles: signups.error ? 0 : (signups.count ?? 0),
      },
      trending,
    });
  } catch {
    return ok({
      period_days: 30,
      metrics: { page_views: 0, saves: 0, searches: 0, new_profiles: 0 },
      trending: [],
    });
  }
}
