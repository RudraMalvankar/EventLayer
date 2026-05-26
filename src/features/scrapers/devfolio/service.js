import * as cheerio from 'cheerio'
import { normalizeEvent } from '../normalizer'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function scrapeDevfolio() {
  try {
    const response = await fetch('https://devfolio.co/hackathons', { headers: { 'User-Agent': 'TechPulse/1.0' } })
    if (!response.ok) return []
    const html = await response.text()
    await sleep(1000)
    const $ = cheerio.load(html)
    const events = []
    $('[href*="/hackathons/"], .hackathon-card, .Listing_container__').each((_, element) => {
      const a = $(element).is('a') ? $(element) : $(element).find('a').first()
      const href = a.attr('href')
      const title = $(element).find('h3,h2,.title').first().text().trim() || a.text().trim()
      const description = $(element).find('p,.subtitle,.description').first().text().trim()
      const image = $(element).find('img').first().attr('src')
      const normalized = normalizeEvent(
        {
          title,
          tagline: description,
          url: href?.startsWith('http') ? href : href ? `https://devfolio.co${href}` : null,
          image,
          organizer: 'Devfolio',
          mode: 'online',
          category: 'hackathon'
        },
        'devfolio'
      )
      if (normalized) events.push(normalized)
    })
    return events
  } catch {
    return []
  }
}

