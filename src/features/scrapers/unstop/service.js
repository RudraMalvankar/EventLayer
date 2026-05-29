import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeUnstop() {
  try {
    // Force HTML fallback for reliability if API is not set
    // Use the provided open hackathons URL with location + user type filters.
    const fallbackUrl =
      "https://unstop.com/hackathons?oppstatus=open&distance=50&location_points=19.07283:72.88261,19.04:72.86,19.12636:72.84897,19.03681:73.01582,19.33333:73.25,19.2437:73.13554&usertype=students&domain=2";
    const resp = await axios.get(fallbackUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const $ = cheerio.load(resp.data || "");
    const found = [];

    // Unstop uses challenge-card classes often
    $(".challenge-card, .double-card, .event-card, a[href]").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || $el.find("a").attr("href") || "";
      if (!/\/challenge\/|\/event\/|\/hackathon\//i.test(href)) return;

      const title =
        $el.find(".challenge-name, .event-title, h2, h3").text().trim() ||
        $el.text().trim();
      if (!title || title.length < 5) return;

      const url = href.startsWith("http") ? href : `https://unstop.com${href}`;
      const img =
        $el.find("img").attr("src") ||
        $el.find(".event-banner img").attr("src");
      const dateStr = $el
        .find(".date, .event-date, .registration-status")
        .text()
        .trim();

      found.push({
        title,
        url,
        image: img
          ? img.startsWith("http")
            ? img
            : `https://unstop.com${img}`
          : null,
        dateStr,
      });
    });

    return found.slice(0, 40).map((it) => ({
      title: it.title,
      description: `${it.title} - Competition on Unstop`,
      url: it.url,
      banner_url: it.image,
      start_date: it.dateStr, // Normalizer will handle the year inference
      organizer: "Unstop",
      platform: "unstop",
      category: "hackathon",
      mode: "online",
      is_free: true,
    }));
  } catch (error) {
    console.error("Error scraping Unstop:", error?.message || error);
    return [];
  }
}

export default scrapeUnstop;
