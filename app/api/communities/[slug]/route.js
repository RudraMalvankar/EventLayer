import { getCommunityEventsService } from "../../../../src/features/communities/service.js";

export async function GET(_request, { params }) {
  const slug = String(params?.slug || "").trim();
  if (!slug) {
    return Response.json({ data: null, error: "slug is required" }, { status: 400 });
  }
  const { data, error } = await getCommunityEventsService(slug);
  if (error === "Community not found") {
    return Response.json({ data: null, error }, { status: 404 });
  }
  return Response.json({ data, error });
}
