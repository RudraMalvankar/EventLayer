import { supabaseAdmin } from "../../shared/clients/supabase.js";
import { detectPlatform } from "../scrapers/normalizer.js";

const ALLOWED_PLATFORMS = new Set([
  "luma",
  "meetup",
  "devfolio",
  "unstop",
  "devpost",
  "eventbrite",
  "eventtier",
  "scraper",
]);

const ALLOWED_MODES = new Set(["online", "offline", "hybrid"]);
const ALLOWED_CATEGORIES = new Set([
  "hackathon",
  "meetup",
  "workshop",
  "conference",
  "webinar",
  "competition",
]);

function normalizePlatform(value) {
  const platform = String(value || "luma")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
  if (platform === "scraper" || !platform) return "luma";
  if (ALLOWED_PLATFORMS.has(platform)) return platform;
  return "luma";
}

function sanitizeMode(value) {
  const mode = String(value || "")
    .toLowerCase()
    .trim();
  return ALLOWED_MODES.has(mode) ? mode : null;
}

function sanitizeCategory(value) {
  const category = String(value || "")
    .toLowerCase()
    .trim();
  return ALLOWED_CATEGORIES.has(category) ? category : null;
}

function resolveEventPlatform(row = {}) {
  const fromRaw =
    row.raw_data?.sourcePlatform || row.raw_data?.originalPlatform;
  const fromUrl = detectPlatform(row.event_url || row.url);
  return normalizePlatform(
    fromRaw || row.platform || row.sourcePlatform || fromUrl,
  );
}

function sanitizeEventRow(event = {}) {
  function canonicalUrl(raw) {
    try {
      const u = new URL(String(raw));
      let host = u.hostname.replace(/^www\./, "");
      // normalize luma hosts to lu.ma
      if (host.endsWith("luma.com")) host = "lu.ma";
      u.hostname = host;
      u.search = ""; // drop query params
      // remove trailing slashes
      u.pathname = u.pathname.replace(/\/+$|^\/$/, (m) =>
        m === "/" ? "" : "",
      );
      const out = u.toString().replace(/\/$/, "");
      return out;
    } catch {
      return raw;
    }
  }

  const row = { ...event };
  if (row.event_url || row.url) {
    const raw = row.event_url || row.url;
    row.event_url = canonicalUrl(raw);
  }

  const aiSummary = row.ai_summary || row.raw_data?.ai_summary || null;
  const raw_data = {
    ...(typeof row.raw_data === "object" && row.raw_data ? row.raw_data : {}),
  };
  if (aiSummary) {
    raw_data.ai_summary = String(aiSummary).slice(0, 500);
  }

  return {
    title: row.title || "",
    description: row.description ?? null,
    platform: resolveEventPlatform(row),
    city: row.city ?? null,
    country: row.country ?? null,
    mode: sanitizeMode(row.mode),
    category: sanitizeCategory(row.category),
    tags: Array.isArray(row.tags) ? row.tags : [],
    banner_url: row.banner_url ?? null,
    event_url: row.event_url,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    organizer: row.organizer ?? null,
    is_free: typeof row.is_free === "boolean" ? row.is_free : true,
    raw_data,
    ...(row.created_at ? { created_at: row.created_at } : {}),
  };
}

function projectEventRow(row = {}) {
  return {
    ...row,
    platform: resolveEventPlatform(row),
    ai_summary: row.ai_summary || row.raw_data?.ai_summary || null,
  };
}

function getEventId(row = {}) {
  return row?.id || row?.event_id || row?.events?.id || null;
}

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
  upcomingOnly = true,
} = {}) {
  try {
    let query = supabaseAdmin
      .from("events")
      .select("*", { count: "exact" })
      .order("start_date", { ascending: true });
    if (city) query = query.ilike("city", `%${city}%`);
    if (category) query = query.eq("category", category);
    if (mode) query = query.eq("mode", mode);
    if (platform) {
      const p = normalizePlatform(platform);
      query = query.or(`platform.eq.${p},raw_data->>sourcePlatform.eq.${p}`);
    }
    if (typeof is_free === "boolean") query = query.eq("is_free", is_free);
    if (upcomingOnly) {
      const now = new Date().toISOString();
      query = query.or(`start_date.gte.${now},start_date.is.null`);
    }
    if (keyword)
      query = query.or(
        `title.ilike.%${keyword}%,description.ilike.%${keyword}%`,
      );
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    const { data, error, count } = await query.range(from, to);
    if (error) return fail(error.message);
    return ok({ events: (data || []).map(projectEventRow), total: count || 0 });
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
    return ok(projectEventRow(data || {}));
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
    const sanitizedEvents = eventsArray.map(sanitizeEventRow);
    const { data, error } = await supabaseAdmin
      .from("events")
      .upsert(sanitizedEvents, { onConflict: "event_url" })
      .select("id");
    if (error) {
      console.error("Upsert error from Supabase:", error);
      return fail(error.message);
    }
    return ok({
      inserted: data?.length || 0,
      skipped: Math.max(sanitizedEvents.length - (data?.length || 0), 0),
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

export async function findTrendingEvents(limit = 6) {
  try {
    const { data, error } = await supabaseAdmin
      .from("saved_events")
      .select("event_id, events(*)");
    if (error) return fail(error.message);

    const grouped = new Map();
    for (const row of data || []) {
      const event = row?.events;
      const id = getEventId(row);
      if (!event || !id) continue;

      const current = grouped.get(String(id)) || {
        event: projectEventRow(event),
        saves: 0,
      };
      current.saves += 1;
      grouped.set(String(id), current);
    }

    const events = Array.from(grouped.values())
      .sort((a, b) => {
        if (b.saves !== a.saves) return b.saves - a.saves;
        const aTime = a.event?.start_date
          ? new Date(a.event.start_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        const bTime = b.event?.start_date
          ? new Date(b.event.start_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, limit)
      .map(({ event, saves }) => ({ ...event, trending_saves: saves }));

    return ok({ events, total: events.length });
  } catch {
    return fail("Failed to fetch trending events");
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
