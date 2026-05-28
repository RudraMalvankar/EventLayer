import { scrapeByPlatform } from "../src/features/scrapers/service.js";
import { upsertEventsService } from "../src/features/events/service.js";
import { fetchEventDetails } from "../src/features/scrapers/luma/details.js";
import { fetchDevfolioEventDetails } from "../src/features/scrapers/devfolio/details.js";
import fs from "fs/promises";
import path from "path";

const outDir = path.resolve("scripts", "scrape_outputs");

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
  try {
    const meta =
      String(event.platform || "").toLowerCase() === "devfolio"
        ? await fetchDevfolioEventDetails(url)
        : await fetchEventDetails(url);
    return {
      ...event,
      description: event.description || meta.description || null,
      banner_url: event.banner_url || meta.banner_url || null,
      startDate:
        event.startDate ||
        event.starts_at ||
        event.start_date ||
        meta.start_date ||
        null,
      endDate:
        event.endDate ||
        event.ends_at ||
        event.end_date ||
        meta.end_date ||
        null,
      organizer: event.organizer || meta.organizer || null,
      city: event.city || meta.city || null,
    };
  } catch (err) {
    console.error("Enrichment failed for", event.url, err?.message || err);
    return event;
  }
}

function normalizeForDb(event) {
  return {
    title: event.title || "",
    description: event.description || null,
    event_url: event.url || event.redirectURL || event.event_url || null,
    banner_url: event.banner_url || event.image || null,
    start_date: event.startDate || event.starts_at || event.start_date || null,
    end_date: event.endDate || event.ends_at || event.end_date || null,
    organizer: event.organizer || event.hostedBy || null,
    city:
      event.city ||
      (String(event.platform || event.sourcePlatform || "").toLowerCase() ===
      "eventbrite"
        ? "Online"
        : null),
    country:
      event.country ||
      (String(event.platform || event.sourcePlatform || "").toLowerCase() ===
      "eventbrite"
        ? "Online"
        : null),
    platform: event.platform || event.sourcePlatform || "scraper",
    category: event.category || event.type || null,
    tags: event.tags || [],
    mode:
      event.mode ||
      (String(event.platform || event.sourcePlatform || "").toLowerCase() ===
      "eventbrite"
        ? "online"
        : null),
    is_free: event.tags && event.tags.includes("free") ? true : null,
    created_at: new Date().toISOString(),
  };
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  console.error("Running combined scrape -> enrich -> upsert");
  const platforms = [
    "luma",
    "meetup",
    "devfolio",
    "unstop",
    "devpost",
    "eventbrite",
  ];
  let allEvents = [];
  for (const p of platforms) {
    try {
      const res = await scrapeByPlatform(p);
      if (res?.events && res.events.length) {
        console.error(`Scraped ${res.events.length} from ${p}`);
        allEvents.push(
          ...res.events.map((event) => ({
            ...event,
            sourcePlatform: event.platform || p,
            platform: event.platform || p,
          })),
        );
      } else {
        console.error(`No events from ${p}`);
      }
    } catch (err) {
      console.error(`Scrape failed for ${p}:`, err?.message || err);
    }
  }

  console.error("Total scraped", allEvents.length, "events. Enriching...");
  const enriched = [];
  for (const e of allEvents) {
    const enrichedEvent = await enrichEvent(e);
    enriched.push(enrichedEvent);
  }

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
        platforms,
        scraped: allEvents.length,
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
