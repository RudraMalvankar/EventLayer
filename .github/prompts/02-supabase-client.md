# Stage 02: Supabase and OpenAI Clients

## Purpose
Create core singleton clients and auth/session helpers used by API routes and AI utilities.

## Inputs/Dependencies
- Stage 01 schema assumed available.
- Next.js 14 App Router project.
- Environment variables configured:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_KEY`
  - `OPENAI_API_KEY`

## Required Outputs
Create `/lib/supabase.js`:
- Export `supabase` client-safe singleton.
- Export `supabaseAdmin` server-only singleton.
- Export async `getSession()` returns session or `null`.
- Export async `requireAuth(request)` returns auth user context for routes.
- Add JSDoc for each export.

Create `/lib/openai.js`:
- Export singleton `openai` client.
- Export async `chatCompletion(systemPrompt, userMessage, maxTokens = 500)`.
- Use model `gpt-4o`.
- Return parsed text output; safe fallback on failure.

## Constraints
- JavaScript only, no TypeScript.
- Never expose service-role secrets to client components.
- Keep helper signatures stable for downstream imports.

## Acceptance Checks
- Re-importing modules does not create duplicate clients.
- Auth helpers are usable from API routes.
- AI helper catches failures and returns safe defaults.
