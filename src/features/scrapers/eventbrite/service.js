import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeEventbrite() {
  try {
    const url = "https://www.eventbrite.com/d/online/hackathon/";
    const resp = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    const $ = cheerio.load(resp.data);
    const events = [];

    $(
      '.event-card, .search-event-card, [class*="event-card"], .eds-event-card',
    ).each((i, el) => {
      try {
        const $el = $(el);
        const title = $el
          .find('h1, h2, h3, .event-title, [class*="title"]')
          .first()
          .text()
          .trim();
        if (!title) return;
        const titleLower = title.toLowerCase();
        const hackKeywords = [
          "hackathon",
          "hack day",
          "coding competition",
          "programming contest",
        ];
        if (!hackKeywords.some((k) => titleLower.includes(k))) return;
        const desc = $el
          .find('p, .event-description, [class*="description"]')
          .first()
          .text()
          .trim();
        const href = $el.find("a").first().attr("href") || $el.attr("href");
        const redirectURL = href
          ? href.startsWith("http")
            ? href
            : `https://www.eventbrite.com${href}`
          : "";
        const price = $el
          .find('.event-price, .price, [class*="price"]')
          .first()
          .text()
          .trim();
        const tags = ["hackathon", "eventbrite"];
        if (price && price.toLowerCase().includes("free")) tags.push("free");

        events.push({
          title,
          description: desc || "",
          type: "hackathon",
          startDate: null,
          endDate: null,
          deadline: null,
          tags,
          hostedBy: "Eventbrite",
          verified: true,
          redirectURL,
        });
      } catch (err) {
        // continue
      }
    });

    return events.slice(0, 3);
  } catch (error) {
    console.error("Error scraping Eventbrite:", error?.message || error);
    return [];
  }
}

export default scrapeEventbrite;
