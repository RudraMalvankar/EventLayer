"use client";

import { useEffect, useMemo, useState } from "react";
import { EventCard } from "../../components/EventCard";
import { LoggedOutSaveModal } from "../../components/LoggedOutSaveModal";
import { SearchBar } from "../../components/SearchBar";
import { Navbar } from "../../components/Navbar";
import { useRouter } from "next/navigation";
import { useUser } from "../../components/AuthProvider";
import { supabase } from "../../supabase/client";
import { notifySavedEventsUpdated } from "../../src/shared/events/refresh";
import {
  dayKey,
  isUpcoming,
  localDayKeyFromDate,
} from "../../src/shared/events/dates";

const MAP_PREVIEW_URL = process.env.NEXT_PUBLIC_MAPBOX_STATIC_PREVIEW_URL || "";

function CalendarWidget({ selectedDate, events, onDateSelect }) {
  const days = useMemo(() => {
    const today = new Date();
    const result = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      result.push(d);
    }
    return result;
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide px-2">
      {days.map((date) => {
        const dateKey = localDayKeyFromDate(date);
        const isSelected = selectedDate === dateKey;
        const hasEvents = events.some(
          (e) => dayKey(e.start_date) === dateKey,
        );

        return (
          <button
            key={dateKey}
            onClick={() => onDateSelect(isSelected ? null : dateKey)}
            className={`flex flex-col items-center justify-center min-w-[70px] h-24 rounded-[24px] transition-all duration-500 border ${
              isSelected
                ? "bg-orange-500 text-white border-orange-500 shadow-[0_10px_30px_rgba(255,77,0,0.3)] scale-105"
                : "bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <span
              className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isSelected ? "text-white/70" : "text-gray-500"}`}
            >
              {date.toLocaleDateString("en-US", { weekday: "short" })}
            </span>
            <span className="text-2xl font-black">{date.getDate()}</span>
            {hasEvents && !isSelected && (
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function getDisplayPlatform(event) {
  return String(
    event?.raw_data?.sourcePlatform ||
      event?.raw_data?.originalPlatform ||
      event?.platform ||
      "scraper",
  ).toLowerCase();
}

function matchesPlatformFilter(event, platformFilter) {
  if (!platformFilter || platformFilter === "All") return true;
  return getDisplayPlatform(event) === String(platformFilter).toLowerCase();
}

function formatDayLabel(value) {
  if (!value) return "Upcoming Events";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Upcoming Events";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function EventsPage() {
  const router = useRouter();
  const { session, loading: authLoading, initialized } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [filters, setFilters] = useState({
    category: "All",
    mode: "All",
    city: "",
    platform: "All",
  });
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showModalEventId, setShowModalEventId] = useState(null);

  async function resolveToken() {
    const token = session?.access_token;
    if (token) return token;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  }

  async function loadSavedIds() {
    const token = await resolveToken();
    if (!token) {
      setSavedIds(new Set());
      return;
    }
    const response = await fetch("/api/saved", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await response.json();
    const items = Array.isArray(json?.data?.events)
      ? json.data.events
      : Array.isArray(json?.data?.saved_events)
        ? json.data.saved_events
        : Array.isArray(json?.data)
          ? json.data
          : [];
    setSavedIds(
      new Set(items.map((item) => item.id || item.event_id).filter(Boolean)),
    );
  }

  async function handleToggleSave(event) {
    const token = await resolveToken();
    if (!token) {
      setShowModalEventId(event?.id || null);
      return;
    }

    const response = await fetch("/api/saved", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ event_id: event.id }),
    });

    const json = await response.json();
    if (!response.ok || json?.error) {
      console.error(
        "Failed to toggle save",
        json?.error || response.statusText,
      );
      return;
    }

    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(event.id)) next.delete(event.id);
      else next.add(event.id);
      return next;
    });
    notifySavedEventsUpdated();
  }

  function closeModal() {
    setShowModalEventId(null);
  }

  async function loadEvents(query = "") {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "1000");
      params.set("upcomingOnly", "true");
      if (filters.city) params.set("city", filters.city);
      if (filters.category !== "All")
        params.set("category", filters.category.toLowerCase());
      if (filters.mode !== "All")
        params.set("mode", filters.mode.toLowerCase());
      if (query) params.set("search", query);

      const res = await fetch(`/api/events?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      setEvents(json?.data?.events || []);
    } catch (error) {
      console.error("Failed to load events:", error);
      // Optional: Set some error state to show in UI
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/scrapers/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      const json = await res.json();
      if (json.data) {
        await loadEvents();
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    setSelectedDateKey(null);
    loadEvents();
  }, [filters.city, filters.category, filters.mode]);

  useEffect(() => {
    if (!initialized || authLoading) return;
    loadSavedIds().catch((error) =>
      console.error("Failed to load saved ids", error),
    );
  }, [initialized, authLoading, session?.access_token]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (filters.platform !== "All") {
      result = result.filter((event) =>
        matchesPlatformFilter(event, filters.platform),
      );
    }
    return result;
  }, [events, filters.platform]);

  const groupedEvents = useMemo(() => {
    const groups = new Map();
    const sorted = [...filteredEvents].sort((a, b) => {
      const aTime = a?.start_date
        ? new Date(a.start_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b?.start_date
        ? new Date(b.start_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

    sorted.forEach((event) => {
      const key = dayKey(event?.start_date);
      if (!groups.has(key)) {
        groups.set(key, {
          dateKey: key,
          label: formatDayLabel(event?.start_date),
          items: [],
        });
      }
      groups.get(key).items.push(event);
    });
    return Array.from(groups.values());
  }, [filteredEvents]);

  useEffect(() => {
    if (!selectedDateKey || loading) return;
    const el = document.getElementById(`event-day-${selectedDateKey}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedDateKey, loading, groupedEvents]);

  return (
    <main className="min-h-screen text-white pb-24">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <LoggedOutSaveModal
          isOpen={Boolean(showModalEventId)}
          eventId={showModalEventId}
          onClose={closeModal}
        />
        <header className="mb-20 animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                  Live Aggregator
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter mb-4">
                Discover <span className="text-orange-500">Events</span>
              </h1>
              <p className="text-lg text-gray-500 max-w-md leading-relaxed">
                The most curated tech events, hackathons and meetups in your
                city.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-full border border-white/5">
              <button
                onClick={() => setShowMap(!showMap)}
                className={`text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full transition-all duration-300 ${showMap ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}
              >
                {showMap ? "List View" : "Map View"}
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full text-gray-500 hover:text-white transition-all disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-12">
            <div className="md:col-span-6">
              <SearchBar onSearch={(q) => loadEvents(q)} />
            </div>
            <div className="md:col-span-2">
              <select
                className="w-full bg-[#0a0c12] border border-white/5 rounded-2xl px-5 py-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-orange-500/50 transition-colors appearance-none text-gray-400"
                onChange={(e) =>
                  setFilters((f) => ({ ...f, platform: e.target.value }))
                }
                value={filters.platform}
              >
                <option value="All">All Platforms</option>
                <option value="luma">Luma</option>
                <option value="meetup">Meetup</option>
                <option value="devfolio">Devfolio</option>
                <option value="unstop">Unstop</option>
                <option value="eventbrite">Eventbrite</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <select
                className="w-full bg-[#0a0c12] border border-white/5 rounded-2xl px-5 py-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-orange-500/50 transition-colors appearance-none text-gray-400"
                onChange={(e) =>
                  setFilters((f) => ({ ...f, category: e.target.value }))
                }
                value={filters.category}
              >
                <option>All Types</option>
                <option>Hackathon</option>
                <option>Meetup</option>
                <option>Workshop</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <input
                placeholder="City..."
                className="w-full bg-[#0a0c12] border border-white/5 rounded-2xl px-5 py-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-orange-500/50 transition-colors text-gray-400"
                onChange={(e) =>
                  setFilters((f) => ({ ...f, city: e.target.value }))
                }
                value={filters.city}
              />
            </div>
          </div>

          <div className="mt-16">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
              Tap a date to jump — all upcoming events are listed below
            </p>
            <CalendarWidget
              selectedDate={selectedDateKey}
              events={filteredEvents}
              onDateSelect={setSelectedDateKey}
            />
          </div>

          {showMap && (
            <div className="mt-12 h-[500px] w-full bg-[#0a0c12] rounded-[40px] overflow-hidden relative border border-white/5 animate-fade-in-up">
              <div
                className="absolute inset-0 flex items-center justify-center bg-cover bg-center"
                style={
                  MAP_PREVIEW_URL
                    ? { backgroundImage: `url(${MAP_PREVIEW_URL})` }
                    : {
                        background:
                          "linear-gradient(135deg, #111827 0%, #020617 100%)",
                      }
                }
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <span className="text-2xl">📍</span>
                  </div>
                  <p className="text-xs font-black text-white uppercase tracking-[0.3em] bg-black/60 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 shadow-2xl">
                    Exploring Mumbai
                  </p>
                </div>
              </div>
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 animate-pulse">
            <div className="w-12 h-12 rounded-full border-t-2 border-orange-500 animate-spin mb-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
              Curating feed...
            </span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-40 glass rounded-[48px] border border-white/5">
            <div className="text-4xl mb-6 opacity-20">📂</div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-8">
              No events found in the database.
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-orange-500 text-white px-10 py-5 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 accent-glow"
            >
              {syncing ? "Syncing Data..." : "Force Sync Scrapers"}
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-40 glass rounded-[48px] border border-white/5">
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-4">
              No upcoming events match your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedDateKey(null);
                setFilters({
                  category: "All",
                  mode: "All",
                  city: "",
                  platform: "All",
                });
              }}
              className="text-orange-500 text-xs font-black uppercase tracking-[0.2em] hover:text-orange-400"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-32">
            {groupedEvents.map((group) => (
              <section
                key={group.dateKey || group.label}
                id={`event-day-${group.dateKey}`}
                className="animate-fade-in-up scroll-mt-28"
              >
                <div className="sticky top-20 z-10 py-6 mb-12 border-b border-white/5 flex items-center gap-4 bg-black/10 backdrop-blur-md">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
                    {group.label}
                  </h2>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                    {group.items.length} Events
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {group.items.map((event) => (
                    <EventCard
                      key={event.id || event.event_url}
                      event={event}
                      isSaved={savedIds.has(event.id)}
                      onSave={handleToggleSave}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
