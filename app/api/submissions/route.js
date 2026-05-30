import { requireAuth } from "../../../src/features/auth/service";
import { supabaseAdmin } from "../../../src/shared/clients/supabase";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);

    let data = [];
    let error = null;

    try {
      const result = await supabaseAdmin
        .from("event_submissions")
        .select(
          "id, event_id, event_url, title, note, status, submitted_at, reviewed_at, events(*)",
        )
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });
      data = result.data || [];
      error = result.error || null;
    } catch (queryError) {
      error = queryError;
    }

    if (error) {
      const message = String(error?.message || error || "");
      const missingTable =
        error?.code === "42P01" ||
        error?.code === "PGRST205" ||
        message.toLowerCase().includes("does not exist") ||
        message.toLowerCase().includes("could not find");
      if (missingTable) {
        return Response.json({
          data: { submissions: [] },
          error: null,
        });
      }

      return Response.json(
        { data: null, error: error.message },
        { status: 500 },
      );
    }

    return Response.json({
      data: {
        submissions:
          (data || []).map((row) => ({
            id: row.id,
            event_id: row.event_id,
            event_url: row.event_url,
            title: row.title || row.events?.title || row.event_url,
            note: row.note || null,
            status: row.status || (row.event_id ? "added" : "received"),
            submitted_at: row.submitted_at,
            reviewed_at: row.reviewed_at,
            event: row.events || null,
          })) || [],
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { data: null, error: "Unauthorized" },
      { status: 401 },
    );
  }
}
