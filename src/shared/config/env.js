export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  scrapeSecret: process.env.SCRAPE_SECRET || '',
  scraperDevfolioEnabled: (process.env.SCRAPER_DEVFOLIO_ENABLED || 'false').toLowerCase() === 'true',
  scraperUnstopEnabled: (process.env.SCRAPER_UNSTOP_ENABLED || 'false').toLowerCase() === 'true'
}

