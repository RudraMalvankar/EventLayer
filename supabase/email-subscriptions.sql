-- Email subscriptions + notification prefs (run after schema-extensions.sql)

create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references public.profiles(id) on delete set null,
  city text default 'Mumbai',
  weekly_digest boolean default true,
  event_alerts boolean default true,
  community_alerts boolean default true,
  unsubscribed_at timestamptz,
  created_at timestamptz default now(),
  unique (email)
);

create index if not exists email_subscribers_active_idx
  on public.email_subscribers (email)
  where unsubscribed_at is null;

alter table public.email_subscribers enable row level security;

drop policy if exists email_subscribers_self on public.email_subscribers;
create policy email_subscribers_self on public.email_subscribers
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists email_subscribers_insert on public.email_subscribers;
create policy email_subscribers_insert on public.email_subscribers
  for insert with check (true);
