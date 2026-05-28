import { fetchEventDetails } from "../luma/details.js";
import { fetchDevfolioEventDetails } from "../devfolio/details.js";
import { normalizeEvent, detectPlatform } from "../normalizer.js";

/**
 * EventTier is a platform that often hosts links to other platforms.
 * This scraper follows those links to get full event details.
 */
export async function scrapeEventTier() {
  try {
    // Placeholder for EventTier scraping logic.
    // In a real scenario, this would fetch from an EventTier API or HTML page.
    const rawEvents = [
      // Example of an event from EventTier that points to Luma
      {
        title: "MTW Satellite Event: Agentic Marketing Build Labs",
        url: "https://lu.ma/event/evt-123456789",
        platform: "eventtier",
      },
    ];

    const enrichedEvents = await Promise.all(
      rawEvents.map(async (event) => {
        const url = event.url;
        const platform = detectPlatform(url);

        let details = {};
        try {
          if (platform === "luma") {
            details = await fetchEventDetails(url);
          } else if (platform === "devfolio") {
            details = await fetchDevfolioEventDetails(url);
          }
        } catch (err) {
          console.error(`Failed to fetch details for ${url}:`, err.message);
        }

        return normalizeEvent(
          {
            ...event,
            ...details,
            platform: platform !== "scraper" ? platform : "eventtier",
          },
          platform !== "scraper" ? platform : "eventtier",
        );
      }),
    );

    return enrichedEvents.filter(Boolean);
  } catch (error) {
    console.error("Error in scrapeEventTier:", error.message);
    return [];
  }
}
