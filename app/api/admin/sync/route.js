import { isAdminAuthorized } from "../../../../src/features/auth/adminSession.js";
import { scrapeByPlatform } from "../../../../src/features/scrapers/service.js";
import { upsertEventsService } from "../../../../src/features/events/service.js";
import { sanitizeEventRow } from "../../../../src/features/events/repository.js";
import { fetchDevfolioEventDetails } from "../../../../src/features/scrapers/devfolio/details.js";
import { fetchEventDetails } from "../../../../src/features/scrapers/luma/details.js";
import { detectPlatform } from "../../../../src/features/scrapers/normalizer.js";
import { withRateLimit } from "../../../../src/shared/security/rateLimiter.js";

const PLATFORMS = [
  "luma",
  "meetup",
  "devfolio",
  "unstop",
  "devpost",
  "eventbrite",
];

async function enrichEvent(event) {
  if (!event) return event;
  const url =
    event.url ||
    event.event_url ||
    event.redirectURL ||
    event.link ||
    event.href ||
    null;
  if (!url) return event;
  const platform = detectPlatform(url);
  const meta =
    platform === "devfolio"
      ? await fetchDevfolioEventDetails(url)
      : await fetchEventDetails(url);
  return {
    ...event,
    platform: platform !== "scraper" ? platform : event.platform || "scraper",
    description: event.description || meta.description || null,
    banner_url: event.banner_url || meta.banner_url || null,
    startDate:
      event.startDate ||
      event.starts_at ||
      event.start_date ||
      meta.start_date ||
      null,
    endDate:
      event.endDate || event.ends_at || event.end_date || meta.end_date || null,
    organizer: event.organizer || meta.organizer || null,
    city: event.city || meta.city || null,
    country: event.country || meta.country || null,
  };
}

/**
 * Maps scraper-specific field names to standard event fields,
 * then delegates to sanitizeEventRow for final validation/sanitization.
 */
function normalizeForDb(event) {
  const standardized = {
    title: event.title || "",
    description: event.description || null,
    event_url: event.url || event.redirectURL || event.event_url || null,
    banner_url: event.banner_url || event.image || null,
    start_date: event.startDate || event.starts_at || event.start_date || null,
    end_date: event.endDate || event.ends_at || event.end_date || null,
    organizer: event.organizer || event.hostedBy || null,
    city: event.city || null,
    country: event.country || null,
    platform: event.platform || null,
    category: event.category || event.type || null,
    tags: event.tags || [],
    mode: event.mode || null,
    is_free: Array.isArray(event.tags) && event.tags.includes("free") ? true : false,
    raw_data: {
      sourcePlatform: event.sourcePlatform || event.platform || "scraper",
      originalPlatform: event.platform || event.sourcePlatform || null,
      sourceUrl: event.url || event.redirectURL || event.event_url || null,
      ai_summary: event.ai_summary || null,
    },
    created_at: new Date().toISOString(),
  };
  // sanitizeEventRow handles URL normalization, platform resolution,
  // mode/category validation, and raw_data.ai_summary packing.
  return sanitizeEventRow(standardized);
}

function dedupeEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    const key = `${String(event.platform || event.sourcePlatform || "").toLowerCase()}::${event.event_url || event.url || event.redirectURL || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function postHandler(request) {
  try {
    const allowed = await isAdminAuthorized(request);
    if (!allowed) {
      return Response.json({ data: null, error: "Forbidden" }, { status: 403 });
    }

    const scraped = [];
    const platformResults = [];

    for (const platform of PLATFORMS) {
      try {
        const res = await scrapeByPlatform(platform);
        const events = res?.events || [];
        const tagged = events.map((event) => ({
          ...event,
          platform: event.platform || platform,
          sourcePlatform: event.sourcePlatform || platform,
        }));
        scraped.push(...tagged);
        platformResults.push({
          platform,
          count: tagged.length,
          error: res?.error || null,
        });
      } catch (error) {
        platformResults.push({
          platform,
          count: 0,
          error: error?.message || String(error),
        });
      }
    }

    const uniqueEvents = dedupeEvents(scraped);

    const enrichmentPromises = uniqueEvents.map(async (event) => {
      try {
        const enriched = await enrichEvent(event);
        return enriched; // skipping AI summary for admin-triggered sync to speed up
      } catch (err) {
        console.error(
          `Enrichment failed for ${event.event_url}:`,
          err?.message || err,
        );
        return event;
      }
    });

    const enrichedResults = await Promise.all(enrichmentPromises);
    const dbItems = enrichedResults.map(normalizeForDb);
    const upsert = await upsertEventsService(dbItems);

    return Response.json({
      data: {
        platforms: platformResults,
        scraped: scraped.length,
        unique: uniqueEvents.length,
        upserted: dbItems.length,
      },
      error: upsert.error || null,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("Admin sync failed", e);
    return Response.json(
      { data: null, error: "Admin sync failed" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(postHandler, {
  routeName: "admin-sync",
  limit: 30,       // 30 sync requests
  windowMs: 60_000, // per minute
});
