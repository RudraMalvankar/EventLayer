"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "./AuthProvider";
import { notifySavedEventsUpdated, subscribeToSavedEventsUpdated } from "../src/shared/events/refresh";
import { LoggedOutSaveModal } from "./LoggedOutSaveModal";

export function SaveEventButton({ eventId, redirectPath = "/login" }) {
  const { session, initialized } = useUser();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadSavedState = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    const token = session?.access_token;
    if (!token) {
      setSaved(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/saved?event_id=${encodeURIComponent(eventId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await response.json();
      if (response.ok && typeof json?.data?.saved === "boolean") {
        setSaved(json.data.saved);
      }
    } catch {
      setSaved(false);
    } finally {
      setLoading(false);
    }
  }, [eventId, session?.access_token]);

  useEffect(() => {
    if (!initialized) return;
    loadSavedState();
  }, [initialized, loadSavedState]);

  useEffect(() => {
    return subscribeToSavedEventsUpdated(() => {
      loadSavedState();
    });
  }, [loadSavedState]);

  async function handleSave() {
    if (!session?.access_token) {
      setShowModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ event_id: eventId }),
      });
      const json = await response.json();
      if (!response.ok || json?.error) return;
      if (typeof json?.data?.saved === "boolean") {
        setSaved(json.data.saved);
      } else {
        setSaved((current) => !current);
      }
      notifySavedEventsUpdated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <LoggedOutSaveModal
        eventId={eventId}
        redirectPath={redirectPath}
        isOpen={Boolean(showModal)}
        onClose={() => setShowModal(false)}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={loading || submitting}
        aria-pressed={saved}
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
          aria-hidden
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        {loading ? "Loading..." : saved ? "Saved ✓" : "Save Event"}
      </button>
    </>
  );
}
