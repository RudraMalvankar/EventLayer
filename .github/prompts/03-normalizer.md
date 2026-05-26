# Stage 03: Event Normalizer

## Purpose
Normalize source-specific event payloads into a single canonical event schema for storage and API use.

## Inputs/Dependencies
- Depends on canonical event fields from `CODEX-MASTER.md`.
- Platforms supported: `luma`, `devfolio`, `unstop`.

## Required Outputs
Create `/lib/normalizer.js` with:
- Exported function `normalizeEvent(rawEvent, platform)`.
- Platform-aware field extraction for all supported sources.
- Output shape:
  - `title`, `description`, `platform`, `city`, `country`, `mode`, `category`, `tags`
  - `banner_url`, `event_url`, `start_date`, `end_date`, `organizer`, `is_free`
- Mode detection:
  - if "online" appears in title/description -> `online`
  - if city exists and no online mention -> `offline`
  - otherwise -> `hybrid`
- Category detection by keywords:
  - `hackathon`, `meetup`, `workshop`, `conference`, `webinar`, `competition`
- Tags:
  - use source tags when available
  - fallback to title keyword extraction (for example AI, Web3, Cloud, React)
- `is_free`:
  - true for price `0`, null, or "free"
  - false otherwise
- Sanitize strings:
  - trim
  - strip HTML
  - description max 500 chars
- Return `null` for invalid records (missing title or `event_url`).

## Constraints
- JavaScript only.
- Keep output directly compatible with DB upsert and API responses.

## Acceptance Checks
- Mixed source payloads are normalized to consistent keys.
- Invalid records are dropped safely.
- No exceptions leak to callers for malformed raw input.
