import { supabaseAdmin } from "../../shared/clients/supabase.js";
import { ok, fail } from "../../shared/db/errors.js";

export async function getOrganizerDashboardService(userId) {
  try {
    const profileRes = await supabaseAdmin
      .from("profiles")
      .select("display_name, name, is_organizer")
      .eq("id", userId)
      .maybeSingle();

    const displayName =
      profileRes.data?.display_name || profileRes.data?.name || "";

    const { data: submissions } = await supabaseAdmin
      .from("event_submissions")
      .select("id, status, event_url, title, submitted_at, event_id")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(50);

    const organizerName = displayName.trim();
    let events = [];
    if (organizerName) {
      const { data } = await supabaseAdmin
        .from("events")
        .select("id, title, city, start_date, platform, event_url")
        .ilike("organizer", `%${organizerName}%`)
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(20);
      events = data || [];
    }

    const eventIds = (submissions || [])
      .map((s) => s.event_id)
      .filter(Boolean);
    let linkedEvents = [];
    if (eventIds.length) {
      const { data } = await supabaseAdmin
        .from("events")
        .select("id, title, city, start_date, platform")
        .in("id", eventIds);
      linkedEvents = data || [];
    }

    const statusCounts = { added: 0, received: 0, queued: 0, rejected: 0 };
    for (const row of submissions || []) {
      if (statusCounts[row.status] !== undefined) statusCounts[row.status]++;
    }

    return ok({
      organizer_name: organizerName,
      is_organizer: Boolean(profileRes.data?.is_organizer),
      submissions: submissions || [],
      status_counts: statusCounts,
      matched_events: events,
      linked_events: linkedEvents,
    });
  } catch {
    return fail("Failed to load organizer dashboard");
  }
}
