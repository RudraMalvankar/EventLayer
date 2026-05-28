import { normalizeEvent } from "../../../../src/features/scrapers/normalizer.js";
import { scrapeByPlatform } from "../../../../src/features/scrapers/service.js";
import { upsertEventsService } from "../../../../src/features/events/service.js";

const PLATFORMS = ["luma", "devfolio", "unstop", "devpost", "eventbrite"];

function normalizeLiveEvent(event, platform) {
  const eventUrl =
    event?.event_url || event?.url || event?.redirectURL || event?.href || null;
  if (!eventUrl) return null;

  return normalizeEvent(
    {
      ...event,
      title: event?.title || "",
      description: event?.description || event?.title || "",
      url: eventUrl,
      image: event?.banner_url || event?.image || event?.cover_url || null,
      city: event?.city || null,
      country: event?.country || null,
      organizer: event?.organizer || event?.hostedBy || event?.host || platform,
      category: event?.category || event?.type || "hackathon",
      tags: Array.isArray(event?.tags) ? event.tags : [platform],
      start_date:
        event?.start_date || event?.startDate || event?.starts_at || null,
      end_date: event?.end_date || event?.endDate || event?.ends_at || null,
      is_free: event?.is_free ?? null,
    },
    platform,
  );
}

function dedupeEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    const key = `${event.platform || ""}::${event.event_url || ""}::${event.title || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET() {
  const events = [];

  for (const platform of PLATFORMS) {
    try {
      const res = await scrapeByPlatform(platform);
      const items = res?.events || [];
      items.forEach((item) => {
        const normalized = normalizeLiveEvent(item, platform);
        if (normalized) events.push(normalized);
      });
    } catch {
      // skip failed scraper in live feed
    }
  }

  const deduped = dedupeEvents(events);

  // Background upsert to DB
  if (deduped.length > 0) {
    upsertEventsService(deduped).catch((err) => {
      console.error("Failed to upsert live events:", err);
    });
  }

  return Response.json({ data: { events: deduped }, error: null });
}
