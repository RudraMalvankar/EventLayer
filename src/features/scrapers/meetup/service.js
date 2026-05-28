import * as cheerio from "cheerio";
import { fetchEventDetails } from "../luma/details.js";

/**
 * Helper to build an absolute URL from a possibly relative href.
 * Re‑uses the same logic as the Luma scraper.
 */
function absoluteUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return "";
  }
}

/**
 * Scrape Meetup search results for technology events in Mumbai.
 * The function fetches the public search page, extracts links to individual
 * event pages, then re‑uses the existing Luma `fetchEventDetails` parser to
 * normalise each event.
 *
 * The returned array contains objects that already match the Normalized Event
 * Shape used throughout the application, with an added `platform` field set
 * to "meetup" and the original `event_url`.
 */
export async function scrapeMeetup() {
  const searchUrl = "https://www.meetup.com/find/?topic=technology&source=EVENTS&categoryId=546&location=in--mumbai&distance=twentyFiveMiles&eventType=inPerson";

  try {
    const res = await fetch(searchUrl, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36", 
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      },
      cache: "no-store",
    });
    
    if (!res.ok) {
      console.error(`Meetup fetch failed with status ${res.status}`);
      return [];
    }
    
    const html = await res.text();
    const $ = cheerio.load(html);

    const links = new Set();
    // Improved selector for Meetup event links
    $('a[id*="event-card-in-search-results"], a[href*="/events/"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        const url = absoluteUrl(href, "https://www.meetup.com");
        if (url.includes("/events/") && !url.includes("/find/") && !url.includes("/create/")) {
          const cleanUrl = url.split('?')[0].replace(/\/$/, '');
          links.add(cleanUrl);
        }
      }
    });

    const events = [];
    const uniqueLinks = Array.from(links).slice(0, 12);
    
    // Process details in parallel but limit concurrency to avoid being blocked
    const detailPromises = uniqueLinks.map(async (url) => {
      try {
        const details = await fetchEventDetails(url);
        if (details && details.title) {
          return { 
            ...details, 
            platform: "meetup", 
            event_url: url,
            city: details.city || "Mumbai",
            country: details.country || "India",
            location: "Mumbai", // Force location for search
            mode: details.location_detail?.toLowerCase().includes('online') ? 'online' : 'offline'
          };
        }
      } catch (e) {
        console.error(`Failed to fetch Meetup details for ${url}:`, e.message);
      }
      return null;
    });

    const results = await Promise.all(detailPromises);
    return results.filter(Boolean);
  } catch (err) {
    console.error("Meetup scrape failed:", err.message);
    return [];
  }
}
