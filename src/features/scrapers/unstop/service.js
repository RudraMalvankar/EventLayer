import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeUnstop() {
  try {
    const baseUrl = process.env.UNSTOP_API;
    if (!baseUrl) {
      // try a very small HTML fallback to discover some public events
      try {
        const fallbackUrl = "https://unstop.com/search?query=hackathon";
        const resp = await axios.get(fallbackUrl, {
          headers: { "User-Agent": "TechPulse/1.0" },
        });
        const $ = cheerio.load(resp.data || "");
        const found = [];
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href") || "";
          // prefer challenge/event links
          if (!/\/challenge\/|\/event\/|\/hackathon\//i.test(href)) return;
          const title = $(el).text().trim();
          if (!title || title.length < 5) return;
          const url = href.startsWith("http")
            ? href
            : `https://unstop.com${href}`;
          found.push({ title, url });
        });
        // map to similar shape used by main pipeline
        return found.slice(0, 30).map((it) => ({
          title: it.title,
          description: it.title,
          redirectURL: it.url,
          hostedBy: "Unstop",
          verified: false,
          type: "hackathon",
        }));
      } catch (e) {
        return [];
      }
    }

    let allEvents = [];
    let currentPage = 1;

    while (currentPage <= 3) {
      const pageUrl = `${baseUrl}&page=${currentPage}`;
      const response = await axios.get(pageUrl);
      if (!response.data || !response.data.data) break;

      const paginatedData = response.data.data;
      const rawData = paginatedData.data;
      const eventsArray = Object.values(rawData || {});
      if (!eventsArray.length) break;

      // process items
      for (let i = 0; i < eventsArray.length; i++) {
        try {
          const item = eventsArray[i];
          const title = item?.title;
          if (!title || title.length < 5) continue;

          const now = new Date();
          const endDate = item?.end_date ? new Date(item.end_date) : null;
          if (endDate && endDate < now) continue;

          const event = {
            title: title,
            description:
              item.featured_title ||
              item.seo_details?.[0]?.description ||
              `${item.title || "Hackathon"} - Competition/Hackathon on Unstop`,
            type: "hackathons",
            startDate: item.start_date
              ? new Date(item.start_date).toISOString().split("T")[0]
              : null,
            endDate: item.end_date
              ? new Date(item.end_date).toISOString().split("T")[0]
              : null,
            deadline: item.regnRequirements?.end_regn_dt
              ? new Date(item.regnRequirements.end_regn_dt)
                  .toISOString()
                  .split("T")[0]
              : null,
            tags: ["unstop", item.type || "hackathon", item.region].filter(
              Boolean,
            ),
            hostedBy: item.organisation?.name || "Unstop",
            verified: true,
            redirectURL: item.public_url
              ? `https://unstop.com/${item.public_url}`
              : "https://unstop.com",
          };
          allEvents.push(event);
        } catch (err) {
          console.error("Error processing Unstop item", err?.message || err);
        }
      }

      if (!paginatedData.next_page_url) break;
      currentPage++;
    }

    return allEvents;
  } catch (error) {
    console.error("Error scraping Unstop:", error?.message || error);
    return [];
  }
}

export default scrapeUnstop;
