import { supabaseAdmin } from "../../../src/shared/clients/supabase.js";
import { requireAuth } from "../../../src/features/auth/service.js";
import { isMissingTableError } from "../../../src/shared/db/errors.js";
import { getSiteOrigin } from "../../../src/shared/config/siteUrl.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendWelcomeEmail(email, city) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "no_provider" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "EventLayer <onboarding@eventlayer.dev>",
        to: [email],
        subject: "You're subscribed to EventLayer alerts",
        html: `<p>You'll get weekly digests and event alerts for <strong>${city}</strong>.</p><p><a href="${getSiteOrigin()}/digest">View your digest</a></p>`,
      }),
    });
    return { sent: res.ok, reason: res.ok ? "resend" : "resend_error" };
  } catch {
    return { sent: false, reason: "resend_failed" };
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const city = String(body.city || "Mumbai").trim();

    if (!EMAIL_RE.test(email)) {
      return Response.json({ data: null, error: "Valid email required" }, { status: 400 });
    }

    let userId = null;
    try {
      const { user } = await requireAuth(request);
      userId = user?.id || null;
    } catch {
      // anonymous subscribe is allowed
    }

    const row = {
      email,
      user_id: userId,
      city,
      weekly_digest: body.weekly_digest !== false,
      event_alerts: body.event_alerts !== false,
      community_alerts: body.community_alerts !== false,
      unsubscribed_at: null,
    };

    const { error } = await supabaseAdmin
      .from("email_subscribers")
      .upsert(row, { onConflict: "email" });

    if (error) {
      if (isMissingTableError(error)) {
        return Response.json({
          data: { subscribed: true, offline: true },
          error: null,
        });
      }
      return Response.json({ data: null, error: error.message }, { status: 500 });
    }

    if (userId) {
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, digest_enabled: true }, { onConflict: "id" });
    }

    const mail = await sendWelcomeEmail(email, city);

    return Response.json({
      data: { subscribed: true, email, city, mail_sent: mail.sent },
      error: null,
    });
  } catch {
    return Response.json({ data: null, error: "Subscribe failed" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return Response.json({ data: null, error: "Valid email required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("email_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("email", email);

    if (error && !isMissingTableError(error)) {
      return Response.json({ data: null, error: error.message }, { status: 500 });
    }

    return Response.json({ data: { unsubscribed: true }, error: null });
  } catch {
    return Response.json({ data: null, error: "Unsubscribe failed" }, { status: 500 });
  }
}
