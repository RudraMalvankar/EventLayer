"use client";

import { useEffect, useMemo, useState } from "react";
import { EventCard } from "../../components/EventCard";
import { SearchBar } from "../../components/SearchBar";
import { Navbar } from "../../components/Navbar";

const CATEGORY_OPTIONS = ["All", "Hackathon", "Meetup", "Workshop"];
const MODE_OPTIONS = ["All", "Online", "Offline"];
const PLATFORM_ORDER = ["luma", "devfolio", "unstop", "devpost", "eventbrite", "eventtier"];
const currentYear = new Date().getFullYear();

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

function isFutureDate(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime();
}

function isArchivedCard(event) {
  const title = String(event?.title || "").toLowerCase();
  if (!title) return false;
  if (title.includes("past") || title.includes("archive")) return true;
  const yearMatch = title.match(/\b(20\d{2})\b/);
  if (!yearMatch) return false;
  return Number(yearMatch[1]) < currentYear;
}

function shouldShowEvent(event) {
  if (String(event?.platform || "").toLowerCase() !== "devfolio") return true;
  if (isArchivedCard(event)) return false;
  return isFutureDate(event?.start_date);
}

function getVisibleEvents(items = []) {
  return items.filter(shouldShowEvent);
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [scraperStatus, setScraperStatus] = useState([]);
  const [liveScraperEvents, setLiveScraperEvents] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
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
    hackathon: false,
  });

  function buildParams({ search } = {}) {
    const params = new URLSearchParams();
    params.set("limit", "48");
    if (filters.city) params.set("city", filters.city);
    if (filters.category !== "All")
      params.set("category", filters.category.toLowerCase());
    if (filters.mode !== "All") params.set("mode", filters.mode.toLowerCase());
    if (filters.price === "Free") params.set("is_free", "true");
    if (devfolioPast) params.set("platform", "devfolio");
    // if hackathon toggle is enabled, prefer keyword search for 'hack'
    if (filters.hackathon && !search) search = "hack";
    if (search) params.set("search", search);
    return params;
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/events?${buildParams().toString()}`);
    const json = await res.json();
    const next = json?.data?.events || [];
    setEvents(next);
    const visibleNext = getVisibleEvents(next);
    const firstId = visibleNext?.[0]?.id || visibleNext?.[0]?.event_url || null;
    setSelectedMapId(firstId);
    setSelectedDateKey(
      visibleNext?.[0]?.start_date ? dayKey(visibleNext[0].start_date) : null,
    );
    setLoading(false);
  }

  async function loadScraperStatus() {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/scrapers/status");
      const json = await res.json();
      setScraperStatus(json?.data?.platforms || []);
    } catch {
      setScraperStatus([]);
    } finally {
      setStatusLoading(false);
    }
  }

  async function loadLiveScraperEvents() {
    setLiveLoading(true);
    try {
      const res = await fetch("/api/scrapers/live");
      const json = await res.json();
      setLiveScraperEvents(json?.data?.events || []);
      // Refresh main list to include newly scraped/upserted events
      load();
    } catch {
      setLiveScraperEvents([]);
    } finally {
      setLiveLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadScraperStatus();
    loadLiveScraperEvents();
  }, [
    filters.city,
    filters.category,
    filters.mode,
    filters.price,
    filters.hackathon,
    devfolioPast,
  ]);

  async function onSearch(query) {
    if (!query?.trim()) return load();
    setLoading(true);
    if (devfolioPast) {
      const res = await fetch(
        `/api/events?${buildParams({ search: query }).toString()}`,
      );
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
    const visibleNext = getVisibleEvents(next);
    const firstId = visibleNext?.[0]?.id || visibleNext?.[0]?.event_url || null;
    setSelectedMapId(firstId);
    setSelectedDateKey(
      visibleNext?.[0]?.start_date ? dayKey(visibleNext[0].start_date) : null,
    );
    setLoading(false);
  }

  const visibleEvents = useMemo(() => getVisibleEvents(events), [events]);

  const groupedEvents = useMemo(() => {
    const groups = new Map();
    const ordered = [...visibleEvents].sort((a, b) => {
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
  }, [visibleEvents]);

  const groupedByPlatform = useMemo(() => {
    const buckets = new Map();
    PLATFORM_ORDER.forEach((platform) => buckets.set(platform, []));
    visibleEvents.forEach((event) => {
      const platform = String(event?.platform || "luma").toLowerCase();
      if (!buckets.has(platform)) buckets.set(platform, []);
      buckets.get(platform).push(event);
    });

    return PLATFORM_ORDER.map((platform) => ({
      platform,
      items: (buckets.get(platform) || []).sort((a, b) => {
        const aTime = a?.start_date
          ? new Date(a.start_date).getTime()
          : Number.POSITIVE_INFINITY;
        const bTime = b?.start_date
          ? new Date(b.start_date).getTime()
          : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      }),
    })).filter((group) => group.items.length);
  }, [visibleEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    visibleEvents.forEach((event) => {
      const key = dayKey(event?.start_date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return map;
  }, [visibleEvents]);

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
    return (
      visibleEvents.find((event) => (event.id || event.event_url) === key) ||
      visibleEvents[0] ||
      null
    );
  }, [visibleEvents, selectedMapId]);

  const mapQuery = useMemo(() => {
    if (!selectedMapEvent) return "Mumbai, India";
    return (
      [selectedMapEvent.city, selectedMapEvent.country]
        .filter(Boolean)
        .join(", ") || "Mumbai, India"
    );
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
                  className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                    filters.category === category
                      ? "bg-[var(--accent)] text-white shadow-lg shadow-orange-500/20"
                      : "bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--border)]"
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
                  className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                    filters.mode === mode
                      ? "bg-[var(--accent)] text-white shadow-lg shadow-orange-500/20"
                      : "bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--border)]"
                  }`}
                >
                  {mode}
                </button>
              ))}
              <div className="h-4 w-px bg-[var(--border)] mx-1" />
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    price: prev.price === "Free" ? "All" : "Free",
                  }))
                }
                className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                  filters.price === "Free"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--border)]"
                }`}
              >
                Free only
              </button>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    hackathon: !prev.hackathon,
                  }))
                }
                className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                  filters.hackathon
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--border)]"
                }`}
              >
                Hackathons
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-10">
            {/* Live Scraper Feed - Moved here and made more compact */}
            {liveScraperEvents.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                      Live Feed
                    </h2>
                    <p className="text-xs text-[var(--muted)]">Real-time discovered events</p>
                  </div>
                  <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-600 uppercase">
                    {liveScraperEvents.length} New
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {liveScraperEvents.map((event) => (
                    <EventCard
                      key={`${event.platform}-${event.event_url}-${event.title}`}
                      event={event}
                      variant="grid"
                    />
                  ))}
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent opacity-50" />
              </section>
            )}

            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-[32px] border border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                  <span className="text-sm font-medium">Curating your experience...</span>
                </div>
              </div>
            ) : !visibleEvents.length ? (
              <div className="flex h-64 items-center justify-center rounded-[32px] border border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
                <p className="text-sm">No events matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {groupedEvents.map((group) => (
                  <section key={group.key} className="space-y-5">
                    <div className="sticky top-24 z-20 -mx-4 flex items-center gap-4 bg-[var(--bg)]/80 px-4 py-2 backdrop-blur-md lg:mx-0 lg:px-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface)] text-lg shadow-sm border border-[var(--border)]">
                        📅
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[var(--text)]">
                          {group.label}
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
                          {group.items.length} {group.items.length === 1 ? "Event" : "Events"}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      {group.items.map((event) => (
                        <div
                          key={event.id || event.event_url}
                          onClick={() => {
                            setSelectedMapId(event.id || event.event_url);
                            setSelectedDateKey(dayKey(event?.start_date));
                          }}
                          className="block w-full transition active:scale-[0.98]"
                        >
                          <EventCard event={event} variant="grid" />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Unified Sidebar: Calendar + Location */}
            <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
              <div className="bg-[var(--surface-2)] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text)]">
                    Timeline
                  </h2>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setMonthCursor(
                          (prev) =>
                            new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text)] shadow-sm transition hover:bg-[var(--accent)] hover:text-white"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMonthCursor(
                          (prev) =>
                            new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text)] shadow-sm transition hover:bg-[var(--accent)] hover:text-white"
                    >
                      →
                    </button>
                  </div>
                </div>
                
                <div className="mb-2 text-center text-xs font-bold text-[var(--muted)]">
                  {monthLabel(monthCursor)}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[var(--faint)]">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                    <div key={day} className="py-2">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((date) => {
                    const key = dayKey(date.toISOString());
                    const dayEvents = eventsByDate.get(key) || [];
                    const inMonth = date.getMonth() === monthCursor.getMonth();
                    const isActive = selectedDateKey === key;
                    const isToday = dayKey(new Date().toISOString()) === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedDateKey(key);
                          if (dayEvents[0])
                            setSelectedMapId(
                              dayEvents[0].id || dayEvents[0].event_url,
                            );
                        }}
                        className={`group relative flex aspect-square items-center justify-center rounded-xl text-[11px] font-bold transition ${
                          isActive
                            ? "bg-[var(--accent)] text-white shadow-lg shadow-orange-500/40"
                            : isToday
                              ? "bg-orange-50 text-[var(--accent)] ring-1 ring-inset ring-orange-200"
                              : "text-[var(--text)] hover:bg-[var(--surface)]"
                        } ${!inMonth ? "opacity-20" : "opacity-100"}`}
                      >
                        {date.getDate()}
                        {dayEvents.length > 0 && !isActive && (
                          <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[var(--accent)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                    At a Glance
                  </h3>
                  <a
                    href={appleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] hover:underline"
                  >
                    Maps →
                  </a>
                </div>
                
                <div className="mb-4 rounded-2xl bg-[var(--surface-2)] p-4">
                  <p className="text-[11px] font-bold text-[var(--text)] line-clamp-1">
                    {selectedMapEvent?.title || "Select an event"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                    {selectedMapEvent?.city || "Online"}
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[var(--border)] grayscale transition duration-500 hover:grayscale-0">
                  <iframe
                    title="Event map"
                    src={mapEmbedUrl}
                    className="h-40 w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* Scraper Status - Moved to bottom of sidebar and made very minimal */}
            <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-6">
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                Network Status
              </h3>
              <div className="space-y-3">
                {scraperStatus.map((item) => (
                  <div key={item.platform} className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">
                      {item.platform}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[var(--text)]">
                        {item.count}
                      </span>
                      <div className={`h-1.5 w-1.5 rounded-full ${item.error ? "bg-red-500" : "bg-emerald-500"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
