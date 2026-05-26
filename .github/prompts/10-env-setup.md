# Stage 10: Environment and Bootstrap

## Purpose
Set up the TechPulse project baseline, dependencies, environment variables, and folder structure.

## Inputs/Dependencies
- Run before implementation or to bootstrap a fresh repo.

## Required Outputs
1. Create project:
```bash
npx create-next-app@latest techpulse --js --tailwind --app --no-src-dir --no-import-alias
```

2. Install dependencies:
```bash
cd techpulse
npm install @supabase/supabase-js openai cheerio node-fetch node-cron
npx shadcn-ui@latest init
npx shadcn-ui@latest add button badge card input skeleton
```

3. Configure `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
SCRAPE_SECRET=techpulse_scrape_secret_2025
```

4. Ensure Copilot instructions are available at project root if required by your workflow.

5. Create folders:
```bash
mkdir -p app/api/events app/api/search app/api/scrape app/api/saved app/api/auth
mkdir -p app/events/[id] app/explore app/saved
mkdir -p lib/scrapers components
```

6. Use stage execution order from `CODEX-MASTER.md`.

## Constraints
- Keep package choices aligned with prompt pack assumptions.
- Do not introduce TypeScript.

## Acceptance Checks
- Fresh install completes without missing dependency errors.
- Environment keys match required runtime usage.
- Folder structure supports all stage outputs.
