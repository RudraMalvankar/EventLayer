"use client";

import { useState } from "react";
import { useUser } from "./AuthProvider";

export function EmailSubscribe({ city = "Mumbai", compact = false }) {
  const { user } = useUser();
  const [email, setEmail] = useState(user?.email || "");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        city,
        weekly_digest: true,
        event_alerts: true,
        community_alerts: true,
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok || json?.error) {
      setStatus(json?.error || "Could not subscribe");
      return;
    }
    setStatus("Subscribed — weekly event alerts enabled ✓");
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-orange-500/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-xl bg-orange-500 px-5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "..." : "Subscribe"}
        </button>
        {status && <p className="text-xs text-emerald-400 sm:col-span-2">{status}</p>}
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-500">
        Email alerts
      </p>
      <h3 className="mt-2 text-lg font-bold text-white">Never miss an event</h3>
      <p className="mt-1 text-sm text-gray-500">
        Weekly digest + alerts for new hackathons and meetups in {city}.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-orange-500/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-orange-500 py-3 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Subscribing..." : "Subscribe to event emails"}
        </button>
        {status && <p className="text-sm text-emerald-400">{status}</p>}
      </form>
    </div>
  );
}
