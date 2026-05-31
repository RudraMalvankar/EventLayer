"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LoggedOutSaveModal({ isOpen, onClose, eventId, redirectPath }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSignIn() {
    const redirect =
      redirectPath || (eventId ? `/events/${eventId}` : "/events");
    router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xl"
        onClick={() => onClose?.()}
      />

      <div className="relative z-10 w-[90%] max-w-md rounded-2xl border border-white/10 bg-zinc-900/95 p-6 shadow-lg">
        <h3 className="mb-2 text-lg font-bold">Sign in to save this event</h3>
        <p className="mb-4 text-sm text-zinc-300">
          Keep track of events you like, get reminders, and build your personal
          tech calendar.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSignIn}
            className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
          >
            Sign in to save
          </button>

          <button
            onClick={() => onClose?.()}
            className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm text-zinc-200"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
