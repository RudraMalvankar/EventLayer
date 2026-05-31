import { generateText, isGeminiConfigured } from "../../shared/clients/gemini.js";
import { env } from "../../shared/config/env.js";

function extractJsonObject(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // markdown code block
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        return null;
      }
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Rule-based parser when Gemini is off or fails */
export function parseSearchQueryFallback(query) {
  const q = String(query || "").toLowerCase();
  const filters = { keyword: String(query || "").trim() || null };

  if (/\bmumbai\b|\bbombay\b/.test(q)) filters.city = "Mumbai";
  if (/\bpune\b/.test(q)) filters.city = "Pune";
  if (/\bbangalore\b|\bbengaluru\b/.test(q)) filters.city = "Bangalore";
  if (/\bdelhi\b|\bncr\b|\bgurgaon\b|\bnoida\b/.test(q)) filters.city = "Delhi";

  if (/\bhackathon\b/.test(q)) filters.category = "hackathon";
  else if (/\bmeetup\b/.test(q)) filters.category = "meetup";
  else if (/\bworkshop\b/.test(q)) filters.category = "workshop";
  else if (/\bconference\b/.test(q)) filters.category = "conference";

  if (/\bfree\b/.test(q)) filters.is_free = true;
  if (/\bonline\b|\bvirtual\b/.test(q)) filters.mode = "online";
  if (/\boffline\b|\bin[- ]?person\b/.test(q)) filters.mode = "offline";

  if (/\btoday\b/.test(q)) filters.date_range = "today";
  else if (/\bweekend\b/.test(q)) filters.date_range = "this_weekend";
  else if (/\bthis week\b|\bnext week\b/.test(q)) filters.date_range = "this_week";
  else if (/\bthis month\b/.test(q)) filters.date_range = "this_month";

  const tags = [];
  if (/\bai\b|\bml\b|\bgenai\b|\bllm\b/.test(q)) tags.push("ai");
  if (/\breact\b|\bjavascript\b|\bjs\b/.test(q)) tags.push("javascript");
  if (/\bandroid\b|\bflutter\b/.test(q)) tags.push("android");
  if (/\bcloud\b|\bgcp\b|\baws\b/.test(q)) tags.push("cloud");
  if (/\bstartup\b|\bfounder\b/.test(q)) tags.push("startups");
  if (tags.length) filters.tags = tags;

  return filters;
}

function simplifyKeyword(value = "") {
  const text = String(value || "").toLowerCase().trim();
  if (!text) return null;

  const stop = new Set([
    "event",
    "events",
    "in",
    "at",
    "for",
    "this",
    "next",
    "near",
    "around",
    "show",
    "find",
    "free",
    "online",
    "offline",
    "mumbai",
    "pune",
    "bangalore",
    "bengaluru",
    "delhi",
  ]);

  const tokens = text
    .split(/[^a-z0-9+]+/)
    .filter(Boolean)
    .filter((t) => !stop.has(t));

  if (!tokens.length) return null;
  // Keep top 2-3 meaningful tokens so DB ilike can match.
  return tokens.slice(0, 3).join(" ");
}

export async function parseSearchQuery(query) {
  const fallback = parseSearchQueryFallback(query);

  if (!isGeminiConfigured()) {
    return { ...fallback, _source: "rules" };
  }

  const system = `You parse natural-language search queries for a tech events app in India.
Return ONLY valid JSON (no markdown) with this shape:
{
  "city": string|null,
  "country": string|null,
  "category": "hackathon"|"meetup"|"workshop"|"conference"|"webinar"|"competition"|null,
  "tags": string[],
  "mode": "online"|"offline"|"hybrid"|null,
  "is_free": boolean|null,
  "date_range": "today"|"this_week"|"this_weekend"|"this_month"|null,
  "keyword": string|null
}
Use city "Mumbai" when user says Mumbai. Put leftover intent in keyword.`;

  const text = await generateText(system, query, { json: true });
  const parsed = extractJsonObject(text);
  if (!parsed || typeof parsed !== "object") {
    return { ...fallback, _source: "rules" };
  }

  return {
    city: parsed.city ?? fallback.city ?? null,
    country: parsed.country ?? null,
    category: parsed.category ?? fallback.category ?? null,
    tags: Array.isArray(parsed.tags)
      ? parsed.tags
      : fallback.tags || [],
    mode: parsed.mode ?? fallback.mode ?? null,
    is_free:
      typeof parsed.is_free === "boolean"
        ? parsed.is_free
        : fallback.is_free ?? null,
    date_range: parsed.date_range ?? fallback.date_range ?? null,
    keyword: parsed.keyword ?? fallback.keyword ?? null,
    _source: "gemini",
  };
}

export async function describeSearchFilters(query, filters, resultCount) {
  if (!isGeminiConfigured()) {
    const parts = [];
    if (filters.city) parts.push(filters.city);
    if (filters.category) parts.push(filters.category);
    if (filters.date_range) parts.push(filters.date_range.replace(/_/g, " "));
    return parts.length
      ? `Showing ${resultCount} events for ${parts.join(", ")}.`
      : `Found ${resultCount} events matching your search.`;
  }

  const text = await generateText(
    "Write one friendly sentence (max 120 chars) explaining what events were found. No markdown.",
    `Query: ${query}\nFilters: ${JSON.stringify(filters)}\nCount: ${resultCount}`,
  );
  return text || `Found ${resultCount} matching events.`;
}

export async function autoTagEvent(title, description) {
  const system =
    "Return ONLY JSON: { category: string, tags: string[] }. Category in hackathon/meetup/workshop/conference/webinar/competition and tags 3-7.";
  const text = await generateText(system, `${title}\n\n${description}`, {
    json: true,
  });
  const parsed = extractJsonObject(text) || {};
  return {
    category: parsed.category || "meetup",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
  };
}

export async function generateSummary(title, description) {
  if (!env.enrichWithGemini) return null;
  const system =
    "Write a concise 2-3 line AI summary for a tech event card. Fresh language, under 240 characters. No bullets or markdown.";
  const text = await generateText(system, `${title}\n\n${description || ""}`);
  return (text || "").replace(/\s+/g, " ").trim().slice(0, 240);
}

export function dateRangeToFilter(date_range) {
  if (!date_range) return null;
  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);
  if (date_range === "today") {
    to.setHours(23, 59, 59, 999);
  } else if (date_range === "this_week") {
    to.setDate(now.getDate() + 7);
  } else if (date_range === "this_weekend") {
    const day = now.getDay();
    const daysToSat = (6 - day + 7) % 7;
    from.setDate(now.getDate() + daysToSat);
    to.setDate(from.getDate() + 1);
    to.setHours(23, 59, 59, 999);
  } else if (date_range === "this_month") {
    to.setDate(now.getDate() + 30);
  } else {
    return null;
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

export async function runAiSearch(query) {
  const filters = await parseSearchQuery(query);
  const range = dateRangeToFilter(filters?.date_range);
  const merged = {
    ...filters,
    keyword: simplifyKeyword(filters?.keyword) || filters?.keyword || null,
    ...(range ? { start_from: range.from, start_to: range.to } : {}),
  };
  delete merged.date_range;
  delete merged._source;

  const { searchEventsService } = await import("../events/service.js");
  const first = await searchEventsService(merged);

  let events = first.data?.events || [];
  let error = first.error;
  let applied = merged;

  // Retry with relaxed filters if first pass finds nothing.
  if (!error && events.length === 0) {
    const relaxed = {
      ...merged,
      category: undefined,
      mode: undefined,
      is_free: undefined,
      start_from: undefined,
      start_to: undefined,
      tags: undefined,
      keyword:
        simplifyKeyword(String(filters?.keyword || "").replace(/\b(js)\b/gi, "javascript")) ||
        simplifyKeyword(filters?.keyword) ||
        null,
    };

    const second = await searchEventsService(relaxed);
    if (!second.error && (second.data?.events || []).length > 0) {
      events = second.data.events;
      applied = relaxed;
    } else if (!second.error) {
      const broad = {
        keyword: relaxed.keyword || null,
        limit: 48,
        upcomingOnly: true,
      };
      const third = await searchEventsService(broad);
      if (!third.error && (third.data?.events || []).length > 0) {
        events = third.data.events;
        applied = broad;
      }
    }
  }

  const summary = await describeSearchFilters(query, applied, events.length);

  return {
    events,
    filters_applied: applied,
    ai_summary: summary,
    parser: filters._source || "rules",
    error,
  };
}
