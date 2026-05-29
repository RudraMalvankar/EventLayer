import fetch from "node-fetch";
// Use SCRAPE_SECRET from environment to avoid committing secrets in source.
const url = "http://localhost:3002/api/scrape/meetup";
const headers = { "x-scrape-key": process.env.SCRAPE_SECRET || "REPLACE_ME" };

if (!process.env.SCRAPE_SECRET) {
  console.error(
    "Warning: SCRAPE_SECRET is not set in the environment. Set it before running this script.",
  );
}

fetch(url, { method: "POST", headers })
  .then((r) => r.json())
  .then((data) => console.log("Response:", data))
  .catch((e) => console.error("Error:", e));
