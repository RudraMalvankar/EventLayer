import fs from 'fs'
import path from 'path'

// Load .env.local manually so this script can run with node
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (m) {
      const k = m[1]
      let v = m[2] || ''
      // strip surrounding quotes
      if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      process.env[k] = v
    }
  })
}

try {
  // Create a Supabase admin client directly to avoid ESM import path issues
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  const q = supabaseAdmin
    .from('events')
    .select('id,title,event_url,platform,start_date', { count: 'exact' })
    .order('start_date', { ascending: true })
    .range(0, 9)

  const res = await q
  if (res.error) {
    console.error(JSON.stringify({ ok: false, error: res.error.message }))
    process.exit(2)
  }

  console.log(JSON.stringify({ ok: true, total: res.count || 0, rows: res.data || [] }, null, 2))
} catch (e) {
  console.error(JSON.stringify({ ok: false, error: e.message }))
  process.exit(3)
}
