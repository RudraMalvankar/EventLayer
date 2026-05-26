import * as cheerio from 'cheerio'

function absoluteUrl(href, base) {
  try {
    return new URL(href, base).href
  } catch {
    return ''
  }
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function stripUrls(value) {
  return String(value || '').replace(/https?:\/\/\S+/gi, '').trim()
}

function cleanAboutText(value) {
  const text = normalizeText(value)
  if (!text) return ''
  return stripUrls(
    text
      .replace(/Speakers?:/gi, '')
      .replace(/Ticket link:?/gi, '')
      .replace(/Location:?/gi, '')
  )
}

function flattenJsonLd(value, results = []) {
  if (!value) return results
  if (Array.isArray(value)) {
    value.forEach((item) => flattenJsonLd(item, results))
    return results
  }
  if (typeof value === 'object') {
    if (value['@graph']) flattenJsonLd(value['@graph'], results)
    results.push(value)
  }
  return results
}

function extractJsonLd($) {
  const items = []
  $("script[type='application/ld+json']").each((_, element) => {
    const text = $(element).text().trim()
    if (!text) return
    try {
      const parsed = JSON.parse(text)
      flattenJsonLd(parsed, items)
    } catch {
      // ignore invalid structured data
    }
  })
  return items
}

function getOrganizer(eventLike) {
  const organizer = eventLike?.organizer
  if (!organizer) return ''
  if (Array.isArray(organizer)) {
    const names = organizer.map((item) => item?.name).filter(Boolean)
    return names.join(', ')
  }
  return organizer?.name || ''
}

function getLocation(eventLike) {
  const location = eventLike?.location || {}
  const address = location?.address || {}
  return {
    city: address?.addressLocality || location?.name || '',
    country: address?.addressCountry || '',
    detail: normalizeText(address?.streetAddress || address?.addressRegion || location?.name || '')
  }
}

function collectSectionText($, labelRegex) {
  const heading = $('h1,h2,h3,h4,div,p,strong,span').filter((_, el) => labelRegex.test(normalizeText($(el).text()))).first()
  if (!heading.length) return ''
  const container = heading.closest('section,div')
  if (!container.length) return ''
  const paragraphs = container.find('p,li').map((_, el) => normalizeText($(el).text())).get()
  const cleaned = paragraphs.filter((text) => text && !labelRegex.test(text))
  return cleanAboutText(cleaned.join(' ')).slice(0, 1200)
}

function collectNamesFromJsonLd(eventLike, field) {
  const value = eventLike?.[field]
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item?.name || item)).filter(Boolean)
  }
  return [normalizeText(value?.name || value)].filter(Boolean)
}

function findTicketLink($) {
  const link = $('a[href]').filter((_, el) => {
    const href = $(el).attr('href') || ''
    const text = normalizeText($(el).text())
    return /ticket|register|rsvp/i.test(text) || /ticket|register|rsvp/i.test(href)
  }).first()
  if (!link.length) return { url: '', label: '' }
  return { url: link.attr('href') || '', label: normalizeText(link.text()) }
}

function findRegistrationStatus($) {
  const pageText = normalizeText($('body').text())
  if (/sold out/i.test(pageText)) return 'Sold out'
  if (/registration closed/i.test(pageText)) return 'Registration closed'
  if (/waitlist/i.test(pageText)) return 'Waitlist'
  return 'Open'
}

export async function fetchEventDetails(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('fetch failed ' + res.status)
    const html = await res.text()
    const $ = cheerio.load(html)
    const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || ''
    const ogDesc =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      ''
    const ogImage =
      $('meta[property="og:image"]').attr('content') ||
      $('link[rel="image_src"]').attr('href') ||
      ''
    const metaStart =
      $('meta[property="event:start_time"]').attr('content') ||
      $('meta[property="event:start_date"]').attr('content') ||
      $('meta[name="start_date"]').attr('content') ||
      $('meta[itemprop="startDate"]').attr('content') ||
      ''
    const metaEnd =
      $('meta[property="event:end_time"]').attr('content') ||
      $('meta[property="event:end_date"]').attr('content') ||
      $('meta[name="end_date"]').attr('content') ||
      $('meta[itemprop="endDate"]').attr('content') ||
      ''
    const h1 = $('h1').first().text().trim() || ''
    const structured = extractJsonLd($)
    const eventLike =
      structured.find((item) => {
        const type = item?.['@type']
        return type === 'Event' || (Array.isArray(type) && type.includes('Event')) || item?.startDate || item?.endDate
      }) || {}

    const location = getLocation(eventLike)
    const organizer = getOrganizer(eventLike)
    const aboutText = collectSectionText($, /about event|about/i)
    const hosts = collectNamesFromJsonLd(eventLike, 'organizer')
    const speakers = collectNamesFromJsonLd(eventLike, 'performer')
    const ticket = findTicketLink($)
    const registrationStatus = findRegistrationStatus($)

    return {
      title: (ogTitle || h1 || '').trim(),
      description: (ogDesc || '').trim(),
      banner_url: ogImage ? absoluteUrl(ogImage, url) : null,
      start_date: parseDate(eventLike.startDate || metaStart),
      end_date: parseDate(eventLike.endDate || metaEnd),
      organizer,
      city: location.city,
      country: location.country,
      location_detail: location.detail,
      about: aboutText,
      hosts,
      speakers,
      registration_status: registrationStatus,
      ticket_url: ticket.url ? absoluteUrl(ticket.url, url) : '',
      ticket_label: ticket.label
    }
  } catch {
    return {
      title: '',
      description: '',
      banner_url: null,
      start_date: null,
      end_date: null,
      organizer: '',
      city: '',
      country: '',
      location_detail: '',
      about: '',
      hosts: [],
      speakers: [],
      registration_status: '',
      ticket_url: '',
      ticket_label: ''
    }
  }
}
