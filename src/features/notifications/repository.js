import { supabaseAdmin } from "../../shared/clients/supabase.js";
import { ok, fail, isMissingTableError } from "../../shared/db/errors.js";

export async function listNotificationsRepo(userId, { limit = 30 } = {}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (isMissingTableError(error)) return ok({ notifications: [], unread: 0 });
      return fail(error.message);
    }
    const notifications = data || [];
    const unread = notifications.filter((n) => !n.read_at).length;
    return ok({ notifications, unread });
  } catch {
    return ok({ notifications: [], unread: 0 });
  }
}

export async function createNotificationRepo(userId, payload) {
  try {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        type: payload.type || "info",
        title: payload.title,
        body: payload.body || null,
        link: payload.link || null,
      })
      .select("*")
      .maybeSingle();
    if (error) {
      if (isMissingTableError(error)) return ok({ notification: null, offline: true });
      return fail(error.message);
    }
    return ok({ notification: data });
  } catch {
    return fail("Failed to create notification");
  }
}

export async function markNotificationsReadRepo(userId, ids = null) {
  try {
    let query = supabaseAdmin
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
    if (Array.isArray(ids) && ids.length) {
      query = query.in("id", ids);
    }
    const { error } = await query;
    if (error) {
      if (isMissingTableError(error)) return ok({ updated: 0 });
      return fail(error.message);
    }
    return ok({ updated: true });
  } catch {
    return fail("Failed to mark notifications read");
  }
}
