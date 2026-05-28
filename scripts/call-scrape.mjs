import fetch from "node-fetch";
const url = "http://localhost:3002/api/scrape/meetup";
const scrapeKey =
  process.env.SCRAPE_KEY || process.env.SCRAPER_SECRET_KEY || "";
const headers = scrapeKey ? { "x-scrape-key": scrapeKey } : {};
fetch(url, { method: "POST", headers })
  .then((r) => r.json())
  .then((data) => console.log("Response:", data))
  .catch((e) => console.error("Error:", e));
