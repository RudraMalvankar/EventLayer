import { supabaseAdmin } from "../../shared/clients/supabase.js";

function ok(data) {
  return { data, error: null };
}

function fail(message) {
  return { data: null, error: message };
}

export async function findEvents({
  city,
  category,
  mode,
  is_free,
  platform,
  keyword,
  page = 1,
  limit = 12,
} = {}) {
  try {
    let query = supabaseAdmin
      .from("events")
      .select("*", { count: "exact" })
      .order("start_date", { ascending: true });
    if (city) query = query.ilike("city", `%${city}%`);
    if (category) query = query.eq("category", category);
    if (mode) query = query.eq("mode", mode);
    if (platform) query = query.eq("platform", platform);
    if (typeof is_free === "boolean") query = query.eq("is_free", is_free);
    if (keyword)
      query = query.or(
        `title.ilike.%${keyword}%,description.ilike.%${keyword}%`,
      );
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    const { data, error, count } = await query.range(from, to);
    if (error) return fail(error.message);
    return ok({ events: data || [], total: count || 0 });
  } catch {
    return fail("Failed to fetch events");
  }
}

export async function findEventById(id) {
  try {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return fail(error.message);
    return ok(data);
  } catch {
    return fail("Failed to fetch event");
  }
}

export async function updateEventById(id, payload = {}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("events")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return fail(error.message);
    return ok(data);
  } catch {
    return fail("Failed to update event");
  }
}

export async function upsertEventsRepo(eventsArray = []) {
  try {
    if (!eventsArray.length) return ok({ inserted: 0, skipped: 0 });
    const { data, error } = await supabaseAdmin
      .from("events")
      .upsert(eventsArray, { onConflict: "event_url" })
      .select("id");
    if (error) return fail(error.message);
    return ok({
      inserted: data?.length || 0,
      skipped: Math.max(eventsArray.length - (data?.length || 0), 0),
    });
  } catch {
    return fail("Failed to upsert events");
  }
}

export async function findSavedEvents(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("saved_events")
      .select("event_id, events(*)")
      .eq("user_id", userId);
    if (error) return fail(error.message);
    return ok((data || []).map((row) => row.events).filter(Boolean));
  } catch {
    return fail("Failed to fetch saved events");
  }
}

export async function toggleSavedEventRepo(userId, eventId) {
  try {
    const existing = await supabaseAdmin
      .from("saved_events")
      .select("id")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .maybeSingle();
    if (existing.data?.id) {
      const { error } = await supabaseAdmin
        .from("saved_events")
        .delete()
        .eq("id", existing.data.id);
      if (error) return fail(error.message);
      return ok({ saved: false });
    }
    const { error } = await supabaseAdmin
      .from("saved_events")
      .insert({ user_id: userId, event_id: eventId });
    if (error) return fail(error.message);
    return ok({ saved: true });
  } catch {
    return fail("Failed to toggle saved event");
  }
}
