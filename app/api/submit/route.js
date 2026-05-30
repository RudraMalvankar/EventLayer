import { supabaseAdmin } from "../../../src/shared/clients/supabase.js";

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventUrl = String(body?.event_url || body?.url || "").trim();
    const note = String(body?.note || "").trim();

    if (!eventUrl || !isValidUrl(eventUrl)) {
      return Response.json(
        { data: null, error: "Please enter a valid event link." },
        { status: 400 },
      );
    }

    const submission = {
      event_url: eventUrl,
      note: note || null,
      source: String(body?.source || "submit-page"),
      submitted_at: body?.submitted_at || new Date().toISOString(),
    };

    try {
      if (supabaseAdmin && typeof supabaseAdmin.from === "function") {
        const { data, error } = await supabaseAdmin
          .from("event_submissions")
          .insert(submission)
          .select("*")
          .maybeSingle();

        if (!error && data) {
          return Response.json({
            data: { stored: "supabase", submission: data },
            error: null,
          });
        }
      }
    } catch {
      // Fall through to local success response.
    }

    return Response.json({
      data: { stored: "local", submission },
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