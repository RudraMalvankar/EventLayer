import { getTrendingEventsService } from "../../../src/features/events/service";

export async function GET(request) {
  try {
    const { data, error } = await getTrendingEventsService(6);
    return Response.json({ data, error });
  } catch (e) {
    return Response.json(
      { data: null, error: "Failed to fetch trending" },
      { status: 500 },
    );
  }
}
