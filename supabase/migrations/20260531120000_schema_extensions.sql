-- EventLayer feature tables (profiles extensions, follows, notifications, digests, analytics, communities)

alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists digest_enabled boolean default true;
alter table public.profiles add column if not exists is_organizer boolean default false;

create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.organizer_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  organizer_slug text not null,
  created_at timestamptz default now(),
  unique (user_id, organizer_slug)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  summary text,
  events jsonb default '[]',
  created_at timestamptz default now(),
  unique (user_id, week_start)
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references public.profiles(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists user_follows_follower_idx on public.user_follows (follower_id);
create index if not exists user_follows_following_idx on public.user_follows (following_id);
create index if not exists organizer_follows_user_idx on public.organizer_follows (user_id);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists digests_user_idx on public.digests (user_id, week_start desc);
create index if not exists analytics_type_idx on public.analytics_events (event_type, created_at desc);

alter table public.user_follows enable row level security;
alter table public.organizer_follows enable row level security;
alter table public.notifications enable row level security;
alter table public.digests enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists user_follows_read on public.user_follows;
create policy user_follows_read on public.user_follows for select using (true);

drop policy if exists notifications_owner on public.notifications;
create policy notifications_owner on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists digests_owner on public.digests;
create policy digests_owner on public.digests for select using (auth.uid() = user_id);

create table if not exists public.community_follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  community_slug text not null,
  created_at timestamptz default now(),
  unique (user_id, community_slug)
);

create index if not exists community_follows_user_idx on public.community_follows (user_id);

alter table public.community_follows enable row level security;

drop policy if exists community_follows_owner on public.community_follows;
create policy community_follows_owner on public.community_follows for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists analytics_insert on public.analytics_events;
create policy analytics_insert on public.analytics_events for insert with check (true);

drop policy if exists analytics_admin_read on public.analytics_events;
create policy analytics_admin_read on public.analytics_events for select using (false);
