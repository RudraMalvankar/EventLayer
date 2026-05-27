"use client";

import { useEffect, useMemo, useState } from "react";
import { EventCard } from "../../components/EventCard";
import { SearchBar } from "../../components/SearchBar";
import { Navbar } from "../../components/Navbar";

const CATEGORY_OPTIONS = ["All", "Hackathon", "Meetup", "Workshop"];
const MODE_OPTIONS = ["All", "Online", "Offline"];

function dayKey(value) {
  if (!value) return "tba";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "tba";
  return date.toISOString().slice(0, 10);
}

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

function monthLabel(date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [devfolioPast, setDevfolioPast] = useState(false);
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [filters, setFilters] = useState({
    category: "All",
    mode: "All",
    price: "All",
    city: "",
  });

  function buildParams({ search } = {}) {
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (filters.category !== "All") params.set("category", filters.category.toLowerCase());
    if (filters.mode !== "All") params.set("mode", filters.mode.toLowerCase());
    if (filters.price === "Free") params.set("is_free", "true");
    params.set("platform", devfolioPast ? "devfolio" : "luma");
    if (search) params.set("search", search);
    return params;
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/events?${buildParams().toString()}`);
    const json = await res.json();
    const next = json?.data?.events || [];
    setEvents(next);
    const firstId = next?.[0]?.id || next?.[0]?.event_url || null;
    setSelectedMapId(firstId);
    setSelectedDateKey(next?.[0]?.start_date ? dayKey(next[0].start_date) : null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [filters.city, filters.category, filters.mode, filters.price, devfolioPast]);

  async function onSearch(query) {
    if (!query?.trim()) return load();
    setLoading(true);
    if (devfolioPast) {
      const res = await fetch(`/api/events?${buildParams({ search: query }).toString()}`);
      const json = await res.json();
      setEvents(json?.data?.events || []);
      setLoading(false);
      return;
    }
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await res.json();
    const next = json?.data?.events || [];
    setEvents(next);
    const firstId = next?.[0]?.id || next?.[0]?.event_url || null;
    setSelectedMapId(firstId);
    setSelectedDateKey(next?.[0]?.start_date ? dayKey(next[0].start_date) : null);
    setLoading(false);
  }

  const groupedEvents = useMemo(() => {
    const groups = new Map();
    const ordered = [...events].sort((a, b) => {
      const aTime = a?.start_date ? new Date(a.start_date).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b?.start_date ? new Date(b.start_date).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });

    ordered.forEach((event) => {
      const key = dayKey(event?.start_date);
      if (!groups.has(key)) {
        groups.set(key, { label: formatDayLabel(event?.start_date), items: [] });
      }
      groups.get(key).items.push(event);
    });

    return Array.from(groups.entries()).map(([key, group]) => ({ key, ...group }));
  }, [events]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const key = dayKey(event?.start_date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return map;
  }, [events]);

  const calendarCells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());
    const gridEnd = new Date(end);
    gridEnd.setDate(end.getDate() + (6 - end.getDay()));

    const cells = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      cells.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return cells;
  }, [monthCursor]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDateKey) return [];
    return eventsByDate.get(selectedDateKey) || [];
  }, [eventsByDate, selectedDateKey]);

  const selectedMapEvent = useMemo(() => {
    const key = selectedMapId;
    return events.find((event) => (event.id || event.event_url) === key) || events[0] || null;
  }, [events, selectedMapId]);

  const mapQuery = useMemo(() => {
    if (!selectedMapEvent) return "Mumbai, India";
    return [selectedMapEvent.city, selectedMapEvent.country].filter(Boolean).join(", ") || "Mumbai, India";
  }, [selectedMapEvent]);

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=11&ie=UTF8&iwloc=&output=embed`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(mapQuery)}`;

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
        background:
          "radial-gradient(1200px 420px at 10% -20%, rgba(255,79,23,0.12) 0%, transparent 60%), radial-gradient(900px 380px at 85% 10%, rgba(255,143,94,0.12) 0%, transparent 60%), var(--bg)",
      }}
    >
      <Navbar />
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-8 lg:px-6">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_24px_60px_rgba(24,24,20,0.12)]">
          <SearchBar onSearch={onSearch} loading={loading} />
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORY_OPTIONS.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, category }))}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    filters.category === category
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface-2)] text-[var(--muted)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex w-full flex-wrap items-center justify-center gap-2">
              {MODE_OPTIONS.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, mode }))}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    filters.mode === mode
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface-2)] text-[var(--muted)]"
                  }`}
                >
                  {mode}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, price: prev.price === "Free" ? "All" : "Free" }))}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  filters.price === "Free"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--muted)]"
                }`}
              >
                Free only
              </button>
              <input
                className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text)]"
                placeholder="City"
                value={filters.city}
                onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setDevfolioPast((value) => !value)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  devfolioPast ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-2)] text-[var(--muted)]"
                }`}
              >
                Devfolio archive
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {loading ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--muted)]">
                Loading events...
              </div>
            ) : !events.length ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--muted)]">
                No events found. Try different search or filters.
              </div>
            ) : (
              groupedEvents.map((group) => (
                <section key={group.key} className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">{group.label}</h2>
                  <div className="space-y-4">
                    {group.items.map((event) => (
                      <div
                        key={event.id || event.event_url}
                        onClick={() => {
                          setSelectedMapId(event.id || event.event_url);
                          setSelectedDateKey(dayKey(event?.start_date));
                        }}
                        className="block w-full cursor-pointer"
                      >
                        <EventCard event={event} variant="list" />
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="rounded-full bg-[var(--surface-2)] px-3 py-2 text-sm"
                >
                  Prev
                </button>
                <h2 className="text-base font-semibold">{monthLabel(monthCursor)}</h2>
                <button
                  type="button"
                  onClick={() => setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="rounded-full bg-[var(--surface-2)] px-3 py-2 text-sm"
                >
                  Next
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                  <div key={`${day}-${idx}`}>{day}</div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1">
                {calendarCells.map((date) => {
                  const key = dayKey(date.toISOString());
                  const dayEvents = eventsByDate.get(key) || [];
                  const inMonth = date.getMonth() === monthCursor.getMonth();
                  const isActive = selectedDateKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedDateKey(key);
                        if (dayEvents[0]) setSelectedMapId(dayEvents[0].id || dayEvents[0].event_url);
                      }}
                      className={`min-h-14 rounded-xl border p-1 text-left transition ${
                        isActive
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--border)] bg-[var(--surface-2)]"
                      } ${inMonth ? "opacity-100" : "opacity-50"}`}
                    >
                      <div className="text-[11px] font-semibold">{date.getDate()}</div>
                      {dayEvents.length ? (
                        <div className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-xl bg-[var(--surface-2)] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {selectedDateKey ? formatDayLabel(selectedDateKey) : "Select a date"}
                </div>
                <div className="mt-2 space-y-1">
                  {selectedDayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id || event.event_url}
                      type="button"
                      onClick={() => setSelectedMapId(event.id || event.event_url)}
                      className="w-full rounded-lg bg-[var(--surface)] p-2 text-left text-xs"
                    >
                      <div className="font-semibold line-clamp-1">{event.title}</div>
                      <div className="text-[var(--muted)]">{event.city || "Online"}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{selectedMapEvent?.city || "Event location"}</h3>
                <a href={appleMapsUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--accent)]">
                  Apple Maps
                </a>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                <iframe title="Event map" src={mapEmbedUrl} className="h-64 w-full" loading="lazy" />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
