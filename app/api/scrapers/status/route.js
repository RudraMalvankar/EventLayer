import { scrapeByPlatform } from "../../../../src/features/scrapers/service.js";

const PLATFORMS = ["unstop", "devpost", "eventbrite"];

export async function GET() {
  const results = [];

  for (const platform of PLATFORMS) {
    try {
      const res = await scrapeByPlatform(platform);
      const events = res?.events || [];
      results.push({
        platform,
        count: events.length,
        error: res?.error || null,
        sample: events.slice(0, 3).map((event) => ({
          title: event.title,
          url: event.event_url || event.url || event.redirectURL || null,
          start_date:
            event.start_date || event.startDate || event.starts_at || null,
        })),
      });
    } catch (error) {
      results.push({
        platform,
        count: 0,
        error: error?.message || String(error),
        sample: [],
      });
    }
  }

  return Response.json({ data: { platforms: results }, error: null });
}
