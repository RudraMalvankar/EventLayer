import * as cheerio from "cheerio";
import { normalizeEvent } from "../normalizer.js";
import { env } from "../../../shared/config/env.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mumbaiAllowlist = ["mumbai", "navi mumbai", "mumbai, india", "bombay"];
const allowAnyRegion = true;
const defaultSearchUrl =
  "https://devfolio.co/search?location[]={%22label%22%3A%22Mumbai%22%2C%22id%22%3A%22Mumbai%22}&location[]={%22label%22%3A%22Navi%20Mumbai%22%2C%22id%22%3A%22Navi%20Mumbai%22}&location[]={%22label%22%3A%22Thane%22%2C%22id%22%3A%22Thane%22}&primary_filter=hackathons";

function isOnlineOnly(text) {
  const value = String(text || "").toLowerCase();
  return value.includes("online") || value.includes("virtual");
}

async function scrapeDevfolioPlaywright() {
  if (!env.devfolioPlaywrightEnabled) return null;
  let browser = null;
  try {
    const { chromium } = await import("playwright");
    const targetUrl = env.devfolioSearchUrl || defaultSearchUrl;
    try {
      browser = await chromium.launch({ headless: true, channel: "chrome" });
    } catch {
      try {
        browser = await chromium.launch({ headless: true, channel: "msedge" });
      } catch {
        browser = await chromium.launch({ headless: true });
      }
    }
    const page = await browser.newPage({ userAgent: "TechPulse/1.0" });
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll("a[href]")).some((anchor) =>
          anchor.href.includes(".devfolio.co/"),
        ),
      { timeout: 15000 },
    );
    await page.waitForTimeout(1500);

    const payload = await page.evaluate(() => {
      const DEVFOLIO_HOST = "devfolio.co";
      const IGNORED_HOSTS = new Set([
        "devfolio.co",
        "www.devfolio.co",
        "guide.devfolio.co",
        "status.devfolio.co",
      ]);

      function normalizeText(value) {
        return String(value || "")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .replace(/\s+/g, " ")
          .trim();
      }

      function isDevfolioHackathonUrl(url) {
        try {
          const parsed = new URL(url);
          const host = parsed.hostname.toLowerCase();
          const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
          if (!host.endsWith(DEVFOLIO_HOST)) return false;
          if (IGNORED_HOSTS.has(host)) {
            if (!pathname.startsWith("/hackathons/")) return false;
            const slug = pathname.replace("/hackathons/", "");
            return Boolean(slug) && !slug.includes("/");
          }
          if (pathname !== "/") return false;
          const slug = host.slice(0, -(DEVFOLIO_HOST.length + 1));
          return Boolean(slug) && !slug.includes("/");
        } catch {
          return false;
        }
      }

      function extractTitle(text) {
        let title = normalizeText(text);
        const cutPoints = [
          title.indexOf("By"),
          title.search(/\bSold Out\b/i),
          title.search(/\+\d+/),
          title.search(/\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\b/i),
          title.search(
            /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i,
          ),
        ].filter((index) => index > 0);

        if (cutPoints.length > 0) {
          title = title.slice(0, Math.min(...cutPoints));
        }

        return normalizeText(title);
      }

      function extractCardImage(card) {
        const img = card.querySelector("img");
        if (!img) return "";
        return img.getAttribute("src") || img.getAttribute("data-src") || "";
      }

      const anchors = Array.from(document.querySelectorAll("a[href]"));
      const seen = new Set();
      const cards = [];

      anchors.forEach((anchor) => {
        const href = anchor.getAttribute("href") || "";
        const url = href.startsWith("http")
          ? href
          : `https://devfolio.co${href}`;
        if (!isDevfolioHackathonUrl(url) || seen.has(url)) return;

        let node = anchor.closest("div") || anchor.parentElement;
        let title = "";
        for (let i = 0; i < 6 && node; i += 1) {
          const heading = node.querySelector("h3") || node.querySelector("h2");
          title = normalizeText(heading?.textContent || "");
          if (title) break;
          node = node.parentElement;
        }

        const card = node || anchor;
        const cardText = normalizeText(card.textContent);

        seen.add(url);
        cards.push({
          title: extractTitle(title || cardText),
          url,
          image: extractCardImage(card),
          rawText: cardText,
        });
      });

      const pageTitle = normalizeText(document.title);
      return { cards, pageTitle };
    });

    const events = [];
    const pageLocation = payload?.pageTitle || "";

    payload.cards.forEach((event) => {
      const title = event?.title || "";
      const locationText =
        `${pageLocation} ${event?.rawText || ""} ${title}`.toLowerCase();
      const isMumbai = mumbaiAllowlist.some((entry) =>
        locationText.includes(entry),
      );
      if (!allowAnyRegion && !isMumbai) return;

      const city = isOnlineOnly(locationText)
        ? null
        : isMumbai
          ? "Mumbai"
          : null;
      const normalized = normalizeEvent(
        {
          title,
          url: event?.url || null,
          image: event?.image || null,
          city,
          organizer: "Devfolio",
          category: "hackathon",
        },
        "devfolio",
      );
      if (normalized) events.push(normalized);
    });

    return events;
  } catch (error) {
    console.error("Devfolio Playwright scrape failed", error?.message || error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function scrapeDevfolioApi() {
  if (!env.devfolioApi) return null;
  try {
    const events = [];
    for (let page = 1; page <= 2; page += 1) {
      const joiner = env.devfolioApi.includes("?") ? "&" : "?";
      const response = await fetch(`${env.devfolioApi}${joiner}page=${page}`, {
        headers: { "User-Agent": "TechPulse/1.0" },
      });
      if (!response.ok) return [];
      const payload = await response.json();
      const data = Array.isArray(payload?.result)
        ? payload.result
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      if (!data.length) break;

      data.forEach((event) => {
        const title = event?.name || event?.title || "";
        const description =
          event?.desc || event?.description || event?.tagline || "";
        const location = event?.city || event?.location || event?.region || "";
        const locationText =
          `${location} ${title} ${description}`.toLowerCase();
        const isMumbai = mumbaiAllowlist.some((entry) =>
          locationText.includes(entry),
        );
        if (!allowAnyRegion && !isMumbai) return;

        const city = isOnlineOnly(locationText)
          ? null
          : location || (isMumbai ? "Mumbai" : null);
        const url =
          event?.url ||
          event?.link ||
          (event?.slug ? `https://${event.slug}.devfolio.co` : null);
        const normalized = normalizeEvent(
          {
            title,
            description,
            url,
            image:
              event?.cover_image || event?.banner_url || event?.logo || null,
            city,
            organizer: event?.organizer || "Devfolio",
            category: "hackathon",
            tags: event?.tagline ? [event.tagline] : [],
            starts_at: event?.starts_at || event?.start_at || null,
            ends_at: event?.ends_at || event?.end_at || null,
          },
          "devfolio",
        );
        if (normalized) events.push(normalized);
      });
    }
    return events;
  } catch {
    return [];
  }
}

export async function scrapeDevfolio() {
  try {
    const browserEvents = await scrapeDevfolioPlaywright();
    if (browserEvents) return browserEvents;
    const apiEvents = await scrapeDevfolioApi();
    if (apiEvents) return apiEvents;
    const response = await fetch("https://devfolio.co/hackathons", {
      headers: { "User-Agent": "TechPulse/1.0" },
    });
    if (!response.ok) return [];
    const html = await response.text();
    await sleep(1000);
    const $ = cheerio.load(html);
    const events = [];
    $('[href*="/hackathons/"], .hackathon-card, .Listing_container__').each(
      (_, element) => {
        const a = $(element).is("a")
          ? $(element)
          : $(element).find("a").first();
        const href = a.attr("href");
        const title =
          $(element).find("h3,h2,.title").first().text().trim() ||
          a.text().trim();
        const description = $(element)
          .find("p,.subtitle,.description")
          .first()
          .text()
          .trim();
        const location = $(element)
          .find('[class*="location"], .location, .city, .Listing_location__')
          .first()
          .text()
          .trim();
        const image = $(element).find("img").first().attr("src");
        const locationText =
          `${location} ${title} ${description}`.toLowerCase();
        const isMumbai = mumbaiAllowlist.some((entry) =>
          locationText.includes(entry),
        );
        if (!allowAnyRegion && !isMumbai) return;
        const city = isOnlineOnly(locationText)
          ? null
          : location || (isMumbai ? "Mumbai" : null);
        const normalized = normalizeEvent(
          {
            title,
            tagline: description,
            url: href?.startsWith("http")
              ? href
              : href
                ? `https://devfolio.co${href}`
                : null,
            image,
            city,
            organizer: "Devfolio",
            mode: "online",
            category: "hackathon",
          },
          "devfolio",
        );
        if (normalized) events.push(normalized);
      },
    );
    return events;
  } catch {
    return [];
  }
}
