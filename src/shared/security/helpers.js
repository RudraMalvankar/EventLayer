import { env } from "../config/env.js";

/** Escape `%` and `_` for safe PostgREST ilike filters. */
export function sanitizeIlike(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .slice(0, 120);
}

export function verifyScrapeSecret(request) {
  const key = request.headers.get("x-scrape-key");
  if (!env.scrapeSecret) {
    return process.env.NODE_ENV === "development";
  }
  return key === env.scrapeSecret;
}

const ALLOWED_ANALYTICS_EVENTS = new Set([
  "page_view",
  "search",
  "save",
  "event_view",
  "community_view",
  "follow",
]);

export function sanitizeAnalyticsPayload(body = {}) {
  const event_type = ALLOWED_ANALYTICS_EVENTS.has(body.event_type)
    ? body.event_type
    : "page_view";
  const metadata =
    body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? Object.fromEntries(Object.entries(body.metadata).slice(0, 20))
      : {};
  return {
    event_type,
    event_id: body.event_id || null,
    metadata,
  };
}
