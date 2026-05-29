create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  platform text not null check (platform in ('luma','meetup','devfolio','unstop','devpost','eventbrite','eventtier','scraper')),
  city text,
  country text,
  mode text check (mode in ('online','offline','hybrid')),
  category text check (category in ('hackathon','meetup','workshop','conference','webinar','competition')),
  tags text[] default '{}',
  banner_url text,
  event_url text unique not null,
  start_date timestamptz,
  end_date timestamptz,
  organizer text,
  is_free boolean default true,
  raw_data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  display_name text,
  first_name text,
  interests text[] default '{}',
  event_types text[] default '{}',
  city text,
  profile_picture_url text,
  platforms_followed text[] default '{}',
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists event_types text[] default '{}';
alter table public.profiles add column if not exists profile_picture_url text;
alter table public.profiles add column if not exists platforms_followed text[] default '{}';

create table if not exists public.saved_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  saved_at timestamptz default now(),
  unique (user_id, event_id)
);

alter table public.events enable row level security;
alter table public.profiles enable row level security;
alter table public.saved_events enable row level security;

drop policy if exists events_read_all on public.events;
create policy events_read_all on public.events for select using (true);

drop policy if exists saved_owner_read on public.saved_events;
create policy saved_owner_read on public.saved_events for select using (auth.uid() = user_id);

drop policy if exists saved_owner_write on public.saved_events;
create policy saved_owner_write on public.saved_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists events_tags_gin on public.events using gin (tags);
create index if not exists events_city_idx on public.events (city);
create index if not exists events_platform_idx on public.events (platform);
create index if not exists events_category_idx on public.events (category);
create index if not exists events_start_date_idx on public.events (start_date);
create index if not exists events_fts_idx on public.events using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));
