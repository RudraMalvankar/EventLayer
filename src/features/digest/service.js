import { supabaseAdmin } from "../../shared/clients/supabase.js";
import { getPersonalizedFeedService } from "../feed/service.js";
import { createNotificationRepo } from "../notifications/repository.js";
import { generateText } from "../../shared/clients/gemini.js";
import { ok, fail, isMissingTableError } from "../../shared/db/errors.js";

function weekStartDate(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function getDigestService(userId) {
  const week_start = weekStartDate();
  try {
    const { data: existing, error } = await supabaseAdmin
      .from("digests")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", week_start)
      .maybeSingle();

    if (error && !isMissingTableError(error)) return fail(error.message);
    if (existing) {
      return ok({
        digest: existing,
        events: existing.events || [],
        summary: existing.summary,
      });
    }

    return generateDigestService(userId);
  } catch {
    return fail("Failed to load digest");
  }
}

export async function generateDigestService(userId) {
  const week_start = weekStartDate();
  const feed = await getPersonalizedFeedService(userId, { limit: 8 });
  if (feed.error) return feed;

  const events = feed.data?.events || [];
  let summary = `Your week ahead: ${events.length} events matched your profile.`;

  try {
    const titles = events.map((e) => e.title).slice(0, 6).join("; ");
    if (titles) {
      const ai = await generateText(
        "Write a friendly 2-sentence weekly tech events digest intro. No markdown.",
        titles,
      );
      if (ai) summary = ai.slice(0, 320);
    }
  } catch {
    // keep default summary
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("digests")
      .upsert(
        {
          user_id: userId,
          week_start,
          summary,
          events: events.map((e) => ({
            id: e.id,
            title: e.title,
            city: e.city,
            start_date: e.start_date,
            platform: e.platform,
          })),
        },
        { onConflict: "user_id,week_start" },
      )
      .select("*")
      .maybeSingle();

    if (error && !isMissingTableError(error)) return fail(error.message);

    await createNotificationRepo(userId, {
      type: "digest",
      title: "Your weekly digest is ready",
      body: summary,
      link: "/digest",
    });

    return ok({
      digest: data || { week_start, summary, events },
      events,
      summary,
    });
  } catch {
    return ok({ digest: { week_start, summary, events }, events, summary });
  }
}
