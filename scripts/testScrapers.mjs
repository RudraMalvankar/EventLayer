import fs from "fs/promises";
import path from "path";
import { scrapeByPlatform } from "../src/features/scrapers/service.js";

const outDir = path.resolve("scripts", "scrape_outputs");
const platforms = [
  "luma",
  "devfolio",
  "unstop",
  "devpost",
  "eventbrite",
  "all",
];

function sortByStartDate(a, b) {
  const aDate = a.startDate ? new Date(a.startDate) : null;
  const bDate = b.startDate ? new Date(b.startDate) : null;
  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;
  return aDate - bDate;
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  for (const p of platforms) {
    console.error(`Running scraper for: ${p}`);
    const start = Date.now();
    try {
      const { platform, events, error } = await scrapeByPlatform(p);
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      if (error) {
        console.error(`Platform ${p} error:`, error);
        await fs.writeFile(
          path.join(outDir, `${p}.json`),
          JSON.stringify({ platform: p, error }, null, 2),
        );
        continue;
      }
      const sorted = Array.isArray(events)
        ? events.slice().sort(sortByStartDate)
        : [];
      console.error(
        `Platform ${p} returned ${sorted.length} events (${duration}s). Sample:`,
      );
      for (let i = 0; i < Math.min(5, sorted.length); i++) {
        const ev = sorted[i];
        console.error(`  ${i + 1}. ${ev.title} — ${ev.startDate || "no-date"}`);
      }
      await fs.writeFile(
        path.join(outDir, `${p}.json`),
        JSON.stringify(
          { platform: p, count: sorted.length, events: sorted },
          null,
          2,
        ),
      );
    } catch (err) {
      console.error(`Exception for ${p}:`, err?.message || err);
      await fs.writeFile(
        path.join(outDir, `${p}.json`),
        JSON.stringify({ platform: p, error: String(err) }, null, 2),
      );
    }
  }
  console.error("Done");
}

run();
