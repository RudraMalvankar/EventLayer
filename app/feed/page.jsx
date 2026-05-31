"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { EventCard } from "../../components/EventCard";
import { useUser } from "../../components/AuthProvider";
import { supabase } from "../../supabase/client";

export default function FeedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/feed");
      return;
    }

    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch("/api/feed?limit=12", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok || json?.error) {
        setError(json?.error || "Could not load your feed.");
        setLoading(false);
        return;
      }
      setEvents(json?.data?.events || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
          Personalized AI Feed
        </p>
        <h1 className="mb-3 text-4xl font-black tracking-tighter">
          For you this week
        </h1>
        <p className="mb-10 max-w-2xl text-sm text-gray-500">
          Ranked by your city, interests, followed organizers, and community
          saves.
        </p>

        {loading && (
          <div className="py-20 text-center text-xs font-black uppercase tracking-widest text-gray-600">
            Building your feed...
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-300">
            {error}
          </div>
        )}
        {!loading && !error && (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {events.length ? (
              events.map((ev) => (
                <div key={ev.id} className="space-y-2">
                  {ev.feed_reason && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                      {ev.feed_reason}
                    </p>
                  )}
                  <EventCard event={ev} />
                </div>
              ))
            ) : (
              <p className="col-span-full py-16 text-center text-sm text-gray-500">
                Complete onboarding to personalize your feed.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
