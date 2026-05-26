# Stage 07: API Routes

## Purpose
Create all TechPulse API route handlers for events, AI search, scraping triggers, saved events, and auth.

## Inputs/Dependencies
- Depends on Stages 02-06.
- Prefer helpers from `/lib/db.js`, `/lib/ai.js`, and `/lib/supabase.js`.

## Required Outputs
Create these routes under `/app/api`:
- `/events/route.js` (`GET`):
  - query params: `city`, `category`, `mode`, `is_free`, `platform`, `search`, `page`, `limit`
  - call `getEvents()` from `/lib/db.js`
  - return `{ data: { events, total, page, limit }, error }`
- `/search/route.js` (`POST`):
  - body `{ query }`
  - validate query string
  - call `parseSearchQuery(query)` + `dateRangeToFilter(...)`
  - call `searchEvents(filters)`
  - return `{ data: { events, filters_applied }, error }`
- `/scrape/[platform]/route.js` (`POST`):
  - enforce header secret (`x-scrape-key` against `SCRAPE_SECRET`)
  - platform support: `luma`, `devfolio`, optional `unstop` if implemented
  - run platform scraper + `upsertEvents()`
  - return `{ data: { count or inserted/skipped, platform }, error }`
- `/saved/route.js` (`GET`, `POST`, `DELETE`):
  - all operations require `requireAuth()`
  - GET: return saved events
  - POST/DELETE with `{ event_id }`: toggle or explicit save/unsave behavior
  - return consistent saved state envelopes
- `/auth/route.js` (`POST`):
  - body `{ email, password, action: 'login'|'signup' }`
  - use Supabase auth helpers
  - return `{ data: { user, session } | null, error }`

## Constraints
- JavaScript only.
- Named exports (`GET`, `POST`, `DELETE`).
- No stack traces in responses.
- Keep response shape as `{ data, error }` everywhere.

## Acceptance Checks
- Route dependencies resolve without contract mismatch.
- Unauthorized flows return 401 envelopes.
- Search and scrape routes tolerate downstream failures safely.
