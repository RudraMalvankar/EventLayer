import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if(!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_KEY){
  console.error('Missing SUPABASE env vars')
  process.exit(1)
}

function absoluteUrl(href, base){
  try{ return new URL(href, base).href }catch{return ''}
}
const STATIC_PATHS = new Set(['discover','pricing','help','signin','app','login','home','events'])
function isEventUrl(url){
  try{
    const pathname = new URL(url).pathname.replace(/\/+$/,'')
    const slug = pathname.replace(/^\//,'').toLowerCase()
    return /^\/[a-z0-9]{8}$/i.test(pathname) && !STATIC_PATHS.has(slug)
  }catch{return false}
}

async function scrapeHtml(){
  const url = 'https://luma.com/mumbai'
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' } })
  if(!res.ok) throw new Error('Failed to fetch Luma HTML: ' + res.status)
  const html = await res.text()
  const $ = cheerio.load(html)
  const seen = new Set()
  const events = []
  $('a[href]').each((_, el) => {
    try{
      const href = absoluteUrl($(el).attr('href'), url)
      if(!href || !isEventUrl(href)) return
      if(seen.has(href)) return
      seen.add(href)
      const card = $(el).closest('a,article,div')
      const title = String($(el).text() || card.find('h1,h2,h3').first().text()).replace(/\s+/g,' ').trim()
      const rawText = String(card.text() || '').replace(/\s+/g,' ').trim()
      const organizer = (rawText.split('By')[1] || '').split(/Sold Out|\+\d+/)[0].trim()
      const ev = {
        title: title.slice(0,140),
        description: rawText.slice(0,500),
        platform: 'luma',
        city: 'Mumbai',
        country: 'India',
        mode: 'offline',
        category: 'meetup',
        tags: [],
        banner_url: null,
        event_url: href,
        start_date: null,
        end_date: null,
        organizer: organizer || 'Unknown Organizer',
        is_free: true
      }
      events.push(ev)
    }catch(e){ /* ignore element errors */ }
  })
  return events
}

async function main(){
  try{
    const events = await scrapeHtml()
    console.log('FOUND', events.length, 'events')
    if(!events.length) return
    const sb = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const res = await sb.from('events').upsert(events, { onConflict: 'event_url' })
    if(res.error){
      console.error('UPSERT ERROR', res.error)
      process.exit(1)
    }
    console.log('UPSERT OK, returned:', (res.data || []).length)
    console.log(JSON.stringify((res.data || []).slice(0,5), null,2))
  }catch(e){
    console.error('EXCEPTION', e && e.message ? e.message : e)
    process.exit(2)
  }
}

main()
