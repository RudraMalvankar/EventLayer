import { scrapeByPlatform } from "../src/features/scrapers/service.js";
import { upsertEventsService } from "../src/features/events/service.js";
import { fetchEventDetails } from "../src/features/scrapers/luma/details.js";
import fs from "fs/promises";
import path from "path";

const outDir = path.resolve("scripts", "scrape_outputs");

async function enrichEvent(event) {
  if (!event || !event.url) return event;
  try {
    const meta = await fetchEventDetails(event.url);
    return {
      ...event,
      description: event.description || meta.description || null,
      banner_url: event.banner_url || meta.banner_url || null,
      startDate: event.startDate || meta.start_date || null,
      endDate: event.endDate || meta.end_date || null,
      organizer: event.organizer || meta.organizer || null,
      city: event.city || meta.city || null,
    };
  } catch (err) {
    console.error("Enrichment failed for", event.url, err?.message || err);
    return event;
  }
}

function normalizeForDb(event) {
  // Map fields into DB shape used by upsert (best effort)
  return {
    title: event.title || "",
    description: event.description || null,
    event_url: event.url || event.redirectURL || null,
    banner_url: event.banner_url || event.image || null,
    start_date: event.startDate || event.starts_at || event.start_date || null,
    end_date: event.endDate || event.ends_at || event.end_date || null,
    organizer: event.organizer || event.hostedBy || null,
    city: event.city || null,
    country: event.country || null,
    platform: event.platform || "scraper",
    category: event.category || event.type || null,
    tags: event.tags || [],
    mode: event.mode || null,
    is_free: event.tags && event.tags.includes("free") ? true : null,
    created_at: new Date().toISOString(),
  };
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  console.error("Running combined scrape -> enrich -> upsert");
  const { platform, events, error } = await scrapeByPlatform("all");
  if (error) {
    console.error("Scrape error:", error);
    await fs.writeFile(
      path.join(outDir, "upsert_error.json"),
      JSON.stringify({ error }, null, 2),
    );
    process.exit(1);
  }
  console.error("Scraped", events.length, "events. Enriching...");
  const enriched = [];
  for (const e of events) {
    const enrichedEvent = await enrichEvent(e);
    enriched.push(enrichedEvent);
  }

  // Normalize and upsert in batches
  const batchSize = 50;
  const dbItems = enriched.map(normalizeForDb);
  let inserted = 0;
  for (let i = 0; i < dbItems.length; i += batchSize) {
    const batch = dbItems.slice(i, i + batchSize);
    try {
      const res = await upsertEventsService(batch);
      inserted += batch.length;
      console.error(`Upserted batch ${i / batchSize + 1}: ${batch.length}`);
    } catch (err) {
      console.error(
        "Upsert failed for batch",
        i / batchSize + 1,
        err?.message || err,
      );
    }
  }

  await fs.writeFile(
    path.join(outDir, "upsert_result.json"),
    JSON.stringify(
      {
        platform,
        scraped: events.length,
        enriched: enriched.length,
        upserted: inserted,
      },
      null,
      2,
    ),
  );
  console.error("Done: upserted", inserted);
}

run();
