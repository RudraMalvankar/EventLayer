import * as cheerio from "cheerio";
import { normalizeEvent } from "../normalizer.js";
import { fetchDevfolioEventDetails } from "./details.js";
import { env } from "../../../shared/config/env.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mumbaiAllowlist = ["mumbai", "navi mumbai", "mumbai, india", "bombay"];
const allowAnyRegion = true;
const currentYear = new Date().getFullYear();
const defaultSearchUrl =
  "https://devfolio.co/search?location[]={%22label%22%3A%22Mumbai%22%2C%22id%22%3A%22Mumbai%22}&location[]={%22label%22%3A%22Navi%20Mumbai%22%2C%22id%22%3A%22Navi%20Mumbai%22}&location[]={%22label%22%3A%22Thane%22%2C%22id%22%3A%22Thane%22}&primary_filter=hackathons";

function isOnlineOnly(text) {
  const value = String(text || "").toLowerCase();
  return value.includes("online") || value.includes("virtual");
}

function isArchivedDevfolioTitle(title) {
  const value = String(title || "").toLowerCase();
  if (!value) return false;
  if (value.includes("past") || value.includes("archive")) return true;
  const yearMatch = value.match(/\b(20\d{2})\b/);
  if (!yearMatch) return false;
  return Number(yearMatch[1]) < currentYear;
}

function isFutureDate(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime();
}

function shouldKeepDevfolioEvent(event) {
  if (!event) return false;
  const title = event?.title || "";
  if (isArchivedDevfolioTitle(title)) return false;
  // If we don't have a start_date, we keep it as it might be a newly scraped event without enrichment yet
  if (!event.start_date) return true;
  return isFutureDate(event.start_date);
}

async function enrichDevfolioEvents(events) {
  const enriched = [];
  for (const event of events) {
    const url = event?.url || event?.event_url || null;
    if (!url) {
      enriched.push(event);
      continue;
    }

    try {
      const details = await fetchDevfolioEventDetails(url);
      const combined = {
        ...event,
        description: event?.description || details?.description || null,
        banner_url: event?.banner_url || details?.banner_url || null,
        start_date: event?.start_date || details?.start_date || null,
        end_date: event?.end_date || details?.end_date || null,
        organizer: event?.organizer || details?.organizer || null,
        city: event?.city || details?.city || null,
        country: event?.country || details?.country || null,
      };
      // Normalize after enrichment to ensure consistent shape
      const normalized = normalizeEvent(combined, "devfolio");
      if (normalized) enriched.push(normalized);
    } catch {
      const normalized = normalizeEvent(event, "devfolio");
      if (normalized) enriched.push(normalized);
    }
  }
  return enriched;
}

async function scrapeFromHtml(url = defaultSearchUrl) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
    });
    if (!response.ok) return [];
    const html = await response.text();
    const $ = cheerio.load(html);
    const events = [];

    $('a[href*="devfolio.co"]').each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      
      const absolute = href.startsWith("http") ? href : `https://devfolio.co${href}`;
      if (absolute.includes(".devfolio.co") || absolute.includes("devfolio.co/hackathons/")) {
        const card = $(el).closest("div");
        const title = card.find("h1, h2, h3, h4").first().text().trim() || $(el).text().trim();
        const banner = card.find("img").attr("src");
        
        if (title && title.length > 3 && !isArchivedDevfolioTitle(title)) {
          events.push({
            title,
            url: absolute,
            banner_url: banner,
            platform: "devfolio",
            organizer: "Devfolio"
          });
        }
      }
    });

    return events;
  } catch (err) {
    console.error("Devfolio HTML scrape failed:", err.message);
    return [];
  }
}

export async function scrapeDevfolio() {
  try {
    const htmlEvents = await scrapeFromHtml();
    if (htmlEvents.length > 0) {
      const enriched = await enrichDevfolioEvents(htmlEvents);
      return enriched.filter(shouldKeepDevfolioEvent);
    }
    return [];
  } catch (error) {
    console.error("Error in Devfolio scraping:", error?.message || error);
    return [];
  }
}

export default scrapeDevfolio;
