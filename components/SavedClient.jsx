"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import { EventCard } from "./EventCard";
import { useUser } from "./AuthProvider";
import { supabase } from "../supabase/client";
import { notifySavedEventsUpdated } from "../src/shared/events/refresh";

function normalizeSavedEvents(json) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.events)) return json.data.events;
  if (Array.isArray(json?.data?.saved_events)) return json.data.saved_events;
  return [];
}

export default function SavedClient() {
  const router = useRouter();
  const { session, loading: authLoading, initialized } = useUser();
  const [activeSession, setActiveSession] = useState(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [events, setEvents] = useState([]);

  async function toggleSave(event) {
    const token = activeSession?.access_token || session?.access_token;
    if (!token) {
      router.push("/login?redirect=/saved");
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
      setError(json?.error || "Could not update saved event.");
      return;
    }

    setEvents((current) => current.filter((item) => item.id !== event.id));
    notifySavedEventsUpdated();
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
    const token = activeSession?.access_token || session?.access_token;
    if (!token) return;

    let cancelled = false;

    async function loadSaved() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/saved/sync", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        if (cancelled) return;
        if (response.ok && !json?.error) {
          setEvents(json?.data?.events || []);
          if (json?.data?.sync_token) {
            localStorage.setItem(
              "eventlayer.saved-sync",
              json.data.sync_token,
            );
          }
        } else {
          const fallback = await fetch("/api/saved", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const fallbackJson = await fallback.json();
          if (!fallback.ok || fallbackJson?.error) {
            throw new Error(
              fallbackJson?.error || "Could not load saved events.",
            );
          }
          setEvents(normalizeSavedEvents(fallbackJson));
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSaved();
    return () => {
      cancelled = true;
    };
  }, [activeSession?.access_token, session?.access_token]);

  if (!initialized || authLoading || !sessionResolved) {
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

  if (!activeSession) {
    return (
      <main className="min-h-screen pb-24 text-white">
        <Navbar />
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-[32px] border border-white/10 bg-[#0a0c12]/90 p-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">
              Saved events
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Sign in to access your saved events
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-400 sm:text-base">
              Save events you like, build your personal event list, and come
              back anytime.
            </p>
            <Link
              href="/login?redirect=/saved"
              className="mt-8 inline-flex rounded-full bg-orange-500 px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600"
            >
              Sign in to continue
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
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
        <h1 className="text-4xl font-black tracking-tight">Saved Events</h1>
        <p className="mt-3 text-sm text-gray-500">
          Events you bookmarked to revisit later.
        </p>

        {error && (
          <p className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {!error && events.length === 0 ? (
          <div className="mt-10 rounded-[32px] border border-white/10 bg-[#0a0c12]/80 p-10 text-center">
            <h2 className="text-2xl font-black tracking-tight">
              No saved events yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500">
              Start exploring events and save the ones you do not want to miss.
            </p>
            <Link
              href="/events"
              className="mt-8 inline-flex rounded-full bg-orange-500 px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-orange-600"
            >
              Browse events
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id || event.event_url}
                event={event}
                isSaved
                onSave={toggleSave}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
