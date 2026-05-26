import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

function absoluteUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return "";
  }
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function flattenJsonLd(value, results = []) {
  if (!value) return results;
  if (Array.isArray(value)) {
    value.forEach((item) => flattenJsonLd(item, results));
    return results;
  }
  if (typeof value === "object") {
    if (value["@graph"]) flattenJsonLd(value["@graph"], results);
    results.push(value);
  }
  return results;
}

function extractJsonLd($) {
  const items = [];
  $("script[type='application/ld+json']").each((_, element) => {
    const text = $(element).text().trim();
    if (!text) return;
    try {
      const parsed = JSON.parse(text);
      flattenJsonLd(parsed, items);
    } catch {
      // ignore invalid structured data
    }
  });
  return items;
}

async function fetchMeta(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
    });
    if (!res.ok) throw new Error("fetch failed " + res.status);
    const html = await res.text();
    const $ = cheerio.load(html);
    const ogTitle =
      $('meta[property="og:title"]').attr("content") || $("title").text() || "";
    const ogDesc =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";
    const ogImage =
      $('meta[property="og:image"]').attr("content") ||
      $('link[rel="image_src"]').attr("href") ||
      "";
    const metaStart =
      $('meta[property="event:start_time"]').attr("content") ||
      $('meta[property="event:start_date"]').attr("content") ||
      $('meta[name="start_date"]').attr("content") ||
      $('meta[itemprop="startDate"]').attr("content") ||
      "";
    const metaEnd =
      $('meta[property="event:end_time"]').attr("content") ||
      $('meta[property="event:end_date"]').attr("content") ||
      $('meta[name="end_date"]').attr("content") ||
      $('meta[itemprop="endDate"]').attr("content") ||
      "";
    const h1 = $("h1").first().text().trim() || "";
    const structured = extractJsonLd($);
    const eventLike = structured.find((item) => {
      const type = item?.["@type"];
      return type === "Event" || (Array.isArray(type) && type.includes("Event")) || item?.startDate || item?.endDate;
    }) || {};
    const location = eventLike.location || {};
    return {
      title: (ogTitle || h1 || "").trim(),
      description: (ogDesc || "").trim(),
      banner_url: ogImage ? absoluteUrl(ogImage, url) : null,
      start_date: parseDate(eventLike.startDate || metaStart),
      end_date: parseDate(eventLike.endDate || metaEnd),
      city: location.addressLocality || location.name || "",
      country: location.addressCountry || "",
    };
  } catch (e) {
    return { title: "", description: "", banner_url: null, start_date: null, end_date: null, city: "", country: "" };
  }
}

async function main() {
  const sb = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY);
  try {
    const toFill = await sb
      .from("events")
      .select("id,event_url,title,description,banner_url,start_date,end_date,city,country")
      .limit(50);
    if (toFill.error) {
      console.error("SELECT ERROR", toFill.error);
      process.exit(1);
    }
    const rows = toFill.data || [];
    console.log("Need update rows:", rows.length);
    for (const row of rows) {
      console.log("Processing", row.event_url);
      const meta = await fetchMeta(row.event_url);
      if (!meta.title && !meta.description && !meta.banner_url) {
        console.log("No meta found, skipping");
        continue;
      }
      const update = {
        event_url: row.event_url,
        title: meta.title || row.title || "",
        description: meta.description || row.description || "",
        banner_url: meta.banner_url || row.banner_url || null,
        start_date: meta.start_date || row.start_date || null,
        end_date: meta.end_date || row.end_date || null,
        city: meta.city || row.city || null,
        country: meta.country || row.country || null,
        platform: "luma",
      };
      const up = await sb
        .from("events")
        .upsert(update, { onConflict: "event_url" });
      if (up.error) {
        console.error("UPSERT ERROR", up.error);
        continue;
      }
      console.log("Updated", update.event_url);
    }
    console.log("Done");
  } catch (e) {
    console.error("EX", e && e.message ? e.message : e);
    process.exit(2);
  }
}

main();
