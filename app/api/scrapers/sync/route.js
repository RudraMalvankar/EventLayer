import { upsertEventsService } from "../../../../src/features/events/service.js";
import { fetchDevfolioEventDetails } from "../../../../src/features/scrapers/devfolio/details.js";
import { fetchEventDetails } from "../../../../src/features/scrapers/luma/details.js";
import { scrapeByPlatform } from "../../../../src/features/scrapers/service.js";
import { detectPlatform } from "../../../../src/features/scrapers/normalizer.js";

const PLATFORMS = ["luma", "devfolio", "unstop", "devpost", "eventbrite", "eventtier"];

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
    platform: platform !== 'scraper' ? platform : (event.platform || 'scraper'),
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

function normalizeForDb(event) {
  const platform = String(
    event.platform || event.sourcePlatform || "scraper",
  ).toLowerCase();
  return {
    title: event.title || "",
    description: event.description || null,
    event_url: event.url || event.redirectURL || event.event_url || null,
    banner_url: event.banner_url || event.image || null,
    start_date: event.startDate || event.starts_at || event.start_date || null,
    end_date: event.endDate || event.ends_at || event.end_date || null,
    organizer: event.organizer || event.hostedBy || null,
    city: event.city || (platform === "eventbrite" ? "Online" : null),
    country: event.country || (platform === "eventbrite" ? "Online" : null),
    platform,
    category: event.category || event.type || null,
    tags: event.tags || [],
    mode: event.mode || (platform === "eventbrite" ? "online" : null),
    is_free:
      Array.isArray(event.tags) && event.tags.includes("free") ? true : null,
    created_at: new Date().toISOString(),
  };
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

export async function POST() {
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
  const enriched = [];
  for (const event of uniqueEvents) {
    enriched.push(await enrichEvent(event));
  }

  const dbItems = enriched.map(normalizeForDb);
  const upsert = await upsertEventsService(dbItems);

  return Response.json({
    data: {
      platforms: platformResults,
      scraped: scraped.length,
      unique: uniqueEvents.length,
      enriched: enriched.length,
      upserted: dbItems.length,
      error: upsert.error || null,
    },
    error: upsert.error || null,
  });
}
