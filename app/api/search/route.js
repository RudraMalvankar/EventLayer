import { parseSearchQuery, dateRangeToFilter } from '../../../src/features/ai/service'
import { searchEventsService } from '../../../src/features/events/service'

export async function POST(request) {
  try {
    const body = await request.json()
    if (!body?.query || typeof body.query !== 'string') {
      return Response.json({ data: null, error: 'query is required' }, { status: 400 })
    }
    const filters = await parseSearchQuery(body.query)
    const range = dateRangeToFilter(filters?.date_range)
    const merged = { ...filters, ...(range ? { start_from: range.from, start_to: range.to } : {}) }
    const { data, error } = await searchEventsService(merged)
    return Response.json({ data: { events: data?.events || [], filters_applied: merged }, error })
  } catch {
    return Response.json({ data: null, error: 'Invalid request' }, { status: 400 })
  }
}
