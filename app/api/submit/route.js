import { supabaseAdmin } from "../../../src/shared/clients/supabase.js";
import { requireAuth } from "../../../src/features/auth/service.js";
import { upsertEventsService } from "../../../src/features/events/service.js";
import { fetchDevfolioEventDetails } from "../../../src/features/scrapers/devfolio/details.js";
import { fetchEventDetails } from "../../../src/features/scrapers/luma/details.js";
import enrichWithGemini from "../../../src/features/scrapers/enrichWithGemini.js";
import {
  detectPlatform,
  normalizeEvent,
} from "../../../src/features/scrapers/normalizer.js";
import { env } from "../../../src/shared/config/env.js";

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchPageText(eventUrl) {
  const res = await fetch(eventUrl, {
    headers: { "User-Agent": "EventLayer/1.0" },
    cache: "no-store",
  });
  if (!res.ok) return { html: "", ok: false };
  return { html: await res.text(), ok: true };
}

function canonicalSubmitUrl(raw) {
  try {
    const u = new URL(String(raw));
    let host = u.hostname.replace(/^www\./, "");
    if (host.endsWith("luma.com")) host = "lu.ma";
    u.hostname = host;
    u.search = "";
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

async function buildEventFromUrl(eventUrl) {
  const canonicalUrl = canonicalSubmitUrl(eventUrl);
  const platform = detectPlatform(canonicalUrl);
  const meta =
    platform === "devfolio"
      ? await fetchDevfolioEventDetails(canonicalUrl)
      : await fetchEventDetails(canonicalUrl);

  const normalized = normalizeEvent(
    {
      title: meta?.title,
      description: meta?.description || meta?.about,
      url: canonicalUrl,
      start_at: meta?.start_date,
      end_at: meta?.end_date,
      cover_url: meta?.banner_url,
      city: meta?.city,
      country: meta?.country,
      host: meta?.organizer,
    },
    platform,
  );

  if (!normalized) return null;

  return {
    ...normalized,
    raw_data: {
      sourcePlatform: platform,
      originalPlatform: platform,
      sourceUrl: canonicalUrl,
    },
  };
}

function shouldEnrichWithGemini() {
  return Boolean(env.geminiApiKey) && env.enrichWithGemini;
}

export async function POST(request) {
  try {
    let user = null;
    try {
      ({ user } = await requireAuth(request));
    } catch (authError) {
      if (authError instanceof Response) return authError;
      throw authError;
    }

    const body = await request.json().catch(() => ({}));
    const eventUrl = String(body?.event_url || body?.url || "").trim();
    const note = String(body?.note || "").trim();

    if (!eventUrl || !isValidUrl(eventUrl)) {
      return Response.json(
        { data: null, error: "Please enter a valid event link." },
        { status: 400 },
      );
    }

    if (!env.supabaseUrl || !env.supabaseServiceKey) {
      return Response.json(
        {
          data: null,
          error:
            "Server database is not configured. Add Supabase keys to .env.local.",
        },
        { status: 503 },
      );
    }

    const submission = {
      event_url: eventUrl,
      note: note || null,
      source: String(body?.source || "submit-page"),
      submitted_at: body?.submitted_at || new Date().toISOString(),
    };

    let eventPayload = await buildEventFromUrl(eventUrl);

    if (shouldEnrichWithGemini() && eventPayload) {
      const { html } = await fetchPageText(eventUrl);
      if (html) {
        const enriched = await enrichWithGemini(eventPayload, html, {
          upsert: false,
        });
        if (enriched) {
          const summary =
            enriched.ai_summary ||
            enriched.description?.slice(0, 400) ||
            eventPayload.raw_data?.ai_summary ||
            null;
          eventPayload = {
            ...enriched,
            raw_data: {
              ...eventPayload.raw_data,
              ...(enriched.raw_data || {}),
              ...(summary ? { ai_summary: summary } : {}),
            },
          };
          delete eventPayload.ai_summary;
        }
      }
    }

    if (!eventPayload?.title || !eventPayload?.event_url) {
      return Response.json(
        {
          data: null,
          error:
            "Could not read event details from that link. Try a Luma, Meetup, or Eventbrite URL.",
        },
        { status: 422 },
      );
    }

    const upsert = await upsertEventsService([eventPayload]);
    if (upsert.error) {
      return Response.json(
        { data: null, error: upsert.error || "Failed to save event." },
        { status: 500 },
      );
    }

    let eventRow = null;
    try {
      const { data, error } = await supabaseAdmin
        .from("events")
        .select("id, title, start_date, event_url, platform")
        .eq("event_url", eventPayload.event_url)
        .maybeSingle();
      if (!error && data) eventRow = data;
    } catch {
      // ignore lookup errors
    }

    const submissionStatus = eventRow?.id ? "added" : "received";

    let submissionRow = null;
    try {
      const payload = {
        ...submission,
        user_id: user?.id,
        user_email: user?.email || null,
        title: eventRow?.title || eventPayload.title,
        status: submissionStatus,
        event_id: eventRow?.id || null,
        raw_data: {
          platform: detectPlatform(eventUrl),
          event: eventPayload,
        },
      };
      const { data, error } = await supabaseAdmin
        .from("event_submissions")
        .insert(payload)
        .select("*")
        .maybeSingle();
      if (!error && data) submissionRow = data;
    } catch {
      // event_submissions table may not exist
    }

    return Response.json({
      data: {
        stored: "supabase",
        status: submissionStatus,
        submission: submissionRow || submission,
        event: eventRow || eventPayload,
        event_id: eventRow?.id || null,
        upserted: upsert.data?.inserted ?? 1,
      },
      error: null,
    });
  } catch (err) {
    return Response.json(
      {
        data: null,
        error: err?.message || "Could not submit event link.",
      },
      { status: 500 },
    );
  }
}
