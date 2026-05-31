import { supabaseAdmin } from "../../shared/clients/supabase.js";
import { ok, fail } from "../../shared/db/errors.js";

export async function syncSavedEventsRepo(userId, since = null) {
  try {
    let query = supabaseAdmin
      .from("saved_events")
      .select("event_id, saved_at, events(*)")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    if (since) {
      query = query.gte("saved_at", since);
    }

    const { data, error } = await query;
    if (error) return fail(error.message);

    const events = (data || []).map((row) => ({
      ...row.events,
      saved_at: row.saved_at,
    })).filter((e) => e?.id);

    const latest =
      data?.[0]?.saved_at || new Date().toISOString();

    return ok({
      events,
      sync_token: latest,
      count: events.length,
    });
  } catch {
    return fail("Failed to sync saved events");
  }
}
