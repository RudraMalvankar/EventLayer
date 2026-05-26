# TechPulse Prompt Orchestrator Pack

Use this file as the single `/goal` instruction source for Codex/Copilot.

## /goal
Build TechPulse end-to-end as a production-ready Next.js 14 App Router application for unified tech event discovery.

Global requirements:
- JavaScript only. No TypeScript.
- Keep runtime-safe error handling. Do not leak stack traces in API responses.
- Use consistent response envelopes: `{ data, error }`.
- Prefer reusable helpers in `/lib` over duplicating query logic in routes.
- Keep event fields consistent across DB, scrapers, AI parsing, API routes, and UI.

Canonical event fields:
- `title`, `description`, `platform`, `city`, `country`, `mode`, `category`, `tags`
- `banner_url`, `event_url`, `start_date`, `end_date`, `organizer`, `is_free`

Canonical API/contract rules:
- DB helpers return `{ data, error }`.
- `parseSearchQuery()` returns structured filters JSON shape used by `searchEvents()`.
- API routes always return `{ data, error }`.
- Scrapers output normalized event objects compatible with DB upsert.

## Stage Execution Order
Run stages in this exact order:
1. `01-supabase-schema.md`
2. `02-supabase-client.md`
3. `03-normalizer.md`
4. `04-luma-scraper.md`
5. `05-devfolio-scraper.md`
6. `06-ai-search.md`
7. `07-api-routes.md`
8. `08-components.md`
9. `09-pages.md`
10. `10-env-setup.md`

## Stage Cards

### Stage 01: Database Foundation
- Prompt file: `01-supabase-schema.md`
- Output: Supabase SQL schema with indexes, RLS, and seed data.
- Done when:
  - `events`, `profiles`, `saved_events` exist with required constraints.
  - RLS policies match ownership/public-read requirements.
  - search and filter indexes are present.

### Stage 02: Core Clients and Auth Helpers
- Prompt file: `02-supabase-client.md`
- Output: `/lib/supabase.js`, `/lib/openai.js`.
- Done when:
  - singleton clients are implemented.
  - auth/session helpers are available for API usage.

### Stage 03-05: Ingestion Pipeline
- Prompt files: `03-normalizer.md`, `04-luma-scraper.md`, `05-devfolio-scraper.md`
- Output: normalization + scraper modules.
- Done when:
  - normalizer maps source-specific fields into canonical event shape.
  - scrapers call `normalizeEvent()` and return clean arrays.
  - invalid or malformed records are safely dropped.

### Stage 06: AI Search Layer
- Prompt file: `06-ai-search.md`
- Output: `/lib/ai.js` utilities for parsing, tagging, summarizing, date-range conversion.
- Done when:
  - JSON parsing is strict and safe.
  - fallback defaults are returned on every failure path.

### Stage 07: API Layer
- Prompt file: `07-api-routes.md`
- Output: all route handlers under `/app/api`.
- Done when:
  - routes use shared helpers instead of raw SQL.
  - auth-protected routes enforce user identity.
  - all responses follow `{ data, error }`.

### Stage 08-09: UI and Pages
- Prompt files: `08-components.md`, `09-pages.md`
- Output: core components and App Router pages.
- Done when:
  - data flows cleanly between filters/search and APIs.
  - loading and empty states are present.
  - saved events flow works with auth-aware UX.

### Stage 10: Environment and Bootstrap
- Prompt file: `10-env-setup.md`
- Output: local setup commands, env shape, and build order.
- Done when:
  - dependencies install cleanly.
  - env keys and folder structure are complete.

## Parallelization Guidance
Sequential only:
- 01 -> 02 -> 03

Can run in parallel after Stage 03:
- Stage 04 and Stage 05

Can run in parallel after Stage 02:
- Stage 06 can start once `/lib/openai.js` exists.

Must wait for dependencies:
- Stage 07 waits for 02, 03, 04, 05, 06.
- Stage 08 can begin before 07 with mocked data, but final integration waits for 07.
- Stage 09 waits for 07 and 08.

## If Blocked
- If external API schema changes (Luma/Devfolio), keep adapter logic isolated in scraper modules and continue using canonical normalizer output.
- If AI output is non-JSON, return safe defaults and continue request handling.
- If auth/session checks fail, return clear 401/403 envelopes without internal details.

## Final Integration Checklist
- Copy/paste each stage prompt without encoding artifacts.
- Verify shared field names are consistent (`event_url`, `is_free`, `mode`, `category`).
- Verify helper contracts align (`parseSearchQuery` -> `searchEvents`, auth helpers -> saved routes).
- Verify every implemented API route and helper returns `{ data, error }`.
