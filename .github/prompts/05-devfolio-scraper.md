# Stage 05: Devfolio Scraper

## Purpose
Scrape public Devfolio hackathon listings and normalize them into canonical event objects.

## Inputs/Dependencies
- Depends on Stage 03 (`normalizeEvent`).
- Uses `node-fetch` + `cheerio`.

## Required Outputs
Create `/lib/scrapers/devfolio.js` with:
- Exported async function `scrapeDevfolio()`.
- Fetch target page: `https://devfolio.co/hackathons`.
- Parse listing cards and extract:
  - title, URL, description/tagline, banner image, start date, end date, organizer, prize pool or extra metadata.
- Build full URLs where needed.
- Default mode to `online` unless clear location text indicates otherwise.
- Normalize via `normalizeEvent(rawEvent, "devfolio")`.
- Filter null entries.
- Return normalized array; return `[]` on errors.
- Add a respectful 1 second delay between multi-request steps if needed.

## Constraints
- JavaScript only.
- No Playwright.
- Keep selectors and parsing resilient to minor DOM changes.

## Acceptance Checks
- Output records match canonical schema.
- Scraper handles HTML/network parse failures gracefully.
- Upstream callers can pass output directly to DB upsert.
