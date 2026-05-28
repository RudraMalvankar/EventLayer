import * as cheerio from "cheerio";
import { normalizeEvent } from "../normalizer.js";

const STATIC_PATHS = new Set([
  "discover",
  "pricing",
  "help",
  "signin",
  "app",
  "login",
  "home",
  "events",
]);

function normalizeText(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(href, baseUrl) {
  if (!href) return "";
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return "";
  }
}

function isEventUrl(url) {
  try {
    const pathname = new URL(url).pathname.replace(/\/+$/, "");
    const slug = pathname.replace(/^\//, "").toLowerCase();
    return /^\/[a-z0-9]{8}$/i.test(pathname) && !STATIC_PATHS.has(slug);
  } catch {
    return false;
  }
}

function uniqueByUrl(events) {
  const seen = new Set();
  return events.filter((event) => {
    if (!event?.event_url || seen.has(event.event_url)) return false;
    seen.add(event.event_url);
    return true;
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "TechPulse/1.0" },
  });
  if (!response.ok) throw new Error("Failed request");
  return response.json();
}

async function scrapeFromApi() {
  const [listRes, searchRes] = await Promise.all([
    fetchJson(
      "https://api.lu.ma/public/v1/calendar/list-events?pagination_limit=50",
    ),
    fetchJson(
      "https://api.lu.ma/public/v1/event/search?query=hackathon+mumbai",
    ),
  ]);
  const rawEvents = [
    ...(listRes?.entries || []),
    ...(searchRes?.entries || []),
  ];
  return rawEvents
    .map((event) =>
      normalizeEvent(
        {
          title: event.name || event.title,
          description: event.description,
          url: event.url,
          start_at:
            event.start_at ||
            event.starts_at ||
            event.startDate ||
            event.start_date,
          end_at:
            event.end_at || event.ends_at || event.endDate || event.end_date,
          cover_url: event.cover_url,
          location: event.location?.city || event.location_name,
          country: event.location?.country,
          host: event.hosts?.[0]?.name,
          price: event.ticket_info?.price || event.ticket_info?.amount,
          tags: event.tags || [],
        },
        "luma",
      ),
    )
    .filter(Boolean);
}

async function scrapeFromHtml(url = "https://lu.ma/discover") {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    },
  });
  if (!response.ok) return [];
  const html = await response.text();
  const $ = cheerio.load(html);
  const events = [];
  
  // Luma discover page often has event cards with specific classes or just links
  $("a").each((_, element) => {
    const href = absoluteUrl($(element).attr("href"), "https://lu.ma");
    if (!href || !isEventUrl(href)) return;
    
    const card = $(element).closest("div");
    const title = normalizeText($(element).find("h1,h2,h3,span").first().text()) || 
                  normalizeText($(element).text());
    
    if (!title || title.length < 3) return;

    const normalized = normalizeEvent(
      {
        title,
        url: href,
        location: "Global",
        organizer: "Luma",
      },
      "luma",
    );
    if (normalized) events.push(normalized);
  });
  return events;
}

export async function scrapeLuma() {
  try {
    const apiEvents = await scrapeFromApi();
    if (apiEvents.length) return uniqueByUrl(apiEvents);
  } catch {
    // fall through to HTML strategy
  }

  try {
    const htmlEvents = await scrapeFromHtml();
    return uniqueByUrl(htmlEvents);
  } catch {
    return [];
  }
}
