"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../src/shared/clients/supabase";
import { notifySavedEventsUpdated } from "../src/shared/events/refresh";

export function SaveEventButton({ eventId, redirectPath = "/login" }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function resolveToken() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  }

  useEffect(() => {
    let active = true;

    async function loadSavedState() {
      const token = await resolveToken();
      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/saved", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        const events = Array.isArray(json?.data?.events)
          ? json.data.events
          : Array.isArray(json?.data?.saved_events)
            ? json.data.saved_events
            : Array.isArray(json?.data)
              ? json.data
              : [];
        if (!active) return;
        setSaved(
          events.some(
            (item) => String(item?.id || item?.event_id) === String(eventId),
          ),
        );
      } catch {
        if (active) setSaved(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSavedState();

    return () => {
      active = false;
    };
  }, [eventId]);

  async function handleSave() {
    const token = await resolveToken();
    if (!token) {
      router.push(`${redirectPath}?redirect=/events/${eventId}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId }),
      });
      const json = await response.json();
      if (!response.ok || json?.error) return;
      setSaved((current) => !current);
      notifySavedEventsUpdated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={loading || submitting}
      className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-[11px] font-bold uppercase tracking-widest transition active:scale-[0.98] ${
        saved
          ? "border-orange-500 bg-orange-500 text-white shadow-[0_10px_30px_rgba(249,115,22,0.25)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      } ${loading || submitting ? "opacity-70" : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
      {loading ? "Loading..." : saved ? "Saved" : "Save Event"}
    </button>
  );
}
