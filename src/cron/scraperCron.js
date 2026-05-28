import cron from "node-cron";
import { env } from "../shared/config/env.js";
import { scrapeByPlatform } from "../features/scrapers/service.js";
import { upsertEventsService } from "../features/events/service.js";

async function runAll() {
  try {
    console.error("cron: starting scrapeByPlatform(all)");
    const { platform, events, error } = await scrapeByPlatform("all");
    if (error) {
      console.error("cron: scrape error", error);
      return;
    }
    if (!events || !events.length) {
      console.error("cron: no events returned");
      return;
    }
    console.error("cron: upserting", events.length, "events");
    const res = await upsertEventsService(events);
    console.error("cron: upsert result", res);
  } catch (err) {
    console.error("cron: unexpected error", err?.message || err);
  }
}

export function startScraperCron() {
  const schedule = process.env.SCRAPER_SCHEDULE || "hourly";
  let cronExpr = "0 * * * *"; // default: every hour at minute 0
  if (schedule === "3hour" || schedule === "every3hours")
    cronExpr = "0 */3 * * *";
  if (schedule && schedule.startsWith("cron:"))
    cronExpr = schedule.replace("cron:", "");

  console.error("Starting scraper cron:", cronExpr);
  cron.schedule(cronExpr, async () => {
    await runAll();
  });
}

if (typeof import.meta !== "undefined" && import.meta?.main) {
  startScraperCron();
}
