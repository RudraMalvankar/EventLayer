import { generateText } from '../../shared/clients/gemini'

function safeJsonParse(text, fallback) {
  try {
    if (!text) return fallback
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

export async function parseSearchQuery(query) {
  const system =
    "You are a search parser for a tech event platform. Return ONLY JSON: { city: string|null, country: string|null, category: string|null, tags: string[], mode: 'online'|'offline'|null, is_free: boolean|null, date_range: 'today'|'this_week'|'this_weekend'|'this_month'|null, keyword: string|null }"
  const text = await generateText(system, query)
  return safeJsonParse(text, {})
}

export async function autoTagEvent(title, description) {
  const system =
    'Return ONLY JSON: { category: string, tags: string[] }. Category in hackathon/meetup/workshop/conference/webinar/competition and tags 3-7.'
  const text = await generateText(system, `${title}\n\n${description}`)
  const parsed = safeJsonParse(text, {})
  return {
    category: parsed.category || 'meetup',
    tags: Array.isArray(parsed.tags) ? parsed.tags : []
  }
}

export async function generateSummary(title, description) {
  const system =
    'Write a concise 2-3 line AI summary for a tech event card. Rewrite the event into fresh language instead of copying the source description. Keep it specific, readable, and under 240 characters. Mention the event vibe, audience, and purpose if available. Avoid repeating the exact sentence structure or key phrases from the source. Do not use bullets, markdown, quotes, or the exact wording of the source text.'
  const text = await generateText(system, `${title}\n\n${description || ''}`)
  return (text || '').replace(/\s+/g, ' ').trim().slice(0, 240)
}

export function dateRangeToFilter(date_range) {
  if (!date_range) return null
  const now = new Date()
  const from = new Date(now)
  const to = new Date(now)
  if (date_range === 'today') {
    to.setHours(23, 59, 59, 999)
  } else if (date_range === 'this_week') {
    to.setDate(now.getDate() + 7)
  } else if (date_range === 'this_weekend') {
    const day = now.getDay()
    const daysToSat = (6 - day + 7) % 7
    from.setDate(now.getDate() + daysToSat)
    to.setDate(from.getDate() + 1)
    to.setHours(23, 59, 59, 999)
  } else if (date_range === 'this_month') {
    to.setDate(now.getDate() + 30)
  } else {
    return null
  }
  return { from: from.toISOString(), to: to.toISOString() }
}

