"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const res = await fetch("/api/admin/dashboard", { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/login");
        return;
      }
      setError(json?.error || "Failed to load dashboard");
      setLoading(false);
      return;
    }
    setData(json.data);
    setLoading(false);
  }

  async function runSync() {
    setSyncing(true);
    setSyncMsg("");
    const res = await fetch("/api/admin/sync", {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json();
    setSyncing(false);
    setSyncMsg(res.ok ? "Sync started/completed." : json?.error || "Sync failed");
    loadDashboard();
  }

  async function signOut() {
    await fetch("/api/admin/login", { method: "DELETE", credentials: "include" });
    router.replace("/admin/login");
  }

  const m = data?.metrics || {};

  return (
    <main className="min-h-screen bg-[#030407] text-white">
      <header className="border-b border-white/5 bg-[#0a0c12]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
              Platform Admin
            </p>
            <h1 className="text-2xl font-black tracking-tight">EventLayer Control</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white"
            >
              View site
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {loading && <p className="text-gray-500">Loading platform data...</p>}
        {error && (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            {error}
          </p>
        )}

        {data && (
          <>
            <div className="mb-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runSync}
                disabled={syncing}
                className="rounded-full bg-orange-500 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Run scrape sync"}
              </button>
              {syncMsg && (
                <span className="self-center text-sm text-gray-400">{syncMsg}</span>
              )}
            </div>

            <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total events", m.events_total],
                ["Upcoming", m.events_upcoming],
                ["Users", m.users_total],
                ["New users (30d)", m.users_new],
                ["Total saves", m.saves_total],
                ["Saves (30d)", m.saves_recent],
                ["Page views (30d)", m.page_views],
                ["Searches (30d)", m.searches],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-6"
                >
                  <p className="text-3xl font-black">{value ?? 0}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-[32px] border border-white/5 bg-[#0a0c12] p-6">
                <h2 className="mb-4 text-lg font-black uppercase tracking-tight">
                  Events by platform
                </h2>
                <ul className="space-y-2">
                  {Object.entries(data.platform_counts || {}).map(([p, count]) => (
                    <li
                      key={p}
                      className="flex justify-between rounded-xl border border-white/5 px-4 py-3 text-sm"
                    >
                      <span className="font-bold capitalize">{p}</span>
                      <span className="text-orange-400">{count}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[32px] border border-white/5 bg-[#0a0c12] p-6">
                <h2 className="mb-4 text-lg font-black uppercase tracking-tight">
                  Top saved events
                </h2>
                <ul className="space-y-2">
                  {(data.trending || []).map((ev, i) => (
                    <li
                      key={ev?.id || i}
                      className="flex justify-between gap-4 rounded-xl border border-white/5 px-4 py-3 text-sm"
                    >
                      <span className="line-clamp-1">{ev?.title || "Event"}</span>
                      <span className="shrink-0 text-orange-400">{ev?.saves} saves</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[32px] border border-white/5 bg-[#0a0c12] p-6">
                <h2 className="mb-4 text-lg font-black uppercase tracking-tight">
                  Recent signups
                </h2>
                <ul className="space-y-2">
                  {(data.recent_users || []).map((u) => (
                    <li
                      key={u.id}
                      className="flex justify-between rounded-xl border border-white/5 px-4 py-3 text-sm"
                    >
                      <span>{u.display_name || u.name || "User"}</span>
                      <span className="text-gray-500">{u.city || "—"}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[32px] border border-white/5 bg-[#0a0c12] p-6">
                <h2 className="mb-4 text-lg font-black uppercase tracking-tight">
                  Recent submissions
                </h2>
                <ul className="space-y-2">
                  {(data.recent_submissions || []).map((s) => (
                    <li
                      key={s.id}
                      className="rounded-xl border border-white/5 px-4 py-3 text-sm"
                    >
                      <p className="font-bold line-clamp-1">{s.title || s.event_url}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-500">
                        {s.status} · {s.user_email || "user"}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
