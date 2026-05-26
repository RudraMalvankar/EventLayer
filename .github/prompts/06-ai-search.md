# Stage 06: AI Search and Enrichment

## Purpose
Implement AI utilities for natural-language search parsing, tagging, summarization, and date-range conversion.

## Inputs/Dependencies
- Depends on Stage 02 (`/lib/openai.js`).
- Filters output must be consumable by `searchEvents()` and API search routes.

## Required Outputs
Create `/lib/ai.js` with:
- Async `parseSearchQuery(userQuery)`:
  - Prompt model to return only valid JSON with shape:
    - `city: string|null`
    - `country: string|null`
    - `category: string|null`
    - `tags: string[]`
    - `mode: 'online'|'offline'|null`
    - `is_free: boolean|null`
    - `date_range: 'today'|'this_week'|'this_weekend'|'this_month'|null`
    - `keyword: string|null`
  - Parse safely; return `{}` on failure.
- Async `autoTagEvent(title, description)`:
  - Return `{ category, tags }`.
  - Category constrained to:
    - `hackathon`, `meetup`, `workshop`, `conference`, `webinar`, `competition`
- Async `generateSummary(title, description)`:
  - Return one-sentence summary, max 100 characters.
- `dateRangeToFilter(date_range)`:
  - Convert supported ranges into `{ from, to }` ISO bounds.
  - Return `null` for missing/invalid values.

## Constraints
- JavaScript only.
- Never throw; always return safe defaults.

## Acceptance Checks
- Parser output is stable JSON for route usage.
- Bad model output cannot break request flow.
- Date-range helper integrates cleanly with DB filter logic.
