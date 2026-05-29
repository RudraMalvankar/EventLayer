import { env } from '../../../src/shared/config/env'
import { scrapeByPlatform } from '../../../src/features/scrapers/service'
import { upsertEventsService } from '../../../src/features/events/service'
import enrichWithGemini from '../../../src/features/scrapers/enrichWithGemini.js'

export async function POST(request) {
  const key = request.headers.get('x-scrape-key')
  if (!env.scrapeSecret || key !== env.scrapeSecret) {
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { platform, events, error: scrapeError } = await scrapeByPlatform('luma')
  if (scrapeError) return Response.json({ data: null, error: scrapeError }, { status: 400 })
  // Optionally enrich events with Gemini before upsert
  let enrichedEvents = events
  try {
    if (env.geminiApiKey && env.enrichWithGemini && Array.isArray(events) && events.length) {
      enrichedEvents = []
      for (const ev of events) {
        try {
          const rawText = ev.description || `${ev.title || ''} ${ev.description || ''}`
          const merged = await enrichWithGemini(ev, rawText, { upsert: false })
          enrichedEvents.push(merged || ev)
        } catch (e) {
          enrichedEvents.push(ev)
        }
      }
    }
  } catch (e) {
    console.error('Enrichment process failed:', e?.message || e)
    enrichedEvents = events
  }

  const { data, error } = await upsertEventsService(enrichedEvents)
  return Response.json({ data: { count: events.length, platform, ...data }, error })
}

