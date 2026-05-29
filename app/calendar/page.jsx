"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { useUser } from "../../components/AuthProvider";
import { supabase } from "../../supabase/client";
import { subscribeToSavedEventsUpdated } from "../../src/shared/events/refresh";

const REMINDERS_STORAGE_KEY = "eventlayer.calendar.reminders.v1";
const REMINDED_STORAGE_KEY = "eventlayer.calendar.reminded.v1";

function normalizeSavedEvents(json) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.events)) return json.data.events;
  if (Array.isArray(json?.data?.saved_events)) return json.data.saved_events;
  return [];
}

function dayKey(value) {
  if (!value) return "tba";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "tba";
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(value) {
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function isTodayOrFuture(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime();
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBA";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function loadStoredSet(key) {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function persistStoredSet(key, values) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(values)));
}

function buildMonthCells(referenceDate) {
  const first = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    cells.push(current);
  }

  return cells;
}

export default function CalendarPage() {
  const router = useRouter();
  const { session, loading: authLoading, initialized } = useUser();
  const [activeSession, setActiveSession] = useState(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [activeMonth, setActiveMonth] = useState(() => new Date());
  const [reminders, setReminders] = useState(() => new Set());
  const [reminded, setReminded] = useState(() => new Set());
  const [refreshTick, setRefreshTick] = useState(0);
  const [reminderStatus, setReminderStatus] = useState("");

  async function resolveToken() {
    const token = activeSession?.access_token || session?.access_token;
    if (token) return token;
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDirectSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      setActiveSession(currentSession || null);
      setSessionResolved(true);
    }

    loadDirectSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setActiveSession(nextSession || null);
      setSessionResolved(true);
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setReminders(loadStoredSet(REMINDERS_STORAGE_KEY));
    setReminded(loadStoredSet(REMINDED_STORAGE_KEY));
  }, []);

  useEffect(() => {
    return subscribeToSavedEventsUpdated(() => {
      setRefreshTick((current) => current + 1);
    });
  }, []);

  useEffect(() => {
    if (!sessionResolved || authLoading) return;
    if (!activeSession) {
      router.replace("/login?redirect=/calendar");
    }
  }, [sessionResolved, authLoading, activeSession, router]);

  useEffect(() => {
    const token = activeSession?.access_token || session?.access_token;
    if (!token) return;

    let cancelled = false;

    async function loadCalendar() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/saved", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        if (cancelled) return;
        if (!response.ok || json?.error) {
          throw new Error(json?.error || "Could not load saved events.");
        }
        setEvents(normalizeSavedEvents(json));
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCalendar();
    return () => {
      cancelled = true;
    };
  }, [activeSession?.access_token, session?.access_token, refreshTick]);

  useEffect(() => {
    persistStoredSet(REMINDERS_STORAGE_KEY, reminders);
  }, [reminders]);

  useEffect(() => {
    persistStoredSet(REMINDED_STORAGE_KEY, reminded);
  }, [reminded]);

  const upcomingSaved = useMemo(
    () => events.filter((event) => isTodayOrFuture(event?.start_date)),
    [events],
  );

  const monthEvents = useMemo(
    () =>
      upcomingSaved.filter((event) => {
        if (!event?.start_date) return false;
        const date = new Date(event.start_date);
        if (Number.isNaN(date.getTime())) return false;
        return (
          date.getFullYear() === activeMonth.getFullYear() &&
          date.getMonth() === activeMonth.getMonth()
        );
      }),
    [upcomingSaved, activeMonth],
  );

  const monthGroups = useMemo(() => {
    const groups = new Map();
    monthEvents.forEach((event) => {
      const key = dayKey(event?.start_date);
      if (!groups.has(key)) {
        groups.set(key, {
          label: formatDayLabel(event?.start_date),
          items: [],
        });
      }
      groups.get(key).items.push(event);
    });
    return groups;
  }, [monthEvents]);

  const monthCells = useMemo(() => buildMonthCells(activeMonth), [activeMonth]);

  const selectedDayEvents = selectedDateKey
    ? monthGroups.get(selectedDateKey)?.items || []
    : [];

  useEffect(() => {
    if (!monthEvents.length) {
      setSelectedDateKey(null);
      return;
    }

    const visible = selectedDateKey
      ? monthEvents.some((event) => dayKey(event?.start_date) === selectedDateKey)
      : false;

    if (!visible) {
      setSelectedDateKey(dayKey(monthEvents[0]?.start_date));
    }
  }, [monthEvents, selectedDateKey]);

  useEffect(() => {
    if (!reminders.size || !monthEvents.length) return undefined;

    const tick = setInterval(() => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") {
        return;
      }

      const now = Date.now();
      const nextReminded = new Set(reminded);
      let changed = false;

      monthEvents.forEach((event) => {
        const id = String(event?.id || event?.event_url || "");
        if (!id || !reminders.has(id) || nextReminded.has(id) || !event?.start_date) {
          return;
        }

        const startTime = new Date(event.start_date).getTime();
        const minutesUntil = (startTime - now) / 60000;
        if (minutesUntil < 0 || minutesUntil > 60) return;

        new Notification(`Reminder: ${event.title}`, {
          body: `${formatDayLabel(event.start_date)} at ${formatTime(event.start_date)}`,
        });
        nextReminded.add(id);
        changed = true;
      });

      if (changed) {
        setReminded(nextReminded);
      }
    }, 30000);

    return () => clearInterval(tick);
  }, [monthEvents, reminders, reminded]);

  function toggleReminder(event) {
    const id = String(event?.id || event?.event_url || "");
    if (!id) return;

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    setReminders((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persistStoredSet(REMINDERS_STORAGE_KEY, next);
      return next;
    });

    setReminded((current) => {
      const next = new Set(current);
      next.delete(id);
      persistStoredSet(REMINDED_STORAGE_KEY, next);
      return next;
    });

    const isActive = reminders.has(id);
    setReminderStatus(isActive ? "Reminder removed" : "Reminder set");
    window.setTimeout(() => setReminderStatus(""), 1800);
  }

  function moveMonth(offset) {
    setActiveMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  if (
    !initialized ||
    authLoading ||
    !sessionResolved ||
    loading ||
    !activeSession
  ) {
    return (
      <main className="min-h-screen text-white">
        <Navbar />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="h-16 w-64 animate-pulse rounded-2xl bg-white/5" />
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="h-80 animate-pulse rounded-[32px] border border-white/10 bg-white/5" />
            <div className="h-80 animate-pulse rounded-[32px] border border-white/10 bg-white/5" />
            <div className="h-80 animate-pulse rounded-[32px] border border-white/10 bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24 text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                My Calendar
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Saved agenda</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500">
              Your saved events grouped into a compact month grid with reminders.
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-white/10 w-fit"
          >
            Save more events
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {reminderStatus && (
          <p className="mb-6 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
            {reminderStatus}
          </p>
        )}

        <div className="grid gap-8 xl:grid-cols-[1.45fr_0.95fr]">
          <section className="rounded-[32px] border border-white/10 bg-[#0a0c12]/90 p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  Month view
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  {formatMonthLabel(activeMonth)}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveMonth(-1)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMonth(new Date())}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => moveMonth(1)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {monthCells.map((date) => {
                const key = dayKey(date);
                const hasEvents = monthGroups.has(key);
                const isCurrentMonth =
                  date.getMonth() === activeMonth.getMonth() &&
                  date.getFullYear() === activeMonth.getFullYear();
                const isSelected = selectedDateKey === key;
                return (
                  <button
                    key={key + date.toISOString()}
                    type="button"
                    onClick={() => setSelectedDateKey(key)}
                    className={`min-h-[92px] rounded-[20px] border p-3 text-left transition-all ${
                      isSelected
                        ? "border-orange-500 bg-orange-500/10 shadow-[0_10px_30px_rgba(249,115,22,0.18)]"
                        : "border-white/5 bg-white/3 hover:border-white/15 hover:bg-white/5"
                    } ${isCurrentMonth ? "text-white" : "text-gray-600 opacity-60"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-lg font-black">{date.getDate()}</span>
                      {hasEvents && (
                        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-white">
                          {monthGroups.get(key)?.items.length || 0}
                        </span>
                      )}
                    </div>
                    {hasEvents && (
                      <div className="mt-4 flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
              <span>{monthEvents.length} saved events this month</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{reminders.size} reminders set</span>
            </div>
          </section>

          <aside className="rounded-[32px] border border-white/10 bg-[#0a0c12]/90 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  Selected day
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  {selectedDayEvents.length
                    ? formatDayLabel(selectedDayEvents[0]?.start_date)
                    : "No events here"}
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                {selectedDayEvents.length} events
              </span>
            </div>

            {selectedDayEvents.length ? (
              <div className="space-y-4">
                {selectedDayEvents.map((event) => {
                  const id = String(event?.id || event?.event_url || "");
                  const isReminderOn = reminders.has(id);
                  return (
                    <div
                      key={event.id || event.event_url}
                      className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                            {formatTime(event?.start_date)}
                          </p>
                          <Link
                            href={event?.id ? `/events/${event.id}` : event?.event_url || "/events"}
                            className="mt-2 block text-base font-black leading-tight text-white transition hover:text-orange-400"
                          >
                            {event?.title}
                          </Link>
                          <p className="mt-2 text-xs leading-relaxed text-gray-500 line-clamp-3">
                            {event?.ai_summary || event?.description || "No summary available."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleReminder(event)}
                          disabled={!id || !event?.start_date}
                          className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition ${
                            isReminderOn
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-white/10 bg-white/5 text-gray-300 hover:text-white"
                          } ${!id || !event?.start_date ? "opacity-40" : ""}`}
                        >
                          {isReminderOn ? "Reminder on" : "Remind me"}
                        </button>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        <span>{event?.raw_data?.sourcePlatform || event?.platform}</span>
                        <span className="h-1 w-1 rounded-full bg-white/20" />
                        <span>{event?.city || "Online"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : monthEvents.length ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 p-8 text-center">
                <p className="text-sm leading-relaxed text-gray-500">
                  Pick a day in the month grid to see the saved events.
                </p>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 p-8 text-center">
                <h3 className="text-xl font-black tracking-tight">No saved events yet</h3>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500">
                  Save events from Explore to fill your calendar and reminders.
                </p>
                <Link
                  href="/explore"
                  className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600"
                >
                  Browse events
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}