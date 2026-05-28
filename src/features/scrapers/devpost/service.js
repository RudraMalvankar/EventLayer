import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeDevpost() {
  try {
    const baseURL = process.env.DEVPOST_API;
    
    // Always attempt HTML scraping if API is not available or as a fallback
    try {
      const resp = await axios.get("https://devpost.com/hackathons", {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        },
      });
      const $ = cheerio.load(resp.data || "");
      const items = [];
      
      $(".hackathon-tile, .featured-hackathon-tile").each((_, el) => {
        const $el = $(el);
        const title = $el.find("h3, h2").text().trim();
        const url = $el.find("a").attr("href") || "";
        const banner = $el.find("img").attr("src") || "";
        const description = $el.find(".tagline, .description").text().trim();
        const dateStr = $el.find(".submission-period, .date-range").text().trim();
        
        if (title && url) {
          const { startDate, endDate } = parseSubmissionDates(dateStr);
          items.push({
            title,
            description: description || title,
            url: url.startsWith("http") ? url : `https://devpost.com${url}`,
            banner_url: banner,
            start_date: startDate,
            end_date: endDate,
            platform: "devpost",
            organizer: "Devpost",
            is_free: true,
            category: "hackathon"
          });
        }
      });

      if (items.length > 0) return items;
    } catch (e) {
      console.error("Devpost HTML fallback failed:", e.message);
    }

    if (!baseURL) return [];

    let page = 1;
    const maxPages = 2;
    const events = [];

    while (page <= maxPages) {
      try {
        const response = await axios.get(`${baseURL}?page=${page}`);
        if (!response.data || !response.data.hackathons) break;

        const data = response.data.hackathons;
        if (!Array.isArray(data) || data.length === 0) break;

        for (const hackathon of data) {
          const submissionDates = hackathon.submission_period_dates || "";
          const parsed = parseSubmissionDates(submissionDates);
          
          events.push({
            title: hackathon.title,
            description: hackathon.description || hackathon.tagline || "DevPost hackathon",
            url: hackathon.url || "https://devpost.com",
            banner_url: hackathon.thumbnail_url || hackathon.large_gallery_url,
            start_date: parsed.startDate,
            end_date: parsed.endDate,
            platform: "devpost",
            organizer: hackathon.organization_name || "Devpost",
            is_free: true,
            category: "hackathon"
          });
        }
        page++;
      } catch (pageError) {
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
    const clean = dateString.replace(/\s+/g, ' ').trim();
    const parts = clean.split(" - ");
    
    const currentYear = new Date().getFullYear();
    
    if (parts.length === 2) {
      const start = new Date(`${parts[0].trim()}, ${currentYear}`);
      const end = new Date(`${parts[1].trim()}, ${currentYear}`);
      
      return {
        startDate: !isNaN(start.getTime()) ? start.toISOString() : null,
        endDate: !isNaN(end.getTime()) ? end.toISOString() : null
      };
    }
    
    const single = new Date(`${clean}, ${currentYear}`);
    if (!isNaN(single.getTime())) {
      return { startDate: single.toISOString(), endDate: null };
    }
    
    return { startDate: null, endDate: null };
  } catch (err) {
    return { startDate: null, endDate: null };
  }
}

export default scrapeDevpost;
