import { env } from "../../../../src/shared/config/env";
import { scrapeByPlatform } from "../../../../src/features/scrapers/service";
import { upsertEventsService } from "../../../../src/features/events/service";
import enrichWithGemini from "../../../../src/features/scrapers/enrichWithGemini.js";
import { generateEventSummary } from "../../../../src/features/scrapers/summarize.js";
import { withRateLimit } from "../../../../src/shared/security/rateLimiter.js";
import { scrapePlatformParamsSchema } from "../../../../src/shared/validation/schemas.js";
import { validateParams } from "../../../../src/shared/validation/validate.js";

async function postHandler(request, { params }) {
  const key = request.headers.get("x-scrape-key");
  if (!env.scrapeSecret || key !== env.scrapeSecret) {
    return Response.json(
      { data: null, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { error: validationError } = validateParams(
    scrapePlatformParamsSchema,
    { platform: params.platform },
  );
  if (validationError) return validationError;

  const {
    platform,
    events,
    error: scrapeError,
  } = await scrapeByPlatform(params.platform);
  if (scrapeError) {
    const status = scrapeError.includes("Unsupported") ? 400 : 403;
    return Response.json({ data: null, error: scrapeError }, { status });
  }
  // Optionally enrich events with Gemini before upsert
  let enrichedEvents = events;
  try {
    if (
      env.geminiApiKey &&
      env.enrichWithGemini &&
      Array.isArray(events) &&
      events.length
    ) {
      enrichedEvents = [];
      for (const ev of events) {
        try {
          const rawText =
            ev.description || `${ev.title || ""} ${ev.description || ""}`;
          const merged = await enrichWithGemini(ev, rawText, { upsert: false });
          
          // Generate a high-quality TL;DR summary
          const summary = await generateEventSummary(merged || ev, rawText);
          
          enrichedEvents.push({
            ...(merged || ev),
            ai_summary: summary || (merged?.ai_summary || ev.ai_summary),
          });
        } catch (e) {
          enrichedEvents.push(ev);
        }
      }
    }
  } catch (e) {
    console.error("Enrichment process failed:", e?.message || e);
    enrichedEvents = events;
  }

  const { data, error } = await upsertEventsService(enrichedEvents);
  // In development return the raw events so the caller can see the full payload.
  const responseData = {
    count: events.length,
    platform,
    ...data,
    ...(process.env.NODE_ENV === "development" ? { events } : {}),
  };
  return Response.json({ data: responseData, error });
}

export const POST = withRateLimit(postHandler, {
  routeName: "scrape-platform",
  limit: 20, // 20 scrape requests
  windowMs: 60_000, // per minute
});
