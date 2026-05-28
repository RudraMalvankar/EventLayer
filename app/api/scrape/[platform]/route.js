import { env } from "../../../../src/shared/config/env";
import { scrapeByPlatform } from "../../../../src/features/scrapers/service";
import { upsertEventsService } from "../../../../src/features/events/service";

export async function POST(request, { params }) {
  const key = request.headers.get("x-scrape-key");
  // In development allow the request without a secret for convenience.
  const requireSecret = process.env.NODE_ENV !== "development";
  if (requireSecret && (!env.scrapeSecret || key !== env.scrapeSecret)) {
    return Response.json(
      { data: null, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const {
    platform,
    events,
    error: scrapeError,
  } = await scrapeByPlatform(params.platform);
  if (scrapeError) {
    const status = scrapeError.includes("Unsupported") ? 400 : 403;
    return Response.json({ data: null, error: scrapeError }, { status });
  }
  const { data, error } = await upsertEventsService(events);
  // In development return the raw events so the caller can see the full payload.
  const responseData = {
    count: events.length,
    platform,
    ...data,
    ...(process.env.NODE_ENV === "development" ? { events } : {}),
  };
  return Response.json({ data: responseData, error });
}
