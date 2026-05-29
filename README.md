TechPulse (EventLayer)

Unified tech event discovery platform built with Next.js 14. It aggregates events from Luma, Devfolio, and Unstop into a single feed with AI-powered search.

Features

- Unified event feed with normalized data
- AI search over event metadata
- Saved events per user (Supabase Auth)
- Scheduled scraping via cron
- API routes for events, search, and scraping

Tech stack

- Next.js 14 App Router
- React + Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth)
- Cheerio + node-fetch for scraping
- OpenAI for AI search
- node-cron for scheduling

Quick start

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
SCRAPE_SECRET=
```

3. Run the dev server

```bash
npm run dev
```

4. Open the app

```bash
http://localhost:3000
```

Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run clean` - Remove `.next` cache/output
- `npm run start` - Start the production server
- `npm run lint` - Run linting
- `npm run smoke` - Run Playwright smoke checks against local app
- `npm run e2e:signup` - Validate signup + profile API flow

Environment variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key for client
- `SUPABASE_SERVICE_KEY` - Supabase service key for server routes
- `OPENAI_API_KEY` - OpenAI API key for AI search
- `SCRAPE_SECRET` - Secret token for scrape endpoints

API overview

- `GET /api/events` - List events
- `GET /api/events/[id]` - Event details
- `POST /api/search` - AI search
- `POST /api/scrape/[platform]` - Trigger a platform scrape
- `POST /api/saved` - Save or unsave events

Data model (events)
Fields: `title`, `description`, `platform`, `city`, `country`, `mode`, `category`, `tags`, `banner_url`, `event_url`, `start_date`, `end_date`, `organizer`, `is_free`

Security notes

- All write routes validate a Supabase session
- Service key is server-only, never exposed to the client
- Scraper output is sanitized before insert
- RLS enabled on `saved_events`

Deployment

- Configure the same env vars in your hosting platform
- Ensure cron jobs are scheduled if needed for scraping

Troubleshooting

- If scraping fails, verify `SCRAPE_SECRET` and platform endpoints
- If search fails, confirm `OPENAI_API_KEY` and API quota
- If auth/profile pages loop to login, clear stale local build output with `npm run clean` and restart `npm run dev`
- If signup E2E shows `over_email_send_rate_limit`, use `E2E_SIGNIN_EMAIL` and `E2E_SIGNIN_PASSWORD` for an existing test account
