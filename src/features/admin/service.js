import { supabaseAdmin } from "../../shared/clients/supabase.js";
import { ok } from "../../shared/db/errors.js";

export async function getPlatformAdminDashboard() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    eventsTotal,
    eventsUpcoming,
    profilesTotal,
    profilesNew,
    savesTotal,
    savesRecent,
    submissions,
    pageViews,
    searches,
  ] = await Promise.all([
    supabaseAdmin.from("events").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("events")
      .select("id", { count: "exact", head: true })
      .gte("start_date", new Date().toISOString()),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since.toISOString()),
    supabaseAdmin.from("saved_events").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("saved_events")
      .select("id", { count: "exact", head: true })
      .gte("saved_at", since.toISOString()),
    supabaseAdmin
      .from("event_submissions")
      .select("id, status, title, event_url, submitted_at, user_email")
      .order("submitted_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("created_at", since.toISOString()),
    supabaseAdmin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "search")
      .gte("created_at", since.toISOString()),
  ]);

  const { data: platformRows } = await supabaseAdmin
    .from("events")
    .select("platform");

  const platformCounts = {};
  for (const row of platformRows || []) {
    const p = row.platform || "unknown";
    platformCounts[p] = (platformCounts[p] || 0) + 1;
  }

  const { data: savedRows } = await supabaseAdmin
    .from("saved_events")
    .select("event_id, events(id, title, platform, city)");

  const saveMap = new Map();
  for (const row of savedRows || []) {
    const id = row.event_id;
    if (!id) continue;
    const cur = saveMap.get(id) || { event: row.events, saves: 0 };
    cur.saves += 1;
    saveMap.set(id, cur);
  }

  const trending = Array.from(saveMap.values())
    .sort((a, b) => b.saves - a.saves)
    .slice(0, 8)
    .map(({ event, saves }) => ({ ...event, saves }));

  const { data: recentProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id, display_name, name, city, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const submissionList = submissions.data || [];
  const statusCounts = { added: 0, received: 0, queued: 0, rejected: 0 };
  for (const s of submissionList) {
    if (statusCounts[s.status] !== undefined) statusCounts[s.status]++;
  }

  return ok({
    period_days: 30,
    metrics: {
      events_total: eventsTotal.count ?? 0,
      events_upcoming: eventsUpcoming.count ?? 0,
      users_total: profilesTotal.count ?? 0,
      users_new: profilesNew.count ?? 0,
      saves_total: savesTotal.count ?? 0,
      saves_recent: savesRecent.count ?? 0,
      page_views: pageViews.count ?? 0,
      searches: searches.count ?? 0,
      submissions_total: submissionList.length,
    },
    platform_counts: platformCounts,
    submission_status: statusCounts,
    recent_submissions: submissionList,
    recent_users: recentProfiles || [],
    trending,
  });
}
