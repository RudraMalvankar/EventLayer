"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { EventCard } from "../../components/EventCard";
import { useUser } from "../../components/AuthProvider";
import { supabase } from "../../supabase/client";

export default function DigestPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [summary, setSummary] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function loadDigest(token) {
    const res = await fetch("/api/digest", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setSummary(json?.data?.summary || "");
    setEvents(json?.data?.events || []);
    setLoading(false);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/digest");
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) loadDigest(session.access_token);
    });
  }, [user, authLoading, router]);

  async function regenerate() {
    setGenerating(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    const res = await fetch("/api/digest", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setSummary(json?.data?.summary || "");
    setEvents(json?.data?.events || []);
    setGenerating(false);
  }

  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
          Digest Engine
        </p>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-black tracking-tighter">Weekly digest</h1>
          <button
            type="button"
            onClick={regenerate}
            disabled={generating}
            className="rounded-full bg-orange-500 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Refresh digest"}
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading digest...</p>
        ) : (
          <>
            <div className="mb-10 rounded-[32px] border border-orange-500/20 bg-orange-500/5 p-8">
              <p className="text-sm leading-relaxed text-gray-300">
                {summary || "Your personalized weekly summary will appear here."}
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
            {!events.length && (
              <p className="mt-8 text-sm text-gray-500">
                <Link href="/feed" className="text-orange-400 hover:underline">
                  Open your feed
                </Link>{" "}
                to discover events for next week&apos;s digest.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
