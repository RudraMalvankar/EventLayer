import { getEventByIdService } from "../../../../src/features/events/service";

export async function GET(_request, { params }) {
  const id = params?.id;
  if (!id) {
    return Response.json({ data: null, error: "Missing event id" });
  }
  const { data, error } = await getEventByIdService(id);
  return Response.json({ data, error });
}
