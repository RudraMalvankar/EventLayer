import cron from "node-cron";
import { scrapeLuma } from "./scrapers/luma";
import { scrapeDevfolio } from "./scrapers/devfolio";
import { upsertEvents } from "./db";
import { env } from "../src/shared/config/env";

export function startCronJobs() {
  cron.schedule("0 */6 * * *", async () => {
    const events = await scrapeLuma();
    const result = await upsertEvents(events);
    console.error("luma cron", result);
  });

  cron.schedule("0 */12 * * *", async () => {
    if (!env.scraperDevfolioEnabled) return;
    const events = await scrapeDevfolio();
    const result = await upsertEvents(events);
    console.error("devfolio cron", result);
  });
}
