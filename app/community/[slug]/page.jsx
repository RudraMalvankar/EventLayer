"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "../../../components/Navbar";
import { EventCard } from "../../../components/EventCard";
import { CommunityCard } from "../../../components/CommunityCard";

export default function CommunityDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const [community, setCommunity] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/communities/${slug}`);
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok || json?.error) {
        setError(json?.error || "Community not found");
        setLoading(false);
        return;
      }
      setCommunity(json?.data?.community);
      setEvents(json?.data?.events || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/community"
          className="mb-8 inline-flex text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white"
        >
          ← All communities
        </Link>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            {error}
          </p>
        )}

        {community && (
          <>
            <div className="mb-10 max-w-xl">
              <CommunityCard
                community={{ ...community, upcoming_count: events.length }}
                detail
              />
            </div>

            <div id="upcoming-events" className="mb-6 flex scroll-mt-28 items-end justify-between gap-4">
              <h2 className="text-2xl font-black tracking-tight">
                Upcoming events
                <span className="ml-2 text-orange-500">({events.length})</span>
              </h2>
              <Link
                href="/events?city=Mumbai"
                className="text-[10px] font-black uppercase tracking-widest text-orange-400 hover:text-orange-300"
              >
                All Mumbai events →
              </Link>
            </div>

            {events.length ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-dashed border-white/10 p-12 text-center">
                <p className="text-4xl mb-4">📡</p>
                <p className="text-sm text-gray-500">
                  No matched events yet. Run a scrape sync from the admin dashboard
                  — events with this community in the title or organizer will appear
                  here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
