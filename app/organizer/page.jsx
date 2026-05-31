"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { EventCard } from "../../components/EventCard";
import { useUser } from "../../components/AuthProvider";
import { supabase } from "../../supabase/client";

export default function OrganizerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/organizer");
      return;
    }

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch("/api/organizer", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json?.data || null);
      setLoading(false);
    }

    load();
  }, [user, authLoading, router]);

  const counts = data?.status_counts || {};

  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
          Organizer Dashboard
        </p>
        <h1 className="mb-3 text-4xl font-black tracking-tighter">
          {data?.organizer_name || "Your"} events
        </h1>
        <p className="mb-10 text-sm text-gray-500">
          Track submissions and events linked to your organizer name.
        </p>

        {loading ? (
          <p className="text-gray-500">Loading dashboard...</p>
        ) : (
          <>
            <div className="mb-12 grid gap-4 sm:grid-cols-4">
              {[
                ["Added", counts.added],
                ["Received", counts.received],
                ["Queued", counts.queued],
                ["Rejected", counts.rejected],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/5 bg-white/2 p-6 text-center"
                >
                  <p className="text-3xl font-black">{value ?? 0}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight">
                Matched upcoming events
              </h2>
              <Link
                href="/submit"
                className="text-xs font-bold uppercase tracking-widest text-orange-400"
              >
                Submit event →
              </Link>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {(data?.matched_events || []).map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
            {!data?.matched_events?.length && (
              <p className="text-sm text-gray-500">
                Set your display name in profile to match organizer names on events.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
