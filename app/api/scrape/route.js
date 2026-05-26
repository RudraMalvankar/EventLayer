import { env } from '../../../src/shared/config/env'
import { scrapeByPlatform } from '../../../src/features/scrapers/service'
import { upsertEventsService } from '../../../src/features/events/service'

export async function POST(request) {
  const key = request.headers.get('x-scrape-key')
  if (!env.scrapeSecret || key !== env.scrapeSecret) {
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { platform, events, error: scrapeError } = await scrapeByPlatform('luma')
  if (scrapeError) return Response.json({ data: null, error: scrapeError }, { status: 400 })
  const { data, error } = await upsertEventsService(events)
  return Response.json({ data: { count: events.length, platform, ...data }, error })
}

