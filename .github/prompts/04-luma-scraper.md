# Stage 04: Luma Scraper

## Purpose
Ingest future events from Luma public endpoints and normalize them for DB upsert.

## Inputs/Dependencies
- Depends on Stage 03 (`normalizeEvent`).
- Uses public Luma APIs.

## Required Outputs
Create `/lib/scrapers/luma.js` with:
- Exported async function `scrapeLuma()`.
- Fetch from:
  - `https://api.lu.ma/public/v1/calendar/list-events?pagination_limit=50`
  - `https://api.lu.ma/public/v1/event/search?query=hackathon+mumbai`
- Include `User-Agent: TechPulse/1.0`.
- Parse event entries and extract source fields needed for normalization:
  - title, description, url, start/end, cover, location, timezone, organizer, price/free info.
- Normalize each record via `normalizeEvent(rawEvent, "luma")`.
- Filter out null normalized entries.
- Return normalized array; return `[]` on fetch/parse failure.

## Constraints
- JavaScript only, async/await.
- Keep API schema adapter logic local to this file.

## Acceptance Checks
- Scraper returns canonical event objects.
- Network or schema errors do not crash callers.
- Invalid records are excluded.
