"use client";

import { useEffect, useMemo, useState } from "react";
import { EventCard } from "../../components/EventCard";
import { FilterBar } from "../../components/FilterBar";
import { SearchBar } from "../../components/SearchBar";
import { Navbar } from "../../components/Navbar";

function formatDayLabel(value) {
  if (!value) return "TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBA";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function dayKey(value) {
  if (!value) return "tba";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "tba";
  return date.toISOString().slice(0, 10);
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "All",
    mode: "All",
    price: "All",
    city: "",
  });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (filters.category !== "All")
      params.set("category", filters.category.toLowerCase());
    if (filters.mode !== "All") params.set("mode", filters.mode.toLowerCase());
    if (filters.price === "Free") params.set("is_free", "true");
    params.set("platform", "luma");
    const res = await fetch(`/api/events?${params.toString()}`);
    const json = await res.json();
    setEvents(json?.data?.events || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [filters.city, filters.category, filters.mode, filters.price]);

  async function onSearch(query) {
    if (!query?.trim()) return load();
    setLoading(true);
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    setEvents(json?.data?.events || []);
    setLoading(false);
  }

  const groupedEvents = useMemo(() => {
    const groups = new Map();
    const ordered = [...events].sort((a, b) => {
      const aTime = a?.start_date
        ? new Date(a.start_date).getTime()
        : Number.POSITIVE_INFINITY;
      const bTime = b?.start_date
        ? new Date(b.start_date).getTime()
        : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });

    ordered.forEach((event) => {
      const key = dayKey(event?.start_date);
      if (!groups.has(key)) {
        groups.set(key, {
          label: formatDayLabel(event?.start_date),
          items: [],
        });
      }
      groups.get(key).items.push(event);
    });

    return Array.from(groups.entries()).map(([key, group]) => ({
      key,
      ...group,
    }));
  }, [events]);

  const stats = useMemo(() => {
    const upcoming = events.filter((event) => event?.start_date).length;
    const free = events.filter((event) => event?.is_free).length;
    const online = events.filter((event) => event?.mode === "online").length;
    return { upcoming, free, online };
  }, [events]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--muted)]">
          Loading events...
        </div>
      );
    }

    if (!events.length) {
      return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--muted)]">
          No events found. Try adjusting your filters.
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {groupedEvents.map((group) => (
          <section key={group.key} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                {group.label}
              </h2>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>
            <div className="space-y-4">
              {group.items.map((event) => (
                <EventCard
                  key={event.id || event.event_url}
                  event={event}
                  variant="list"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }, [events, groupedEvents, loading]);

  return (
    <main
      className="min-h-screen text-[var(--text)]"
      style={{
        "--bg": "#FAFAF8",
        "--surface": "#FFFFFF",
        "--surface-2": "#F5F4F0",
        "--border": "#E8E6E0",
        "--text": "#1A1916",
        "--muted": "#6B6860",
        "--faint": "#9B9890",
        "--accent": "#FF4F17",
        "--accent-h": "#E64410",
        "--accent-soft": "#FFF2EE",
        background:
          "radial-gradient(1200px 420px at 10% -20%, rgba(255,79,23,0.12) 0%, transparent 60%), radial-gradient(900px 380px at 85% 10%, rgba(255,143,94,0.12) 0%, transparent 60%), var(--bg)",
      }}
    >
      <Navbar />
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-8 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_60px_rgba(24,24,20,0.12)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl space-y-3">
                  <p className="text-xs uppercase tracking-[0.32em] text-[var(--accent)]">
                    Luma-first feed
                  </p>
                  <h1 className="serif text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl lg:text-5xl">
                    Events that feel curated, not crowded.
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
                    Browse upcoming meetups, hackathons, and workshops with a
                    calmer, date-first layout inspired by Luma.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                    <div className="text-2xl font-semibold text-[var(--text)]">
                      {stats.upcoming}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      Upcoming
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                    <div className="text-2xl font-semibold text-[var(--text)]">
                      {stats.free}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      Free
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                    <div className="text-2xl font-semibold text-[var(--text)]">
                      {stats.online}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      Online
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <SearchBar onSearch={onSearch} loading={loading} />
                <FilterBar filters={filters} onChange={setFilters} />
              </div>
            </div>

            {content}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_24px_60px_rgba(24,24,20,0.1)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                Feed guide
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">
                A calmer way to browse
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                The feed is ordered by date, grouped by day, and presented in a
                cleaner list so the important details stand out first.
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                Quick tips
              </p>
              <div className="mt-4 space-y-3 text-sm text-[var(--text)]">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  Search by intent: “free AI meetup in Mumbai”
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  Use category chips to narrow the list fast
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  Dates are sorted earliest first
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
