import { env } from "../../shared/config/env.js";
import { scrapeLuma } from "./luma/service.js";
import { scrapeDevfolio } from "./devfolio/service.js";
import { scrapeUnstop } from "./unstop/service.js";
import { scrapeDevpost } from "./devpost/service.js";
import { scrapeEventbrite } from "./eventbrite/service.js";
import { scrapeMeetup } from "./meetup/service.js";

export function resolvePlatform(requestedPlatform) {
  if (!requestedPlatform || requestedPlatform === "default") return "luma";
  return requestedPlatform;
}

export async function scrapeByPlatform(requestedPlatform) {
  const platform = resolvePlatform(requestedPlatform);
  try {
    if (platform === "luma")
      return { platform, events: await scrapeLuma(), error: null };
    if (platform === "meetup")
      return { platform, events: await scrapeMeetup(), error: null };
    if (platform === "devfolio") {
      if (!env.scraperDevfolioEnabled) {
        return {
          platform,
          events: [],
          error:
            "Devfolio scraper is disabled. Set SCRAPER_DEVFOLIO_ENABLED=true to enable.",
        };
      }
      return { platform, events: await scrapeDevfolio(), error: null };
    }
    if (platform === "unstop")
      return { platform, events: await scrapeUnstop(), error: null };
    if (platform === "devpost")
      return { platform, events: await scrapeDevpost(), error: null };
    if (platform === "eventbrite")
      return { platform, events: await scrapeEventbrite(), error: null };

    // special "all" to run everything (limited)
    if (platform === "all") {
      const results = [];
      results.push(...(await scrapeLuma()));
      results.push(...(await scrapeMeetup()));
      if (env.scraperDevfolioEnabled) results.push(...(await scrapeDevfolio()));
      results.push(...(await scrapeUnstop()));
      results.push(...(await scrapeDevpost()));
      results.push(...(await scrapeEventbrite()));
      // eventtier scraper not present in this workspace — skip
      return { platform, events: results, error: null };
    }

    return { platform, events: [], error: "Unsupported platform" };
  } catch (err) {
    return { platform, events: [], error: err?.message || String(err) };
  }
}
