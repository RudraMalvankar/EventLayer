"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { useUser } from "../../components/AuthProvider";
import { supabase } from "../../supabase/client";

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?redirect=/analytics");
      return;
    }

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Access denied");
        setLoading(false);
        return;
      }
      setData(json?.data);
      setLoading(false);
    }

    load();
  }, [user, authLoading, router]);

  const m = data?.metrics || {};

  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
          Analytics Layer
        </p>
        <h1 className="mb-10 text-4xl font-black tracking-tighter">
          Platform metrics
        </h1>

        {loading && <p className="text-gray-500">Loading analytics...</p>}
        {error && (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-gray-400">
            {error}. Set ADMIN_EMAILS in env to access this dashboard.
          </p>
        )}
        {data && (
          <>
            <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Page views (30d)", m.page_views],
                ["Saves (30d)", m.saves],
                ["Searches (30d)", m.searches],
                ["New profiles (30d)", m.new_profiles],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/5 bg-white/2 p-6"
                >
                  <p className="text-3xl font-black">{value ?? 0}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <h2 className="mb-4 text-lg font-black uppercase">Top saved events</h2>
            <ul className="space-y-2">
              {(data.trending || []).map((ev, i) => (
                <li
                  key={ev?.id || i}
                  className="flex justify-between rounded-xl border border-white/5 bg-white/2 px-4 py-3 text-sm"
                >
                  <span>{ev?.title || "Event"}</span>
                  <span className="text-orange-400">{ev?.saves} saves</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
