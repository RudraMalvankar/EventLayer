import * as cheerio from "cheerio";
import { normalizeEvent } from "../normalizer.js";
import { fetchEventDetails } from "./details.js";

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
    const segments = pathname
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    if (segments.length !== 1) return false;

    const slug = segments[0].toLowerCase();
    if (STATIC_PATHS.has(slug)) return false;
    if (!/^[a-z0-9][a-z0-9-]{3,}$/i.test(slug)) return false;

    return true;
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
  const queries = [
    "mumbai",
    "build",
    "community",
    "ai",
    "developer",
    "hackathon",
  ];
  const results = await Promise.allSettled([
    fetchJson(
      "https://api.lu.ma/public/v1/calendar/list-events?pagination_limit=100",
    ),
    ...queries.map((query) =>
      fetchJson(
        `https://api.lu.ma/public/v1/event/search?query=${encodeURIComponent(query)}`,
      ),
    ),
  ]);

  const rawEvents = [];
  for (const result of results) {
    if (result.status === "fulfilled" && Array.isArray(result.value?.entries)) {
      rawEvents.push(...result.value.entries);
    }
  }

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
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    },
  });
  if (!response.ok) return [];
  const html = await response.text();
  const $ = cheerio.load(html);

  // Collect candidate event URLs from the page
  const hrefs = new Set();
  $("a[href]").each((_, el) => {
    try {
      const href = absoluteUrl($(el).attr("href"), "https://lu.ma");
      if (href && isEventUrl(href)) hrefs.add(href);
    } catch (e) {
      // ignore
    }
  });

  const candidates = Array.from(hrefs).slice(0, 200);
  const events = [];

  for (const candidate of candidates) {
    try {
      const meta = await fetchEventDetails(candidate);
      if (!meta?.start_date) continue;

      const normalized = normalizeEvent(
        {
          title: meta.title || "",
          description: meta.about || meta.description || "",
          url: candidate,
          cover_url: meta.banner_url || null,
          location: meta.city || null,
          country: meta.country || null,
          host: meta.organizer || null,
          start_at: meta.start_date || null,
          end_at: meta.end_date || null,
          tags: [],
        },
        "luma",
      );
      if (normalized) events.push(normalized);
    } catch (e) {
      // ignore individual fetch errors
    }
  }

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
    const pages = [
      "https://lu.ma/discover",
      "https://lu.ma/home",
      "https://lu.ma/mumbai",
      "https://lu.ma/india",
    ];
    const results = await Promise.allSettled(
      pages.map((p) => scrapeFromHtml(p)),
    );
    const all = [];
    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value))
        all.push(...r.value);
    }
    return uniqueByUrl(all);
  } catch {
    return [];
  }
}
