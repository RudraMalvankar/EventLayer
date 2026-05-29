import { getEventsService } from "../../../src/features/events/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 12);
    const args = {
      city: searchParams.get("city") || undefined,
      category: searchParams.get("category") || undefined,
      mode: searchParams.get("mode") || undefined,
      is_free:
        searchParams.get("is_free") === null
          ? undefined
          : searchParams.get("is_free") === "true",
      platform: searchParams.get("platform") || undefined,
      keyword: searchParams.get("search") || undefined,
      upcomingOnly: searchParams.get("upcomingOnly") !== "false",
      page,
      limit,
    };
    const { data, error } = await getEventsService(args);
    if (error) throw new Error(error);
    return Response.json({
      data: {
        events: data?.events || [],
        total: data?.total || 0,
        page,
        limit,
      },
      error: null,
    });
  } catch (err) {
    console.error("API Events Error:", err.message);
    return Response.json(
      { data: { events: [], total: 0 }, error: err.message },
      { status: 500 },
    );
  }
}
