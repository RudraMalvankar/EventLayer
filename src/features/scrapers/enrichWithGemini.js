import { generateText } from "../../shared/clients/gemini.js";
import { supabaseAdmin } from "../../shared/clients/supabase.js";

/**
 * Call Gemini to extract structured fields from raw event text and
 * merge them into a normalized event object. Optionally upserts into DB.
 *
 * @param {Object} normalizedEvent - event produced by `normalizeEvent()`
 * @param {string} rawText - raw scraped text/HTML for the event
 * @param {Object} options - { upsert: boolean }
 * @returns merged event object or null on failure
 */
export async function enrichWithGemini(
  normalizedEvent,
  rawText,
  options = { upsert: false },
) {
  if (!normalizedEvent || !rawText) return normalizedEvent;

  const systemPrompt = `You are a JSON extractor for event pages. Return ONLY valid JSON (no surrounding text) with the following keys when available:\ntitle (string), start_date (ISO 8601 string or null), end_date (ISO 8601 string or null), city (string or null), tags (array of strings), is_free (true/false), short_description (string).\n\nRules:\n- If a value is unknown, set it to null.\n- Dates should be ISO 8601 (YYYY-MM-DD or full timestamp) when possible.\n- Output compact JSON only.`;

  const userPrompt = `Raw event text:\n\n${String(rawText).slice(0, 4000)}`; // limit input

  try {
    const raw = await generateText(systemPrompt, userPrompt);
    if (!raw) return normalizedEvent;

    // Try to parse raw as JSON; if it contains a JSON block, extract it
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      const m = raw.match(/\{[\s\S]*\}/m);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch (e2) {
          parsed = null;
        }
      }
    }

    if (!parsed || typeof parsed !== "object") return normalizedEvent;

    // Merge parsed fields into normalizedEvent, preferring parsed values when present
    const merged = {
      ...normalizedEvent,
      title: parsed.title || normalizedEvent.title,
      start_date: parsed.start_date || normalizedEvent.start_date,
      end_date: parsed.end_date || normalizedEvent.end_date,
      city: parsed.city || normalizedEvent.city,
      tags:
        Array.isArray(parsed.tags) && parsed.tags.length
          ? parsed.tags
          : normalizedEvent.tags,
      is_free:
        typeof parsed.is_free === "boolean"
          ? parsed.is_free
          : normalizedEvent.is_free,
      description: parsed.short_description || normalizedEvent.description,
    };

    if (
      options.upsert &&
      supabaseAdmin &&
      typeof supabaseAdmin.from === "function"
    ) {
      try {
        await supabaseAdmin
          .from("events")
          .upsert(merged, { onConflict: "event_url" });
      } catch (e) {
        console.error("Enrichment upsert failed:", e.message || e);
      }
    }

    return merged;
  } catch (err) {
    console.error("Enrichment failed:", err.message || err);
    return normalizedEvent;
  }
}

// Keep the old name as an alias for compatibility
export const enrichAndUpsert = enrichWithGemini;
export default enrichWithGemini;
