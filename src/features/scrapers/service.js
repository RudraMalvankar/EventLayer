import { env } from '../../shared/config/env'
import { scrapeLuma } from './luma/service'
import { scrapeDevfolio } from './devfolio/service'

export function resolvePlatform(requestedPlatform) {
  if (!requestedPlatform || requestedPlatform === 'default') return 'luma'
  return requestedPlatform
}

export async function scrapeByPlatform(requestedPlatform) {
  const platform = resolvePlatform(requestedPlatform)
  if (platform === 'luma') {
    return { platform, events: await scrapeLuma(), error: null }
  }
  if (platform === 'devfolio') {
    if (!env.scraperDevfolioEnabled) {
      return { platform, events: [], error: 'Devfolio scraper is disabled. Set SCRAPER_DEVFOLIO_ENABLED=true to enable.' }
    }
    return { platform, events: await scrapeDevfolio(), error: null }
  }
  return { platform, events: [], error: 'Unsupported platform' }
}

