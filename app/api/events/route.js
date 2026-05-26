import { getEventsService } from '../../../src/features/events/service'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 12)
  const args = {
    city: searchParams.get('city') || undefined,
    category: searchParams.get('category') || undefined,
    mode: searchParams.get('mode') || undefined,
    is_free: searchParams.get('is_free') === null ? undefined : searchParams.get('is_free') === 'true',
    platform: searchParams.get('platform') || undefined,
    keyword: searchParams.get('search') || undefined,
    page,
    limit
  }
  const { data, error } = await getEventsService(args)
  return Response.json({ data: { events: data?.events || [], total: data?.total || 0, page, limit }, error })
}
