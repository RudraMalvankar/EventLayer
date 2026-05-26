# TechPulse — Copilot Instructions

## Project
Unified tech event discovery platform. Next.js 14 fullstack app.
Aggregates events from Luma, Devfolio, Unstop into one feed with AI search.

## Stack
- Frontend: Next.js 14 App Router, React, Tailwind CSS, shadcn/ui
- Backend: Next.js API Routes (no separate Express)
- DB: PostgreSQL via Supabase (use @supabase/supabase-js)
- Scraping: Cheerio + node-fetch
- AI: OpenAI GPT-4o via openai npm package
- Auth: Supabase Auth
- Queue: node-cron for scheduled scraping

## Code Rules
- JavaScript only, NO TypeScript
- async/await only, never callbacks
- Named exports for components, default export for pages
- All API routes return { data, error } shape
- Never hardcode secrets, always use process.env
- No console.log in production (use console.error only)

## DB Schema
events: id, title, description, platform, city, country, mode, category, tags[], banner_url, event_url, start_date, end_date, organizer, is_free, created_at
profiles: id, name, interests[], city, created_at
saved_events: id, user_id, event_id, saved_at

## Normalized Event Shape
{ title, description, platform, city, country, mode, category, tags[], banner_url, event_url, start_date, end_date, organizer, is_free }

## API Response Shape
{ data: result, error: null } or { data: null, error: "message" }

## Style
Tailwind only. Dark theme: bg-zinc-950 background, bg-zinc-900 cards, cyan-400 accent.
Mobile-first: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

## Security
- All write routes check Supabase session
- Never expose service key to client
- Sanitize all scraper output before DB insert
- RLS enabled on saved_events table
