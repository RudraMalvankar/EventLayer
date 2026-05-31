"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "./AuthProvider";
import { supabase } from "../supabase/client";

export function NotificationBell() {
  const { session, user } = useUser();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }

    let cancelled = false;

    async function load() {
      const token =
        session?.access_token ||
        (await supabase.auth.getSession()).data.session?.access_token;
      if (!token || cancelled) return;

      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!cancelled) setUnread(json?.data?.unread ?? 0);
    }

    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, session]);

  if (!user) return null;

  return (
    <Link
      href="/notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
      aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
    >
      <span className="text-sm">🔔</span>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
