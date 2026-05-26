# Stage 01: Supabase Schema

## Purpose
Define the complete Supabase SQL schema for TechPulse, including tables, constraints, indexes, RLS policies, and starter seed data.

## Inputs/Dependencies
- Product domain: unified tech event discovery.
- Uses Supabase Postgres with `auth.users` available.

## Required Outputs
Output pure SQL only for:
- `events` table with:
  - `id uuid default gen_random_uuid()`
  - `title`, `description`, `platform`, `city`, `country`, `mode`, `category`, `tags`
  - `banner_url`, `event_url`, `start_date`, `end_date`, `organizer`, `is_free`
  - `raw_data jsonb`, `created_at timestamptz default now()`
- `profiles` table extending `auth.users`:
  - `id uuid` referencing `auth.users`
  - `name`, `interests text[]`, `city`, `created_at`
- `saved_events` table:
  - `id uuid`
  - `user_id uuid` referencing `profiles`
  - `event_id uuid` referencing `events`
  - `saved_at timestamptz default now()`
  - unique constraint on (`user_id`, `event_id`)
- RLS enabled on all tables.
- Policies:
  - `events` readable by everyone.
  - `saved_events` readable/writable only by owner (`auth.uid() = user_id`).
- Indexes:
  - GIN index on `tags`.
  - indexes on `city`, `platform`, `category`, `start_date`.
  - full text search index on title + description via `tsvector`.
- 5 realistic Mumbai seed events (AI hackathons, meetups, workshops).

## Constraints
- Keep event fields aligned with later app contracts.
- SQL must be executable in Supabase SQL editor without manual cleanup.

## Acceptance Checks
- Tables, constraints, and policies execute successfully.
- Filter/search indexes are present.
- Seed data inserts without violating constraints.
