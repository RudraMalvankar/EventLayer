import axios from "axios";

export async function scrapeDevpost() {
  try {
    const baseURL = process.env.DEVPOST_API;
    if (!baseURL) return [];

    let page = 1;
    const maxPages = 4;
    const events = [];

    while (page <= maxPages) {
      try {
        const response = await axios.get(`${baseURL}?page=${page}`);
        if (!response.data || !response.data.hackathons) break;

        const data = response.data.hackathons;
        if (!Array.isArray(data) || data.length === 0) break;

        for (let i = 0; i < data.length; i++) {
          try {
            const hackathon = data[i];
            const submissionDates = hackathon.submission_period_dates || "";
            const parsed = parseSubmissionDates(submissionDates);
            const deadline = parseDeadline(
              hackathon.time_left_to_submission || "",
            );

            const event = {
              title: hackathon.title,
              description: hackathon.description || "DevPost hackathon",
              tags: hackathon.themes
                ? hackathon.themes.map((t) => t.name)
                : ["devpost"],
              startDate: parsed.startDate,
              endDate: parsed.endDate,
              deadline: deadline,
              redirectURL: hackathon.url || "https://devpost.com",
              hostedBy: "Devpost",
              verified: true,
              type: "hackathon",
            };
            events.push(event);
          } catch (eventError) {
            console.error(
              "Error processing DevPost event:",
              eventError?.message || eventError,
            );
          }
        }
        page++;
      } catch (pageError) {
        console.error(
          `Error fetching DevPost page ${page}:`,
          pageError?.message || pageError,
        );
        break;
      }
    }
    return events;
  } catch (error) {
    console.error("Error in DevPost scraping:", error?.message || error);
    return [];
  }
}

function parseSubmissionDates(dateString) {
  try {
    if (!dateString) return { startDate: null, endDate: null };
    const parts = dateString.split(" - ");
    if (parts.length !== 2) return { startDate: null, endDate: null };
    const startPart = `${parts[0].trim()}, ${new Date().getFullYear()}`;
    const endPart = `${parts[1].trim()}, ${new Date().getFullYear()}`;
    const startDate = isNaN(new Date(startPart))
      ? null
      : new Date(startPart).toISOString().split("T")[0];
    const endDate = isNaN(new Date(endPart))
      ? null
      : new Date(endPart).toISOString().split("T")[0];
    return { startDate, endDate };
  } catch (err) {
    return { startDate: null, endDate: null };
  }
}

function parseDeadline(deadline) {
  try {
    if (!deadline) return null;
    const daysMatch = deadline.match(/(\d+)\s+days?\s+left/i);
    if (daysMatch) {
      const daysLeft = parseInt(daysMatch[1]);
      const d = new Date();
      d.setDate(d.getDate() + daysLeft);
      return d.toISOString().split("T")[0];
    }
    return null;
  } catch (err) {
    return null;
  }
}

export default scrapeDevpost;
