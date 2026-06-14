"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Navbar } from "../../components/Navbar";
import { EventCard } from "../../components/EventCard";
import { LoggedOutSaveModal } from "../../components/LoggedOutSaveModal";
import { useUser } from "../../components/AuthProvider";
import { supabase } from "../../supabase/client";
import { notifySavedEventsUpdated } from "../../src/shared/events/refresh";
import { dayKey } from "../../src/shared/events/dates";

const MAP_PREVIEW_URL = process.env.NEXT_PUBLIC_MAPBOX_STATIC_PREVIEW_URL || "";

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

export default function ExplorePage() {
  const { session, loading: authLoading, initialized } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [profile, setProfile] = useState(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "All",
    mode: "All",
    city: "",
    platform: "All",
  });
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [showModalEventId, setShowModalEventId] = useState(null);

  async function resolveToken() {
    const token = session?.access_token;
    if (token) return token;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  }

  const loadEvents = useCallback(async (nextQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "1000");
      params.set("upcomingOnly", "true");
      if (filters.city) params.set("city", filters.city);
      if (filters.category !== "All") {
        params.set("category", filters.category.toLowerCase());
      }
      if (filters.mode !== "All") {
        params.set("mode", filters.mode.toLowerCase());
      }
      if (nextQuery) params.set("search", nextQuery);

      const response = await fetch(`/api/events?${params.toString()}`);
      const json = await response.json();
      setEvents(Array.isArray(json?.data?.events) ? json.data.events : []);
    } catch (error) {
      console.error("Failed to load explore events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filters.city, filters.category, filters.mode]);

  const loadSavedIds = useCallback(async () => {
    const token = await resolveToken();
    if (!token) {
      setSavedIds(new Set());
      return;
    }
    setLoadingSaved(true);
    try {
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
    } catch (error) {
      console.error("Failed to load saved events:", error);
    } finally {
      setLoadingSaved(false);
    }
  }, [session?.access_token]);

  const loadProfile = useCallback(async () => {
    const token = await resolveToken();
    if (!token) {
      setProfile(null);
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (response.ok && !json?.error) {
        setProfile(json?.data?.profile || null);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      setProfile(null);
    }
  }, [session?.access_token]);

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

  // Debounced search - only trigger API call after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.city, filters.category, filters.mode, query, loadEvents]);

  useEffect(() => {
    if (!initialized || authLoading) return;
    loadSavedIds().catch((error) => console.error(error));
  }, [initialized, authLoading, loadSavedIds]);

  useEffect(() => {
    if (!initialized || authLoading) return;
    loadProfile().catch((error) => console.error(error));
  }, [initialized, authLoading, loadProfile]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (filters.platform !== "All") {
      result = result.filter((event) =>
        matchesPlatformFilter(event, filters.platform),
      );
    }
    if (query) {
      const lower = query.toLowerCase();
      result = result.filter((event) => {
        const haystack = [
          event?.title,
          event?.description,
          event?.city,
          event?.platform,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(lower);
      });
    }
    return result;
  }, [events, filters.platform, query]);

  const recommendedEvents = useMemo(() => {
    const city = String(profile?.city || "")
      .trim()
      .toLowerCase();
    const interests = Array.isArray(profile?.interests)
      ? profile.interests.map((item) => String(item).toLowerCase())
      : [];
    const platformsFollowed = Array.isArray(profile?.platforms_followed)
      ? profile.platforms_followed.map((item) => String(item).toLowerCase())
      : [];

    const base = [...filteredEvents];
    const scored = base.map((event) => {
      const eventCity = String(event?.city || "").toLowerCase();
      const eventPlatform = getDisplayPlatform(event);
      const tags = Array.isArray(event?.tags)
        ? event.tags.map((tag) => String(tag).toLowerCase())
        : [];
      const description = String(
        event?.ai_summary || event?.description || "",
      ).toLowerCase();
      let score = 0;

      if (city && eventCity && eventCity.includes(city)) score += 4;
      if (platformsFollowed.includes(eventPlatform)) score += 3;
      if (
        interests.some(
          (interest) =>
            tags.some((tag) => tag.includes(interest)) ||
            description.includes(interest),
        )
      ) {
        score += 3;
      }

      const startTime = event?.start_date
        ? new Date(event.start_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      const nowMs = typeof window !== "undefined" ? Date.now() : 0;
      const hoursUntil = (startTime - nowMs) / (1000 * 60 * 60);
      if (hoursUntil >= 0 && hoursUntil <= 72) score += 2;
      if (event?.banner_url) score += 1;
      if (event?.is_free) score += 1;

      const savedBoost = savedIds.has(event?.id) ? 2 : 0;

      return {
        event,
        score: score + savedBoost,
      };
    });

    return scored
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const aTime = a.event?.start_date
          ? new Date(a.event.start_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        const bTime = b.event?.start_date
          ? new Date(b.event.start_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 6)
      .map((item) => item.event);
  }, [filteredEvents, profile, savedIds]);

  const showRecommended = Boolean(profile) && recommendedEvents.length > 0;

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
          label: formatDayLabel(event?.start_date),
          items: [],
        });
      }
      groups.get(key).items.push(event);
    });
    return Array.from(groups.values());
  }, [filteredEvents]);

  return (
    <main className="min-h-screen text-white pb-24">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <LoggedOutSaveModal
          isOpen={Boolean(showModalEventId)}
          eventId={showModalEventId}
          onClose={closeModal}
        />
        <header className="mb-16 animate-fade-in-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
              Explore
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-4">
            Explore <span className="text-orange-500">Events</span>
          </h1>
          <p className="max-w-2xl text-lg text-gray-500 leading-relaxed">
            Browse curated tech events across platforms, save the ones you like,
            and jump into the details in one click.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-12">
            <input
              placeholder="Search events, cities, platforms..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="md:col-span-5 w-full rounded-2xl border border-white/5 bg-[#0a0c12] px-5 py-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-orange-500/60"
            />
            <select
              className="md:col-span-2 w-full rounded-2xl border border-white/5 bg-[#0a0c12] px-5 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 outline-none"
              value={filters.platform}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  platform: e.target.value,
                }))
              }
            >
              <option value="All">All Platforms</option>
              <option value="luma">Luma</option>
              <option value="meetup">Meetup</option>
              <option value="devfolio">Devfolio</option>
              <option value="unstop">Unstop</option>
              <option value="eventbrite">Eventbrite</option>
            </select>
            <select
              className="md:col-span-2 w-full rounded-2xl border border-white/5 bg-[#0a0c12] px-5 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 outline-none"
              value={filters.category}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  category: e.target.value,
                }))
              }
            >
              <option>All</option>
              <option>Hackathon</option>
              <option>Meetup</option>
              <option>Workshop</option>
            </select>
            <input
              placeholder="City"
              value={filters.city}
              onChange={(e) =>
                setFilters((current) => ({ ...current, city: e.target.value }))
              }
              className="md:col-span-2 w-full rounded-2xl border border-white/5 bg-[#0a0c12] px-5 py-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-orange-500/60"
            />
            <button
              type="button"
              onClick={() => loadEvents(query)}
              className="md:col-span-1 rounded-2xl bg-orange-500 px-5 py-4 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-orange-600"
            >
              Go
            </button>
          </div>

          <div className="mt-8 rounded-[32px] border border-white/5 bg-[#0a0c12] p-6">
            <div
              className="h-52 w-full rounded-[24px] bg-cover bg-center"
              style={
                MAP_PREVIEW_URL
                  ? { backgroundImage: `url(${MAP_PREVIEW_URL})` }
                  : {
                      background:
                        "linear-gradient(135deg, #111827 0%, #020617 100%)",
                    }
              }
            />
          </div>
        </header>

        {loading || loadingSaved ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            Loading explore feed...
          </div>
        ) : groupedEvents.length === 0 ? (
          <div className="rounded-[32px] border border-white/5 bg-white/5 p-10 text-center text-gray-400">
            No events found. Try adjusting filters or refresh the feed.
          </div>
        ) : (
          <div className="space-y-20">
            {showRecommended && (
              <section>
                <div className="mb-8 flex items-end justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
                      Recommended for you
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                      Based on your city, interests, and saved events.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                    {recommendedEvents.length} Picks
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {recommendedEvents.map((event) => (
                    <EventCard
                      key={`recommended-${event.id || event.event_url}`}
                      event={event}
                      isSaved={savedIds.has(event.id)}
                      onSave={handleToggleSave}
                    />
                  ))}
                </div>
              </section>
            )}

            {groupedEvents.map((group) => (
              <section key={group.label}>
                <div className="mb-8 flex items-center gap-4 border-b border-white/5 pb-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
                    {group.label}
                  </h2>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                    {group.items.length} Events
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
