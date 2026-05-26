const CATEGORIES = ['hackathon', 'meetup', 'workshop', 'conference', 'webinar', 'competition']
const TAG_FALLBACKS = ['ai', 'web3', 'cloud', 'react', 'nextjs', 'ml', 'devops', 'blockchain']

function cleanText(value, max = 500) {
  if (!value) return ''
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

function parseDate(value) {
  if (!value) return null
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  } catch {
    return null
  }
}

function detectMode(title, description, city) {
  const content = `${title} ${description}`.toLowerCase()
  if (content.includes('online') || content.includes('virtual')) return 'online'
  if (city) return 'offline'
  return 'hybrid'
}

function detectCategory(title, description) {
  const content = `${title} ${description}`.toLowerCase()
  return CATEGORIES.find((category) => content.includes(category)) || 'meetup'
}

function detectTags(rawTags, title) {
  const tags = Array.isArray(rawTags) ? rawTags.map((tag) => cleanText(tag, 32).toLowerCase()).filter(Boolean) : []
  if (tags.length) return [...new Set(tags)].slice(0, 8)
  const text = String(title || '').toLowerCase()
  return TAG_FALLBACKS.filter((tag) => text.includes(tag)).slice(0, 8)
}

function isFree(rawPrice) {
  if (rawPrice == null) return true
  const text = String(rawPrice).toLowerCase()
  if (text === 'free' || text === '0' || text === 'null') return true
  return Number(rawPrice) === 0
}

export function normalizeEvent(rawEvent, platform) {
  try {
    const title = cleanText(rawEvent?.title || rawEvent?.name || rawEvent?.event_name, 140)
    const eventUrl = rawEvent?.event_url || rawEvent?.url || rawEvent?.link || rawEvent?.href
    if (!title || !eventUrl) return null
    const description = cleanText(rawEvent?.description || rawEvent?.tagline || rawEvent?.summary || '')
    const city = cleanText(rawEvent?.city || rawEvent?.location?.city || rawEvent?.location || '', 80)
    const country = cleanText(rawEvent?.country || rawEvent?.location?.country || 'India', 80)
    return {
      title,
      description,
      platform,
      city: city || null,
      country: country || null,
      mode: detectMode(title, description, city),
      category: detectCategory(title, description),
      tags: detectTags(rawEvent?.tags, title),
      banner_url: rawEvent?.banner_url || rawEvent?.cover_url || rawEvent?.image || null,
      event_url: eventUrl,
      start_date: parseDate(
        rawEvent?.start_date ||
          rawEvent?.start_at ||
          rawEvent?.starts_at ||
          rawEvent?.startTime ||
          rawEvent?.start_time ||
          rawEvent?.startsOn ||
          rawEvent?.starts_on ||
          null
      ),
      end_date: parseDate(
        rawEvent?.end_date ||
          rawEvent?.end_at ||
          rawEvent?.ends_at ||
          rawEvent?.endTime ||
          rawEvent?.end_time ||
          rawEvent?.endsOn ||
          rawEvent?.ends_on ||
          null
      ),
      organizer: cleanText(rawEvent?.organizer || rawEvent?.host || 'Unknown Organizer', 120),
      is_free: isFree(rawEvent?.price ?? rawEvent?.ticket_price ?? rawEvent?.is_free ?? null)
    }
  } catch {
    return null
  }
}

